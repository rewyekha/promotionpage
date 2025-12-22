const express = require("express");
const path = require("path");
const db = require("../db/db");

const router = express.Router();

// Serve HTML page
router.get("/BuildDetails", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/BuildDetails.html"));
});

// API to fetch build details
router.get("/api/builddetails/:projectId", async (req, res) => {
  try {
    const projectId = req.params.projectId;

    // Simulate LOGON_USER
    const logonUser = req.headers["x-iis-logon-user"] || "DOMAIN\\build";
    const developerID = logonUser.split("\\").pop();
    console.log("LOGON_USER_BuildDetails:", logonUser);
    console.log("Extracted developerID_BuildDetails:", developerID);

    // Check if developer exists
    const devCheck = await db.query(
      `SELECT * FROM Developers WHERE DeveloperID = '${developerID}'`
    );

    if (devCheck.length === 0) {
      return res.status(403).json({ error: "You are not a known user" });
    }

    if (!projectId) {
      return res.status(400).json({ error: "ProjectID is required" });
    }

    // Fetch builds for the project
    const builds = await db.query(`
      SELECT 
        FORMAT(StartTime, 'M/d/yyyy h:mm:ss tt') AS StartTimeFormatted,
        FORMAT(EndTime, 'M/d/yyyy h:mm:ss tt') AS EndTimeFormatted,
        *
      FROM BuildLog
      WHERE ProjectID = ${projectId}
      ORDER BY StartTime DESC
        `);
      
    let projectFileName = builds.length > 0 ? builds[0].ProjectFileName : "";

    res.json({ builds, projectFileName });
    console.log("Response_BuildDetails:", { builds, projectFileName });
  } catch (err) {
    console.error("BuildDetails error:", err);
    res.status(500).json({ error: "Failed to fetch build details" });
  }
});

module.exports = router;
