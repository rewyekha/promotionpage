const express = require("express");
const fs = require("fs");
const path = require("path");
const db = require("../db/db");
const { Console } = require("console");

const router = express.Router();

// GET /Contents.html
router.get("/Contents", async (req, res) => {
  try {
    // query DB
    const versionData = await db.query("SELECT VersionProductStr FROM VersionInformation");
    const version = versionData.length > 0 ? versionData[0].VersionProductStr : "N/A";

    // Get authenticated user from middleware (consistent with app.js)
    let user = "DOMAIN\\build"; // Default fallback
    if (req.user && req.user.authenticated) {
      user = req.user.fullUser; // Full domain\username format
    } else {
      // Fallback to direct header check
      user = req.headers["logon_user"] || 
             req.headers["auth_user"] || 
             req.headers["remote_user"] || 
             req.headers["x-iisnode-logon_user"] || 
             user;
    }
    
    console.log("LOGON_USER_Contents:", user);
    console.log("Extracted user_Contents:", user.split("\\").pop());

    // load HTML file
    let html = fs.readFileSync(path.join(__dirname, "../public/Contents.html"), "utf8");

    // replace placeholders with dynamic data
    html = html.replace("{{USER}}", user);
    html = html.replace("{{VERSION}}", version);

    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading contents");
  }
});

module.exports = router;
