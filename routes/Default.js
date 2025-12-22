const express = require("express");
const path = require("path");
const router = express.Router();

// Serve default Default.html (replaces Default.asp)
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/Default.html"));
});

//Serve Contents.html (replaces Contents.asp)
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/Contents.html"));
});

// Serve News.html (replaces News.htm)
router.get("/News", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/News.html"));
});

module.exports = router;
