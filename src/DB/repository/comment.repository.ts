import { IComment } from "../../common";
import { CommentModel } from "../models";
import { BaseRepository } from "./base.repository";


export  class commentRepository extends BaseRepository<IComment> {
    constructor() {
        super(CommentModel)
        
        }


}