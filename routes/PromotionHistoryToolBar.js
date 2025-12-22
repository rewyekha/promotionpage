const express = require("express");
const router = express.Router();
const path = require("path");
const db = require("../db/db");

// Toolbar HTML
router.get("/PromotionHistoryToolBar", async (req, res) => {
  res.sendFile(path.join(__dirname, "../public/PromotionHistoryToolBar.html"));
});

// API for dropdowns
router.get("/PromotionHistoryToolBar/data", async (req, res) => {
  try {
    const modules = await db.query("SELECT * FROM Modules ORDER BY Description");
    const projectTypes = await db.query("SELECT * FROM ProjectTypes ORDER BY Description");
    const developers = await db.query("SELECT * FROM Developers ORDER BY DeveloperID");
    res.json({ modules, projectTypes, developers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
