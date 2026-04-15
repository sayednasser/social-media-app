import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import {  SYSTEM_ACCESS_TOKEN_KEY, SYSTEM_REFRESH_TOKEN_KEY, USER_ACCESS_TOKEN_KEY, USER_REFRESH_TOKEN_KEY } from "../../../config/config";
import { HydratedDocument, Types, } from "mongoose";
import { IUser } from "../../interfaces";
import { audienceEnum, RoleEnum, TokenTypeEnum } from "../../enum";
import { UserRepository } from "../../../DB/repository/user.repository";
import { BadRequestException, UnauthorizedException } from "../../exception";
import { redisService, RedisServices } from "../../service";
import { randomUUID } from "node:crypto";

export class TokenService {
    private  rides:RedisServices
    private readonly userRepository: UserRepository
    constructor() {
        this.rides= new RedisServices()
        this.userRepository = new UserRepository()
    }


    async sign({ payload, secret = USER_ACCESS_TOKEN_KEY, options }:
        { payload: object, secret?: string, options?: SignOptions }): Promise<string> {
        return jwt.sign(payload, secret, options)
    }
    async verifyToken({ token, secret = USER_ACCESS_TOKEN_KEY, options }:
        { token: string, secret?: string, options?: SignOptions }) { return jwt.verify(token, secret) }

    async getTokenSignature(role: RoleEnum): Promise<{ AccessSignature: string, RefreshSignature: string,audience: number }> {
        let AccessSignature: string
        let RefreshSignature: string;
        let audience = audienceEnum.User;
        switch (role) {
            case RoleEnum.admin:
                AccessSignature = SYSTEM_ACCESS_TOKEN_KEY
                RefreshSignature = SYSTEM_REFRESH_TOKEN_KEY
                audience = audienceEnum.System
                break;

            default:
                AccessSignature = USER_ACCESS_TOKEN_KEY
                RefreshSignature = USER_REFRESH_TOKEN_KEY
                audience = audienceEnum.User
                break;
        }
        return { AccessSignature, RefreshSignature ,audience}



    }

    async createLoginCredentials({ user, issuer }:
        { user: HydratedDocument<IUser>, issuer: string }): Promise<{ access_token: string, refresh_token: string }> {
        const jwtId = randomUUID()

        const { AccessSignature, RefreshSignature, audience  } = await this.getTokenSignature(user.role)
        const access_token = await this.sign(
            { 
                payload: { sub: user._id },
                secret: AccessSignature,
                options: {
                    expiresIn: '1h' ,
                    issuer: issuer,
                    audience: [TokenTypeEnum.access, audience.toString()],
                    jwtid: jwtId
                }
            });

        const refresh_token = await this.sign(
            {
                payload: { sub: user._id },
                secret: RefreshSignature,
                options: {
                    expiresIn: '1y',
                    issuer: issuer,
                    audience: [TokenTypeEnum.refresh, audience.toString()],
                    jwtid: jwtId

                } 
            });
        return { access_token, refresh_token }
    }
    async getSignatureLevel(): Promise<RoleEnum> {
        let signatureLevel;
        switch (audienceEnum.System) {
            case audienceEnum.System:
                signatureLevel = RoleEnum.admin
                break;
            default:
                signatureLevel = RoleEnum.user
                break;
        }
        return signatureLevel
    }

   public async decodeToken({ token, tokenType = TokenTypeEnum.access }: { token: string, tokenType: TokenTypeEnum }): Promise<{ user: HydratedDocument<IUser>, decoded: JwtPayload }> {

        const decoded = await jwt.decode(token) as JwtPayload
        if (!decoded?.aud?.length) {
            throw new BadRequestException(`failed to decode token and token is required`)
        }

        const [decodedTokenType, audienceType] = decoded.aud
        if (decodedTokenType !== tokenType) {
            throw new UnauthorizedException(`invalid token Type  token type of ${decodedTokenType}  cannot access this api while token type of ${tokenType}`)
        }
        const signatureLevel = await this.getTokenSignature(audienceType as unknown as RoleEnum)



        if (decoded.jti && await redisService.get(redisService.revokeTokenKey({ userId: decoded.sub as string, jti: decoded.jti }))) {
            throw new UnauthorizedException("user already logged in")

        }
        const { AccessSignature, RefreshSignature } = await this.getTokenSignature(signatureLevel as unknown as RoleEnum)
        const verifyData = await this.verifyToken({ token, secret: tokenType == TokenTypeEnum.refresh ? RefreshSignature : AccessSignature })
        const user = await this.userRepository.findOne({ filter: { _id: verifyData.sub } })
        if (!user) {
            throw new UnauthorizedException("user not found please signup first")
        }

        if (user.changeCredentialsTime && user.changeCredentialsTime?.getTime() > (decoded.iat as number) * 1000) {
            throw new UnauthorizedException("invalid login session")
        }
        return { user, decoded }

    }

    async CreateRevokeToken({userId,jti,ttl}:{userId:string|Types.ObjectId,jti:string,ttl:number}){

        await this.rides.set({
            key:this.rides.revokeTokenKey({userId,jti}),
            value:jti,
            ttl
        })

        
    
    }
}


