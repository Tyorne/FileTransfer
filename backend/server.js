// backend/server.js
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

// Connect to MongoDB
connectDB();

// === Uploads directory (inside the backend folder) ===
const uploadsPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log("Server created uploads directory:", uploadsPath);
}

app.use(express.urlencoded({ extended: true }));

// Static assets (CSS, etc.)
app.use("/static", express.static(path.join(__dirname, "static")));

// Serve encrypted files
app.use("/uploads", express.static(uploadsPath));

// 🔑 IMPORTANT: tell Express it's behind a proxy so secure cookies work
app.set("trust proxy", 1);

// Sessions (uses SESSION_SECRET from your env)
app.use(session(sessionConfig));

// Home: logged-in users → dashboard, others → login
app.get("/", (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect("/dashboard");
  }
  res.redirect("/login");
});

// Routes
app.use("/", authRoutes);
app.use("/", dashboardRoutes);
app.use("/", fileRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("NODE_ENV =", process.env.NODE_ENV);
  console.log("Uploads directory:", uploadsPath);
});
