import { Types } from "mongoose";
import { IPost } from "./post.interface";

export interface IComment {

    content: string;
    attachments: string[];
    reactions: { userId: Types.ObjectId | string, type: string }[];

    tags: Types.ObjectId[];
    postId: Types.ObjectId | IPost;
    commentId: Types.ObjectId | IComment;
    createdBy: Types.ObjectId | string;
    updatedBy: Types.ObjectId | string;
    hide: Date;
    deletedAt:  { userId: Types.ObjectId | string, type: Date }[];

    restoredId: Date;
    createdAt: Date;
    updatedAt: Date;
}   