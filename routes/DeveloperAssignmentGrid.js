const express = require("express");
const router = express.Router();
const path = require("path");
const db = require("../db/db"); 

router.get("/DeveloperAssignmentGrid", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/DeveloperAssignmentGrid.html"));
});
// Query projects (like ASP Query mode)
// POST → handle Query or Update
router.post("/api/DeveloperAssignmentGrid", async (req, res) => {
  try {
    const { FormMode, QryDeveloperID, QryProjectManagerID, QryModuleNo, updates } = req.body;

    // Handle update (same as ASP Update block)
    if (FormMode === "Update" && Array.isArray(updates)) {
      for (const u of updates) {
        await db.query(
          "UPDATE Projects SET DeveloperID = @DeveloperID WHERE ID = @ID",
          { DeveloperID: u.developerId, ID: u.projectId }
        );
      }
      return res.json({ success: true });
    }

    // Handle Query (same as ASP Query)
    let sql = `
      SELECT Projects.*, t1.DeveloperName, t2.DeveloperName AS ManagerName
      FROM Projects
      INNER JOIN Developers t1 ON Projects.DeveloperID = t1.DeveloperID
      INNER JOIN Developers t2 ON Projects.ProjectManagerID = t2.DeveloperID
      WHERE Projects.Obsolete = 0
    `;

    const params = {};

    if (QryModuleNo && QryModuleNo !== "0") {
      sql += " AND Projects.ModuleNo = @ModuleNo";
      params.ModuleNo = QryModuleNo;
    }

    if (QryProjectManagerID && QryProjectManagerID !== "All") {
      sql += " AND Projects.ProjectManagerID = @ManagerID";
      params.ManagerID = QryProjectManagerID;
    }

    // if (!QryDeveloperID || QryDeveloperID.trim() === "") {
    // // If DeveloperID is empty or null, force no rows
    // sql += " AND 1 = 0";
    // } else if (QryDeveloperID && QryDeveloperID !== "All") {
    //   sql += " AND Projects.DeveloperID = @DeveloperID";
    //   params.DeveloperID = QryDeveloperID;
    // }

    if (QryDeveloperID && QryDeveloperID !== "All") {
      sql += " AND Projects.DeveloperID = @DeveloperID";
      params.DeveloperID = QryDeveloperID;
    }

    sql += " ORDER BY ProjectFldr, t1.DeveloperName";

    console.log("Executing SQL:", sql, "with params:", params);

    const projects = await db.query(sql, params);
    const developers = await db.query(
      "SELECT * FROM Developers WHERE (BuildRole = 'Developer' OR BuildRole = 'Project Manager') AND RTRIM(DeveloperName) <> '' ORDER BY DeveloperID"
    );
    
    // const developers = await db.query(`
    //   SELECT * FROM Developers WHERE (BuildRole = 'Developer' OR BuildRole = 'Administrator' OR BuildRole = 'Project Manager')
    //   UNION
    //   SELECT ' ' AS DeveloperID, ' ' AS DeveloperName, ' ' AS MailID, ' ' AS BuildRole
    //   ORDER BY DeveloperID
    // `);

    res.json({ projects, developers });
  } catch (err) {
    console.error("Error in DeveloperAssignmentGrid:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;