import mongoose, {Schema} from "mongoose"

const reviewSchema = new Schema({
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    rating: {
      type: Number,
      required: true
    },
    reviewText: {
      type: String,
      required: true
    }
});

export const Review = mongoose.model("Review", reviewSchema)
