const express = require("express");
const router = express.Router();
const path = require("path");
const db = require("../db/db"); 
const { Console } = require("console");

router.get("/ManagerAssignmentGrid", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/ManagerAssignmentGrid.html"));
});

router.post("/api/ManagerAssignmentGrid", async (req, res) => {
  try {
    const { QryProjectManagerID, QryModuleNo } = req.body;

    let sql = `
      SELECT P.*, D1.DeveloperName
      FROM Projects P
      LEFT JOIN Developers D1 ON P.ProjectManagerID = D1.DeveloperID
      WHERE Obsolete = 0
    `;

    if (QryModuleNo && Number(QryModuleNo) > 0) sql += ` AND P.ModuleNo = ${QryModuleNo}`;
    if (QryProjectManagerID && QryProjectManagerID !== "All") sql += ` AND ProjectManagerID = '${QryProjectManagerID}'`;
    sql += " ORDER BY P.ProjectFldr, D1.DeveloperName";

    console.log("SQL Query:", sql);

    const projects = await db.query(sql);
    const managers = await db.query("SELECT * FROM Developers WHERE BuildRole = 'Project Manager' OR BuildRole = 'Administrator' UNION SELECT ' ' AS DeveloperID, ' ' AS DeveloperName, ' ' AS MailID, ' ' AS BuildRole ORDER BY DeveloperID");

    res.json({ projects, managers });
    console.log("Response_BuildStatusGrid:", { data: projects, managers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching grid data" });
  }
});

router.post("/api/ManagerAssignmentUpdate", async (req, res) => {
  try {
    const { updates } = req.body; // [{ projectId, managerId }, ...]

    for (const u of updates) {
      await db.query(`UPDATE Projects SET ProjectManagerID='${u.managerId}' WHERE ID=${u.projectId}`);
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error updating projects" });
  }
});


module.exports = router;
