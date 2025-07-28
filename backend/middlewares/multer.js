import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, uploadDir);
    },
    filename: function (req, file, callback) {
        const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext);
        callback(null, `${baseName}-${uniquePrefix}${ext}`);
    },
});

// File filter for images only
const fileFilter = (req, file, callback) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return callback(null, true);
    }
    callback(new Error('Only JPEG, JPG, and PNG images are allowed'));
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
}).fields([
    { name: 'image', maxCount: 1 }, // Single main image
    { name: 'galleryImages', maxCount: 10 }, // Up to 10 gallery images
]);

export default upload;