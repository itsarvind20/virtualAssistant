import fs from "fs";
import path from "path";
import multer from "multer";

const uploadDir = path.resolve("public");

const storage=multer.diskStorage({
    destination:(req,file,cb)=>{
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename:(req,file,cb)=>{
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
        cb(null, `${Date.now()}-${safeName}`);
    }
})

const upload=multer({storage})
export default upload
