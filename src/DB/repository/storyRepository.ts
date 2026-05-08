import { IStory } from "../../common/interfaces/story.interface";
import { StoryModel } from "../models";
import { BaseRepository } from "./base.repository";



export class StoryRepository extends BaseRepository<IStory> {
    constructor() {
        super(StoryModel)

     }
}