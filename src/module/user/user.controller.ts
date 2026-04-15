import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { successResponse, TokenTypeEnum } from "../../common";
import { authentication, authorization } from "../../middleware/authenticationMiddleware";
import { endpoint } from "./user.authorization";
import { userService } from "./user.service";
const router = Router()
router.get("/profile", authentication(), authorization(endpoint.profile), async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const user = await userService.profile(req.user)
    return successResponse({ res, data: user, statusCode: 200 })
})
router.get("/rotate-token", authentication(TokenTypeEnum.refresh), async (req: Request, res: Response, next: NextFunction) => {
    const rotate = await userService.rotateToken(req.user, req.host,
        req.decoded as { sub: string, iat: number, expiresIn: number, jti: string }
    )
    return successResponse({ res, statusCode: 201, data: { ...rotate } })
})
router.post("/logout",authentication(),async(req:Request,res:Response,next:NextFunction)=>{
    const statusCode= await userService.logout(req.body.flag,req.user,req.decoded as  { sub: string, iat: number, expiresIn: number, jti: string })
    successResponse({res,statusCode})
})
router.post("/update-password",authentication(),async(req:Request,res:Response,next:NextFunction)=>{
    console.log(req.body);
    const result=await userService.updateNewPassword({...req.body,user:req.user,issuer:`${req.protocol}://${req.host}`})
    console.log(req.body);
    successResponse({res,data:result,statusCode:200})
})

export default router   