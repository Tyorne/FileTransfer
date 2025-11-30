const crypto = require("crypto");

const KEY = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
if (!KEY || KEY.length !== 32) {
  throw new Error("ENCRYPTION_KEY must be a 32-byte hex string (64 hex chars).");
}

function encrypt(buffer) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);

  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString("hex"),
    encrypted,
    authTag: authTag.toString("hex")
  };
}

function decrypt(encrypted, ivHex, authTagHex) {
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

module.exports = { encrypt, decrypt };
