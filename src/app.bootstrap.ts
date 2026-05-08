import type { NextFunction, Request, Response } from "express"
import express from "express";
import { authRouter, postRouter, StoryRouter, userRouter } from "./module";
import { GlobalErrorHandler } from "./middleware";
import { ORIGIN, PORT } from "./config/config";
import { connectionBD } from "./DB/connection.DB";
import cors from "cors"
import { redisService } from "./common/service";
import helmet from "helmet"
import { rateLimit } from "express-rate-limit"
const app = express()
export const bootstrap = async () => {
    const corsOptions = {
        origin: ORIGIN.split(","),
        optionsSuccessStatus: 200
    }
    const limiter = rateLimit({
        windowMs: 2 * 60 * 1000,
        legacyHeaders: true,
        standardHeaders: 'draft-8',
        skipSuccessfulRequests: true,
        skipFailedRequests: true,
        handler: (req, res, next) => {
            res.status(429).json({ message: "sayed you reached to the limit access" })
        },
        message: "sayed you reached to the limit",
        statusCode: 400,

    })
    app.set("trust proxy", true)
    app.use(cors(corsOptions), helmet(), limiter, express.json())



    //connection
    await connectionBD()
    await redisService.connect()
    //app routing
    app.use("/user", userRouter)
    app.use("/auth", authRouter)
    app.use("/post", postRouter)
    app.use("/story", StoryRouter)

    app.get("/", (req: Request, res: Response) => {
        res.send("hello world")
    })
    app.all("{/*dummy}", (req: Request, res: Response, next: NextFunction) => {
        res.status(400).json({ message: "invalid application Routing" })
    })
    //global error handler
    app.use(GlobalErrorHandler)
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);

    })

} 