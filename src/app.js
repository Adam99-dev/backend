import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


const app = express();
app.use(express.json({limit:'1mb'}));
app.use(express.urlencoded({extended: true, limit:'50kb'}));
app.use(express.static("public"));
app.use(cookieParser());

app.use(cors({
    origin: process.env.CORS_URL,
    credentials: true
}));



import userRouter from "./routes/user.routes.js";
const basePath = process.env.BASE_PATH || '/api/v1';
app.use(`${basePath}/users`, userRouter);

export default app;