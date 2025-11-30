const layout = require("../utils/htmlLayout");
const File = require("../models/File");
const dashboardView = require("../views/dashboard");

module.exports = {
  async showDashboard(req, res) {
    const username = req.session.userId;
    const files = await File.find({ owner: username });

    // Pass encrypted filenames (or whole objects if your view supports it)
    res.send(
      layout(
        "Dashboard",
        dashboardView(username, files)
      )
    );
  }
};
