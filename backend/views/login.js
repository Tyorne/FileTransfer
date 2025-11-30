module.exports = function loginView() {
  return `
    <h1>Login</h1>

    <form class="form" action="/login" method="POST">
      <label>Email:</label>
      <input class="input" type="email" name="email" required>

      <label>Password:</label>
      <input class="input" type="password" name="password" required>

      <button class="button" type="submit">Login</button>
      <p class="muted">Don't have an account? <a href="/register">Register</a></p>
    </form>
  `;
};
