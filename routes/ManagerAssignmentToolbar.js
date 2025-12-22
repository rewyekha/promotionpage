const express = require("express");
const router = express.Router();
const path = require("path");
const db = require("../db/db"); 

router.get("/ManagerAssignmentToolbar", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/ManagerAssignmentToolbar.html"));
});

router.get("/api/ManagerAssignmentToolbar", async (req, res) => {
  try {
    const modules = await db.query("SELECT * FROM Modules ORDER BY ModuleID");
    const managers = await db.query("SELECT * FROM Developers WHERE BuildRole = 'Project Manager' OR BuildRole = 'Administrator' UNION SELECT ' ' AS DeveloperID, ' ' AS DeveloperName, ' ' AS MailID, ' ' AS BuildRole ORDER BY DeveloperID");
    res.json({ modules, managers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching toolbar data" });
  }
});

module.exports = router;
