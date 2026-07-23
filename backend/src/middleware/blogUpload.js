const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadDirectory = path.join(
  process.cwd(),
  "uploads",
  "blogs"
);

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDirectory);
  },

  filename: (req, file, callback) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    const filename = `blog-${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${extension}`;

    callback(null, filename);
  },
});

const allowedMimeTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const fileFilter = (req, file, callback) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    const error = new Error(
      "Only JPG, JPEG, PNG and WEBP images are allowed"
    );

    error.statusCode = 400;

    return callback(error, false);
  }

  callback(null, true);
};

const blogUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = blogUpload;