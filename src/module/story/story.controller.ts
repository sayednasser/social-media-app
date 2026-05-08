import Router from "express"
import type { Request, Response, NextFunction } from "express"
import { successResponse } from "../../common"
import { authentication } from "../../middleware/authenticationMiddleware"
import { CreateStory, reactStory, shareStory } from "./story.validation"
import { validation } from "../../middleware"
import storyService from "./story.service"
import { createStoryDto, reactQueryStory } from "./storyDto"
import { cloudUpload, filedValidation } from "../../common/utils/multer"
const router = Router()


router.post("/create-Story", authentication(), cloudUpload(filedValidation.image || filedValidation.video).array("file", 4),
    validation(CreateStory), async (req: Request, res: Response, next: NextFunction) => {
        const data = await storyService.CreateStory(req.body as createStoryDto, req.user)
        successResponse({ res, statusCode: 201, data })
    })
router.delete("/:storyId/delete-Story", authentication(),
    async (req: Request, res: Response, next: NextFunction) => {
        const data = await storyService.DeleteStory(req.params.storyId as string, req.user)
        successResponse({ res, statusCode: 201, data })
    })
router.patch("/:storyId/react-Story", authentication(),
    validation(reactStory), async (req: Request, res: Response, next: NextFunction) => {
        const data = await storyService.ReactStory(req.params.storyId as string, req.query as unknown as reactQueryStory, req.user)
        successResponse({ res, statusCode: 201, data })
    })
router.get("/:storyId", authentication(),
    validation(shareStory), async (req: Request, res: Response, next: NextFunction) => {
        const data = await storyService.ShareStory(req.params.storyId as string, req.user)
        successResponse({ res, statusCode: 201, data })
    })
router.get("/", authentication(),
     async (req: Request, res: Response, next: NextFunction) => {
        const data = await storyService.ListStory( req.user)
        successResponse({ res, statusCode: 200, data })
    })





export default router