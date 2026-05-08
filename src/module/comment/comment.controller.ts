import { Router } from "express";
import type { Request, Response, NextFunction } from "express"
import { authentication, authorization } from "../../middleware/authenticationMiddleware";
import commentService from "./comment.service";
import { RoleEnum, successResponse } from "../../common";
import { paramsCommentDto, paramsReplyCommentDto, QueryCommentDto, QueryReplyCommentDto, UpdateCommentDto, UpdateCommentParamsDto } from "./comment.Dto";
import { cloudUpload, filedValidation } from "../../common/utils/multer";
import { validation } from "../../middleware";
import { CommentSchema, reactCommentSchema, reactReplyCommentSchema, replyOnCommentSchema, UpdateCommentSchema } from "./comment.validation";
const router = Router({ mergeParams: true })


router.post("/", authentication(),
    cloudUpload(filedValidation.image).array("file", 4),
    validation(CommentSchema), async (req: Request, res: Response, next: NextFunction) => {
        console.log({ params: req.params.postId });
        const data = await commentService.addComment(req.params.postId as unknown as paramsCommentDto, req.body, req.user)
        successResponse({ res, statusCode: 201, data })
    })

router.patch("/:commentId/react", authentication(), validation(reactCommentSchema), async (req: Request, res: Response, next: NextFunction) => {
    const data = await commentService.reactComment(req.params as paramsCommentDto, req.query as unknown as QueryCommentDto, req.user)
    successResponse({ res, statusCode: 200, data })
})

router.post("/:commentId/reply", authentication(),
    cloudUpload(filedValidation.image).array("file", 4),
    validation(replyOnCommentSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        const data = await commentService.replyOnComment(req.params as paramsReplyCommentDto, { ...req.body, ...req.files }, req.user)
        successResponse({ res, statusCode: 201, data })
    })

router.patch("/:commentId/reply/:replyId/react", authentication(), validation(reactReplyCommentSchema), async (req: Request, res: Response, next: NextFunction) => {
    const data = await commentService.reactReplyComment(req.params as paramsReplyCommentDto, req.query as unknown as QueryReplyCommentDto, req.user)
    successResponse({ res, statusCode: 200, data })
})
router.get("/", authentication(), async (req: Request, res: Response, next: NextFunction) => {
    const data = await commentService.listComment(req.params.postId as string, req.user)
    successResponse({ res, statusCode: 200, data })
})

router.patch("/:commentId/hide", authentication(),
    async (req: Request, res: Response, next: NextFunction) => {
        const data = await commentService.hideComment(req.params.commentId as string, req.params.postId as string, req.user)
        successResponse({ res, statusCode: 201, message: "comment hidden successfully" })
    }) 
    router.patch("/:commentId/delete", authentication(),
    async (req: Request, res: Response, next: NextFunction) => {
        const data = await commentService.softDelete(req.params.commentId as string, req.params.postId as string, req.user)
        successResponse({ res, statusCode: 201, message: "comment deleted successfully" })
    })
    router.delete("/:commentId/delete", authentication(),authorization([RoleEnum.admin] ),
    async (req: Request, res: Response, next: NextFunction) => {
        const data = await commentService.hardDelete(req.params.commentId as string, req.params.postId as string, req.user)
        successResponse({ res, statusCode: 201, message: "comment deleted successfully" })
    })
export default router 