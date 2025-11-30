# Secure File Transfer Platform

A simple, full-stack **Secure File Transfer Platform** built for a Software Engineering course project.

Users can:

- Register & log in
- Upload files
- Have files **compressed and encrypted** on the server
- Download their own files
- Generate **time-limited share links** for others to download

The app is built with **Node.js, Express, MongoDB, and server-rendered HTML views**, and is deployed on **Render**.

---

## ✨ Features

- **User Authentication**
  - Email + password registration
  - Passwords stored as **bcrypt hashes** using `bcryptjs`
  - Session-based auth with `express-session`

- **Secure File Handling**
  - Files uploaded via `multer`
  - Raw file compressed, then encrypted before being stored
  - Only encrypted files are kept on disk (raw versions are deleted)
  - Users can only see/download **their own** files

- **File Sharing**
  - Generate **share links** with random tokens
  - Share links expire after a configured time (e.g., 24 hours)
  - Public `shared/:id` endpoint validates token + expiration

- **UI**
  - Simple HTML views rendered on the server
  - Login / Register pages
  - Dashboard showing user’s uploaded files and actions:
    - Download
    - Share
    - Revoke share
    - Delete

---

## 🧱 Tech Stack

- **Backend:** Node.js, Express
- **Database:** MongoDB (Atlas or local)
- **Auth:** `express-session`, `bcryptjs`
- **File Uploads:** `multer`
- **Security Helpers:** custom encryption & compression utilities
- **Deployment:** Render (Node web service)

---

## 📁 Project Structure

Repo (simplified):

```bash
FileTransfer/
  backend/
    server.js
    package.json
    .env                # not committed – create this locally

    controllers/
      authController.js
      dashboardController.js
      fileController.js

    routes/
      authRoutes.js
      dashboardRoutes.js
      fileRoutes.js

    middleware/
      sessionConfig.js
      requireLogin.js
      multerConfig.js

    models/
      User.js
      File.js

    utils/
      htmlLayout.js
      encryption.js
      compressor.js

    views/
      login.js
      register.js
      dashboard.js
      upload.js

    static/
      style.css          # or similar
