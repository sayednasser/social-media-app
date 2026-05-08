import { model, models, Schema, Types } from "mongoose"
import { IComment } from "../../common"


const CommentSchema = new Schema<IComment>({
    content: {
        type: String, required: function (this) {
            return !this.attachments?.length
        }
    },
    attachments: [{ type: String }],
    reactions: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        type: { type: String, enum: ['like', 'love'] }
    }],

    tags: [{ type: Types.ObjectId, ref: "User" }],
    postId: { type: Types.ObjectId, ref: "Post", required: true },
    commentId: { type: Types.ObjectId, ref: "Comment" },
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Types.ObjectId, ref: "User" },
    hide: Date,
    deletedAt:  [{
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        type: { type: Date}
    }],
    restoredId: Date

}, {
    timestamps: true,
    collection: "comment",
    strict: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})


CommentSchema.virtual("reply", {
    localField: "_id",
    foreignField: "commentId",
    ref: "comment",
    // justOne:true

})
export const CommentModel = models.comment || model<IComment>("comment", CommentSchema)