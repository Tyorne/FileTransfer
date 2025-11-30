module.exports = function registerView() {
  return `
    <h1>Create Account</h1>

    <form class="form" action="/register" method="POST">
      <label>Email:</label>
      <input class="input" type="email" name="email" required>

      <label>Password:</label>
      <input class="input" type="password" name="password" required>

      <button class="button" type="submit">Register</button>
      <p class="muted">Already have an account? <a href="/login">Login</a></p>
    </form>
  `;
};
