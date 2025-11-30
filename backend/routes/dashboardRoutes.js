const express = require("express");
const router = express.Router();
const requireLogin = require("../middleware/requireLogin");
const dashboardController = require("../controllers/dashboardController");

router.get("/dashboard", requireLogin, dashboardController.showDashboard);

module.exports = router;
