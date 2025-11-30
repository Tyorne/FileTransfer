const mongoose = require("mongoose");

const FileSchema = new mongoose.Schema({
  encryptedFilename: { type: String, required: true },
  originalName: { type: String, required: true },
  iv: { type: String, required: true },
  authTag: { type: String, required: true },
  owner: { type: String, required: true }, // email
  size: { type: Number, required: true },
  timestamp: { type: Number, default: Date.now },
  shareToken: { type: String, default: null },
  shareExpires: { type: Number, default: null }
});

module.exports = mongoose.model("File", FileSchema);
