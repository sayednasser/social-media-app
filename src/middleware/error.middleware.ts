import type { NextFunction, Request, Response } from "express";


interface IError extends Error {
    statusCode?: number,
    cause?:  unknown
}


export const GlobalErrorHandler = (err: IError, req: Request, res: Response, next: NextFunction) => {
    const status = err.statusCode || 500
    const message = err.message || "something went wrong"
    return res.status(status).json({
        statusCode:status,
        message: message,
        cause:err.cause,
        stack:err.stack,

 
    })


} 