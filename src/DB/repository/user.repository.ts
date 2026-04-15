import { BaseRepository } from "./base.repository";
import { IUser } from "../../common";
import { UserModel } from "../models";


export class UserRepository extends BaseRepository<IUser> {
    constructor( ){
        super(UserModel)
    }
}