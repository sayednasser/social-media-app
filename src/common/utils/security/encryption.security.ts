import crypto from "node:crypto";
import { ENCRYPTION_SECRET_KEY } from "../../../config/config";
import { BadRequestException } from "../../exception";
const IV_LENGTH = 16;
const ENCRYPTION_KEY =  crypto.createHash('sha256').update(ENCRYPTION_SECRET_KEY).digest()

export const encrypt = async (text:string):Promise<string> => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let encryption = cipher.update(text, "utf-8", "hex");
  encryption += cipher.final("hex");
  return `${iv.toString("hex")}:${encryption}`;
};

export const decrypt = async (encrypted:string) :Promise<string>=> {
  
  const [iv, encryption] = encrypted.split(":")
  if (!iv || !encryption) {
    throw new BadRequestException("invalid data") 
  };
  const binaryLikeIV = Buffer.from(iv, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, binaryLikeIV)
  let decryption = decipher.update(encryption, 'hex', 'utf-8')
  decryption += decipher.final('utf-8')
  return decryption
};


