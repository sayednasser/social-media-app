import {z}from"zod"
import { CommentSchema, reactCommentSchema, reactReplyCommentSchema, replyOnCommentSchema, UpdateCommentSchema } from "./comment.validation"

export type CommentDto= z.infer<typeof CommentSchema.body>
export type CommentParamsDto= z.infer<typeof CommentSchema.params>

export type UpdateCommentDto= z.infer<typeof UpdateCommentSchema.body>
export type UpdateCommentParamsDto= z.infer<typeof UpdateCommentSchema.params>

export type replyOnCommentDto= z.infer<typeof replyOnCommentSchema.body>
export type replyOnCommentParamsDto= z.infer<typeof replyOnCommentSchema.params>

export type QueryCommentDto=z.infer<typeof reactCommentSchema.query>
export type paramsCommentDto=z.infer<typeof reactCommentSchema.params>

export type QueryReplyCommentDto=z.infer<typeof reactReplyCommentSchema.query>
export type paramsReplyCommentDto=z.infer<typeof reactReplyCommentSchema.params>
  