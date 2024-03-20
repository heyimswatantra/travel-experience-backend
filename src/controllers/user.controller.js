import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

// defining options to be passed in .cookie()
const options = {
    httpOnly: true,
    secure: true
}

const generateAccessAndRefreshToken = async (userId) => {
    try {
        // console.log("userId :: ", userId);
        const user = await User.findById(userId)
        // console.log(user);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        // console.log("accessToken :: ", accessToken)
        // console.log("refreshtoken :: ", refreshToken);

        // setting the refesh token in user document
        user.refreshToken = refreshToken

        // we must save the change to propogate them,
        // but when we use call save() it fires the mongo models and all fields are validate again,
        // to avoid that we can pass an option "validateBeforeSave" : "false"
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    // steps to register a user
    // get user details from frontend
    // validation of passed fields (not empty)
    // check if user already exits (username, email)
    // email validation (regex)
    // check for images: avatar
    // upload imgs to cloudinary
    // create to user obj to be pushed to DB 
    // check for user creation response
    // remove password and refresh token from DB response
    // return response

    const {fullName, email, username, password} = req.body
    console.log(req);

    // now we have to validate all the fields
    // instead of looping or checking all fields one by one, we can use .some() method
    // some() takes a cb func and return true if any ele of arr satisfies the condition in cb func

    if (
        [fullName, email, username, password].some((field) => 
        field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields required")
    }

    // find if there already exists a user with same username OR email
    // we can use operators "$or"
    const existedUser = await User.findOne({
        $or : [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    const avatarLocalPath = req.file?.path;
    console.log(avatarLocalPath);

    let avatar = ""
    if (avatarLocalPath) {
        avatar = await uploadOnCloudinary(avatarLocalPath)
        if (!avatar) {
            throw new ApiError(400, "Couldn't upload avatar on cloudinary")
        }
    }

    // create user Obj
    const user = await User.create({
        fullName,
        avatar: avatar?.url   || "",
        username: username.toLowerCase(),
        email,
        password
    })

    // remove pass and refresh token
    const createUser = await User.findById(user._id)
    .select("-password -refreshToken")

    if (!createUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createUser, "User register successfully")
    )

})

const loginUser = asyncHandler( async (req, res) => {
    /*
    req.body se data le aao
    username OR email ka access lo
    check in DB if user exists
    perform password check
    generate access and refresh token
    send cookies
    */

    const {username, password, email} = req.body
    // console.log(req.body);
    
    if(!(username || email)) {
        throw new ApiError(400, "Username or Email is required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user) {
        throw new ApiError(404, "User does not exists")
    }

    // password check
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Incorrect Password")
    }

    // access and refresh token banao
    // console.log(user);
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    // error: .select is not a method
    // const logginedUser = user.select("-password -refreshToken")

    const logginedUser = await User.findById(user._id).select("-password -refreshToken")

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: logginedUser, accessToken, refreshToken
            },
            "User Logged In Successfully"
        )
    )

})

const logoutUser = asyncHandler (async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User Logged Out")
    )
})

const changePassword = asyncHandler( async (req, res) => {
    const {oldPassword, newPassword} = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid Old Password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Password Changed Successfully")
    )
})

// const updateAccountDetails = asyncHandler (async (req, res) => {
//     const {fullName, email} = req.body

//     if (!fullName || !email) {
//         throw new ApiError(400, "All fields are required")
//     }

//     const user = await User.findByIdAndUpdate(
//         req.user?._id,
//         {
//             $set: {
//                 fullName,
//                 email
//             }
//         },
//         {new: true}
//     ).select("-password")

//     return res
//     .status(200)
//     .json(
//         new ApiResponse(200, user, "Account details uploaded successfully") 
//     )
// })

const updateUserAvatar = asyncHandler (async (req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }
    
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading avatar on cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar updated successfully")
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    changePassword,
    // updateAccountDetails,
    updateUserAvatar,
}