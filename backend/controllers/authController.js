// backend/controllers/authController.js
const bcrypt = require("bcryptjs");
const layout = require("../utils/htmlLayout");
const User = require("../models/User");

// your existing views – we do NOT change their HTML/CSS
const loginView = require("../views/login");
const registerView = require("../views/register");

module.exports = {
  // ----- LOGIN PAGE -----
  showLogin(req, res) {
    const error = req.query.error ? decodeURIComponent(req.query.error) : "";
    const bodyHtml =
      loginView() +
      (error ? `<p style="color:red; margin-top:1rem;">${error}</p>` : "");
    res.send(layout("Login", bodyHtml));
  },

  // ----- LOGIN SUBMIT -----
  async login(req, res) {
    try {
      const email = (req.body.email || "").trim().toLowerCase();
      const password = req.body.password || "";

      const user = await User.findOne({ email });
      if (!user) {
        console.log("Login failed: user not found", email);
        return res.redirect(
          "/login?error=" + encodeURIComponent("Invalid email or password")
        );
      }

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) {
        console.log("Login failed: bad password", email);
        return res.redirect(
          "/login?error=" + encodeURIComponent("Invalid email or password")
        );
      }

      // SUCCESS: store email as session userId
      req.session.userId = user.email;
      console.log("Login success for", email);
      return res.redirect("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      return res.redirect(
        "/login?error=" +
          encodeURIComponent("Login error, please try again later")
      );
    }
  },

  // ----- REGISTER PAGE -----
  showRegister(req, res) {
    const error = req.query.error ? decodeURIComponent(req.query.error) : "";
    const bodyHtml =
      registerView() +
      (error ? `<p style="color:red; margin-top:1rem;">${error}</p>` : "");
    res.send(layout("Register", bodyHtml));
  },

  // ----- REGISTER SUBMIT -----
  async register(req, res) {
    try {
      const email = (req.body.email || "").trim().toLowerCase();
      const password = req.body.password || "";

      if (!email || !password) {
        return res.redirect(
          "/register?error=" +
            encodeURIComponent("Email and password are required")
        );
      }

      const existing = await User.findOne({ email });
      if (existing) {
        console.log("Register: email already used", email);
        return res.redirect(
          "/register?error=" +
            encodeURIComponent("That email is already registered. Please log in.")
        );
      }

      const passwordHash = await bcrypt.hash(password, 10);
      await User.create({ email, passwordHash });

      console.log("Registered new user", email);
      return res.redirect(
        "/login?error=" +
          encodeURIComponent("Registered successfully, please log in")
      );
    } catch (err) {
      console.error("Register error:", err);
      return res.redirect(
        "/register?error=" +
          encodeURIComponent("Registration error, please try again later")
      );
    }
  },

  // ----- LOGOUT -----
  logout(req, res) {
    req.session.destroy(() => {
      res.redirect("/login");
    });
  }
};
