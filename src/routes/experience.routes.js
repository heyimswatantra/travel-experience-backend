import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js"
import { addExperience } from "../controllers/experience.controller.js";

const router = Router();

router.use(verifyJWT)

router.route("/add-experience").post(upload.array("images"), addExperience);

export default router;