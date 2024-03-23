import { Router } from "express";
import { 
    changePassword, 



    loginUser,
    logoutUser,
    // refreshAccessToken, 
    registerUser,
    // updateAccountDetails, 
    updateUserAvatar, 

} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post( upload.single("avatar"), registerUser)

router.route("/login").post(loginUser)

// secured routes
router.route("/logout").post(verifyJWT, logoutUser)

// router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT, changePassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)

// router.route("/update-account").patch(verifyJWT, updateAccountDetails)

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)

// router.route("/eperience-images").post(verifyJWT, upload.fields("coverImage"), uploadExperienceImages)

// router.route("/c/:username").get(verifyJWT, getUserChannelProfile)

// router.route("/history").get(verifyJWT, getWatchHistory)

export default router