import { model, models, Schema, Types } from "mongoose";
import { IPost } from "../../common";
import { AvailabilityEnum } from "../../common";



const PostSchema = new Schema<IPost>({
    folderId: { type: String, required: true },
    content: {
        type: String, required: function (this) {
            return !this.attachments?.length
        }
    },
    attachments: [{ type: String }],
    availability: { type: Number, enum: AvailabilityEnum, default: AvailabilityEnum.public },
    tags: [{ type: Types.ObjectId, ref: "User" }],
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Types.ObjectId, ref: "User" },
    deletedAt: Date,
    restoredId: Date,
    reactions: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        type: { type: String, enum: ['like', 'love'] }
    }]

}, {
    timestamps: true,
    collection: "post",
    strict: true,
    strictQuery: true,
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    },
})

  
PostSchema.virtual("comment", {
    localField: "_id",
    foreignField: "postId",
    ref: "comment",
    justOne:true

})

PostSchema.pre(["find", "findOne"], async function () {
    const query = this.getQuery()
    if (query.paranoid === false) {
        this.setQuery({ ...query })
    } else {
        this.setQuery({ ...query, deletedAt: { $exists: false } })
    }

})
export const PostModel = models.post || model<IPost>("Post", PostSchema)       