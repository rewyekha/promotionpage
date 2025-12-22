const express = require('express');
const { sql, poolPromise } = require('../db/db');
const path = require('path');
const router = express.Router();

// Middleware to check user authentication (uses req.user from main server middleware)
const checkAuth = (req, res, next) => {
    // The main server middleware already set req.user
    if (!req.user || !req.user.authenticated) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    req.userId = req.user.developerId; // Already extracted by main middleware
    next();
};

// Middleware to check user exists in database
const checkUserExists = async (req, res, next) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('developerId', sql.VarChar(50), req.userId)
            .query('SELECT BuildRole FROM Developers WHERE DeveloperID = @developerId');

        if (result.recordset.length === 0) {
            return res.status(403).json({ error: 'User not found' });
        }

        req.userRole = result.recordset[0].BuildRole.trim();
        next();
    } catch (error) {
        console.error('Error checking user:', error);
        res.status(500).json({ error: 'Database error checking user' });
    }
};

// Apply middleware to all routes (commented out for testing)
// router.use(checkAuth);
// router.use(checkUserExists);

// Serve the main HTML page
router.get('/', (req, res) => {
    console.log('Module Maintenance main page requested');
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(path.join(__dirname, '../public/moduleMaintenance.html'));
});

// Test route
router.get('/test', (req, res) => {
    console.log('Module Maintenance test route hit!');
    res.json({ message: 'Module maintenance routes working!' });
});

// Serve the JavaScript file
router.get('/moduleMaintenanceMinimal.js', (req, res) => {
    console.log('Module Maintenance JS file requested');
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'moduleMaintenanceMinimal.js'));
});

// Get all modules with optional filtering
router.get('/modules', async (req, res) => {
    try {
        const { ModuleID, ModuleNo, Description } = req.query;

        const pool = await poolPromise;
        let query = 'SELECT RTRIM(ModuleID) as ModuleID, ModuleNo, RTRIM(Description) as Description FROM Modules';
        const conditions = [];
        const request = pool.request();

        // Add filters if provided
        if (ModuleID) {
            conditions.push('ModuleID LIKE @ModuleID');
            request.input('ModuleID', sql.VarChar(50), `%${ModuleID}%`);
        }

        if (ModuleNo) {
            conditions.push('ModuleNo = @ModuleNo');
            request.input('ModuleNo', sql.Int, ModuleNo);
        }

        if (Description) {
            conditions.push('Description LIKE @Description');
            request.input('Description', sql.VarChar(255), `%${Description}%`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY ModuleID';

        const result = await request.query(query);
        res.json(result.recordset);

    } catch (error) {
        console.error('Error fetching modules:', error);
        res.status(500).json({ error: 'Failed to fetch modules' });
    }
});

// Get a specific module by ID
router.get('/modules/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('moduleId', sql.VarChar(50), id)
            .query('SELECT RTRIM(ModuleID) as ModuleID, ModuleNo, RTRIM(Description) as Description FROM Modules WHERE ModuleID = @moduleId');

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Module not found' });
        }

        res.json(result.recordset[0]);

    } catch (error) {
        console.error('Error fetching module:', error);
        res.status(500).json({ error: 'Failed to fetch module' });
    }
});

// Insert new module
router.post('/insert', async (req, res) => {
    try {
        const { ModuleID, ModuleNo, Description } = req.body;

        // Validate required fields
        if (!ModuleID || !ModuleNo) {
            return res.status(400).json({
                success: false,
                message: 'ModuleID and ModuleNo are required'
            });
        }

        const pool = await poolPromise;

        // Check if ModuleID already exists
        const existsResult = await pool.request()
            .input('moduleId', sql.VarChar(50), ModuleID)
            .query('SELECT COUNT(*) as count FROM Modules WHERE ModuleID = @moduleId');

        if (existsResult.recordset[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Module ID already exists'
            });
        }

        // Insert the new module
        await pool.request()
            .input('moduleId', sql.VarChar(50), ModuleID)
            .input('moduleNo', sql.Int, parseInt(ModuleNo))
            .input('description', sql.VarChar(255), Description || null)
            .query(`
                INSERT INTO Modules (ModuleID, ModuleNo, Description)
                VALUES (@moduleId, @moduleNo, @description)
            `);

        res.json({
            success: true,
            message: 'Module inserted successfully',
            moduleId: ModuleID
        });

    } catch (error) {
        console.error('Error inserting module:', error);

        if (error.number === 2627) { // Primary key violation
            res.status(400).json({
                success: false,
                message: 'Module ID already exists'
            });
        } else if (error.number === 515) { // Cannot insert null value
            res.status(400).json({
                success: false,
                message: 'Required field cannot be empty'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to insert module'
            });
        }
    }
});

// Update existing module
router.post('/update', async (req, res) => {
    try {
        const { originalModuleID, ModuleID, ModuleNo, Description } = req.body;

        // Validate required fields
        if (!originalModuleID || !ModuleID || !ModuleNo) {
            return res.status(400).json({
                success: false,
                message: 'ModuleID and ModuleNo are required'
            });
        }

        const pool = await poolPromise;

        // If ModuleID has changed, check if new ID already exists
        if (originalModuleID !== ModuleID) {
            const existsResult = await pool.request()
                .input('moduleId', sql.VarChar(50), ModuleID)
                .query('SELECT COUNT(*) as count FROM Modules WHERE ModuleID = @moduleId');

            if (existsResult.recordset[0].count > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Module ID already exists'
                });
            }
        }

        // Update the module
        const result = await pool.request()
            .input('originalModuleId', sql.VarChar(50), originalModuleID)
            .input('moduleId', sql.VarChar(50), ModuleID)
            .input('moduleNo', sql.Int, parseInt(ModuleNo))
            .input('description', sql.VarChar(255), Description || null)
            .query(`
                UPDATE Modules
                SET ModuleID = @moduleId, ModuleNo = @moduleNo, Description = @description
                WHERE ModuleID = @originalModuleId
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Module not found'
            });
        }

        res.json({
            success: true,
            message: 'Module updated successfully'
        });

    } catch (error) {
        console.error('Error updating module:', error);

        if (error.number === 2627) { // Primary key violation
            res.status(400).json({
                success: false,
                message: 'Module ID already exists'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to update module'
            });
        }
    }
});

// Delete module
router.post('/delete', async (req, res) => {
    try {
        const { ModuleID } = req.body;

        if (!ModuleID) {
            return res.status(400).json({
                success: false,
                message: 'ModuleID is required'
            });
        }

        const pool = await poolPromise;

        // Try to delete the module directly (following original ASP pattern)
        const result = await pool.request()
            .input('moduleId', sql.VarChar(50), ModuleID)
            .query('DELETE FROM Modules WHERE ModuleID = @moduleId');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: 'Module not found'
            });
        }

        res.json({
            success: true,
            message: 'Module deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting module:', error);

        // Handle specific database constraint errors
        if (error.number === 547) { // Foreign key constraint violation
            res.status(400).json({
                success: false,
                message: 'Unable to delete the record from Modules.'
            });
        } else if (error.number === 2627) { // Primary key violation (shouldn't happen on delete)
            res.status(400).json({
                success: false,
                message: 'Unable to delete the record from Modules.'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Unable to delete the record from Modules.'
            });
        }
    }
});

// Filter modules (POST endpoint)
router.post('/filter', async (req, res) => {
    try {
        const { ModuleID, ModuleNo, Description } = req.body;

        const pool = await poolPromise;
        let query = 'SELECT RTRIM(ModuleID) as ModuleID, ModuleNo, RTRIM(Description) as Description FROM Modules';
        const conditions = [];
        const request = pool.request();

        // Add filters if provided
        if (ModuleID && ModuleID.trim()) {
            conditions.push('ModuleID LIKE @ModuleID');
            request.input('ModuleID', sql.VarChar(50), `%${ModuleID.trim()}%`);
        }

        if (ModuleNo && ModuleNo.toString().trim()) {
            conditions.push('ModuleNo = @ModuleNo');
            request.input('ModuleNo', sql.Int, parseInt(ModuleNo));
        }

        if (Description && Description.trim()) {
            conditions.push('Description LIKE @Description');
            request.input('Description', sql.VarChar(255), `%${Description.trim()}%`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY ModuleID';

        const result = await request.query(query);
        
        res.json({
            success: true,
            data: result.recordset,
            message: `Found ${result.recordset.length} modules`
        });

    } catch (error) {
        console.error('Error filtering modules:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to filter modules',
            error: error.message
        });
    }
});

module.exports = router;
