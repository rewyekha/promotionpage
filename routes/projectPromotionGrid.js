const express = require("express");
const path = require("path");
const router = express.Router();
const db = require("../db/db");
const sql = require("mssql");

router.get("/ProjectPromotionGrid", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/ProjectPromotionGrid.html"));
});

// Format valid dates and ignore 1/1/1900
const formatValidDate = d => {
    if (!d) return "";
    const date = new Date(d);
    return date.getFullYear() > 1900 ? date.toLocaleString('en-US', { hour12: true }) : "";
};

// GET grid data
router.get("/ProjectPromotion/api/grid", async (req, res) => {
    try {
        const {
            QryDeveloperID = "All",
            QryModuleNo = "0",
            QryPromotionStatus = "All",
            QryProjectTypeID = "All",
            QryProjectMask = "",
        } = req.query;

        let sSQL = `
            SELECT 
                p.ID, 
                p.PromotionStatus,
                CASE WHEN p.PromotionDate > '1900-01-01' 
                    THEN FORMAT(p.PromotionDate, 'MM/dd/yyyy hh:mm:ss tt') 
                    ELSE '' END AS PromotionDate,
                CASE WHEN p.NextExtractionDate > '1900-01-01' 
                    THEN FORMAT(p.NextExtractionDate, 'MM/dd/yyyy hh:mm:ss tt') 
                    ELSE '' END AS NextExtractionDate,
                p.ModuleNo, 
                p.ProjectFileName, 
                p.DeveloperID,
                CASE WHEN p.LastExtractionDate > '1900-01-01' 
                    THEN FORMAT(p.LastExtractionDate, 'MM/dd/yyyy hh:mm:ss tt') 
                    ELSE '' END AS LastExtractionDate,
                p.ProjectManagerID, 
                p.PromoteID,
                t1.ModuleID, 
                t2.DeveloperName, 
                t3.DeveloperName AS ManagerName
            FROM Projects p
            INNER JOIN Modules t1 ON p.ModuleNo = t1.ModuleNo
            LEFT JOIN Developers t2 ON p.DeveloperID = t2.DeveloperID
            LEFT JOIN Developers t3 ON p.ProjectManagerID = t3.DeveloperID
            WHERE p.Obsolete = 0
        `;

        const pool = await sql.connect(db.config);
        const request = pool.request();

        if (QryModuleNo && QryModuleNo !== "0") {
            const moduleNoInt = parseInt(QryModuleNo, 10);
            if (!isNaN(moduleNoInt)) {
                sSQL += " AND p.ModuleNo = @ModuleNo";
                request.input("ModuleNo", sql.Int, moduleNoInt);
            }
        }

        if (!QryDeveloperID || QryDeveloperID.trim() === "") {
        // If developer ID is empty or null, force no rows
        sSQL += " AND 1 = 0";  // This will make SQL return zero rows
        } else if (QryDeveloperID && QryDeveloperID !== "All") {
            sSQL += " AND p.DeveloperID = @DeveloperID";
            request.input("DeveloperID", sql.VarChar(50), QryDeveloperID);
        }
        console.log("QryDeveloperID_ProjectPromotionGrid:", QryDeveloperID);

        if (QryPromotionStatus && QryPromotionStatus !== "All") {
            sSQL += " AND p.PromotionStatus = @PromotionStatus";
            request.input("PromotionStatus", sql.VarChar(30), QryPromotionStatus);
        }
        console.log("QryPromotionStatus_ProjectPromotionGrid:", QryPromotionStatus);

        if (QryProjectTypeID && QryProjectTypeID !== "All") {
            const projectTypeIDInt = parseInt(QryProjectTypeID, 10);
            if (!isNaN(projectTypeIDInt)) {
                sSQL += " AND p.ProjectTypeID = @ProjectTypeID";
                request.input("ProjectTypeID", sql.Int, projectTypeIDInt);
            }
        }

        if (QryProjectMask) {
            sSQL += " AND p.ProjectFileName LIKE @ProjectMask";
            request.input("ProjectMask", sql.VarChar(200), `%${QryProjectMask}%`);
        }

        sSQL += " ORDER BY p.ProjectFileName";

        const result = await request.query(sSQL);
        const projects = result.recordset;

        // Format dates
        projects.forEach(p => {
            p.PromotionDate = formatValidDate(p.PromotionDate);
            p.NextExtractionDate = formatValidDate(p.NextExtractionDate);
            p.LastExtractionDate = formatValidDate(p.LastExtractionDate);
        });

        res.json(projects);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch grid data" });
    }
});

// POST update grid data
router.post("/ProjectPromotion/api/update", async (req, res) => {
    try {
        const { updates = {}, formMode, QryDeveloperID } = req.body;
        const developerID = QryDeveloperID || "System";

        const pool = await sql.connect(db.config);
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        for (const key in updates) {
            if (key.startsWith("procmb")) {
                const projID = parseInt(key.slice(6), 10);
                if (!isNaN(projID)) {
                    const promoteStatus = updates[key];
                    const request = new sql.Request(transaction);
                    request.requestTimeout = 60000;

                    await request.input("iProjID", sql.Int, projID)
                                 .input("iPromotionStatus", sql.VarChar(30), promoteStatus)
                                 .input("iPromoteID", sql.VarChar(20), developerID)
                                 .execute("spUpdatePromotionStatus");
                }
            }
        }

        await transaction.commit();
        res.json({ success: true, message: "Grid data updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update grid data" });
    }
});

module.exports = router;
