const express = require("express");
const router = express.Router();
const db = require("../db/db");
const fs = require("fs");
const path = require("path");

// Get authenticated user from middleware (consistent with app.js)
function getLoggedInUser(req) {
  // Use the user object set by Windows Authentication middleware in app.js
  if (req.user && req.user.authenticated) {
    return req.user.developerId;
  }
  
  // Fallback to direct header check if middleware somehow failed
  const logonUser = req.headers["logon_user"] || 
                   req.headers["auth_user"] || 
                   req.headers["remote_user"] || 
                   req.headers["x-iisnode-logon_user"] || 
                   "DOMAIN\\build"; // Default for local testing
  
  return logonUser.includes('\\') ? logonUser.split("\\").pop() : logonUser;
}

// GET user info
router.get("/UserRegistration", async (req, res) => {
  const developerId = getLoggedInUser(req);
  const developer = await db.getDeveloperById(developerId);

  // Load HTML template and inject values
  const filePath = path.join(__dirname, "../public/UserRegistration.html");
  let html = fs.readFileSync(filePath, "utf8");

  html = html
    .replace("{{DeveloperID}}", developerId)
    .replace("{{DeveloperName}}", developer ? developer.DeveloperName : "")
    .replace("{{MailID}}", developer ? developer.MailID : "");

  res.send(html);
});

// POST update
router.post("/UserRegistration", async (req, res) => {
  const developerId = getLoggedInUser(req);
  const { DeveloperName, MailID, FormMode } = req.body;

  let message = "";

  if (FormMode === "Update") {
    // ✅ Server-side validation
    if (!DeveloperName || !MailID) {
      return res.redirect(
        `/UserRegistration?msg=${encodeURIComponent("Error: Name and Email are required.")}`
      );
    }

    try {
      const developer = await db.getDeveloperById(developerId);

      if (!developer) {
        // Insert
        await db.query(
          "INSERT INTO Developers (DeveloperID, DeveloperName, MailID) VALUES (@id, @name, @mail)",
          { id: developerId, name: DeveloperName.trim(), mail: MailID.trim() }
        );
        message = "User added";
      } else {
        // Update
        await db.query(
          "UPDATE Developers SET DeveloperName=@name, MailID=@mail WHERE DeveloperID=@id",
          { id: developerId, name: DeveloperName.trim(), mail: MailID.trim() }
        );
        message = "User updated";
      }
    } catch (err) {
      console.error("Error in UserRegistration:", err);
      message = "Error: " + err.message; // ✅ Send DB error back to UI
    }
  }

  res.redirect(`/UserRegistration?msg=${encodeURIComponent(message)}`);
});

module.exports = router;
