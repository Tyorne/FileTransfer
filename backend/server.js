require("dotenv").config();

const express = require("express");
const session = require("express-session");
const path = require("path");
const fs = require("fs");

const connectDB = require("./database/connection");
const sessionConfig = require("./middleware/sessionConfig");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const fileRoutes = require("./routes/fileRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Prefer the Render disk mount if it exists
const diskPath = "/uploads";
let uploadsPath;

if (fs.existsSync(diskPath)) {
  uploadsPath = diskPath; // Render persistent disk
} else {
  uploadsPath = path.join(__dirname, "uploads"); // Local dev fallback
}

// Ensure uploads dir exists
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log("Server created uploads directory:", uploadsPath);
}

app.use(express.urlencoded({ extended: true }));

// Static assets
app.use("/static", express.static(path.join(__dirname, "static")));

// Serve encrypted files
app.use("/uploads", express.static(uploadsPath));

// Sessions
app.use(session(sessionConfig));

// Routes
app.use("/", authRoutes);
app.use("/", dashboardRoutes);
app.use("/", fileRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("NODE_ENV =", process.env.NODE_ENV);
  console.log("Uploads directory:", uploadsPath);
});
