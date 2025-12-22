const express = require("express");
const path = require("path");
const db = require("../db/db");

const router = express.Router();

// Serve Grid page
router.get("/BuildStatusGrid", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/BuildStatusGrid.html"));
});

// API to fetch grid data
router.post("/api/buildstatus/grid", async (req, res) => {
  try {
    let { FormMode, qryDeveloperID, qryModuleNo, qryBuildStatus, qryProjectMask } = req.body;

    // Simulate LOGON_USER
    const logonUser = req.headers["x-iis-logon-user"] || "DOMAIN\\build";
    const sDeveloperID = logonUser.split("\\").pop();
    console.log("LOGON_USER_BuildStatusGrid:", logonUser);
    console.log("Extracted sDeveloperID_BuildStatusGrid:", sDeveloperID);

   // Set defaults only if first load (FormMode empty or undefined)
    if (!FormMode) {
      qryDeveloperID = sDeveloperID;  // default to logged-in dev
      qryModuleNo = "All";
      qryBuildStatus = "Error";
      qryProjectMask = "";
    }

    let sSQL = `
      SELECT FORMAT(Projects.BuildDate, 'M/d/yyyy h:mm:ss tt') AS FormattedBuildDate, Projects.*, t1.ModuleID, t2.DeveloperName
      FROM Projects
      INNER JOIN Modules t1 ON Projects.ModuleNo = t1.ModuleNo
      INNER JOIN Developers t2 ON Projects.DeveloperID = t2.DeveloperID
      WHERE Projects.Obsolete = 0
    `;

    if (qryModuleNo && qryModuleNo !== "All" && qryModuleNo !== "0") {
      sSQL += ` AND Projects.ModuleNo = ${qryModuleNo}`;
    }

    if (!qryDeveloperID || qryDeveloperID.trim() === "") {
        // If developer ID is empty or null, force no rows
        sSQL += " AND 1 = 0";  // This will make SQL return zero rows
    }
    else if (qryDeveloperID && qryDeveloperID !== "All") {
      sSQL += ` AND Projects.DeveloperID = '${qryDeveloperID}'`;
    }

    if (qryBuildStatus && qryBuildStatus !== "All") {
      sSQL += ` AND Projects.BuildStatus = '${qryBuildStatus}'`;
    }
    if (qryProjectMask && qryProjectMask !== "") {
      if (!qryProjectMask.includes("%")) {
        qryProjectMask += "%";
      }
      sSQL += ` AND ProjectFileName LIKE '${qryProjectMask}'`;
    }

    sSQL += " ORDER BY ProjectFileName";

        // Optional: log SQL and filters for debugging
    console.log("Grid Filters_BuildStatusGrid:", { qryDeveloperID, qryModuleNo, qryBuildStatus, qryProjectMask });
    console.log("Generated SQL_BuildStatusGrid:", sSQL);

    const rows = await db.query(sSQL);

    res.json({ data: rows });
    console.log("Response_BuildStatusGrid:", { data: rows });

  } catch (err) {
    console.error("Grid error:", err);
    res.status(500).json({ error: "Failed to fetch grid data" });
  }
});

module.exports = router;
