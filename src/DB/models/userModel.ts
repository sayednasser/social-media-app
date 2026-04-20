import { Schema, model, models } from "mongoose";
import { GenderEnum, ProviderEnum, RoleEnum, IUser, hashPassword, encrypt } from "../../common";
const UserSchema = new Schema<IUser>(
    {
        firstName: { type: String, required: true, min: 2, max: 20 },
        lastName: { type: String, required: true, min: 2, max: 20 },
        email: { type: String, required: true, unique: true },
        password: {
            type: String, required: function (this) {
                return this.provider === ProviderEnum.system
            }
        },
        provider: {
            type: Number,
            enum: Object.values(ProviderEnum).filter(v => typeof v === "number"),
            default: ProviderEnum.system
        },
        role: {
            type: Number,
            enum: Object.values(RoleEnum).filter(v => typeof v === "number"),
            default: RoleEnum.user
        },
        gender: {
            type: Number,
            enum: Object.values(GenderEnum).filter(v => typeof v === "number"),
            default: GenderEnum.male
        },
        age: { type: Number, required: true },
        phone: { type: String, required: true },
        profileImage: { type: String },
        profileCover: [{ type: String }],
        confirmPassword: { type: String },
        oldPassword: [{ type: String }],
        confirmedAt: { type: String },
        confirmEmail: Date,
        bio: { type: String, max: 200 },
        changeCredentialsTime: { type: Date },
        deletedAt: { type: Date },

    },
    {
        timestamps: true,
        strict: true,
        strictQuery: true,
        collection: "Users",
        toJSON: {
            virtuals: true
        },
        toObject: {
            virtuals: true
        },
    })
UserSchema.virtual("userName").set(function (this: IUser, value: String) {
    const [firstName, lastName] = value.split(" ")
    this.firstName = firstName as string
    this.lastName = lastName as string
}).get(function (this: IUser) {
    return `${this.firstName} ${this.lastName}`
})



UserSchema.pre("save", async function () {
    if (this.isModified("phone")) {
        this.phone = await encrypt(this.phone)
    }
})
UserSchema.pre("save", async function () {
    if (this.isModified("password")) {
        this.password = await hashPassword({ plainText: this.password })
    }
});

UserSchema.pre(["find", "findOne"], async function () {
    const query = this.getQuery()
    if (query.paranoid === false) {
        this.setQuery({ ...query })
    } else {
        this.setQuery({ ...query, deletedAt: { $exists: false } })
    }

})

    export const UserModel = models.User || model<IUser>("User", UserSchema)
