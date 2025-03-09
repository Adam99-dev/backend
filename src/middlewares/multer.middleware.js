import multer from "multer";


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "./public/temp"); // Specify the destination folder
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname); // Create a unique filename
    }
  });
  
  export const upload = multer({storage});