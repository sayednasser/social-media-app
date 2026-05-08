
import {z}from"zod"
import { createPostSchema, reactPostSchema,  sharePostSchema,  updataPostSchema } from "./post.validation"

export type PostDto=z.infer<typeof createPostSchema.body>
export type updatePostDto=z.infer<typeof updataPostSchema.body>

export type QueryPostDto=z.infer<typeof reactPostSchema.query>
export type paramsPostDto=z.infer<typeof reactPostSchema.params>
export type paramsSharePostDto=z.infer<typeof sharePostSchema.params>


