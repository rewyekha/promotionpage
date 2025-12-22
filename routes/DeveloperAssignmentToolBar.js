const express = require("express");
const router = express.Router();
const path = require("path");
const db = require("../db/db"); 

// Serve the HTML
router.get("/DeveloperAssignmentToolBar", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/DeveloperAssignmentToolBar.html"));
});

// API to get dropdown data
router.get("/api/DeveloperAssignmentToolbar", async (req, res) => {
  try {
    // Detect the logged-in Windows user from IIS header     
    let currentUserID = "build"; // default

    const logonUser = req.headers['x-iis-logon-user'];
    if (logonUser) {
      // Extract just the username from "DOMAIN\username"
      currentUserID = logonUser.split("\\").pop();
    }


    const developers = await db.query(
      "SELECT * FROM Developers WHERE (BuildRole = 'Developer' OR BuildRole = 'Project Manager') AND RTRIM(DeveloperName) <> '' ORDER BY DeveloperID"
    );

    const modules = await db.query("SELECT * FROM Modules ORDER BY ModuleID");

    res.json({ developers, modules, currentUserID });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching toolbar data" });
  }
});

module.exports = router;
