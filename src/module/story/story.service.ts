import { HydratedDocument, Types } from "mongoose"
import { BadRequestException, CloudinaryService, IUser, NotFoundException, NotificationService, RedisServices } from "../../common"
import { UserRepository } from "../../DB/repository"
import { StoryRepository } from "../../DB/repository/storyRepository"
import { createStoryDto, reactParamsStory, reactQueryStory } from "./storyDto"
import { randomUUID } from "node:crypto"
import { APPLICATION_NAME } from "../../config/config"
import { IStory } from "../../common/interfaces/story.interface"
import { getAvailability, getAvailabilityStory } from "../../common/utils/post.shared"


export class StoryService {

    private storyRepository: StoryRepository
    private cloudinaryService: CloudinaryService
    private notification: NotificationService
    private redis: RedisServices
    private userRepository: UserRepository

    constructor() {
        this.storyRepository = new StoryRepository()
        this.cloudinaryService = new CloudinaryService()
        this.notification = new NotificationService()
        this.redis = new RedisServices()
        this.userRepository = new UserRepository()

    }



    async CreateStory({ content, tags, files = [], availability }: createStoryDto, user: HydratedDocument<IUser>): Promise<IStory> {
        const mentions: Types.ObjectId[] = []
        const FCM_TOKEN: string[] = []
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
                const tokens = await this.redis.getFCMs(tag)
                tokens.map(token => FCM_TOKEN.push(token))
            }
        }

        const folderId = randomUUID()
        let attachments: string[] = []
        if (files?.length) {
            attachments = await this.cloudinaryService.uploadFiles({ files, folder: `${APPLICATION_NAME}/users/${user.userName}/storyPicture` })
        }
        const story = await this.storyRepository.create({
            data: {
                createdBy: user._id,
                content,
                attachments,
                availability,
                folderId,
                deletedAt: new Date(Date.now() + 60 * 60 * 24 * 1000),
                tags: mentions,
            }
        })
        if (!story) {
            if (attachments.length) { }
            await this.cloudinaryService.deleteFiles(attachments)

            throw new BadRequestException("failed to create story")
        }
        if (FCM_TOKEN.length) {
            await this.notification.sendNotifications({
                tokens: FCM_TOKEN,
                data: { title: `${user.userName} mentioned you in a Story`, body: JSON.stringify({ message: `${user.userName}` }) }
            })
        }
        return story

    }
    async DeleteStory(storyId: string, user: HydratedDocument<IUser>) {
        const findStory = await this.storyRepository.findOne(
            {
                filter: {
                    _id: storyId,
                    createdBy: user._id
                }
            })
        if (!findStory) {
            throw new NotFoundException("Story Not found")
        }
        await this.storyRepository.deleteOne({
            filter: {
                _id: storyId,
                createdBy: user._id

            }
        })
        return

    }
    async ReactStory(storyId: string, { react }: reactQueryStory, user: HydratedDocument<IUser>): Promise<IStory> {
        const reaction: Record<number, string> = {
            1: "like",
            2: "love",
            3: "care",
            4: "wow",
            5: "haha",
            6: "sad",
            7: "angry"
        }


        const selectedReaction = reaction[Number(react)];
        if (!selectedReaction) {
            throw new BadRequestException(" invalid reaction type")
        }
        const reactStory = await this.storyRepository.findOneAndUpdate({
            filter: {
                _id: storyId,
                $or: getAvailability(user),
            },
            update: { $push: { reactions: { userId: user._id, type: selectedReaction } } },
            options: { new: true }
        })
        if (!reactStory) {
            throw new NotFoundException("failed to find this story")
        }
        return reactStory
    }


    async ShareStory(storyId: string, user: HydratedDocument<IUser>): Promise<IStory> {
        console.log({ user });
        console.log({storyId});
        const story = await this.storyRepository.findOne({
            filter: {
                _id: storyId,
                $or: getAvailabilityStory(user),
            }
        })
        if (!story) {
            throw new NotFoundException("failed to find this story")
        }
        return story

    }

async ListStory(user: HydratedDocument<IUser>):Promise<IStory[]> {
        const stories = await this.storyRepository.find({
            filter: {
                $or: getAvailability(user),
            }
        })
        return stories
    }
}


export default new StoryService() 