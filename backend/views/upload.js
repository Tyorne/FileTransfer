module.exports = function uploadView() {
  return `
    <h1>Upload a File</h1>

    <form class="form" action="/upload" method="POST" enctype="multipart/form-data">
      <label>Select a file:</label>
      <input type="file" name="file" required>

      <button class="button" type="submit">Upload</button>
    </form>

    <div class="spacer"></div>
    <p class="muted"><a href="/dashboard">Back to Dashboard</a></p>
  `;
};
