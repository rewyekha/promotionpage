const express = require("express");
const path = require("path");
const fs = require("fs");
const { getDeveloperById } = require("../db/db");

const router = express.Router();


router.get("/ProjectPromotion", async (req, res) => {
  try {
    // Simulate LOGON_USER from headers
    let logonUser = req.headers["x-iis-logon-user"] || "DOMAIN\\build";
    let devId = logonUser.split("\\").pop();
    console.log("LOGON_USER_ProjectPromotion:", logonUser);
    console.log("Extracted devId_ProjectPromotion:", devId);

    const developer = await getDeveloperById(devId);

    if (!developer) {
      // Handle Unknown User → replace {{username}}
      const filePath = path.join(__dirname, "../public/ErrorPages/UnknownUser.html");
      fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
          return res.status(500).send("Error loading UnknownUser page");
        }
        const updatedHtml = data.replace("{{username}}", devId);
        res.send(updatedHtml);
      });
    } else {
      // Valid developer → show ProjectPromotion.html
      res.sendFile(path.join(__dirname, "../public/ProjectPromotion.html"));
    }
  } catch (error) {
    console.error("Error in /ProjectPromotion route:", error);
    res.status(500).send("Internal server error");
  }
});

module.exports = router;
