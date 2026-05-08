import { HydratedDocument } from "mongoose";
import { BadRequestException, CloudinaryService, ForbiddenException, IComment, IPost, IUser, NotFoundException, NotificationService, RedisServices, UnauthorizedException } from "../../common";
import { commentRepository, PostRepository, UserRepository } from "../../DB/repository";
import { CommentDto, CommentParamsDto, paramsCommentDto, paramsReplyCommentDto, QueryCommentDto, QueryReplyCommentDto, replyOnCommentDto, replyOnCommentParamsDto, UpdateCommentDto } from "./comment.Dto";
import { getAvailability } from "../../common/utils/post.shared";
import { Types } from "mongoose";
import { APPLICATION_NAME } from "../../config/config";
import de from "zod/v4/locales/de.js";


export class commentService {
    private readonly commentRepository: commentRepository
    private readonly notification: NotificationService
    private readonly redis: RedisServices
    private readonly postRepository: PostRepository
    private readonly cloudinaryService: CloudinaryService
    private readonly userRepository: UserRepository
    constructor() {
        this.commentRepository = new commentRepository()
        this.notification = new NotificationService()
        this.redis = new RedisServices()
        this.postRepository = new PostRepository()
        this.cloudinaryService = new CloudinaryService()
        this.userRepository = new UserRepository()
    }


    async addComment(postId: CommentParamsDto, { content, files = [], tags }: CommentDto, user: HydratedDocument<IUser>): Promise<HydratedDocument<IComment>> {
        const post = await this.postRepository.findOne({
            filter: {
                _id: postId,
                $or: getAvailability(user)
            }
        })
        if (!post) {
            throw new NotFoundException("post not found")
        }
        const mentions: Types.ObjectId[] = []
        const Fcm_token: string[] = []
        if (tags?.includes(user._id.toString())) {
            throw new BadRequestException("you cannot mention yourself")
        }
        if (tags?.length) {
            const mentionAccount = await this.userRepository.find({ filter: { _id: { $in: tags } } })
            if (mentionAccount.length !== tags.length) {
                throw new NotFoundException("user not found")
            }
            for (const tag of tags) {
                mentions.push(Types.ObjectId.createFromHexString(tag))
                const tokens = (await this.redis.getFCMs(tag))
                tokens.map(token => Fcm_token.push(token))
            }
        }
        const folderId = post.folderId
        let attachments: any[] = []
        if (files?.length) {
            attachments = await this.cloudinaryService.uploadFiles({ files, folder: `${APPLICATION_NAME}/users/${user.userName}/commentPicture` })
        }
        const comment = await this.commentRepository.createOne({
            data: {
                createdBy: user._id,
                content,
                attachments,
                postId: post._id,
                tags: mentions
            }
        })
        if (!comment) {
            if (attachments.length) {
                await this.cloudinaryService.deleteFiles(attachments)

            }
            throw new BadRequestException(" failed to created a comment")
        }
        if (Fcm_token.length) {
            this.notification.sendNotifications({
                tokens: Fcm_token,
                data: { title: `${user.userName} mentioned you in a comment`, body: JSON.stringify({ message: `${user.userName}`, postId: post._id, commentId: comment._id }) }
            })
        }
        return comment

    }
    async reactComment(params: paramsCommentDto, { react }: QueryCommentDto, user: HydratedDocument<IUser>) {
        const { commentId, postId } = params
        const reaction: Record<number, string> = {
            1: 'like',
            2: 'love',
            3: "care",
            4: 'wow',
            5: 'haha',
            6: "sad",
            7: "angry"
        };

        const selectedReaction = reaction[Number(react)];

        if (!selectedReaction) {
            throw new BadRequestException("Invalid reaction type");
        }
        await this.commentRepository.findOneAndUpdate({
            filter: { _id: commentId, postId: postId },
            update: { $pull: { reactions: { userId: user._id } } },
        });

        const comment = await this.commentRepository.findOneAndUpdate({
            filter: {
                _id: commentId,
                postId: postId,
                $or: [...getAvailability(user), { postId: postId }]
            },
            update: {
                $addToSet: { reactions: { userId: user._id, type: selectedReaction } }
            },
            options: { new: true }

        })
        console.log({ comment });
        if (!comment) {
            throw new NotFoundException("failed to find matching comment")
        }
        return comment

    }
    async replyOnComment({ postId, commentId }: replyOnCommentParamsDto, { content, files = [], tags }: replyOnCommentDto, user: HydratedDocument<IUser>): Promise<HydratedDocument<IComment>> {
        const comment = await this.commentRepository.findOne({
            filter: {
                _id: commentId as string,
                postId: postId,
            },
            options: {
                populate: [{ path: "postId", match: { $or: getAvailability(user) } }]
            }
        })
        if (!comment) {
            throw new NotFoundException("comment not found")
        }
        if (!comment.postId) {
            throw new ForbiddenException("you are not allowed to reply on this comment")
        }
        const mentions: Types.ObjectId[] = []
        const Fcm_token: string[] = []
        if (tags?.includes(user._id.toString())) {
            throw new BadRequestException("you cannot mention yourself")
        }
        if (tags?.length) {
            const mentionAccount = await this.userRepository.find({ filter: { _id: { $in: tags } } })
            if (mentionAccount.length !== tags.length) {
                throw new NotFoundException("user not found")
            }
            for (const tag of tags) {
                mentions.push(Types.ObjectId.createFromHexString(tag))
                const tokens = (await this.redis.getFCMs(tag))
                tokens.map(token => Fcm_token.push(token))
            }
        }
        const post = comment.postId as HydratedDocument<IPost>
        const folderId = post.folderId
        let attachments: any[] = []
        if (files?.length) {
            attachments = await this.cloudinaryService.uploadFiles({ files, folder: `${APPLICATION_NAME}/users/${user.userName}/commentPicture` })
        }
        const reply = await this.commentRepository.createOne({
            data: {
                createdBy: user._id,
                content,
                attachments,
                postId: post._id,
                commentId: comment._id,
                tags: mentions,
            }
        })
        if (!reply) {
            if (attachments.length) {
                await this.cloudinaryService.deleteFiles(attachments)

            }
            throw new BadRequestException(" failed to created a replyOnComment")
        }
        if (Fcm_token.length) {
            this.notification.sendNotifications({
                tokens: Fcm_token,
                data: { title: `${user.userName} mentioned you in a comment`, body: JSON.stringify({ message: `${user.userName}`, postId: post._id, commentId: comment._id, replyId: reply._id }) }
            })
        }
        return reply

    }
    async reactReplyComment(params: paramsReplyCommentDto, react: QueryReplyCommentDto, user: HydratedDocument<IUser>) {
        const { commentId, replyId, postId } = params
        const reaction: Record<number, string> = {
            1: 'like',
            2: 'love',
            3: "care",
            4: 'wow',
            5: 'haha',
            6: "sad",
            7: "angry"
        };

        const reactionType = Number(react.react || react);
        const selectedReaction = reaction[reactionType];
        if (!selectedReaction) {
            throw new BadRequestException("Invalid reaction type");
        }
        await this.commentRepository.findOneAndUpdate({
            filter: { _id: replyId, postId: postId, commentId: commentId },
            update: { $pull: { reactions: { userId: user._id } } }
        });


        const reply = await this.commentRepository.findOneAndUpdate({
            filter: {
                _id: replyId,
                $or: getAvailability(user),
            },
            update: {
                $addToSet: { reactions: { userId: user._id, type: selectedReaction } }
            },
            options: { new: true }

        })
        console.log({ reply });
        if (!reply) {
            throw new NotFoundException("failed to find matching comment")
        }
        return reply

    }
    async listComment(postId: string, user: HydratedDocument<IUser>): Promise<IComment[]> {

        const post = await this.postRepository.findOne({ filter: { _id: postId } })
        if (!post) {
            throw new NotFoundException("post not found")
        }
        const comment = await this.commentRepository.find({
            filter: {
                postId: postId,
                hide: { $exists: false },
                ...(post ? {} : { $or: getAvailability(user) })
            },
            options: {
                populate: [{ path: "reply", populate: [{ path: "reply", populate: [{ path: "reply" }] }] }],
            }
        })
        return comment

    }
    async hideComment(commentId: string, postId: string, user: HydratedDocument<IUser>) {
        const CheckComment = await this.commentRepository.findOne({
            filter: { _id: commentId, postId: postId, hide: { $exists: false } },
            options: {
                populate: [{ path: "postId" }]
            },
        })
        if (!CheckComment) {
            throw new NotFoundException("comment not found")
        }
        if (CheckComment.postId.toString() !== user._id.toString()) {
            throw new UnauthorizedException("only Admin can see");
        }
        const updateComment = await this.commentRepository.findOneAndUpdate({
            filter: { _id: commentId, postId: postId },
            update: { hide: new Date() },
            options: { new: true }

        })
        if (!updateComment) {
            throw new BadRequestException("failed to hide comment")
        }
        return updateComment

    }
    async softDelete(commentId: string, postId: string, user: HydratedDocument<IUser>) {
        {
            const CheckComment = await this.commentRepository.findOne({
                filter: { _id: commentId, postId: postId, deletedAt: { $exists: false }, hide:{ $exists: false } },
                options: {
                    populate: [{ path: "postId" }]
                },
            })
            if (!CheckComment) {
                throw new NotFoundException("comment not found")
            }
            console.log({ CheckComment });
            console.log({ commentId });
            console.log({ postId });
            if ((CheckComment.postId as HydratedDocument<IPost>).createdBy.toString() !== user._id.toString() && CheckComment.createdBy.toString() !== user._id.toString()) {
                throw new UnauthorizedException("only Admin can see");
            }
            const updateComment = await this.commentRepository.findOneAndUpdate({
                filter: { _id: commentId, postId: postId },
                update:{  $addToSet: { deletedAt: { userId: user._id, type: new Date() } }},
                options: { new: true }

            })
            if (!updateComment) {
                throw new BadRequestException("failed to deleted comment")
            }
            return updateComment

        }

    }
     async hardDelete(commentId: string, postId: string, user: HydratedDocument<IUser>) {
        
            const Comment = await this.commentRepository.findOne({
                filter: { _id: commentId, postId: postId, deletedAt: { $exists: true } },
                options: {
                    populate: [{ path: "postId" }]
                },
            })
            if (!Comment) {
                throw new NotFoundException("comment not found")
            }
             if ((Comment.postId as HydratedDocument<IPost>).createdBy.toString() !== user._id.toString() && Comment.createdBy.toString() !== user._id.toString()) {
                throw new UnauthorizedException("only Admin can see");
            }
            const deleteComment = await this.commentRepository.findOneAndDelete({
                filter: { _id: commentId, postId: postId },

            })
            if (!deleteComment) {
                throw new BadRequestException("failed to deleted comment")
            }
            return deleteComment

        

    }
}
export default new commentService()