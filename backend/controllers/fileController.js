const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const { encrypt, decrypt } = require("../utils/encryption");
const { compress, decompress } = require("../utils/compressor");

const File = require("../models/File");
const layout = require("../utils/htmlLayout");

// Determine upload path based on environment
const uploadsDir =
  process.env.NODE_ENV === "production"
    ? "/uploads"
    : path.join(__dirname, "..", "uploads");

module.exports = {
  // ---------------------------
  // UPLOAD FILE
  // ---------------------------
  async uploadFile(req, res) {
    try {
      if (!req.file) {
        return res.send(layout("Error", "<h2>No file uploaded.</h2>"));
      }

      // Raw file (temp)
      const rawPath = path.join(uploadsDir, req.file.filename);
      const rawBuffer = fs.readFileSync(rawPath);

      // Compress file
      const compressed = compress(rawBuffer);

      // Encrypt file
      const { iv, encrypted, authTag } = encrypt(compressed);

      // Final encrypted file name
      const encryptedFilename = req.file.filename + ".enc";
      const encryptedPath = path.join(uploadsDir, encryptedFilename);

      // Save encrypted contents
      fs.writeFileSync(encryptedPath, encrypted);

      // Remove raw file
      fs.unlinkSync(rawPath);

      // Store metadata in DB
      await File.create({
        encryptedFilename,
        originalName: req.file.originalname,
        iv,
        authTag,
        owner: req.session.userId,
        size: compressed.length,
        timestamp: Date.now()
      });

      res.redirect("/dashboard");
    } catch (err) {
      console.error("Upload Error:", err);
      res.send(layout("Error", "<h2>Upload failed.</h2>"));
    }
  },

  // ---------------------------
  // DOWNLOAD FILE
  // ---------------------------
  async downloadFile(req, res) {
    const file = await File.findOne({ encryptedFilename: req.params.id });
    if (!file) return res.send(layout("Error", "<h2>File not found.</h2>"));

    const encryptedPath = path.join(uploadsDir, file.encryptedFilename);

    if (!fs.existsSync(encryptedPath))
      return res.send(layout("Error", "<h2>Encrypted file missing.</h2>"));

    const encryptedBuffer = fs.readFileSync(encryptedPath);
    const decryptedCompressed = decrypt(encryptedBuffer, file.iv, file.authTag);
    const rawData = decompress(decryptedCompressed);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.originalName}"`
    );
    res.send(rawData);
  },

  // ---------------------------
  // SHARE FILE
  // ---------------------------
  async shareFile(req, res) {
    const file = await File.findOne({ encryptedFilename: req.params.id });
    if (!file) return res.send(layout("Error", "<h2>File not found.</h2>"));

    if (file.owner !== req.session.userId)
      return res.send(layout("Error", "<h2>You do not own this file.</h2>"));

    // Generate share token if missing
    if (!file.shareToken) {
      file.shareToken = crypto.randomBytes(16).toString("hex");
      file.shareExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hrs
      await file.save();
    }

    const baseURL = process.env.BASE_URL || "http://localhost:3000";

    const shareLink = `${baseURL}/shared/${file.encryptedFilename}?token=${file.shareToken}`;

    res.send(
      layout(
        "Share File",
        `
          <h1>Share Link</h1>
          <p>Provide this link to the recipient:</p>
          <p><a href="${shareLink}">${shareLink}</a></p>
          <p>This link expires in 24 hours.</p>
          <p><a href="/dashboard">Back</a></p>
        `
      )
    );
  },

  // ---------------------------
  // PUBLIC SHARED DOWNLOAD
  // ---------------------------
  async sharedDownload(req, res) {
    const file = await File.findOne({ encryptedFilename: req.params.id });
    if (!file) return res.send(layout("Error", "<h2>File not found.</h2>"));

    const token = req.query.token;

    if (!token || token !== file.shareToken)
      return res.send(layout("Error", "<h2>Invalid or missing token.</h2>"));

    if (Date.now() > file.shareExpires)
      return res.send(layout("Error", "<h2>This link has expired.</h2>"));

    const encryptedPath = path.join(uploadsDir, file.encryptedFilename);

    const encryptedBuffer = fs.readFileSync(encryptedPath);
    const decryptedCompressed = decrypt(encryptedBuffer, file.iv, file.authTag);
    const rawData = decompress(decryptedCompressed);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.originalName}"`
    );
    res.send(rawData);
  },

  // ---------------------------
  // REVOKE SHARE
  // ---------------------------
  async revokeShare(req, res) {
    const file = await File.findOne({ encryptedFilename: req.params.id });
    if (!file) return res.send(layout("Error", "<h2>File not found.</h2>"));

    if (file.owner !== req.session.userId)
      return res.send(layout("Error", "<h2>You do not own this file.</h2>"));

    file.shareToken = null;
    file.shareExpires = null;
    await file.save();

    res.redirect("/dashboard");
  },

  // ---------------------------
  // DELETE FILE
  // ---------------------------
  async deleteFile(req, res) {
    const file = await File.findOne({ encryptedFilename: req.params.id });
    if (!file) return res.send(layout("Error", "<h2>File not found.</h2>"));

    if (file.owner !== req.session.userId)
      return res.send(layout("Error", "<h2>You do not own this file.</h2>"));

    const encryptedPath = path.join(uploadsDir, file.encryptedFilename);

    if (fs.existsSync(encryptedPath)) fs.unlinkSync(encryptedPath);

    await File.deleteOne({ encryptedFilename: file.encryptedFilename });

    res.redirect("/dashboard");
  }
};
