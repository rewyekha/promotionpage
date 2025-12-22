const express = require("express");
const path = require("path");
const db = require("../db/db");

const router = express.Router();

// Serve toolbar HTML
router.get("/BuildStatusToolBar", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/BuildStatusToolBar.html"));
});

// API for toolbar dropdowns
router.get("/api/buildstatus/toolbar-data", async (req, res) => {
  try {
    const logonUser = req.headers["x-iis-logon-user"] || "DOMAIN\\build";
    const devId = logonUser.split("\\").pop();
    console.log("LOGON_USER_BuildStatusToolBar:", logonUser);
    console.log("Extracted devId_BuildStatusToolBar:", devId);

    const developer = await db.getDeveloperById(devId);
    const settings = await db.query("SELECT * FROM Settings");
    const modules = await db.query("SELECT * FROM Modules ORDER BY ModuleID");
    const developers = await db.query("SELECT * FROM Developers ORDER BY DeveloperID");
    const buildStatus = await db.query("SELECT * FROM BuildStatus ORDER BY BuildStatus");

    res.json({
      developer,
      settings: settings[0],
      modules,
      developers,
      buildStatus
    });

  } catch (err) {
    console.error("Toolbar error:", err);
    res.status(500).json({ error: "Failed to fetch toolbar data" });
  }
});

module.exports = router;
