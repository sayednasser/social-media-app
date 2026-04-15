import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import authService from "./auth.service";
import { successResponse } from "../../common/utils/response";
import { validation } from "../../middleware";
import { confirmEmail, loginSchema, resendConfirmEmail, signupSchema } from "./auth.validation";
import { IUser } from "../../common";
import { ILoginResponse } from "./auth.entity";
const router = Router()
router.post("/signup", validation(signupSchema), async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const result = await authService.signup(req.body)
    return successResponse<IUser>({ res, data: result, statusCode: 201 })
});
router.patch("/confirm-Email", validation(confirmEmail), async (req: Request, res: Response, next: NextFunction) => {
    const result = await authService.confirmEmail(req.body)
    successResponse({ res, data: result, statusCode: 200 })
});
router.patch("/resend-Confirm-Email", validation(resendConfirmEmail), async (req: Request, res: Response, next: NextFunction) => {
    const result = await authService.resendConfirmEmail(req.body)
    successResponse({ res, data: result, statusCode: 200 })
}); 
router.post("/login", validation(loginSchema), async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const data = await authService.login(req.body, req.host)
    return successResponse<ILoginResponse>({ res, data })
});
router.post("/signup/google", async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const { status, credentials } = await authService.SignupWithGmail(req.body.idToken, `${req.protocol}://${req.host}`)
    return successResponse({ res, data: { ...credentials } })
});
router.patch('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
    const result = await authService.ForgotPassword(req.body.email)
    successResponse({ res, data: result, statusCode: 200 })
});
router.patch('/verify-forgot-password', async (req: Request, res: Response, next: NextFunction) => {
    const result = await authService.verifyForgotPassword(req.body)
    successResponse({ res, data: result, statusCode: 200 })
});
router.patch('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
    const result = await authService.resatForgotPasswordCode(req.body)
    successResponse({ res, data: result, statusCode: 200 })
});

export default router  