const express = require("express");
const router = express.Router();
const path = require("path");
const db = require("../db/db");

// Toolbar HTML route
router.get("/ObsoleteProjects", async (req, res) => {
  res.sendFile(path.join(__dirname, "../public/ObsoleteProjects.html"));
});

// GET all obsolete projects
router.get("/api/obsoleteprojects", async (req, res) => {
  try {
    const logonUser = req.headers["x-iis-logon-user"] || "DOMAIN\\build"; // Default for local testing
    const developerID = logonUser.split("\\").pop(); // same as Mid/Instr in ASP

    const sqlQuery = `
        SELECT projects.*, t1.ModuleID, t2.DeveloperName, t3.DeveloperName AS ManagerName
        FROM projects
        INNER JOIN Modules t1 ON projects.ModuleNo = t1.ModuleNo
        LEFT JOIN Developers t2 ON projects.DeveloperID = t2.DeveloperID
        LEFT JOIN Developers t3 ON projects.ProjectManagerID = t3.DeveloperID
        WHERE projects.Obsolete = 1
        `;

    const result = await db.query(sqlQuery);
    res.json({ developerID, data: result });
  } catch (err) {
    console.error("Error fetching obsolete projects:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
