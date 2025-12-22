const express = require("express");
const router = express.Router();
const path = require("path");
const db = require("../db/db");

// Grid HTML
router.get("/PromotionHistoryGrid", async (req, res) => {
  res.sendFile(path.join(__dirname, "../public/PromotionHistoryGrid.html"));
});

// API for projects list
router.post("/PromotionHistoryGrid/projects", async (req, res) => {
  try {
    const { ModuleNo, ProjectType, DeveloperID, ProjectMask, DescriptionMask } = req.body;

    let sWhere = "WHERE 1=1";
    const params = {};

    if (ModuleNo && ModuleNo !== "0") {
      sWhere += " AND p.ModuleNo = @ModuleNo";
      params.ModuleNo = ModuleNo;
    }

    if (ProjectType && ProjectType !== "All") {
      sWhere += " AND p.ProjectTypeID = @ProjectType";
      params.ProjectType = ProjectType;
    }

    if (!DeveloperID || DeveloperID.trim() === "") {
      // If DeveloperID is empty or null, force no rows
      sWhere += " AND 1 = 0"; 
    } else if (DeveloperID && DeveloperID !== "All") {
      sWhere += " AND p.DeveloperID = @DeveloperID";
      params.DeveloperID = DeveloperID;
    }

    if (ProjectMask) {
      sWhere += " AND p.ProjectFileName LIKE @ProjectMask";
      params.ProjectMask = ProjectMask.includes("%") ? ProjectMask : ProjectMask + "%";
    }

    if (DescriptionMask) {
      sWhere += " AND p.Description LIKE @DescriptionMask";
      params.DescriptionMask = DescriptionMask.includes("%") ? DescriptionMask : DescriptionMask + "%";
    }

    const sSQL = `
      SELECT p.*, d.DeveloperName, t.Description AS ProjectTypeDesc
      FROM Projects p
      LEFT JOIN Developers d ON p.DeveloperID = d.DeveloperID
      LEFT JOIN ProjectTypes t ON p.ProjectTypeID = t.ProjectTypeID
      ${sWhere}
      ORDER BY p.ProjectFileName
    `;

    console.log("Executing SQL:", sSQL, params);

    const projects = await db.query(sSQL, params);
    res.json(projects);

  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// API for promotion history
router.get("/PromotionHistoryGrid/history/:projectId", async (req, res) => {
  try {
    const projectId = req.params.projectId;

    const sSQL = `
        SELECT 
            p.ProjectFileName AS ProjectName,
            FORMAT(h.PromotionDate, 'M/d/yyyy h:mm:ss tt') AS FormattedPromotionDate,
            d.DeveloperName AS PromotedBy,
            FORMAT(h.LastExtractionDate, 'M/d/yyyy h:mm:ss tt') AS FormattedLastExtractionDate,
            CASE h.PromotionStatus
                WHEN 'promotenextbuild' THEN 'Promoted For Next Build ' + CONVERT(varchar, h.ForBuildDate, 120)
                WHEN 'promotenextschemabuild' THEN 'Promoted For Next Schema Build ' + CONVERT(varchar, h.ForBuildDate, 120)
            END AS Action
        FROM PromotionHistory h
        JOIN Projects p ON p.ID = h.ProjID
        JOIN Developers d ON h.PromoteID = d.DeveloperID
        WHERE p.ID = @ProjectID
        ORDER BY h.PromotionDate DESC
    `;

    const history = await db.query(sSQL, { ProjectID: projectId });
    res.json(history);

  } catch (err) {
    console.error("Error fetching promotion history:", err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
