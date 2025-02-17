import dotenv from "dotenv";
dotenv.config({path:"./env"});
import connectDB from "./db/index.js";
import app from "./app.js";




connectDB().then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{console.log(` 🤟 server is running at port ${process.env.PORT}`)})
}).catch((err)=> console.log("Failed to connect to DB",err))

















































/*(async ()=>{
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        console.log("Connected to DB")
    } catch (error) {
        console.error("ERROR:", error)
        throw err
    }
})()*/