
import { HydratedDocument } from "mongoose"
import { CloudinaryService, comparePassword, ConflictException, hashPassword, IUser, logoutEnum, NotificationService, RedisServices, TokenService } from "../../common"
import { ACCESS_EXPIRES_IN, APPLICATION_NAME, REFRESH_EXPIRES_IN } from "../../config/config"
import { UserRepository } from "../../DB/repository/user.repository"


class UserService {
    private userService: UserRepository
    private tokenService: TokenService
    private redis: RedisServices
    private cloudinaryService: CloudinaryService
    private notification: NotificationService


    constructor() {
        this.userService = new UserRepository()
        this.tokenService = new TokenService()
        this.redis = new RedisServices()
        this.cloudinaryService = new CloudinaryService()
        this.notification = new NotificationService()
    }
    async profile(): Promise<HydratedDocument<IUser>[]> {
        const users = await this.userService.find({ filter: { paranoid: true } })
        return users
    }
    async rotateToken(user: HydratedDocument<IUser>, issuer: string, { sub, iat, expiresIn, jti }: { sub: string, iat: number, expiresIn: number, jti: string }): Promise<{ access_token: string, refresh_token: string }> {
        if (Date.now() + 30000 >= (iat + ACCESS_EXPIRES_IN) * 1000) {

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
        const result = await this.userService.updateOne({ filter: { _id: id, confirmEmail: { $exists: true } }, update: { deletedAt: new Date() } })
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
    async ProfilePicture(file: string, FCM: string, user: HydratedDocument<IUser>): Promise<IUser> {
        if (user.profileImage?.public_id) {
            await this.cloudinaryService.deleteImage(user.profileImage.public_id)
        }
        
        const { public_id, secure_url } = await this.cloudinaryService.uploadFile({ filePath: file, folder: `${APPLICATION_NAME}/users/${user.userName}/profilePicture` })
        user.profileImage = { public_id, secure_url }
        await user.save()
        if (FCM) {
            await this.redis.addFCM(user._id, FCM)
            const tokens = await this.redis.getFCMs(user._id)
            if (tokens?.length) {
                await this.notification.sendNotifications({ tokens, data: { title: "faceBook", body: "profile picture is updated successfully" } })
            }
        }

        return user 
    }
    async coverPicture(files: { path: string }[], FCM: string, user: HydratedDocument<IUser>): Promise<HydratedDocument<IUser>> {
        if (user.profileCover?.length) {
            await this.cloudinaryService.deleteFiles(user.profileCover.map(( ele ) => ele))
        }
        console.log(files);
       user.profileCover = await this.cloudinaryService.uploadFiles({ files, folder:`${APPLICATION_NAME}/users/${user.userName}/coverPicture`})       
        await user.save() 
        console.log({cover:user.profileCover});
        
        if (FCM) {
            await this.redis.addFCM(user._id, FCM)
            const tokens = await this.redis.getFCMs(user._id)
            if (tokens?.length) {
                await this.notification.sendNotifications({ tokens, data: { title: "faceBook", body: "cover picture is updated successfully" } })
            }
        }
        return user

    }


}

export const userService = new UserService()