import mongoose, {Schema} from "mongoose"

const experienceSchema = new Schema(
  {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    location: {
      type: {
        type: String,
        enum: ['Point'], // 'location.type' must be 'Point'
        required: true
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    category: {
      type: String,
    },
    images: {
      type: [String],
    },
    averageRating: {
      type: Number,
      default: 0
    },
    numReviews: {
      type: Number,
      default: 0
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      // required: true
    },
    tags: {
      type: [String]
    },
    // price: {
    //   type: Number,
    //   required: true
    // },
    // duration: {
    //   type: Number,
    //   required: true
    // },
    // availability: {
    //   type: [Date]
    // },
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review"
      }
    ]
  },
  {
    timestamps: true
  }
)

experienceSchema.index({ location: "2dsphere" });

export const Experience = mongoose.model("Experience", experienceSchema)
