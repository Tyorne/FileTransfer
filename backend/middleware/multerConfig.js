const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

// Prefer the Render disk mount if it exists
const diskPath = "/uploads";
let uploadDir;

if (fs.existsSync(diskPath)) {
  uploadDir = diskPath; // Render persistent disk
} else {
  uploadDir = path.join(__dirname, "..", "uploads"); // Local dev
}

// Ensure upload directory exists
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
