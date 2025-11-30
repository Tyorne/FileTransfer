const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Determine upload path based on environment
const uploadPath =
  process.env.NODE_ENV === "production"
    ? "/opt/render/project/src/uploads"
    : path.join(__dirname, "..", "uploads");

// Ensure upload directory exists
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
  console.log("Multer created uploads directory:", uploadPath);
}

// Multer storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Unique filename
    const uniqueName = `${crypto.randomUUID()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

module.exports = multer({ storage });
