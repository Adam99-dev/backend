import asyncHandler from '../utils/asyncHandler.js';


const registerUser = asyncHandler(async (_, res) => {
    res.status(201).json({
        message: "User registered successfully"
    })
})

export default registerUser  