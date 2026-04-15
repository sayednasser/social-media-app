import { GenderEnum, ProviderEnum, RoleEnum } from "../enum";

export interface IUser {
    firstName: string;
    lastName: string;
    userName?: string;
    email: string;
    password: string;
    role: RoleEnum;
    bio?: String;
    age: number;
    phone: string;
    profileImage: string; profileCover: string[];
    provider: ProviderEnum;
    gender: GenderEnum;
    confirmPassword: string;
    confirmedAt?: Date;
    createdAt: Date;
    updatedAt?: Date;
    changeCredentialsTime?: Date;
    confirmEmail: Date;
    oldPassword: string[];

}
