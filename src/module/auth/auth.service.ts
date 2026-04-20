import { BadRequestException, comparePassword, ConflictException, EmailTypeEnum, encrypt, hashPassword, IUser, NotFoundException, ProviderEnum, TokenService } from "../../common";
import { redisService, RedisServices } from "../../common/service/redis.service";
import { createTemplateOtp, emailEvent, emailTemplate, sendEmail } from "../../common/utils/email";
import { CLIENT_ID } from "../../config/config";
import { UserRepository } from "../../DB/repository/user.repository";
import { loginDto, signupDto } from "./auth.dto";
import { OAuth2Client, TokenPayload } from 'google-auth-library';


class authService {
  private userRepository: UserRepository
  private redis: RedisServices
  private tokenServices: TokenService
  constructor() {
    this.userRepository = new UserRepository()
    this.redis = redisService
    this.tokenServices = new TokenService()

  }


  private async sendOtpEmail({ email, subject, title }: { email: string, subject: EmailTypeEnum, title: string }): Promise<void> {
    const isBlocked = await this.redis.ttl(this.redis.blockOtpKey({ email, subject }))
    if (isBlocked > 0) {
      throw new ConflictException(`Sorry we cannot send new otp until exist otp expire ${isBlocked}`);
    }
    const resendingTime = await this.redis.ttl(this.redis.otpKey({ email, subject }))
    if (resendingTime > 0) {
      throw new ConflictException(`Sorry we cannot resend new otp until exist otp expire ${resendingTime}`);
    }
    const maxTrial = await this.redis.get(this.redis.maxTrialOtpKey({ email, subject }))
    if (maxTrial >= 3) {
      await this.redis.set({
        key: this.redis.blockOtpKey({ email, subject }),
        value: 1,
        ttl: 420
      })
      throw new BadRequestException("yau reached to max place wait ")
    }
    const code = await createTemplateOtp()
    await this.redis.set({
      key: await this.redis.otpKey({ email, subject }),
      value: await hashPassword({ plainText: `${code}`, salt: 12 }),
      ttl: 120
    })
    emailEvent.emit("sendEmail", async () => {
      await sendEmail({
        to: email,
        subject,
        html: await emailTemplate({ code, title })
      })
      await this.redis.incr(this.redis.maxTrialOtpKey({ email, subject }))
    })


  }
  async signup({ userName, email, password, age, phone }: signupDto): Promise<IUser> {
    const user = await this.userRepository.findOne({ filter: { email }, projection: "email", options: { lean: true } });
    if (user) {
      throw new ConflictException("email is exist");
    }
    const result = await this.userRepository.create({
      data: { userName, email, password, age, phone }
    })
    await this.sendOtpEmail({ email, subject: EmailTypeEnum.confirmEmail, title: 'verify email' })
    return result;
  };
  async confirmEmail({ email, otp }: { email: string, otp: string }): Promise<void> {
    const hashOtp = await this.redis.get(this.redis.otpKey({
      email, subject: EmailTypeEnum.confirmEmail
    }))
    if (!hashOtp) {
      throw new NotFoundException("expired opt")
    }
    const checkAccount = await this.userRepository.findOne({ filter: { email, confirmEmail: { $exists: false }, provider: ProviderEnum.system } });
    if (!checkAccount) {
      throw new NotFoundException("email is not found in confirmed")
    }
    if (!await comparePassword({ plainText: otp, cipherText: hashOtp })) {
      throw new ConflictException("invalid otp")
    }
    checkAccount.confirmEmail = new Date();
    await checkAccount.save();
    await this.redis.deleteKey(this.redis.otpKey({ email, subject: EmailTypeEnum.confirmEmail }))
    return;
  };
  async resendConfirmEmail({ email }: { email: string }): Promise<void> {
    const checkEmail = await this.userRepository.findOne({ filter: { email, confirmEmail: { $exists: false }, provider: ProviderEnum.system } })
    if (!checkEmail) {
      throw new NotFoundException("email is not found sending email")
    }
    await this.sendOtpEmail({ email, subject: EmailTypeEnum.confirmEmail, title: "verify email" })
    return;

  };
  async login({ email, password }: loginDto, issuer: string): Promise<{ access_token: string, refresh_token: string }> {
    const user = await this.userRepository.findOne({ filter: { email, confirmEmail: { $exists: true }, provider: ProviderEnum.system } })
    if (!user) {
      throw new NotFoundException("invalid login credentials")
    }
    const checkHashPassword = await comparePassword({ plainText: password, cipherText: user.password })
    if (!checkHashPassword) {
      throw new NotFoundException("invalid login credentials")
    }
    return await this.tokenServices.createLoginCredentials({ user, issuer });
  }
  private async verifyGoogleAccount(idToken: string): Promise<TokenPayload> {
    const client = new OAuth2Client();

    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email_verified) {
      throw new BadRequestException("invalid google account")
    }
    return payload
  }
  async loginWithGmail(idToken: string, issuer: string): Promise<any> {
    const payload = await this.verifyGoogleAccount(idToken)
    console.log(payload);
    const user = await this.userRepository.findOne({ filter: { email: payload.email as string, provider: ProviderEnum.google } })
    if (!user) {
      throw new NotFoundException("noy registered account ")
    }
    return await this.tokenServices.createLoginCredentials({ user, issuer });
  }
  async SignupWithGmail(idToken: string, issuer: string) {
    const payload = await this.verifyGoogleAccount(idToken)
    const checkAccount = await this.userRepository.findOne({ filter: { email: payload.email as string } })
    if (checkAccount) {
      if (checkAccount?.provider === ProviderEnum.google) {
        throw new ConflictException("email is exist")
      }
      return { status: 200, credentials: await this.loginWithGmail(idToken, issuer) }
    }
    const user = await this.userRepository.create({ data: { userName: payload.name as string, firstName: payload.given_name as string, lastName: payload.family_name as string, email: payload.email as string, provider: ProviderEnum.google } })
    return { status: 201, credentials: await this.tokenServices.createLoginCredentials({ user, issuer }) }
  }
  async ForgotPassword(email: string): Promise<void> {
    const account = await this.userRepository.findOne({ filter: { email, confirmEmail: { $exists: true }, provider: ProviderEnum.system } })

    if (!account) {
      throw new NotFoundException("email is not found")
    }
    await this.sendOtpEmail({ email, subject: EmailTypeEnum.forgotPassword, title: "Rest login code" })
    return;

  };
  async verifyForgotPassword({ email, otp }: { email: string, otp: string }): Promise<void> {

    const hashOtp = await this.redis.get(this.redis.otpKey({ email, subject: EmailTypeEnum.forgotPassword }))

    if (!hashOtp) {
      throw new NotFoundException("Expired Otp")
    }
    if (!await comparePassword({ plainText: otp, cipherText: hashOtp })) {
      throw new ConflictException("invalid otp")
    }
    return;

  };
  async resatForgotPasswordCode({ email, otp, password }: { email: string, otp: string, password: string }): Promise<void> {
    await this.verifyForgotPassword({ email, otp })
    const user = await this.userRepository.findOne({ filter: { email, confirmEmail: { $exists: true }, provider: ProviderEnum.system } })
    if (!user) {
      throw new NotFoundException("account not found ")
    }
    const result = await this.userRepository.updataOne({ filter: { _id: user._id }, update: { password: await hashPassword({ plainText: password }), changeCredentialsTime: new Date } })
    const tokenKeys = await this.redis.keys(this.redis.baseRevokeTokenKey(user._id))
    const otpKeys = await this.redis.keys(this.redis.otpKey({ email, subject: EmailTypeEnum.forgotPassword }))

    await this.redis.deleteKey([...tokenKeys, ...otpKeys])


    return;

  };
}




export default new authService()