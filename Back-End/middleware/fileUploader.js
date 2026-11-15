const multer = require("multer");
const path = require("path");
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExts = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|jpg|jpeg|png|gif|svg|webp|jfif)$/i;
  if (!allowedExts.test(path.extname(file.originalname).toLowerCase())) {
    return cb(new Error("Only document and image files are allowed (.pdf, .docx, .jpg, .png, etc)"));
  }
  cb(null, true);
};

const upload = multer({
  storage,        
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

module.exports = upload;