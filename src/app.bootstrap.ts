import type { NextFunction, Request, Response } from "express"
import express from "express";
import { authRouter, userRouter } from "./module";
import { GlobalErrorHandler } from "./middleware";
import { PORT } from "./config/config";
import { connectionBD } from "./DB/connection.DB";
import { redisService } from "./common/service/redis.service";
// import cors from "cors"
const app = express()


export const bootstrap = async () => {
    app.use(express.json())
    await connectionBD()
    await redisService.connect()
    //app routing
    app.use("/user", userRouter)
    app.use("/auth", authRouter)

    app.get("/", (req: Request, res: Response) => {
        res.send("hello world")
    })
    app.all("{/*dummy}", (req: Request, res: Response, next: NextFunction) => {
        res.status(200).json({ message: "invalid application Routing" })
    })
    //global error handler
    app.use(GlobalErrorHandler)
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);

    })

} 