import mongoose from "mongoose";

const URI = process.env.MONGODB_URI
console.log(URI);

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(URI);

        console.log(`MONGODB CONNECT !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGODB CONNECTION ERROR ", error);
        process.exit(1);
    }
}

export default connectDB;