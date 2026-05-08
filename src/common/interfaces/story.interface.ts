import { Types } from "mongoose";
import { AvailabilityEnum } from "../enum";



export interface IStory {
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
  attachments: string[];

}