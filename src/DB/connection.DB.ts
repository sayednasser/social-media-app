import {connect} from "mongoose";
import { DB_URL } from "../config/config";
import { UserModel } from "./models";
 export const connectionBD= async()=>{
    try {
        await connect(DB_URL,{serverSelectionTimeoutMS:5000})
        await UserModel.syncIndexes();
        console.log(` DB is connected successfully ✔😎`);
        
    } catch (error) {
        console.log(`failed to connect to DB ❌😒`);
        
        
    }
 }