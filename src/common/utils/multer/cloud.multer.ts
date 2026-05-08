import multer from "multer"
import { fileFilter } from "./multer.validation"
import { Request } from "express"

export const cloudUpload=(validation:string[],size:number=5)=>{
    const storage = multer.diskStorage({

  filename: function (req:Request, file :any, cb:Function) {
    cb(null, file.originalname)
  }
})
return multer({ fileFilter:fileFilter(validation),storage: storage ,limits:{fileSize:1024*1024*size}})
} 