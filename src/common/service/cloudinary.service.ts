import cloudinary from "../utils/multer/cloudinary"


export class CloudinaryService {


    constructor(

    ) { }


    async uploadFile({ filePath, folder }: { filePath: string, folder: string }) {
        return await cloudinary.uploader.upload(filePath, { folder })
    }
    async deleteImage(public_id: string) {
        return await cloudinary.uploader.destroy(public_id)
    }
    async uploadFiles({
        files = [],
        folder,
    }: {
        files: { path: string }[],
        folder: string
    }) {
        let attachments = []
        for (const file of files) {
            const { public_id} = await this.uploadFile({ filePath: file.path, folder })
            attachments.push( public_id )
        }
        return attachments
    }
    async deleteFiles(public_ids: string[]) {
        return await cloudinary.api.delete_resources(public_ids)
    }
}


export const cloudinaryService = new CloudinaryService()