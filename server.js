const express = require('express');
const session = require('express-session');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');

const app = express();
const PORT = 3000;

// ---------- CONFIG ----------

// In-memory "database"
let users = []; // { id, email, passwordHash }
let files = []; // { id, ownerId, originalName, storedName, size, token, iv, authTag }

// Single symmetric key for demo (32 bytes).
// In a real app, use process.env + proper key management.
const ENC_KEY = crypto
  .createHash('sha256')
  .update('super-secret-key-change-me')
  .digest(); // 32-byte key

// Multer: keep file in memory so we never write plaintext to disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

// ---------- MIDDLEWARE ----------

app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: 'change-this-session-secret',
    resave: false,
    saveUninitialized: false,
  })
);

// ---------- HELPERS ----------

function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

function getCurrentUser(req) {
  return users.find((u) => u.id === req.session.userId);
}

function layout(title, bodyHtml) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      * { box-sizing: border-box; }
      body {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #0f172a;
        color: #e5e7eb;
        margin: 0;
        padding: 40px 16px;
        display: flex;
        justify-content: center;
      }
      .container {
        width: 100%;
        max-width: 720px;
        background: #020617;
        border-radius: 20px;
        padding: 24px 24px 32px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        border: 1px solid #1f2937;
      }
      .nav {
        display: flex;
        gap: 10px;
        margin-bottom: 16px;
      }
      .nav a {
        font-size: 14px;
        text-decoration: none;
        color: #9ca3af;
        padding: 6px 10px;
        border-radius: 999px;
        border: 1px solid transparent;
      }
      .nav a:hover {
        color: #e5e7eb;
        border-color: #4b5563;
        background: #111827;
      }
      h1, h2 {
        margin-top: 8px;
        color: #e5e7eb;
      }
      p { color: #9ca3af; }
      form {
        margin: 16px 0;
        padding: 16px;
        border-radius: 14px;
        background: #020617;
        border: 1px solid #1e293b;
      }
      label {
        display: block;
        font-size: 14px;
        margin-bottom: 4px;
        color: #cbd5f5;
      }
      input[type="email"],
      input[type="password"],
      input[type="file"] {
        width: 100%;
        padding: 8px 10px;
        margin-bottom: 10px;
        border-radius: 10px;
        border: 1px solid #334155;
        background: #020617;
        color: #e5e7eb;
        font-size: 14px;
      }
      input::file-selector-button {
        border: none;
        border-radius: 999px;
        padding: 6px 14px;
        margin-right: 8px;
        background: #2563eb;
        color: white;
        cursor: pointer;
      }
      button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 8px 16px;
        border-radius: 999px;
        border: none;
        background: linear-gradient(135deg, #3b82f6, #06b6d4);
        color: white;
        font-weight: 500;
        cursor: pointer;
        font-size: 14px;
        margin-top: 4px;
      }
      button:hover {
        filter: brightness(1.05);
      }
      .card {
        margin-top: 16px;
        padding: 14px 16px;
        border-radius: 14px;
        background: #020617;
        border: 1px solid #1e293b;
      }
      .file-list-item {
        padding: 10px 0;
        border-bottom: 1px solid #1f2937;
      }
      .file-list-item:last-child {
        border-bottom: none;
      }
      .file-name {
        font-weight: 500;
        color: #e5e7eb;
      }
      .file-meta {
        font-size: 12px;
        color: #9ca3af;
      }
      .file-link a {
        font-size: 13px;
        color: #38bdf8;
        word-break: break-all;
      }
      hr {
        border: none;
        border-bottom: 1px solid #1f2937;
        margin: 16px 0;
      }
      .pill {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 999px;
        background: rgba(56, 189, 248, 0.1);
        color: #7dd3fc;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="nav">
        <a href="/">Home</a>
        <a href="/dashboard">Dashboard</a>
        <a href="/login">Login</a>
        <a href="/register">Register</a>
        <a href="/logout">Logout</a>
      </div>
      ${bodyHtml}
    </div>
  </body>
  </html>
  `;
}

// ---------- ROUTES ----------

// Home
app.get('/', (req, res) => {
  const user = getCurrentUser(req);
  let body = `
    <h1>Mini File Drop</h1>
    <p class="pill">Encrypted & compressed file sharing</p>
    <p>Log in, upload a file, get a link. Anyone with the link can download the original file — no account required for them.</p>
  `;
  if (user) {
    body += `<p>You are logged in as <strong>${user.email}</strong>. Go to your <a href="/dashboard">dashboard</a> to upload.</p>`;
  } else {
    body += `<p><a href="/register">Create an account</a> or <a href="/login">log in</a> to start.</p>`;
  }
  res.send(layout('Home', body));
});

// Register form
app.get('/register', (req, res) => {
  res.send(
    layout(
      'Register',
      `
      <h1>Create an account</h1>
      <form method="POST" action="/register">
        <label>Email</label>
        <input type="email" name="email" required />

        <label>Password</label>
        <input type="password" name="password" required />

        <button type="submit">Register</button>
      </form>
    `
    )
  );
});

// Register handler
app.post('/register', async (req, res) => {
  const { email, password } = req.body.trimmed
    ? req.body
    : { email: req.body.email, password: req.body.password };

  if (!email || !password) {
    return res.send(layout('Register', `<p>Missing email or password.</p><a href="/register">Back</a>`));
  }

  const existing = users.find((u) => u.email === email);
  if (existing) {
    return res.send(layout('Register', `<p>Email already in use.</p><a href="/register">Try again</a>`));
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = {
    id: crypto.randomUUID(),
    email,
    passwordHash,
  };
  users.push(newUser);
  req.session.userId = newUser.id;
  res.redirect('/dashboard');
});

// Login form
app.get('/login', (req, res) => {
  res.send(
    layout(
      'Login',
      `
      <h1>Login</h1>
      <form method="POST" action="/login">
        <label>Email</label>
        <input type="email" name="email" required />

        <label>Password</label>
        <input type="password" name="password" required />

        <button type="submit">Login</button>
      </form>
    `
    )
  );
});

// Login handler
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = users.find((u) => u.email === email);
  if (!user) {
    return res.send(layout('Login', `<p>Invalid email or password.</p><a href="/login">Try again</a>`));
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.send(layout('Login', `<p>Invalid email or password.</p><a href="/login">Try again</a>`));
  }

  req.session.userId = user.id;
  res.redirect('/dashboard');
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// Dashboard (upload + list)
app.get('/dashboard', requireLogin, (req, res) => {
  const user = getCurrentUser(req);
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  const userFiles = files.filter((f) => f.ownerId === user.id);

  let listHtml = `
    <div class="card">
      <h2>Your files</h2>
  `;

  if (userFiles.length === 0) {
    listHtml += `<p>You haven't uploaded anything yet.</p>`;
  } else {
    listHtml += `<div>`;
    for (const f of userFiles) {
      const link = `${baseUrl}/file/${f.token}`;
      listHtml += `
        <div class="file-list-item">
          <div class="file-name">${f.originalName}</div>
          <div class="file-meta">${Math.round(f.size / 1024)} KB · link token: ${f.token.slice(
        0,
        8
      )}...</div>
          <div class="file-link">
            <span>Shareable download link:</span><br/>
            <a href="${link}" target="_blank">${link}</a>
          </div>
        </div>
      `;
    }
    listHtml += `</div>`;
  }
  listHtml += `</div>`;

  res.send(
    layout(
      'Dashboard',
      `
      <h1>Welcome, ${user.email}</h1>
      <div class="card">
        <h2>Upload a file</h2>
        <p>Files are compressed + encrypted on the server. Anyone with the link will get the original file back.</p>
        <form method="POST" action="/upload" enctype="multipart/form-data">
          <label>Select file</label>
          <input type="file" name="file" required />
          <button type="submit">Upload</button>
        </form>
      </div>
      ${listHtml}
    `
    )
  );
});

// Upload: compress + encrypt + save
app.post('/upload', requireLogin, upload.single('file'), (req, res) => {
  const user = getCurrentUser(req);

  if (!req.file) {
    return res.send(layout('Upload', `<p>No file provided.</p><a href="/dashboard">Back</a>`));
  }

  const originalName = req.file.originalname;
  const size = req.file.size;
  const buffer = req.file.buffer;

  const storedName = crypto.randomUUID() + '.bin';
  const filePath = path.join(__dirname, 'uploads', storedName);

  // 1) Compress (gzip) the file buffer
  zlib.gzip(buffer, (err, gzipped) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error compressing file.');
    }

    // 2) Encrypt the compressed data
    const iv = crypto.randomBytes(12); // recommended IV size for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', ENC_KEY, iv);

    let encrypted;
    try {
      encrypted = Buffer.concat([cipher.update(gzipped), cipher.final()]);
    } catch (e) {
      console.error(e);
      return res.status(500).send('Error encrypting file.');
    }

    const authTag = cipher.getAuthTag();

    // 3) Save encrypted data to disk
    fs.writeFile(filePath, encrypted, (err2) => {
      if (err2) {
        console.error(err2);
        return res.status(500).send('Error saving file.');
      }

      // 4) Save metadata in "database"
      const token = crypto.randomBytes(16).toString('hex');
      const newFile = {
        id: crypto.randomUUID(),
        ownerId: user.id,
        originalName,
        storedName,
        size,
        token,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
      };
      files.push(newFile);

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const downloadUrl = `${baseUrl}/file/${token}`;

      res.send(
        layout(
          'File uploaded',
          `
          <h1>File uploaded!</h1>
          <div class="card">
            <p><strong>${originalName}</strong> (${Math.round(size / 1024)} KB)</p>
            <p>Compressed + encrypted on the server.</p>
            <p>Share this link so someone can download the original file:</p>
            <p><a href="${downloadUrl}" target="_blank">${downloadUrl}</a></p>
            <p><a href="/dashboard">Back to dashboard</a></p>
          </div>
        `
        )
      );
    });
  });
});

// Public download route: decrypt + decompress + send original
app.get('/file/:token', (req, res) => {
  const token = req.params.token;
  const file = files.find((f) => f.token === token);

  if (!file) {
    return res.status(404).send('File not found or link invalid.');
  }

  const filePath = path.join(__dirname, 'uploads', file.storedName);

  fs.readFile(filePath, (err, encryptedData) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error reading file.');
    }

    let gzipped;
    try {
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        ENC_KEY,
        Buffer.from(file.iv, 'hex')
      );
      decipher.setAuthTag(Buffer.from(file.authTag, 'hex'));

      gzipped = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    } catch (e) {
      console.error(e);
      return res.status(500).send('Error decrypting file (maybe key changed?).');
    }

    zlib.gunzip(gzipped, (err2, originalBuffer) => {
      if (err2) {
        console.error(err2);
        return res.status(500).send('Error decompressing file.');
      }

      // Send original file to User2
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(file.originalName)}"`
      );
      res.setHeader('Content-Type', 'application/octet-stream');
      res.send(originalBuffer);
    });
  });
});

// ---------- START SERVER ----------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
