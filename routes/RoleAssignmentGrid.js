const express = require("express");
const router = express.Router();
const path = require("path");
const db = require("../db/db"); 

// Serve the HTML
router.get("/RoleAssignmentGrid", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/RoleAssignmentGrid.html"));
});
// API to fetch grid data
router.post('/api/RoleAssignmentGrid', async (req, res) => {
  try {
    const developers = await db.query("SELECT * FROM Developers ORDER BY DeveloperName");
    const roles = await db.query("SELECT * FROM UserRole ORDER BY BuildRole");
    res.json({ developers, roles });  // <-- wrap in object
  } catch (err) {
    console.error(err);
    res.status(500).json({ developers: [], roles: [] });
  }
});


// API to update roles
router.post('/api/RoleAssignmentUpdate', async (req,res) => {
  try {
    const updates = req.body.updates;
    for (const u of updates) {
      await db.query("UPDATE Developers SET BuildRole=@BuildRole WHERE DeveloperID=@DeveloperID", u);
    }
    res.json({ success:true });
  } catch(err) {
    console.error(err);
    res.json({ success:false });
  }
});

module.exports = router;
