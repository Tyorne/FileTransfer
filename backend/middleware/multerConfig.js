const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Decide persistent directory (controllers mirror this logic)
const uploadsDir = process.env.NODE_ENV === "production" ? "/tmp/uploads" : path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadsDir)) {
	try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch (_) {}
}

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, uploadsDir);
	},
	filename: (req, file, cb) => {
		// Sanitize filename
		const safe = Date.now() + "-" + file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
		cb(null, safe);
	},
});

module.exports = multer({
	storage,
	limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit (adjust as needed)
});
