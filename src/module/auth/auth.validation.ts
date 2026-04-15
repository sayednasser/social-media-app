import { z } from "zod"
import { generalValidationFields } from "../../common/validation/generalValidationFields"


export const loginSchema = {
    body: z.strictObject({
        email: generalValidationFields.email,
        password: generalValidationFields.password
    })
}
export const signupSchema = {
    body: loginSchema.body.safeExtend({
        userName: generalValidationFields.userName,
        confirmPassword: generalValidationFields.confirmPassword,
        phone: generalValidationFields.phone,
        age:generalValidationFields.age,

    }).superRefine((data, ctx) => {
        if (data.password !== data.confirmPassword) {
            ctx.addIssue({
                code: "custom",
                message: "password and confirm password must be same"
            })
        }
    })
}
export const resendConfirmEmail = {
    body: z.strictObject({
            email: generalValidationFields.email,

    })
}
export const confirmEmail = {
    body: resendConfirmEmail.body.safeExtend({
        otp: generalValidationFields.otp

    })
}
