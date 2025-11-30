module.exports = function loginView(errorMessage = "") {
  const errorHtml = errorMessage
    ? `<p style="color:red;">${errorMessage}</p>`
    : "";

  return `
    <div class="auth-container">
      <h1>Secure File Transfer Platform</h1>
      <h2>Login</h2>
      ${errorHtml}
      <form method="POST" action="/login">
        <label>Email:</label><br />
        <input type="email" name="email" required /><br /><br />

        <label>Password:</label><br />
        <input type="password" name="password" required /><br /><br />

        <button type="submit">Login</button>
      </form>
      <p>Don't have an account? <a href="/register">Register</a></p>
    </div>
  `;
};
