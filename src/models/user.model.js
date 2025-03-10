import mongoose, {Schema} from "mongoose";
import bcrypt from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";

const userSchema = new Schema(
    {
        userName: {type: String, required: true, unique: true, index: true, lowercase: true, trim:true},
        email: {type: String, required: true, unique: true, index: true, lowercase: true},
        fullName: {type: String, required: true, index: true, trim: true},
        avatar: {type: String, required: true},
        coverImage: {type: String},
        watchHistory: [{ type: Schema.Types.ObjectId, ref: 'Video' }],
        password: {type: String, required: [true, "Password is required"]},
        refreshToken: {type: String}
    },
    {timestamps: true}
)

userSchema.pre("save", async function(next){
    if(! isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next();
})

userSchema.methods.isPasswordMatched = async function(password){
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.genrateAccessToken = function(password){
    return jwt.sign(
        {
        _id: this._id,
        email: this.email,
        userName: this.userName,
        fullName: this.fullName
    },
    process.env.JWT_SECRET_KEY,
    {
        expiresIn: press.env.JWT_EXPIRES_IN
    }
)
}

userSchema.methods.generateRefreshToken = function(password){
    return jwt.sign(
        {
        _id: this._id
    },
    process.env.REFRESH_TOKEN_SECRET_KEY,
    {
        expiresIn: press.env.REFRESH_TOKEN_EXPIRES_IN
    }
)
}

export const User =  mongoose.model("User", userSchema);