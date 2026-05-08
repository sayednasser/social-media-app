import { HydratedDocument } from "mongoose"
import { AvailabilityEnum } from "../enum"
import { IUser } from "../interfaces"

export const getAvailability = (user: HydratedDocument<IUser>) => {
    return [
        { availability: AvailabilityEnum.public },
        { availability: AvailabilityEnum.friend, createdBy: { $in: [user._id, ...(user.friends || [])] } },
        { availability: AvailabilityEnum.Only_me, createdBy: user._id },
        { tags: { $in: [user._id] } },
        
    ]
}
export const getAvailabilityStory = (user: HydratedDocument<IUser>) => {
    return [
        
        { tags: { $in: [user._id] } },
        
    ]
}