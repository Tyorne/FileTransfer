// Read the raw uploaded file
const rawBuffer = fs.readFileSync(req.file.path);

// Compress
const compressed = compress(rawBuffer);

// Encrypt
const { iv, encrypted, authTag } = encrypt(compressed);

// Create encrypted filename
const encryptedFilename = req.file.filename + ".enc";
const encryptedPath = path.join(uploadsDir, encryptedFilename);

// Write encrypted file to disk
fs.writeFileSync(encryptedPath, encrypted);

// Delete the raw (unencrypted) file
fs.unlinkSync(req.file.path);
