import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file

const connectDB = async () => {
    try {
        const mongoURI = `${process.env.MONGO_URI}/${DB_NAME}`;
        if (!mongoURI.startsWith("mongodb://") && !mongoURI.startsWith("mongodb+srv://")) {
            throw new Error("Invalid MongoDB URI scheme. Expected URI to start with 'mongodb://' or 'mongodb+srv://'.");
        }
        const connectionInstance = await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log(`Connected to ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("Error: ", error);
        process.exit(1);
    }
}

export default connectDB;