import {resolve} from "node:path";
import {config} from "dotenv";
config({path:resolve(`./.env.${process.env.NODE_ENV||"development"}`)});

export const DB_URL:string = process.env.DB_URL||""
export const PORT:string= process.env.PORT  || '4000'
export const redisUrl :string= process.env.REDIS_URL||""  
export const SALT :number= Number(process.env.SALT||"")  
export const ENCRYPTION_SECRET_KEY :string= process.env.SECRET_KEY||""
export const USER_ACCESS_TOKEN_KEY :string= process.env.USER_ACCESS_TOKEN_KEY||""
export const SYSTEM_ACCESS_TOKEN_KEY :string= process.env.USER_ACCESS_TOKEN_KEY||""
export const USER_REFRESH_TOKEN_KEY :string= process.env.USER_REFRESH_TOKEN_KEY||""
export const SYSTEM_REFRESH_TOKEN_KEY :string= process.env.USER_ACCESS_TOKEN_KEY||""

export const ACCESS_EXPIRES_IN = process.env.ACCESS_EXPIRES_IN as any
export const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN  as any

export const EMAIL_APP_PASSWORD=process.env.EMAIL_APP_PASSWORD||""
export const EMAIL_APP =process.env.EMAIL_APP||""  
export const FACEBOOK = process.env.FACEBOOK
export const INSTAGRAM = process.env.INSTAGRAM
export const YOUTUBE = process.env.YOUTUBE  
export const CLIENT_ID=process.env.CLIENT_ID as string 