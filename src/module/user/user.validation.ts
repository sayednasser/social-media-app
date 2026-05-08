import { generalValidationFields } from "../../common";
import { filedValidation } from "../../common/utils/multer";
import {z}from"zod"

export const profilePicture = {
        file: generalValidationFields.file(filedValidation.image),
}
export const coverPicture = {
        files:z.array(generalValidationFields.file(filedValidation.image)).min(1).max(2),
    
}

