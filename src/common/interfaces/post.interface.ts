import { Types } from "mongoose";
import { AvailabilityEnum } from "../../common/enum/post.enum";

export type IPost = {
    folderId?: string;
    content?: string;
    files?: string[];
    availability?: AvailabilityEnum;
    userId: Types.ObjectId | string;
    tags?: Types.ObjectId | string[];
   reactions: { userId: Types.ObjectId | string, type: string }[]
    createdBy: Types.ObjectId | string;
    updatedBy?: Types.ObjectId | string;
    deletedAt?: Date;
    restoredId?: Date;
    createdAt: Date;
    updatedAt: Date;
    attachments?: string[];
    mentions: Types.ObjectId[]

};