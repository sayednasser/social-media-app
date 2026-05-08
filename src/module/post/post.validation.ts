import { z } from "zod"
import { generalValidationFields } from "../../common"
import { AvailabilityEnum } from "../../common";
import { filedValidation } from "../../common/utils/multer";

import { Types } from "mongoose"

export const createPostSchema = {
    body: z.strictObject({
        content: z.string().optional(),
        files: z.array(generalValidationFields.file(filedValidation.image)).optional(),
        availability: z.coerce.number().default(AvailabilityEnum.public),
        tags: z.array(z.string()).optional(),
    }).superRefine((args, ctx) => {
        if (!args.content && !args.files) {
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message: "content or files is required"
            })
        }

        if (args.tags?.length) {
            const uniqueTags = [...new Set(args.tags)]
            if (args.tags?.length != uniqueTags.length) {
                ctx.addIssue({
                    code: "custom",
                    path: ["tags"],
                    message: "tags must be unique there is a duplicated data"
                })

            }
            for (const tag of args.tags) {
                if (!Types.ObjectId.isValid(tag)) {
                    ctx.addIssue({
                        code: "custom",
                        path: ["tags"],
                        message: "tags must be valid mongo id"
                    })
                }
            }
        }

    })



}

export const updataPostSchema = {
    params: z.strictObject({
        postId: generalValidationFields.id
    }),
    body: z.strictObject({
        content: z.string().optional(),
        removeFiles: z.array(z.string()).optional(),
        removeTags: z.array(z.string()).optional(),
        files: z.array(generalValidationFields.file(filedValidation.image)).optional(),
        availability: z.coerce.number().optional(),
        tags: z.array(z.string()).optional(),
    }).superRefine((args, ctx) => {
        if (!args.content && !args.files) {
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message: "content or files is required"
            })
        }

        if (args.tags?.length) {
            const uniqueTags = [...new Set(args.tags)]
            if (args.tags?.length != uniqueTags.length) {
                ctx.addIssue({
                    code: "custom",
                    path: ["tags"],
                    message: "tags must be unique there is a duplicated data"
                })

            }

        }

    })

}


export const sharePostSchema = {
    params: z.strictObject({
        postId: generalValidationFields.id
    })
}
export const reactPostSchema = {
    query: z.strictObject({
        react: z.coerce.number()
    }),
    params: z.strictObject({
        postId: generalValidationFields.id
    })
}