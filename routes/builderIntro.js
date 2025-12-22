const express = require("express");
const path = require("path");
const router = express.Router();

// Route for BuilderIntro page
router.get("/BuilderIntro", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/BuilderIntro.html"));
});

module.exports = router;
