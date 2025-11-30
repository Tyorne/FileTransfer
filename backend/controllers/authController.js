const layout = require("../utils/htmlLayout.js");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

module.exports = {
  showLogin(req, res) {
    const loginView = require("../views/login");
    res.send(layout("Login", loginView()));
  },

  async login(req, res) {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.send(layout("Error", "<h2>Invalid login.</h2>"));
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.send(layout("Error", "<h2>Invalid login.</h2>"));
    }

    req.session.userId = user.email;
    res.redirect("/dashboard");
  },

  showRegister(req, res) {
    const registerView = require("../views/register");
    res.send(layout("Register", registerView()));
  },

  async register(req, res) {
    const { email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.send(layout("Error", "<h2>Email already registered.</h2>"));
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await User.create({ email, passwordHash });

    res.redirect("/login");
  },

  logout(req, res) {
    req.session.destroy(() => {
      res.redirect("/login");
    });
  }
};
