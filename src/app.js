import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "30KB"}))
app.use(express.urlencoded({extended: true, limit: "30kb"}))
app.use(express.static("public"))
app.use(cookieParser())

import experienceRoute from "./routes/experience.routes.js"
import userRoute from "./routes/user.routes.js"
import reviewRoute from "./routes/review.routes.js"

app.use("/api/experience", experienceRoute)
app.use("/api/users", userRoute)
app.use("/api/reviews", reviewRoute)

export {app}