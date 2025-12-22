const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const db = require("../db/db"); // your existing db.js

// router.get("/BuildSchedule.html", async (req, res) => {
//     console.log("➡️ Route /BuildSchedule was called");
//     try {
//         console.log("Executing SQL Query...");
//         res.send("OK - BuildSchedule route reached");
//     } catch (err) {
//         console.error(err);
//         res.status(500).send("Error fetching build schedule");
//     }
// });
// Route for "/BuildSchedule"
router.get("/BuildSchedule", async (req, res) => {
    try {
        const result = await db.query(`
                SELECT 
                    NextNonSchemaBuildDate,
                    NextSchemaBuildDate,
                    DATENAME(weekday, NextNonSchemaBuildDate) AS NextNonSchemaBuildDay,
                    DATENAME(weekday, NextSchemaBuildDate) AS NextSchemaBuildDay,
                    FORMAT(NextNonSchemaBuildDate, 'MM/dd/yyyy h:mm:ss tt') AS NextNonSchemaBuildDateStr,
                    FORMAT(NextSchemaBuildDate, 'MM/dd/yyyy h:mm:ss tt') AS NextSchemaBuildDateStr
                FROM Settings
        `);

        
        if (!result || result.length === 0) {
            return res.send("No build schedule found");
        }

        const build = result.length > 0 ? result[0] : null;

        console.log("Row data_BuildSchedule:", build);

        const nextSchema = build
        ? `${build.NextSchemaBuildDay} ${build.NextSchemaBuildDateStr} Pacific Time`
        : "N/A";

        const nextNonSchema = build
        ? `${build.NextNonSchemaBuildDay} ${build.NextNonSchemaBuildDateStr} Pacific Time`
        : "N/A";

        // load HTML template
        let html = fs.readFileSync(path.join(__dirname, "../public/BuildSchedule.html"), "utf-8");

        // replace placeholders
        html = html.replace("{{NextSchemaBuild}}", nextSchema);
        html = html.replace("{{NextNonSchemaBuild}}", nextNonSchema);

        res.send(html);
            
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching build schedule");
    }
});

module.exports = router;
