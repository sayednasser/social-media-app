import { CreateStory, reactStory } from "./story.validation";
import {z}from"zod"



export type createStoryDto= z.infer<typeof CreateStory.body>
export type reactParamsStory= z.infer<typeof reactStory.params>
export type reactQueryStory= z.infer<typeof reactStory.query>
