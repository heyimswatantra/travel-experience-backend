import mongoose, {isValidObjectId} from "mongoose"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { Experience } from "../models/experience.model.js"

const isOwner = async (id, req) => {
    const experience = await Experience.findById(id)
    (experience?.creator.toString() !== req.user?._id.toString()) ? false : true
}

const addExperience = asyncHandler ( async (req, res) => {
    const {
        title, description, latitude, longitude, category, tags
    } = req.body

    const userId = req?.user._id

    if (!userId) throw new ApiError(400, "Login to create Experience")

    const tagArr = tags.split(",").map((item) => item.trim())

    // console.log(req, "files");

    if (
        [title, description].some((field) => 
        field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields required")
    }

    const imageArr = req.files
    const urlArr = []
    
    try {
        if (imageArr.length > 0) {
            for (let i=0; i<imageArr.length; i++) {
                const cloudinaryUrl = await uploadOnCloudinary(imageArr[i].path);
                urlArr.push(cloudinaryUrl.url)
            }
            // console.log(urlArr);
            if (urlArr.length <= 0) {
                throw new ApiError(400, "Something went wrong while uploading images")
            }
        }
    
        const experience = await Experience.create({
            title,
            description,
            images: urlArr,
            tags: tagArr,
            category,
            creator: userId,
            location: {
                type: "Point",
                coordinates: [latitude, longitude]
            }
        })
    
        return res
        .status(200)
        .json(new ApiResponse(200, experience, "Experience created successfully"))
    } catch (error) {
        throw new ApiError(500, error?.message ||"Something went wrong while creating experience")
    }
})

const deleteExperience = asyncHandler(async (req, res) => {
    const { experienceId } = req.params
    //TODO: delete experience

    if (!experienceId) {
        throw new ApiError(400, "Experience Id is required")
    }

    const experience = await Experience.findById(experienceId)

    if (!experience) {
        throw new ApiError(404, "Experience does not exists")
    }

    if (!isValidObjectId(experienceId)) {
        throw new ApiError(400, "Invalid Experience Id")
    }

    const authorized = await isOwner(Experience, req)
    if (!authorized) {
        throw new ApiError(300, "Unauthorized request")
    }
    
    try {
        
        const deleteResponse = await Experience.findByIdAndDelete(experienceId)

        if (!deleteResponse) {
            return res
            .status(400)
            .json(new ApiResponse(400, {}, "Something went wrong while deleting Experience in DB"))
        }

        return res
        .status(200)
        .json(new ApiResponse(200, deleteResponse, "Experience deleted successfully"))

    } catch (error) {
        throw new ApiError(400, "Something went wrong while deleting Experience")
    }
})


export {
    addExperience,
    deleteExperience
}