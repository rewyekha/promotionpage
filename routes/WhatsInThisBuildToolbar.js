const express = require("express");
const router = express.Router();
const path = require("path");
const db = require("../db/db");

// Toolbar HTML route
router.get("/WhatsInThisBuildToolbar", async (req, res) => {
  res.sendFile(path.join(__dirname, "../public/WhatsInThisBuildToolbar.html"));
});

// API to get dropdown data
router.get("/WhatsInThisBuildToolbar/api/data", async (req, res) => {
  try {
    const modules = await db.query("SELECT * FROM Modules ORDER BY ModuleID");
    const developers = await db.query("SELECT * FROM Developers ORDER BY DeveloperID");
    const buildLabels = await db.query("SELECT DISTINCT BuildLabel FROM BuildLog ORDER BY BuildLabel DESC");
    const settings = await db.query("SELECT * FROM Settings");

    res.json({ modules, developers, buildLabels, settings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch toolbar data" });
  }
});

module.exports = router;
