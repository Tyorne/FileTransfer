const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const layout = require("../utils/htmlLayout.js");
const { encrypt, decrypt } = require("../utils/encryption.js");
const { compress, decompress } = require("../utils/compressor.js");
const File = require("../models/File");

// Decide uploads directory (must match multerConfig)
const uploadsDir = process.env.NODE_ENV === "production" ? "/tmp/uploads" : path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadsDir)) {
  try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch (e) { /* ignore */ }
}

module.exports = {
  async uploadFile(req, res) {
    if (!req.file) {
      return res.send(layout("Error", "<h2>No file uploaded.</h2>"));
    }

    // Use Multer-provided path directly to avoid path mismatches
    const rawPath = req.file.path;
    if (!rawPath || !fs.existsSync(rawPath)) {
      return res.send(layout("Error", "<h2>Uploaded file not found on disk.</h2>"));
    }

    const rawBuffer = fs.readFileSync(rawPath);

    // Compress then encrypt
    const compressed = compress(rawBuffer);
    const { iv, encrypted, authTag } = encrypt(compressed);

    // Where to store encrypted file (same directory as raw file for consistency)
    const targetDir = path.dirname(rawPath);
    const encryptedFilename = req.file.filename + ".enc";
    const encryptedPath = path.join(targetDir, encryptedFilename);

    fs.writeFileSync(encryptedPath, encrypted);
    // Remove raw file
    try { fs.unlinkSync(rawPath); } catch (_) {}

    await File.create({
      encryptedFilename,
      originalName: req.file.originalname,
      iv,
      authTag,
      owner: req.session.userId,
      timestamp: Date.now(),
      size: compressed.length,
      shareToken: null,
      shareExpires: null,
    });

    res.send(
      layout(
        "File Uploaded",
        `
        <h1>File Encrypted & Stored</h1>
        <p>Original Name: <strong>${req.file.originalname}</strong></p>
        <p>Encrypted Name: <strong>${encryptedFilename}</strong></p>
        <p><a href="/dashboard">Return to Dashboard</a></p>
        `
      )
    );
  },

  async downloadFile(req, res) {
    const fileName = req.params.id;
    const entry = await File.findOne({ encryptedFilename: fileName });
    if (!entry) return res.send(layout("Error", "<h2>File not found.</h2>"));

    // Physical path (encrypted file expected adjacent to uploadsDir)
    const encryptedPath = path.join(uploadsDir, entry.encryptedFilename);
    if (!fs.existsSync(encryptedPath)) {
      return res.send(layout("Error", "<h2>Encrypted file missing.</h2>"));
    }
    const encryptedBuffer = fs.readFileSync(encryptedPath);

    const decryptedCompressed = decrypt(encryptedBuffer, entry.iv, entry.authTag);
    const rawData = decompress(decryptedCompressed);

    res.setHeader("Content-Disposition", `attachment; filename="${entry.originalName}"`);
    res.send(rawData);
  },

  async shareFile(req, res) {
    const fileName = req.params.id;
    const entry = await File.findOne({ encryptedFilename: fileName });
    if (!entry) return res.send(layout("Error", "<h2>File not found.</h2>"));
    if (entry.owner !== req.session.userId) {
      return res.send(layout("Error", "<h2>You do not own this file.</h2>"));
    }
    if (!entry.shareToken) {
      entry.shareToken = crypto.randomBytes(16).toString("hex");
      entry.shareExpires = Date.now() + 24 * 60 * 60 * 1000;
      await entry.save();
    }
    const shareLink = `${process.env.BASE_URL || "http://localhost:3000"}/shared/${entry.encryptedFilename}?token=${entry.shareToken}`;
    res.send(
      layout(
        "Share File",
        `
        <h1>Share Link</h1>
        <p>Give this link to someone you trust:</p>
        <p><a href="${shareLink}">${shareLink}</a></p>
        <p>This link expires in 24 hours.</p>
        <p><a href="/dashboard">Back to Dashboard</a></p>
        `
      )
    );
  },

  async sharedDownload(req, res) {
    const fileName = req.params.id;
    const token = req.query.token;
    const entry = await File.findOne({ encryptedFilename: fileName });
    if (!entry) return res.send(layout("Error", "<h2>File not found.</h2>"));
    if (!token || token !== entry.shareToken) {
      return res.send(layout("Error", "<h2>Invalid or missing share token.</h2>"));
    }
    if (entry.shareExpires && Date.now() > entry.shareExpires) {
      return res.send(layout("Expired", "<h2>This share link has expired.</h2>"));
    }
    const encryptedPath = path.join(uploadsDir, entry.encryptedFilename);
    if (!fs.existsSync(encryptedPath)) {
      return res.send(layout("Error", "<h2>Encrypted file missing.</h2>"));
    }
    const encryptedBuffer = fs.readFileSync(encryptedPath);
    const decryptedCompressed = decrypt(encryptedBuffer, entry.iv, entry.authTag);
    const rawData = decompress(decryptedCompressed);
    res.setHeader("Content-Disposition", `attachment; filename="${entry.originalName}"`);
    res.send(rawData);
  },

  async revokeShare(req, res) {
    const fileName = req.params.id;
    const entry = await File.findOne({ encryptedFilename: fileName });
    if (!entry) return res.send(layout("Error", "<h2>File not found.</h2>"));
    if (entry.owner !== req.session.userId) {
      return res.send(layout("Error", "<h2>You do not own this file.</h2>"));
    }
    entry.shareToken = null;
    entry.shareExpires = null;
    await entry.save();
    res.send(
      layout(
        "Share Revoked",
        `
        <h1>Share link revoked.</h1>
        <p>This link is no longer valid.</p>
        <p><a href="/dashboard">Back to Dashboard</a></p>
        `
      )
    );
  },

  async deleteFile(req, res) {
    const fileName = req.params.id;
    const entry = await File.findOne({ encryptedFilename: fileName });
    if (!entry) return res.send(layout("Error", "<h2>File not found.</h2>"));
    if (entry.owner !== req.session.userId) {
      return res.send(layout("Error", "<h2>You do not own this file.</h2>"));
    }
    const encryptedPath = path.join(uploadsDir, entry.encryptedFilename);
    if (fs.existsSync(encryptedPath)) {
      try { fs.unlinkSync(encryptedPath); } catch (_) {}
    }
    await File.deleteOne({ encryptedFilename: fileName });
    res.send(
      layout(
        "File Deleted",
        `
        <h1>File Deleted</h1>
        <p>${entry.originalName} has been removed.</p>
        <p><a href="/dashboard">Back to Dashboard</a></p>
        `
      )
    );
  },
};
