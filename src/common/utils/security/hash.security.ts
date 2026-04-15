import {hash,compare} from 'bcrypt'
import { SALT } from '../../../config/config'

export const hashPassword= async({plainText,salt=SALT}:{plainText:string,salt?:number}) :Promise<string>=> {
    return await hash(plainText,salt) 
}
export const comparePassword= async({plainText,cipherText}:{plainText:string,cipherText:string}):Promise<boolean> => {
    return await compare(plainText,cipherText)
} 