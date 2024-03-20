import mongoose, {isValidObjectId} from "mongoose"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Review } from "../models/review.model.js"
import { Experience } from "../models/experience.model.js"

const isOwner = async (id, req) => {
    const review = await Review.findById(id);

    if (review.user?.toString() !== req.user?._id.toString()) {
        return false
    } 
    return true
}

const addReview = asyncHandler ( async (req, res) => {
    const { experienceId, rating, reviewText } = req.body
    const userId = req?.user._id

    if (!userId) throw new ApiError(400, "Login to create review")

    if (!reviewText || !rating) {
        throw new ApiError(400, "All fields required")
    }

    try {
        
        const review = await Review.create({
            user: userId,
            rating,
            reviewText
        })

        if (!review) {
            throw new ApiError(500, "Couldn't add review")
        }

        const experience = await Experience.findByIdAndUpdate(
            experienceId,
            {
                $push: { reviews: review?._id} 
            }
        )

        if (!experience) {
            throw new ApiError(500, "Couldn't add review to experience")
        }

        return res
        .status(200)
        .json(new ApiResponse(200, review, "Review added successfully"))
    } catch (error) {
        throw new ApiError(500, error?.message ||"Something went wrong while adding review")
    }
})

const editReview = asyncHandler ( async (req, res) => {
    const { reviewId, rating, reviewText } = req.body

    const author = isOwner(reviewId, req)
    if (!author) {
        throw new ApiError(300, "Unauthorized Request")
    }
    
    try {
        const review = await Review.findByIdAndUpdate(reviewId, {
            rating,
            reviewText
        })

        if (!review) {
            throw new ApiError(500, "Couldn't edit review")
        }

        return res
        .status(200)
        .json(new ApiResponse(200, review, "Review edited successfully"))

    } catch (error) {
        throw new ApiError(500, error?.message ||"Something went wrong while editing review")
    }
})

const deleteReview = asyncHandler ( async (req, res) => {
    const { reviewId } = req.body

    const author = isOwner(reviewId, req)
    if (!author) {
        throw new ApiError(300, "Unauthorized Request")
    }
    
    try {
        const deleteResponse = await Review.findByIdAndDelete(reviewId)

        if (!deleteResponse) {
            throw new ApiError(500, "Couldn't delete review")
        }

        return res
        .status(200)
        .json(new ApiResponse(200, deleteResponse, "Review deleted successfully"))

    } catch (error) {
        throw new ApiError(500, error?.message ||"Something went wrong while deleting review")
    }
})


export {
    addReview,
    editReview,
    deleteReview
}