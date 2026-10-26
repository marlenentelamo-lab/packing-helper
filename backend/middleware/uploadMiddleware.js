const multer = require("multer");

const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
  },
  fileFilter: (req, file, callback) => {
    if (!allowedImageTypes.has(file.mimetype)) {
      const error = new Error("Only JPEG, PNG, WebP, and GIF images are allowed");
      error.statusCode = 415;
      return callback(error);
    }

    return callback(null, true);
  },
});

module.exports = upload;
