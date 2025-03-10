import asyncHandler from '../utils/asyncHandler.js';
import apiError from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import fileUploader from '../utils/Cloudinary.js';
import apiResponse from '../utils/apiResponse.js';

const registerUser = asyncHandler(async (req) => {
    const { userName, email, fullName, password } = req.body
    console.log(userName, email, fullName, password)

    //NOTE -  validation
    if ([userName, email, fullName, password].some((field) => field.trim() === "")) {
        throw new apiError(400, "All fields are required");
    }

    //NOTE -  existing user
    const existedUser = User.findOne({
        $or: [{ userName }, { email }]
    })

    if (existedUser) {
        throw new apiError(409, "User already exists");
    }

    //NOTE - checking for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if (!avatarLocalPath) {
        throw new apiError(400, "Avatar is required");
    }

    //NOTE - uploading files
    const avatar = await fileUploader(avatarLocalPath);
    const coverImage = await fileUploader(coverImageLocalPath);

    if (!avatar) {
        throw new apiError(400, "Error uploading avatar");
    }


    //NOTE - creating user
    const user = await User.create({
        userName: userName.toLowerCase(),
        email,
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password
    })

    //NOTE - check if user is created and removing password and refreshToken field
    const isUserCreated = await User.findById(user._id).select("-password -refreshToken");
    if (!isUserCreated) {
        throw new apiError(500, "Error creating user");
    }

    //NOTE - returning user response
    res.status(201).json(new apiResponse(200, "User created successfully", isUserCreated));
});

export default registerUser  