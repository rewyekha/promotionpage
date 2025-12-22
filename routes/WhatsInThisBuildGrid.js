const express = require("express");
const router = express.Router();
const path = require("path");
const db = require("../db/db");

// Grid HTML
router.get("/WhatsInThisBuildGrid", async (req, res) => {
  res.sendFile(path.join(__dirname, "../public/WhatsInThisBuildGrid.html"));
});

// Grid data API
router.post("/WhatsInThisBuildGrid/api/data", async (req, res) => {
  try {
    let { operation, moduleNo, developerID, buildLabel } = req.body;

    let sql = `
      SELECT bl.*, m.ModuleID, d.DeveloperName
      FROM BuildLog bl
      INNER JOIN Modules m ON bl.ModuleNo = m.ModuleNo
      INNER JOIN Developers d ON bl.DeveloperID = d.DeveloperID
      WHERE 1=1
    `;

    if (moduleNo && moduleNo != "0") sql += ` AND bl.ModuleNo = ${moduleNo}`;
    // if (developerID && developerID != "All") sql += ` AND bl.DeveloperID = '${developerID}'`;
    if (!developerID || developerID.trim() === "") {
        // If developer ID is empty or null, force no rows
        sql += " AND 1 = 0";  // This will make SQL return zero rows
    }else if (developerID && developerID !== "All") {
      sql += ` AND bl.DeveloperID = '${developerID}'`;
    }
    if (buildLabel && buildLabel != "All") sql += ` AND bl.BuildLabel = '${buildLabel}'`;
    if (operation && operation != "All") sql += ` AND bl.Operation = '${operation}'`;

    sql += " ORDER BY ProjectFileName";

    const projects = await db.query(sql);

    res.json({ projects,});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch build data" });
  }
});

module.exports = router;
