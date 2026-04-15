import type { NextFunction, Request, Response } from "express"
import { BadRequestException, ForbiddenException,  RoleEnum, TokenService, TokenTypeEnum, UnauthorizedException } from "../common"

export const authentication = (tokenType = TokenTypeEnum.access) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const tokenService = new TokenService()
        if (!req?.headers?.authorization) {
            throw new BadRequestException("missing authorization key")
        }
        const { authorization } = req.headers
        const [flag, credentials] = authorization.split(" ")
        if (!flag || !credentials) {
            throw new BadRequestException('missing author')
        }
        switch (flag) {
            case 'Bearer':
                try {
                    const { user, decoded } = await tokenService.decodeToken({ token: credentials, tokenType })
                    req.user = user
                    req.decoded = decoded 
                } catch (error: any) {
                    if (error.name === 'TokenExpiredError') {
                        throw new UnauthorizedException ("Token expired"); 
                    }
                   throw new UnauthorizedException("Invalid token");
                }
                break;
            default:
                break;
        }
        next()
    }

}
export const authorization = (accessRole:RoleEnum[]) => {
    return async(req: Request, res: Response, next: NextFunction) => {
        if (!accessRole.includes(req.user?.role as unknown as RoleEnum)) {
            throw new ForbiddenException("not allowed to access")
        }
 
        next()
    }

}    