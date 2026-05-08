import { z } from "zod"
import { AvailabilityEnum, generalValidationFields } from "../../common"
import { filedValidation } from "../../common/utils/multer"
import { Types } from "mongoose"

export const CreateStory = {
    body: z.strictObject({
        content: z.string().optional(),
        files: z.array(generalValidationFields.file(filedValidation.image)).optional(),
        availability: z.coerce.number().default(AvailabilityEnum.friend),
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

export const reactStory = {
    params: z.strictObject({
        storyId: z.string()
    }),
    query: z.strictObject({
        react: z.coerce.number()
    })
}
export const shareStory = {
    params: z.strictObject({
        storyId: z.string()
    }),
    
}