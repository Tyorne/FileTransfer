const bcrypt = require("bcryptjs");
const layout = require("../utils/htmlLayout");
const User = require("../models/User");

// Use the view helpers below
const loginView = require("../views/login");
const registerView = require("../views/register");

module.exports = {
  showLogin(req, res) {
    const error = req.query.error || "";
    res.send(layout("Login", loginView(error)));
  },

  async login(req, res) {
    try {
      const email = (req.body.email || "").trim().toLowerCase();
      const password = req.body.password || "";

      const user = await User.findOne({ email });
      if (!user) {
        console.log("Login failed: user not found", email);
        return res.redirect("/login?error=Invalid+email+or+password");
      }

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) {
        console.log("Login failed: bad password", email);
        return res.redirect("/login?error=Invalid+email+or+password");
      }

      // Success: set session and go to dashboard
      req.session.userId = user._id.toString();
      req.session.email = user.email;
      console.log("Login success for", email);
      res.redirect("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      res.redirect("/login?error=Login+error");
    }
  },

  showRegister(req, res) {
    const error = req.query.error || "";
    res.send(layout("Register", registerView(error)));
  },

  async register(req, res) {
    try {
      const email = (req.body.email || "").trim().toLowerCase();
      const password = req.body.password || "";

      if (!email || !password) {
        return res.redirect("/register?error=Email+and+password+required");
      }

      const existing = await User.findOne({ email });
      if (existing) {
        return res.redirect("/register?error=Email+already+registered");
      }

      const passwordHash = await bcrypt.hash(password, 10);

      await User.create({ email, passwordHash });

      console.log("Registered new user", email);
      res.redirect("/login?error=Registered+successfully,+please+log+in");
    } catch (err) {
      console.error("Register error:", err);
      res.redirect("/register?error=Registration+error");
    }
  },

  logout(req, res) {
    req.session.destroy(() => {
      res.redirect("/login");
    });
  }
};
