import asyncHandler from '../utils/asyncHandler.js';
import apiError from '../utils/apiError.js';
import { User } from '../models/user.model.js';
import fileUploader from '../utils/Cloudinary.js';
import apiResponse from '../utils/apiResponse.js';
// import { response } from 'express';

const registerUser = asyncHandler(async (req, res) => {
    const { userName, email, fullName, password } = req.body
    console.log(userName, email, fullName, password)

    //NOTE -  validation
    if ([userName, email, fullName, password].some((field) => field.trim() === "")) {
        throw new apiError(400, "All fields are required");
    }

    //NOTE -  existing user
    const existedUser = await User.findOne({
        $or: [{ userName }, { email }]
    })

    if (existedUser) {
        throw new apiError(409, "User already exists");
    }

    //NOTE - checking for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

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



    const generateAccessAndRefreshToken = async (userId) => {
        try {
            const user = await User.findById(userId)
            const accessToken = user.generateAccessToken()
            const refreshToken = user.generateRefreshToken()

            user.refreshToken = refreshToken
            await user.save({ validateBeforeSave: false })

            return { accessToken, refreshToken }
        } catch (error) {
            throw new apiError(500, "Error generating tokens")
        }
    }
});

//ANCHOR - Login User
const loginUser = asyncHandler(async (req, res) => {
    const { userName, password, email } = req.body
    if (!userName || !email) {
        throw new apiError(400, "Username or email is required")
    }
    const user = await User.findOne({
        $or: [{ userName }, { email }]
    })

    if (!user) {
        throw new apiError(404, "User not found")
    }

    const isPasswordValid = await user.isPasswordMatched(password)
    if (!isPasswordValid) {
        throw new apiError(400, "Invalid User Credentials")
    }

    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-passwrod  -refreshToken")

    return res.status(200)
        .cookie("refreshToken", refreshToken, { httpOnly: true, secure: true })
        .cookie("accessToken", accessToken, { httpOnly: true, secure: true })
        .json(new apiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User Logged In Successfully"))

});

//ANCHOR - Logout User  
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { $set: {refreshToken: undefined} }, {new: true})
    return res.status(200)
        .clearCookie("refreshToken", { httpOnly: true, secure: true })
        .clearCookie("accessToken", { httpOnly: true, secure: true })
        .json(new apiResponse(200,{} ,"User Logged Out Successfully"))
});

export  { registerUser, loginUser, logoutUser };