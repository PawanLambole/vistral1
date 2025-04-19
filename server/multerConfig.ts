import multer from "multer";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";

// Define storage paths based on environment
let BASE_STORAGE_PATH = process.cwd();

// For production environments
if (process.env.NODE_ENV === "production") {
  // Check if running on Render.com (they set RENDER environment variable)
  if (process.env.RENDER) {
    // Use /tmp for Render free tier
    BASE_STORAGE_PATH = "/tmp";
  } else {
    // Use /data for Fly.io or other providers with persistent volumes
    BASE_STORAGE_PATH = "/data";
  }
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(BASE_STORAGE_PATH, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = nanoid();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// Configure file filter
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only video files
  const allowedMimeTypes = ["video/mp4", "video/quicktime", "video/x-msvideo"];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only MP4, MOV, and AVI are supported."));
  }
};

// Configure multer upload
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB
  }
});
