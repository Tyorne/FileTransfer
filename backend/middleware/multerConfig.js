const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

// Same logic as server.js
const uploadDir =
  process.env.NODE_ENV === "production"
    ? "/uploads" // persistent disk mount
    : path.join(__dirname, "..", "uploads"); // local dev

// Ensure directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("Multer created upload directory:", uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName =
      crypto.randomUUID() + path.extname(file.originalname || "");
    cb(null, uniqueName);
  }
});

module.exports = multer({ storage });
