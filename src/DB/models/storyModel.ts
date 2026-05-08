import { model, models, Schema, Types } from "mongoose";
import { IStory } from "../../common/interfaces/story.interface";
import { AvailabilityEnum } from "../../common";


const storySchema = new Schema<IStory>({
   content: { type: String, required: function (this) { return !this.files?.length } },
   files: { type: [String] },
   availability: { type: Number, enum: AvailabilityEnum, default: AvailabilityEnum.friend },
   tags: { type: [String] },
   createdBy: { type: Types.ObjectId, ref: "User", required: true },
   deletedAt: {
      type: Date,
      expires: 0
   },
    reactions: [{
          userId: { type: Schema.Types.ObjectId, ref: 'User' },
          type: { type: String }
      }]
   attachments: [{ type: String }],


}, {
   timestamps: true,
   strict: true,
   strictQuery: true,
   collection: "Story",
   toJSON: { virtuals: true },
   toObject: { virtuals: true }

})

export const StoryModel = models.Story || model<IStory>("Story", storySchema)