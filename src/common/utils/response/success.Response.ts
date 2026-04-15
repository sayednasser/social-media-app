import { Response } from "express"

export const successResponse = <T>(
    { res, statusCode = 200, data = undefined, message = "Done" }: { res: Response, statusCode?: number, data?: T, message?: string }
) => {
    return res.status(statusCode).json({ message, data })
}