import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { authentication, authorization } from "../../middleware/authenticationMiddleware";
import { RoleEnum, successResponse } from "../../common";
import postService from "./post.service";
import { filedValidation } from "../../common/utils/multer";
import { cloudUpload } from "../../common/utils/multer/cloud.multer";
import { validation } from "../../middleware";
import { createPostSchema, reactPostSchema,  sharePostSchema,  updataPostSchema } from "./post.validation";
import { paramsPostDto, QueryPostDto } from "./postDto"; 
import { commentRouter } from "../comment";
const router = Router()
router.use('/:postId/comment', commentRouter)
router.post("/add-Post", authentication(),
    cloudUpload(filedValidation.image).array("file", 4),
    validation(createPostSchema), async (req: Request, res: Response, next: NextFunction) => {
        const data = await postService.newPost(req.body, req.user)
        successResponse({ res, statusCode: 201, data })
    })
router.patch("/:postId/react", authentication(), validation(reactPostSchema), async (req: Request, res: Response, next: NextFunction) => {
        const data = await postService.reactPost(req.params as paramsPostDto, req.query as unknown as QueryPostDto, req.user)
        successResponse({ res, statusCode: 201, data })
    })
router.post("/update-Post/:postId", authentication(),
    cloudUpload(filedValidation.image).array("file", 4),
    validation(updataPostSchema), async (req: Request, res: Response, next: NextFunction) => {
        const data = await postService.updatePost(req.params.postId as string, req.body, req.user)
        successResponse({ res, statusCode: 201, data })
    })
router.get("/get-Post", authentication(),async (req: Request, res: Response, next: NextFunction) => {
        const data = await postService.ListPost(req.user)
        successResponse({ res, statusCode: 200, data })
    })
router.patch("/soft-delete-Post/:postId", authentication(),async (req: Request, res: Response, next: NextFunction) => {
    const data = await postService.softDeletePost(req.params.postId as string, req.user)
    successResponse({ res, statusCode: 200, message: "post deleted successfully " })
})
router.delete("/delete-Post/:postId", authentication(),authorization([RoleEnum.admin]),async (req: Request, res: Response, next: NextFunction) => {
    const data = await postService.hardDeletePost(req.params.postId as string,req.user)
    successResponse({ res, statusCode: 200, message: "post deleted successfully " })
})
router.get("/:postId/share",authentication(),validation(sharePostSchema),async(req: Request, res: Response, next: NextFunction) => {
    const data = await postService.sharePost(req.params.postId as string ,req.user   )
    successResponse({ res, statusCode: 200, data })
})


export default router    