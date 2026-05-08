import { z } from "zod";
export const  generalValidationFields = {
        email: z.email(),
        password: z.string().regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*\W).{8,16}$/),
        userName: z.string().regex(new RegExp(/^[A-Z]{1}[a-z]{1,24}\s[A-Z]{1}[a-z]{1,24}$/)),
        otp: z.string().regex(new RegExp(/^\d{6}$/)),
        confirmPassword: z.string(),
        phone: z.string().regex(new RegExp(/^(02|2|\+2)?01[0-25]\d{8}$/)),
        role: z.number(),
        id: z.string().regex(new RegExp(/^[a-fA-F0-9]{24}$/)),
        age: z.number().min(0).max(100),
        FCM: z.string(),
       
        file: function (mimetype: string[] = []) {
                return z.strictObject({
                        fieldname: z.string(),
                        originalname: z.string(),   
                        encoding: z.string(),
                        mimetype: z.enum(mimetype),
                        // finalPath: z.string().required(),
                        destination: z.string(),
                        filename: z.string(),
                        path: z.string(),
                        size: z.number().positive()
                })
        }
}


