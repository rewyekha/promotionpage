const express = require("express");
const router = express.Router();
const path = require("path");
const db = require("../db/db"); 

// Serve the HTML
router.get("/RoleAssignmentToolBar", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/RoleAssignmentToolBar.html"));
});

module.exports = router;
