import { createClient, RedisClientType } from "redis"
import { redisUrl } from "../../config/config"
import { EmailTypeEnum } from "../enum"
import { Types } from "mongoose"
type BaseKeyType = { email: string, subject: EmailTypeEnum }
export class RedisServices {
    private client: RedisClientType
    constructor() {
        this.client=createClient({
            url:redisUrl
        })
        this.handleEvent()
    }
            private  handleEvent(){
         this.client.on('error', (err) => {  
            console.log('Redis Client Error', err);
        });
         this.client.on('connect', () => {
            console.log('Redis Client Connected');
        });
        this.client.on('ready', () => {
            console.log('Redis Client Connected and Ready');
        });
    }
   
    public async connect(): Promise<void> {
        await this.client.connect()
    }

    otpKey({ email, subject = EmailTypeEnum.confirmEmail }: BaseKeyType):string {
        return `OTP::User::${email}${subject}`
    }
    maxTrialOtpKey({ email, subject = EmailTypeEnum.confirmEmail }: BaseKeyType) :string{
        return `${this.otpKey({ email, subject })}::maxTrial`
    }
    blockOtpKey({ email, subject = EmailTypeEnum.confirmEmail }: BaseKeyType):string {
        return `${this.otpKey({ email, subject })}::block`
    }

    baseRevokeTokenKey(userId: string | Types.ObjectId):string {
        return `RevokeToken:: ${userId}`
    }
    revokeTokenKey({ userId, jti }: { userId: string | Types.ObjectId, jti: string }):string {
        return `${this.baseRevokeTokenKey(userId)}::${jti}`
    }

    async set({ key, value, ttl }: { key: string, value?: any, ttl?: number|undefined }): Promise<any> {
        try {
            let data = typeof value == "string" ? value : JSON.stringify(value)
            return  ttl ? await this.client.set(key, data, { EX: ttl }) : await this.client.set(key, data)
        } catch (error) {
            console.log(`failed to set data ${error}`);
            return 
        }
    }
    async get(key: string) :Promise<any> {
        try {
            let data = await this.client.get(key)
            if (!data) {
                return 
            }
            try {
                return JSON.parse(data)
            } catch (error) {
                return data

            }
        } catch (error) {
            console.log(`failed to get data ${error}`);
        }
    }
    async deleteKey(key: string|string[]) :Promise<any> {
        try {
            return await this.client.del(key)
        } catch (error) {
            console.log(`failed to delete data ${error}`);
            return 
        }
    }
    async updata({ key, value, ttl }: { key: string, value?: any, ttl?: number }) {
        try {
          
          return  await this.set({ key, value, ttl })
        } catch (error) {
            console.log(`failed to updata data${error} `);
            return  
        }
    }
    async ttl(key: string):Promise<number> {
        try {
            return await this.client.ttl(key)
        } catch (error) {
            console.log(`failed to get ttl${error}`);
            return -2
        }
    }
    async keys(key: string):Promise<string[]> {
        try {
            return await this.client.keys(key)
        } catch (error) {
            console.log(`failed to get keys${error}`);
            return [] 
        }
    }  
    async incr(key: string):Promise<number> {
        try {
            return await this.client.incr(key)
        } catch (error) {
            console.log(`failed to increment data${error}`);
            return 0
        }
    }



}

export const redisService = new RedisServices();