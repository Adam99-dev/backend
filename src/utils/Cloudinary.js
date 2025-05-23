import { v2 as cloudinary } from 'cloudinary';
import { error } from 'console';
import fs from 'fs';

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const fileUploader = async (localFilePath)=>{
    try {
        if(! localFilePath) return error("File path is required");
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',
        });

        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null
    }
}
const fileDeleter = async (publicId) => {
    try {
        if (!publicId) return error("Public ID is required");
        const response = await cloudinary.uploader.destroy(publicId);
        return response;
    } catch (error) {
        console.error(error);
        return null;
    }
}

export  {fileDeleter, fileUploader};