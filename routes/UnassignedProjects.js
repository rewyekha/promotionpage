const express = require("express");
const router = express.Router();
const path = require("path");
const db = require("../db/db");

// Toolbar HTML route
router.get("/UnassignedProjects", async (req, res) => {
  res.sendFile(path.join(__dirname, "../public/UnassignedProjects.html"));
});
// Route to fetch unassigned projects
router.get("/api/unassigned-projects", async (req, res) => {
  const sqlQuery = `
    SELECT p.*, m.ModuleID, d1.DeveloperName, d2.DeveloperName AS ManagerName
    FROM Projects p
    INNER JOIN Modules m ON p.ModuleNo = m.ModuleNo
    LEFT JOIN Developers d1 ON p.DeveloperID = d1.DeveloperID
    LEFT JOIN Developers d2 ON p.ProjectManagerID = d2.DeveloperID
    WHERE p.DeveloperID = 'unassign' OR p.ProjectManagerID = 'unassign'
  `;

  try {
    const projects = await db.query(sqlQuery);
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

module.exports = router;
