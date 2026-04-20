
import { HydratedDocument } from "mongoose"
import { comparePassword, ConflictException, hashPassword, IUser, logoutEnum, RedisServices, TokenService } from "../../common"
import { ACCESS_EXPIRES_IN, REFRESH_EXPIRES_IN } from "../../config/config"
import { UserRepository } from "../../DB/repository/user.repository"


class UserService {
    userService: UserRepository
    private tokenService: TokenService
    private redis: RedisServices

    constructor() {
        this.userService = new UserRepository()
        this.tokenService = new TokenService()
        this.redis = new RedisServices()
    }
    async profile(): Promise<HydratedDocument<IUser>|null> {
         const users = await this.userService.find({ filter: { paranoid: true } })
        return users
    }

    async rotateToken(user: HydratedDocument<IUser>, issuer: string, { sub, iat, expiresIn, jti }: { sub: string, iat: number, expiresIn: number, jti: string }): Promise < { access_token: string, refresh_token: string } > {
            if(Date.now() + 30000 >= (iat + ACCESS_EXPIRES_IN) * 1000) {

            throw new ConflictException("current access session still valid")
        }
        await this.tokenService.CreateRevokeToken({ userId: sub, jti, ttl: expiresIn + REFRESH_EXPIRES_IN })
        return await this.tokenService.createLoginCredentials({ user, issuer })
    }
    async logout(flag: logoutEnum, user: HydratedDocument<IUser>, { sub, iat, jti }: { sub: string, iat: number, jti: string }) {
        let statusCode = 200;
        switch (flag) {
            case logoutEnum.all:
                user.changeCredentialsTime = new Date();
                await user.save();
                await this.redis.deleteKey(await this.redis.keys(this.redis.baseRevokeTokenKey(sub)))
                break;
            default:
                await this.tokenService.CreateRevokeToken({ userId: sub, jti, ttl: iat + REFRESH_EXPIRES_IN })
                statusCode = 201
                break;
        }
        return statusCode
    }
    async updateNewPassword({ oldPassword, password, user, issuer }: { oldPassword: string, password: string, user: HydratedDocument<IUser>, issuer: string }): Promise<{ access_token: string, refresh_token: string }> {
        if (!await comparePassword({ plainText: oldPassword, cipherText: user.password })) {
            throw new ConflictException("invalid old password")
        }
        for (const hash of user.oldPassword || []) {
            const isUsedBefore = await comparePassword({
                plainText: password,
                cipherText: hash,
            });

            if (isUsedBefore) {
                throw new ConflictException("this password already exists before",);
            }
        }
        user.oldPassword.push(user.password)
        if (user.oldPassword.length > 3) {
            user.oldPassword.shift();
        }
        user.password = await hashPassword({ plainText: password })
        user.changeCredentialsTime = new Date()
        await user.save()
        await this.redis.deleteKey(await this.redis.keys(this.redis.baseRevokeTokenKey(user._id)))
        return await this.tokenService.createLoginCredentials({ user, issuer })


    }
    async softDelete(id: string) {
        const result = await this.userService.updataOne({ filter: { _id: id, confirmEmail: { $exists: true } }, update: { deletedAt: new Date() } })
        if (result.matchedCount == 0) {
            throw new ConflictException("account not found or not confirmed")
        }
        return;
    }
    async hardDelete(id: string) {
        const deleteAccount = await this.userService.deleteOne({ filter: { _id: id, deletedAt: { $exists: true } } })
        if (deleteAccount.deletedCount == 0) {
            throw new ConflictException("account not found ")
        }
        return;
    }
 

}

export const userService = new UserService()