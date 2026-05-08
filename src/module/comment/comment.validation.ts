import { z } from "zod"
import { generalValidationFields } from "../../common"
import { filedValidation } from "../../common/utils/multer"
import { Types } from "mongoose"


export const CommentSchema = {
    params: z.strictObject({
        postId: generalValidationFields.id

    }),

    body: z.strictObject({
        content: z.string().optional(),
        files: z.array(generalValidationFields.file(filedValidation.image)).optional(),
        tags: z.array(generalValidationFields.id).optional(),
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
export const UpdateCommentSchema = {
    params: z.strictObject({
        postId: generalValidationFields.id,
        commentId:generalValidationFields.id

    }),

    body: z.strictObject({
        content: z.string().optional(),
        files: z.array(generalValidationFields.file(filedValidation.image)).optional(),
        tags: z.array(generalValidationFields.id).optional(),
        removeFiles:z.array(z.string()).optional,
        removeTags:z.array(z.string()).optional,
        hide:z.array(z.string()).optional,
        deletedAt:z.array(z.string()).optional
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
export const replyOnCommentSchema = {
    params: z.strictObject({
        commentId: generalValidationFields.id,
        postId: generalValidationFields.id
    }),
    body: z.strictObject({
        content: z.string().optional(),
        files: z.array(generalValidationFields.file(filedValidation.image)).optional(),
        tags: z.array(generalValidationFields.id).optional(),
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
export const reactCommentSchema = {
    query: z.strictObject({
        react: z.coerce.number()
    }),
    params: z.strictObject({
        commentId: generalValidationFields.id,
        postId: generalValidationFields.id
    })
}

export const reactReplyCommentSchema = {
    query: z.strictObject({
        react: z.coerce.number()
    }),
    params: z.strictObject({
        commentId: generalValidationFields.id,
        postId: generalValidationFields.id,
        replyId: generalValidationFields.id

    })
}

