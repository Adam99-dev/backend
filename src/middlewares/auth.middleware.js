import apiError from "../utils/apiError.js";
import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";


const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            throw new apiError(400, "Token not found");
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findById(decodedToken._id).select("-password -refreshToken")

        if (!user) {
            throw new apiError(404, "User not found");
        }

        req.user = user;
        next();
    } catch (error) {
        throw new apiError(401, "Unauthorized");
    }
})
export default verifyJWT;