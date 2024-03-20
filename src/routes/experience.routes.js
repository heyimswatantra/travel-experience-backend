import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js"
import { addExperience, deleteExperience, getAllExperienceByUser, updateExperience } from "../controllers/experience.controller.js";

const router = Router();

router.use(verifyJWT)

router.route("/add-experience").post(upload.array("images"), addExperience);
router
    .route("/:experienceId")
    .patch(upload.array("images"), updateExperience)
    .delete(deleteExperience);
    
router.route("/all-experiences-by-user").get(getAllExperienceByUser);


export default router;