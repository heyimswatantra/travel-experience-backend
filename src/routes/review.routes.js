import { Router } from "express";
import { addReview, editReview, deleteReview } from "../controllers/review.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/add-review").post( verifyJWT, addReview)
router.route("/edit-review").patch( verifyJWT, editReview)
router.route("/delete-review").delete( verifyJWT, deleteReview)

export default router