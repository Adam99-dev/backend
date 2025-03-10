import mongoose from "mongoose";
import dotenv from "dotenv";
import { DB_NAME } from "../constants.js";

dotenv.config(); // Load environment variables from .env file

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is not defined in environment variables.");
        }
        const mongoURI = `${process.env.MONGO_URI}/${DB_NAME}`;
        const options = { useNewUrlParser: true, useUnifiedTopology: true };
        const connectionInstance = await mongoose.connect(mongoURI, options);
        console.log(`Connected to ${connectionInstance.connection.host}/${DB_NAME}`);
    } catch (error) {
        console.error("Error: ", error);
        process.exit(1);
    }
}

export default connectDB;