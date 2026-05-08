import { IPost } from "../../common";
import { PostModel } from "../models";
import { BaseRepository } from "./base.repository";

export class PostRepository extends BaseRepository<IPost>{
    constructor(){
        super(PostModel)
    }
}