const express = require("express");
const router = express.Router();
const path = require("path");
const db = require("../db/db");

router.get("/ProjectPromotionToolBar", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/ProjectPromotionToolBar.html"));
});

// GET toolbar data
router.get("/ProjectPromotion/api/toolbarData", async (req, res) => {
    try {

        const loggedInUser = req.user?.DeveloperID || "All";
        console.log("Logged-in user_ProjectPromotionToolBar:", loggedInUser);
        // Fetch settings with formatted date
        const settings = await db.query(`
            SELECT 
                FORMAT(NextNonSchemaBuildDate, 'MM/dd/yyyy h:mm:ss tt') AS NextNonSchemaBuildDateStr,
                FORMAT(NextSchemaBuildDate, 'MM/dd/yyyy h:mm:ss tt') AS NextSchemaBuildDateStr
            FROM Settings
        `);

        const modules = await db.query("SELECT * FROM Modules ORDER BY Description");
        const developers = await db.query("SELECT * FROM Developers ORDER BY DeveloperID");
        const promotionStatus = await db.query("SELECT * FROM PromotionStatus ORDER BY PromotionStatus");
        const projectTypes = await db.query("SELECT * FROM ProjectTypes ORDER BY Description");

        res.json({
            nextBuildDate: settings[0]?.NextNonSchemaBuildDateStr || "",
            nextSchemaBuildDate: settings[0]?.NextSchemaBuildDateStr || "",
            modules,
            developers,
            promotionStatus,
            projectTypes,
            loggedInUser
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch toolbar data" });
    }
});

module.exports = router;
