const zlib = require("zlib");

module.exports = {
  compress: (buffer) =>
    zlib.gzipSync(buffer),

  decompress: (buffer) =>
    zlib.gunzipSync(buffer)
};
