import { HydratedDocument, Types } from "mongoose"
import { IUser, NotificationService, RedisServices, NotFoundException, BadRequestException, CloudinaryService, IPost, AvailabilityEnum, IComment } from "../../common"
import { PostRepository, UserRepository } from "../../DB/repository"
import { paramsPostDto,  PostDto, QueryPostDto, updatePostDto } from "./postDto"
import { randomUUID } from "node:crypto"
import { APPLICATION_NAME } from "../../config/config"
import { getAvailability } from "../../common/utils/post.shared"


class PostService {
    private readonly postRepository: PostRepository
    private readonly notification: NotificationService
    private readonly redis: RedisServices
    private readonly userRepository: UserRepository
    private readonly cloudinaryService = new CloudinaryService()
    constructor() {
        this.postRepository = new PostRepository()
        this.notification = new NotificationService()
        this.redis = new RedisServices()
        this.userRepository = new UserRepository()
        this.cloudinaryService = new CloudinaryService()
    }
    async newPost({ tags, files = [], content, availability }: PostDto, user: HydratedDocument<IUser>) {
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
        const folderId = randomUUID()
        let attachments: string[] = []
        if (files?.length) {
            attachments = await this.cloudinaryService.uploadFiles({ files, folder: `${APPLICATION_NAME}/users/${user.userName}/postPicture` })
        }
        const post = await this.postRepository.create({
            data: {
                createdBy: user._id,
                content,
                attachments,
                availability,
                folderId,
                tags: mentions
            }
        })
        if (!post) {
            if (attachments.length) {
                await this.cloudinaryService.deleteFiles(attachments)

            }
            throw new BadRequestException(" failed to created a post")
        }
        if (Fcm_token.length) {
            this.notification.sendNotifications({
                tokens: Fcm_token,
                data: { title: `${user.userName} mentioned you in a post`, body: JSON.stringify({ message: `${user.userName}`, postId: post._id }) }
            })
        }
        return post
    }
    async updatePost(postId: string, { tags, files = [], content, availability, removeFiles = [], removeTags = [] }: updatePostDto, user: HydratedDocument<IUser>) {
        const post = await this.postRepository.findOne({ filter: { _id: postId, deletedAt: { $exists: false }, createdBy: user._id } })
        console.log({ post })
        if (!post) {
            throw new NotFoundException("post not found")
        }

        if (!post.content && !content && !files.length && post.attachments?.length == removeFiles?.length) {
            throw new BadRequestException("failed to updata this post ")

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
            attachments = await this.cloudinaryService.uploadFiles({ files, folder: `${APPLICATION_NAME}/posts/${user._id}` })
        }
        const updataPost = await this.postRepository.findOneAndUpdate({
            filter: {
                _id: post._id,
                createdBy: user._id
            },
            update: [{
                $set: {
                    content: content || post.content,
                    availability: Number(availability || post.availability),
                    updatedBy: user._id,
                    attachments: {
                        $setUnion: [
                            {
                                $setDifference: [
                                    "$attachments",
                                    removeFiles ?? []
                                ]
                            },
                            attachments ?? []
                        ]
                    },
                    tags: {
                        $setUnion: [
                            {
                                $setDifference: [
                                    "$tags",
                                    removeTags.map(tag => Types.ObjectId.createFromHexString(tag))
                                ]
                            },
                            mentions
                        ]
                    }




                }
            }]
        })
        console.log({ updataPost })
        if (!updataPost) {
            if (attachments.length) {
                await this.cloudinaryService.deleteFiles(attachments)
            }
            throw new BadRequestException(" failed to created a post")
        }
        if (removeFiles?.length) {
            await this.cloudinaryService.deleteFiles(removeFiles)
        }
        if (Fcm_token.length) {
            this.notification.sendNotifications({
                tokens: Fcm_token,
                data: { title: `${user.userName} mentioned you in a post`, body: JSON.stringify({ message: `${user.userName}`, postId: post._id }) }
            })
        }
        return updataPost


    }
    async ListPost(user: HydratedDocument<IUser>): Promise<IPost[]> {

        const checkPost = await this.postRepository.find({
            filter: {
                $or: getAvailability(user),
            },
            options: {
                populate: [
                    {
                        path: "comment",
                        match: {
                            $or: [
                                { deletedAt: false },
                                { isSharedPost: true }
                            ]
                        },
                        populate: [
                            {
                                path: "reply",
                                match: { deletedAt: false },
                                populate: [{ path: "reply", match: { isDeleted: false } }]
                            }
                        ]
                    }
                ],
                lean: false
            }
        })
        if (!checkPost) {
            throw new NotFoundException("post not found")
        }
        return checkPost
    }
    async softDeletePost(postId: string, user: HydratedDocument<IUser>) {
        if (!user) {
            throw new BadRequestException("user not found")
        }
        const checkPost = await this.postRepository.findOne({ filter: { _id: postId, deletedAt: { $exists: false }, createdBy: user._id } })
        if (!checkPost) {
            throw new NotFoundException("post not found")
        }
        const softDelete = await this.postRepository.updateOne({ filter: { _id: postId }, update: { deletedAt: new Date() } })
        if (softDelete.matchedCount == 0) {
            throw new NotFoundException("post not deleted")
        }
        return;
    }
    async hardDeletePost(postId: string, user: HydratedDocument<IUser>) {

        const hardDeleted = await this.postRepository.deleteOne({ filter: { _id: postId, deletedAt: { $exists: true } } })
        if (hardDeleted.deletedCount == 0) {
            throw new NotFoundException("post not found")
        }
        return;
    }
    async reactPost({ postId }: paramsPostDto, { react }: QueryPostDto, user: HydratedDocument<IUser>) {

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
        await this.postRepository.findOneAndUpdate({
            filter: { _id: postId },
            update: { $pull: { reactions: { userId: user._id } } }
        });

        const post = await this.postRepository.findOneAndUpdate({
            filter: {
                _id: postId,
                $or: getAvailability(user),
            },
            update: {
                $addToSet: { reactions: { userId: user._id, type: selectedReaction } }
            },
            options: { new: true }

        })

        if (!post) {
            throw new NotFoundException("failed to find matching post")
        }
        return post

    }
    async sharePost(postId: string, user: HydratedDocument<IUser>): Promise<HydratedDocument<IPost>> {
        console.log({ user });
        console.log({ postId });
        const findPost = await this.postRepository.findOne({ filter: { deletedAt: { $exists: false }, _id: postId, $or: getAvailability(user), } })
        if (!findPost) {
            throw new NotFoundException("post not found")
        }
        return findPost
    }


}

export default new PostService()