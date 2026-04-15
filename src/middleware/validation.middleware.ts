import type { NextFunction, Request, Response } from "express"
import { BadRequestException } from "../common"
import { ZodError } from "zod/v4"
import { ZodType } from "zod/v4"
type validationSchemaType=Partial<Record<keyRequestType,ZodType>>
type validationErrorType = Array<{
    key: keyRequestType,
    issues: Array<{
        message: string,
        path: Array<string | number | symbol | undefined>
    }>
}>
type keyRequestType = keyof Request
export const validation = (schema: validationSchemaType) => {
    return (req: Request, res: Response, next:NextFunction) => {
        const errors:validationErrorType = []

            for (const key of (Object.keys(schema) as keyRequestType[])) {
            if (!schema[key]) continue;
            const validationResult = schema[key].safeParse(req[key])
            if (!validationResult.success) {
                const error = validationResult.error as ZodError
                errors.push(
                    {
                        key, issues: error.issues.map(issue => {
                            return { message: issue.message, path: issue.path }
                        })
                    }
                )
            }
            if (errors.length) {
                throw new BadRequestException("validation error", errors)

            }

        }
        next()
    }

}