const express = require("express");
const path = require("path");
const fs = require("fs");
const { getDeveloperById } = require("../db/db");

const router = express.Router();

router.get("/ManagerAssignment", async (req, res) => {
  try {
    // Simulate IIS LOGON_USER header
    let logonUser = req.headers["x-iis-logon-user"] || "DOMAIN\\build"; // for local testing
    let devId = logonUser.split("\\").pop();
    console.log("LOGON_USER_ManagerAssignment:", logonUser);
    console.log("Extracted devId_ManagerAssignment:", devId);

    // Fetch developer info from DB
    const developer = await getDeveloperById(devId);

    // === CASE 1: Unknown User ===
    if (!developer) {
      const filePath = path.join(__dirname, "../public/ErrorPages/UnknownUser.html");
      return fs.readFile(filePath, "utf8", (err, data) => {
        if (err) return res.status(500).send("Error loading UnknownUser page");
        const updatedHtml = data.replace("{{username}}", devId);
        res.status(403).send(updatedHtml);
      });
    }

    // Extract BuildRole from DB result
    const buildRole = developer.BuildRole ? developer.BuildRole.trim() : "";

    // === CASE 2: No Rights (role not Administrator or Project Manager) ===
    // if (buildRole !== "Administrator" && buildRole !== "Project Manager") {
    //   const filePath = path.join(__dirname, "../public/ErrorPages/NoRights.html");
    //   return fs.readFile(filePath, "utf8", (err, data) => {
    //     if (err) return res.status(500).send("Error loading NoRights page");
    //     const updatedHtml = data.replace("{{username}}", developer.DeveloperName || devId);
    //     res.status(403).send(updatedHtml);
    //   });
    // }

    // === CASE 2: No Rights (role not Administrator or Project Manager) ===
    if (buildRole !== "Administrator" && buildRole !== "Project Manager") {
      const filePath = path.join(__dirname, "../public/ErrorPages/NoRights.html");
      return fs.readFile(filePath, "utf8", (err, data) => {
        if (err) return res.status(500).send("Error loading NoRights page");
        res.status(403).send(data); // Send the HTML file content as-is
      });
    }


    // === CASE 3: Valid User with rights ===
    res.sendFile(path.join(__dirname, "../public/ManagerAssignment.html"));
  } catch (error) {
    console.error("Error in /ManagerAssignment route:", error);
    res.status(500).send("Internal server error");
  }
});

module.exports = router;
