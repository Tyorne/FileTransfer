const express = require("express");
const router = express.Router();

const requireLogin = require("../middleware/requireLogin");
const upload = require("../middleware/multerConfig");
const fileController = require("../controllers/fileController");
const uploadView = require("../views/upload.js");

router.get("/upload", requireLogin, (req, res) => {
  const layout = require("../utils/htmlLayout.js");
  res.send(layout("Upload File", uploadView()));
});

router.post("/upload", requireLogin, upload.single("file"), fileController.uploadFile);

router.get("/download/:id", fileController.downloadFile);
router.get("/share/:id", requireLogin, fileController.shareFile);

// NEW ROUTES:
router.get("/shared/:id", fileController.sharedDownload);
router.get("/revoke/:id", requireLogin, fileController.revokeShare);
router.get("/delete/:id", requireLogin, fileController.deleteFile);

module.exports = router;
