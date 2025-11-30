module.exports = function dashboardView(username, files) {
  return `
    <h1>Welcome, ${username}</h1>

    <div class="actions">
      <a href="/upload" class="button">Upload File</a>
      <a href="/logout" class="button red">Logout</a>
    </div>

    <div class="spacer"></div>

    <h2>Your Files</h2>

    ${
      !files || files.length === 0
        ? '<p class="muted">No files uploaded yet.</p>'
        : `
        <ul class="file-list">
          ${files
            .map(
              (file) => `
            <li>
              <div>
                <strong>${file.originalName}</strong>
                <div class="muted" style="font-size:12px;">${new Date(file.timestamp).toLocaleString()}</div>
              </div>
              <div class="actions">
                <a class="button" href="/download/${file.encryptedFilename}">Download</a>
                <a class="button" href="/share/${file.encryptedFilename}">Share</a>
                <a class="button" href="/revoke/${file.encryptedFilename}">Revoke</a>
                <a class="button red" href="/delete/${file.encryptedFilename}">Delete</a>
              </div>
            </li>
          `
            )
            .join("")}
        </ul>
      `
    }
  `;
};
