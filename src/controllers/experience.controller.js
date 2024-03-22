import mongoose, {isValidObjectId} from "mongoose"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { Experience } from "../models/experience.model.js"
import { User } from "../models/user.model.js"

const isOwner = async (id, req) => {
    const experience = await Experience.findById(id)

    if (experience.creator?.toString() !== req.user?._id.toString()) {
        return false;
    }
    return true;

    // const experience = await Experience.findById(id)
    // if (experience.creator?.toString() !== req.user?._id.toString()) {
    //     return false
    // }
    // return true
}

const addExperience = asyncHandler ( async (req, res) => {
    const {
        title, description, latitude, longitude, category, tags
    } = req.body

    const userId = req?.user._id

    if (!userId) 
    return res
        .status(400)
        .json(new ApiResponse(400, "Login to create Experience"))

    const tagArr = tags.split(",").map((item) => item.trim())

    // console.log(req, "files");

    if (
        [title, description].some((field) => 
        field?.trim() === "")
    ) {
        return res
        .status(400)
        .json(new ApiResponse(400, "All fields required"))
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
                return res
                .status(400)
                .json(new ApiResponse(400, "Something went wrong while uploading images"))
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

        if (!experience) {
            return res
            .status(500)
            .json(new ApiResponse(500, "Couldn't add experience"))  
        }

        const user = await User.findByIdAndUpdate(
            userId,
            {
                $push: { experience: experience._id}
            }
        )

        if (!user) {
            return res
            .status(500)
            .json(new ApiResponse(500, "Couldn't add experienceId to User Scehma"))
        }
    
        return res
        .status(200)
        .json(new ApiResponse(200, experience, "Experience created successfully"))
    } catch (error) {
        return res
        .status(500)
        .json(new ApiResponse(500, error?.message ||"Something went wrong while creating experience"))
    }
})

const updateExperience = asyncHandler ( async (req, res) => {
    const {
        title, description, latitude, longitude, category, tags, experienceId
    } = req.body

    if (!experienceId) {
        return res
        .status(500)
        .json(new ApiResponse(500, "Experience Id is required"))
    }

    const userId = req?.user._id

    if (!userId) 
    return res
        .status(400)
        .json(new ApiResponse(400, "Login to update experience"))

    const tagArr = tags?.split(",").map((item) => item.trim())

    // console.log(req, "files");

    if (
        [title, description].some((field) => 
        field?.trim() === "")
    ) {
        return res
        .status(400)
        .json(new ApiResponse(400, "Title and Description required"))
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
                return res
                .status(400)
                .json(new ApiResponse(400, "Something went wrong while uploading images"))
            }
        }
    
        const updateData = {
            ...(title && { title }),
            ...(description && { description }),
            ...(urlArr && { $push: { images: urlArr} }),
            ...(tagArr && { $push: { tags: tagArr} }),
            ...(category && { category }),
            // ...(userId && { creator: userId }),
            ...(latitude && longitude && {
                location: {
                    type: "Point",
                    coordinates: [latitude, longitude]
                }
            })
        };

        console.log(updateData);
        
        const experience = await Experience.findByIdAndUpdate(experienceId, updateData)

        if (!experience) {
            return res
            .status(500)
            .json(new ApiResponse(500, "Couldn't update experience"))
        }
        console.log(experience, "experience")
    
        return res
        .status(200)
        .json(new ApiResponse(200, experience, "Experience updated successfully"))
    } catch (error) {
        return res
        .status(500)
        .json(new ApiResponse(500, error?.message ||"Something went wrong while updating experience"))
    }
})

const deleteExperience = asyncHandler(async (req, res) => {
    const { experienceId } = req.params
    //TODO: delete experience

    // console.log(experienceId, "experienceId");
    if (!experienceId) {
        return res
        .status(400)
        .json(new ApiResponse(400, "Experience Id is required"))
    }
    
    if (!isValidObjectId(experienceId)) {
        return res
        .status(400)
        .json(new ApiResponse(400, "Invalid Experience Id"))
    }
    
    const authorized = await isOwner(experienceId, req)
    if (!authorized) {
        return res
        .status(300)
        .json(new ApiResponse(300, "Unauthorized request"))
    }

    const experience = await Experience.findById(experienceId)

    if (!experience) {
        return res
        .status(404)
        .json(new ApiResponse(404, "Experience does not exists"))
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
        return res
        .status(400)
        .json(new ApiResponse(400, "Something went wrong while deleting Experience"))
    }
})

const getAllExperienceByUser = asyncHandler ( async (req, res) => {
    const userId = req?.user._id

    if (!userId) return res
        .status(400)
        .json(new ApiResponse(400, "Login to get all experiences"))
    // console.log(req, "files");
    // console.log(userId);
    
    try {

        const experiences = await Experience.find({creator: userId})
    
        return res
        .status(200)
        .json(new ApiResponse(200, experiences, "Experiences fetched successfully"))
    } catch (error) {
        return res
        .status(500)
        .json(new ApiResponse(500, error?.message ||"Something went wrong while fetching experiences"))
    }
})

export {
    addExperience,
    updateExperience,
    deleteExperience,
    getAllExperienceByUser
}