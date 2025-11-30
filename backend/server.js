require("dotenv").config();

const express = require("express");
const session = require("express-session");
const path = require("path");
const fs = require("fs");

const connectDB = require("./database/connection");
connectDB();

const sessionConfig = require("./middleware/sessionConfig");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const fileRoutes = require("./routes/fileRoutes");

const app = express();

// Render sets its own port in production
const PORT = process.env.PORT || 3000;

// -------------------------------
// DETERMINE UPLOADS PATH
// -------------------------------
const uploadsPath =
  process.env.NODE_ENV === "production"
    ? "/opt/render/project/src/uploads"
    : path.join(__dirname, "uploads");

// Ensure uploads directory exists (Render free tier NEEDS this)
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log("Created uploads directory:", uploadsPath);
}

// -------------------------------
// MIDDLEWARE
// -------------------------------
app.use(express.urlencoded({ extended: true }));

// Serve CSS & static assets
app.use("/static", express.static(path.join(__dirname, "static")));

// Serve uploads directory (encrypted files)
app.use("/uploads", express.static(uploadsPath));

app.use(session(sessionConfig));

// -------------------------------
// ROUTES
// -------------------------------
app.use("/", authRoutes);
app.use("/", dashboardRoutes);
app.use("/", fileRoutes);

// -------------------------------
// START SERVER
// -------------------------------
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log("Uploads directory:", uploadsPath);
});
