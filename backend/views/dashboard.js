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
      files.length === 0
        ? "<p class=\"muted\">No files uploaded yet.</p>"
        : `
        <ul class="file-list">
          ${files
            .map(
              (file) => `
            <li>
              <div>
                <strong>${file}</strong>
              </div>
              <div class="actions">
                <a class="button" href="/download/${file}">Download</a>
                <a class="button" href="/share/${file}">Share</a>
                <a class="button" href="/revoke/${file}">Revoke</a>
                <a class="button red" href="/delete/${file}">Delete</a>
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
