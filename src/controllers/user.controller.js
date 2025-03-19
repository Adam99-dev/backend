import asyncHandler from '../utils/asyncHandler.js';
import apiError from '../utils/apiError.js';
import { User } from '../models/user.model.js';
import {fileUploader, fileDeleter} from '../utils/Cloudinary.js';
import apiResponse from '../utils/apiResponse.js';
import jwt from 'jsonwebtoken';


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
    if (!userName && !email) {
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
    await User.findByIdAndUpdate(req.user._id, { $set: { refreshToken: undefined } }, { new: true })
    return res.status(200)
        .clearCookie("refreshToken", { httpOnly: true, secure: true })
        .clearCookie("accessToken", { httpOnly: true, secure: true })
        .json(new apiResponse(200, {}, "User Logged Out Successfully"))
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingAccessToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingAccessToken) {
        throw new apiError(401, "Access Denied")
    }

    try {
        const decodedToken = jwt.verify(incomingAccessToken, process.env.REFRESH_TOKEN_SECRET_KEY)
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new apiError(404, "User not found")
        } else {
            if (incomingAccessToken !== user.refreshToken) {
                throw new apiError(401, "Access Denied")
            } else {
                const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)
                return res.status(200)
                    .cookie("refreshToken", newRefreshToken, { httpOnly: true, secure: true })
                    .cookie("accessToken", accessToken, { httpOnly: true, secure: true })
                    .json(new apiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Token Refreshed Successfully"))
            }
        }
    } catch (error) {
        throw new apiError(401, error?.message || "Access Denied")
    }
});

// ANCHOR - Change Password Functionality
const changePassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword, confirmPassword} = req.body
    const user = await User.findById(req.user?._id)

    const isPasswordMatched = await user.isPasswordMatched(oldPassword)
    if (!isPasswordMatched) {
        throw new apiError(400, "Invalid Old Password")
    }

    user.password = newPassword
    user.confirmPassword = confirmPassword

    if(newPassword !== confirmPassword) {
        throw new apiError(400, "Password does not match")
    }

    await user.save()
    return res.status(200).json(new apiResponse(200, {}, "Password Changed Successfully"))
});

//ANCHOR - Get Current User
const getCurrentUser = asyncHandler(async (req, res) => {
    res.status(200).json(200, req.user, "User Found")
})

//ANCHOR - Account Details Update
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body
    const user = await User.findByIdAndUpdate(req.user?._id, {$set: {fullName, email} }, { new: true }).select("-password")

    if (!user) {
        throw new apiError(404, "User not found")
    }

    return res.status(200).json(new apiResponse(200, user, "Account Details Updated Successfully"))
});

//ANCHOR - Update User Avatar
const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new apiError(400, "Avatar file is missing");
    }

    const user = await User.findById(req.user._id);
    if (user.avatar) {
        await fileDeleter(user.avatar);
    }

    const avatar = await fileUploader(avatarLocalPath);

    if (!avatar.url) {
        throw new apiError(400, "Error while uploading avatar");
    }

    user.avatar = avatar.url;
    await user.save();

    return res.status(200).json(new apiResponse(200, user, "Avatar image updated successfully"));
});

//ANCHOR - Update User Cover Image
const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new apiError(400, "Cover image file is missing");
    }

    const user = await User.findById(req.user._id);
    if (user.coverImage) {
        await fileDeleter(user.coverImage);
    }

    const coverImage = await fileUploader(coverImageLocalPath);

    if (!coverImage.url) {
        throw new apiError(400, "Error while uploading cover image");
    }

    user.coverImage = coverImage.url;
    await user.save();

    return res.status(200).json(new apiResponse(200, user, "Cover image updated successfully"));
});

// ANCHOR - Subscribers Count
const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { userName } = req.params;

    if (!userName?.trim()) {
        throw new apiError(400, "Username is missing");
    }

    const channel = await User.aggregate([
        {
            $match: {
                userName: userName?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscribers",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscribers",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                userName: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ]);

    if (!channel?.length) {
        throw new apiError(404, "Channel does not exist");
    }

    return res
        .status(200)
        .json(
            new apiResponse(200, channel[0], "User channel fetched successfully")
        );
});

//ANCHOR - Get Watch History
const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        userName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ]);

    return res
        .status(200)
        .json(
            new apiResponse(
                200,
                user[0].watchHistory,
                "Watch history fetched successfully"
            )
        );
});


export { registerUser, loginUser, logoutUser, refreshAccessToken, changePassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory };