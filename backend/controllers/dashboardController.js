const layout = require("../utils/htmlLayout");
const File = require("../models/File");
const dashboardView = require("../views/dashboard");

module.exports = {
  async showDashboard(req, res) {
    const email = req.session.userId; // email stored at login
    const files = await File.find({ owner: email }).sort({ timestamp: -1 });

    res.send(layout("Dashboard", dashboardView(email, files)));
  }
};
