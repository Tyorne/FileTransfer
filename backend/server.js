require("dotenv").config();

const express = require("express");
const session = require("express-session");
const path = require("path");

const connectDB = require("./database/connection");
connectDB();

const sessionConfig = require("./middleware/sessionConfig");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const fileRoutes = require("./routes/fileRoutes");

const app = express();

// Required by Render (it assigns its own port)
const PORT = process.env.PORT || 3000;

// Parse form data
app.use(express.urlencoded({ extended: true }));

// -------------------------------
// STATIC FILES
// -------------------------------
app.use("/static", express.static(path.join(__dirname, "static")));

// LOCAL DEV: serve uploads from project folder
// PRODUCTION: serve uploads from Render disk (/uploads)
const uploadsPath =
  process.env.NODE_ENV === "production"
    ? "/uploads"
    : path.join(__dirname, "uploads");

app.use("/uploads", express.static(uploadsPath));

// -------------------------------
// SESSION CONFIG
// -------------------------------
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
});
