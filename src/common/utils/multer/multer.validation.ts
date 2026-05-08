import { Request } from "express"

export const filedValidation = {
    image: ['image/jpeg', 'image/png', 'image/jpg'],
    video: ['video/mp4', 'video/ogg', 'video/webm'],
    audio: ['audio/mpeg', 'audio/ogg', 'audio/wav'],
    pdf: ['application/pdf']
}

export const fileFilter = (validation: string[] = []) => {
    return (req: Request, file: any, cb: any) => {
        const allowedTypes = validation.map(v => v.toLowerCase())
        if (!allowedTypes.includes(file.mimetype.toLowerCase())) {
            return cb(new Error('Invalid file type'), false)
        }
        return cb(null, true)
    }
}