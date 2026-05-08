import type { NextFunction, Request, Response } from "express";
import fs from"node:fs"

interface IError extends Error {
    statusCode?: number,
    cause?:  unknown
}


export const GlobalErrorHandler = (err: IError, req: Request, res: Response, next: NextFunction) => {
    const status = err.statusCode || 500
    const message = err.message || "something went wrong"
     if(req.file){
        if(fs.existsSync(req.file.path)){
            fs.unlinkSync(req.file.path)
        }
    }
    if(Array.isArray(req.files)){
        req.files.forEach(file=>{
            if(fs.existsSync(file.path)){
                fs.unlinkSync(file.path)
            }
        })
    }
    return res.status(status).json({
        statusCode:status,
        message: message,
        cause:err.cause,
        stack:err.stack,

 
    })


} 