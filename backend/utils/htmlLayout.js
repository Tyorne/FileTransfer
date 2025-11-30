module.exports = function layout(title, bodyHtml) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <link rel="stylesheet" href="/static/style.css">
  </head>
  <body>

    <header>Secure File Transfer Platform</header>

    <div class="container">
      ${bodyHtml}
    </div>

  </body>
  </html>
  `;
};
