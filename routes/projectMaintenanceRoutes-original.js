// projectMaintenanceRoutes.js - Backend routes for Project Maintenance functionality
const express = require('express');
const router = express.Router();
const sql = require('mssql');
const path = require('path');

// DB config (matches server.js config)
const config = {
    user: "sa",
    password: "ciglobal123",
    server: "localhost",
    database: "BalsaBldrDB",
    options: { trustServerCertificate: true }
};

// Helper function to get developer ID from request headers
function getDeveloperIdFromReq(req) {
    const logonUser = req.headers['logon-user'] || req.headers['x-logon-user'] ||
        req.headers['x-iisnode-logon_user'] || req.headers['remote_user'] ||
        req.headers['x-remote-user'];

    if (logonUser) {
        const backslashIndex = logonUser.indexOf('\\');
        return backslashIndex >= 0 ? logonUser.substring(backslashIndex + 1) : logonUser;
    }

    // For development/testing
    if (process.env.DEV_OVERRIDE_USER) {
        return process.env.DEV_OVERRIDE_USER;
    }

    return 'admin';  // Default fallback for testing
}

// Serve the main HTML page
router.get('/', (req, res) => {
    console.log('Project Maintenance main page requested');
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(path.join(__dirname, '../public/ProjectMaintenance.html'));
});

// Test route
router.get('/test', (req, res) => {
    console.log('Project Maintenance test route hit!');
    res.json({ message: 'Project maintenance routes working!' });
});

// Get lookup data (modules, project types, developers, etc.)
router.get('/lookup-data', async (req, res) => {
    console.log('Project Maintenance lookup data requested');
    try {
        const pool = await sql.connect(config);

        // Get all lookup data in parallel
        const [modulesResult, projectTypesResult, developersResult, ssLocationsResult] = await Promise.all([
            pool.request().query('SELECT * FROM Modules ORDER BY Description'),
            pool.request().query('SELECT * FROM ProjectTypes ORDER BY Description'),
            pool.request().query('SELECT * FROM Developers WHERE RTRIM(BuildRole) IN (\'Developer\', \'Project Manager\', \'Administrator\') ORDER BY DeveloperName'),
            pool.request().query('SELECT * FROM SourceSafeLocations ORDER BY SSLocation')
        ]);

        res.json({
            modules: modulesResult.recordset,
            projectTypes: projectTypesResult.recordset,
            developers: developersResult.recordset,
            ssLocations: ssLocationsResult.recordset
        });

    } catch (error) {
        console.error('Error fetching lookup data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Search projects with filters
router.get('/projects', async (req, res) => {
    console.log('Project Maintenance projects search requested', req.query);
    try {
        const { projectMask, descriptionMask, moduleNo, projectType } = req.query;
        const pool = await sql.connect(config);

        let whereConditions = [];
        let params = {};

        // Build WHERE clause based on filters
        if (moduleNo && moduleNo !== '0') {
            whereConditions.push('Projects.ModuleNo = @moduleNo');
            params.moduleNo = parseInt(moduleNo);
        }

        if (projectType && projectType !== 'All') {
            whereConditions.push('Projects.ProjectTypeID = @projectType');
            params.projectType = projectType;
        }

        if (projectMask) {
            let mask = projectMask;
            if (!mask.includes('%')) {
                mask = mask + '%';
            }
            whereConditions.push('ProjectFileName LIKE @projectMask');
            params.projectMask = mask;
        }

        if (descriptionMask) {
            let mask = descriptionMask;
            if (!mask.includes('%')) {
                mask = mask + '%';
            }
            whereConditions.push('Projects.Description LIKE @descriptionMask');
            params.descriptionMask = mask;
        }

        let whereClause = '';
        if (whereConditions.length > 0) {
            whereClause = ' WHERE ' + whereConditions.join(' AND ');
        }

        const query = `
            SELECT Projects.*, t1.DeveloperName, t2.Description as ProjectTypeDescription
            FROM Projects
            LEFT OUTER JOIN Developers t1 ON Projects.DeveloperID = t1.DeveloperID
            LEFT OUTER JOIN ProjectTypes t2 ON Projects.ProjectTypeID = t2.ProjectTypeID
            ${whereClause}
            ORDER BY ProjectFileName
        `;

        const request = pool.request();

        // Add parameters to request
        Object.keys(params).forEach(key => {
            request.input(key, params[key]);
        });

        const result = await request.query(query);

        res.json(result.recordset);

    } catch (error) {
        console.error('Error searching projects:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single project by ID
router.get('/project/:id', async (req, res) => {
    console.log('Project Maintenance single project requested', req.params.id);
    try {
        const projectId = parseInt(req.params.id);
        const pool = await sql.connect(config);

        const result = await pool.request()
            .input('projectId', sql.Int, projectId)
            .query('SELECT * FROM Projects WHERE ID = @projectId');

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json(result.recordset[0]);

    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new project
router.post('/project', async (req, res) => {
    console.log('Project Maintenance create project requested', req.body);
    try {
        const pool = await sql.connect(config);

        const {
            ProjectFileName, ProjectTypeID, ModuleNo, ProjectFldr, Description,
            ProjectManagerID, DeveloperID, FullPath, DestinationPath, BinPath,
            Obsolete, Recursive, Build, ConfigFile, CopyToDBBldr, SSLocation,
            Comments, DBBldrFldr
        } = req.body;

        const result = await pool.request()
            .input('ProjectFileName', sql.VarChar, ProjectFileName)
            .input('ProjectTypeID', sql.VarChar, ProjectTypeID)
            .input('ModuleNo', sql.Int, ModuleNo)
            .input('ProjectFldr', sql.VarChar, ProjectFldr)
            .input('Description', sql.VarChar, Description)
            .input('ProjectManagerID', sql.VarChar, ProjectManagerID)
            .input('DeveloperID', sql.VarChar, DeveloperID)
            .input('FullPath', sql.VarChar, FullPath)
            .input('DestinationPath', sql.VarChar, DestinationPath)
            .input('BinPath', sql.VarChar, BinPath)
            .input('Obsolete', sql.Bit, Obsolete)
            .input('Recursive', sql.Bit, Recursive)
            .input('Build', sql.Bit, Build)
            .input('ConfigFile', sql.Bit, ConfigFile)
            .input('CopyToDBBldr', sql.Bit, CopyToDBBldr)
            .input('SSLocation', sql.VarChar, SSLocation)
            .input('Comments', sql.VarChar, Comments)
            .input('DBBldrFldr', sql.VarChar, DBBldrFldr)
            .query(`
                INSERT INTO Projects (
                    ProjectFileName, ProjectTypeID, ModuleNo, ProjectFldr, Description,
                    ProjectManagerID, DeveloperID, FullPath, DestinationPath, BinPath,
                    Obsolete, Recursive, Build, ConfigFile, CopyToDBBldr, SSLocation,
                    Comments, DBBldrFldr
                ) OUTPUT INSERTED.ID VALUES (
                    @ProjectFileName, @ProjectTypeID, @ModuleNo, @ProjectFldr, @Description,
                    @ProjectManagerID, @DeveloperID, @FullPath, @DestinationPath, @BinPath,
                    @Obsolete, @Recursive, @Build, @ConfigFile, @CopyToDBBldr, @SSLocation,
                    @Comments, @DBBldrFldr
                )
            `);

        res.json({ id: result.recordset[0].ID, message: 'Project created successfully' });

    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update existing project
router.put('/project/:id', async (req, res) => {
    console.log('Project Maintenance update project requested', req.params.id, req.body);
    try {
        const projectId = parseInt(req.params.id);
        const pool = await sql.connect(config);

        const {
            ProjectFileName, ProjectTypeID, ModuleNo, ProjectFldr, Description,
            ProjectManagerID, DeveloperID, FullPath, DestinationPath, BinPath,
            Obsolete, Recursive, Build, ConfigFile, CopyToDBBldr, SSLocation,
            Comments, DBBldrFldr
        } = req.body;

        await pool.request()
            .input('projectId', sql.Int, projectId)
            .input('ProjectFileName', sql.VarChar, ProjectFileName)
            .input('ProjectTypeID', sql.VarChar, ProjectTypeID)
            .input('ModuleNo', sql.Int, ModuleNo)
            .input('ProjectFldr', sql.VarChar, ProjectFldr)
            .input('Description', sql.VarChar, Description)
            .input('ProjectManagerID', sql.VarChar, ProjectManagerID)
            .input('DeveloperID', sql.VarChar, DeveloperID)
            .input('FullPath', sql.VarChar, FullPath)
            .input('DestinationPath', sql.VarChar, DestinationPath)
            .input('BinPath', sql.VarChar, BinPath)
            .input('Obsolete', sql.Bit, Obsolete)
            .input('Recursive', sql.Bit, Recursive)
            .input('Build', sql.Bit, Build)
            .input('ConfigFile', sql.Bit, ConfigFile)
            .input('CopyToDBBldr', sql.Bit, CopyToDBBldr)
            .input('SSLocation', sql.VarChar, SSLocation)
            .input('Comments', sql.VarChar, Comments)
            .input('DBBldrFldr', sql.VarChar, DBBldrFldr)
            .query(`
                UPDATE Projects SET
                    ProjectFileName = @ProjectFileName,
                    ProjectTypeID = @ProjectTypeID,
                    ModuleNo = @ModuleNo,
                    ProjectFldr = @ProjectFldr,
                    Description = @Description,
                    ProjectManagerID = @ProjectManagerID,
                    DeveloperID = @DeveloperID,
                    FullPath = @FullPath,
                    DestinationPath = @DestinationPath,
                    BinPath = @BinPath,
                    Obsolete = @Obsolete,
                    Recursive = @Recursive,
                    Build = @Build,
                    ConfigFile = @ConfigFile,
                    CopyToDBBldr = @CopyToDBBldr,
                    SSLocation = @SSLocation,
                    Comments = @Comments,
                    DBBldrFldr = @DBBldrFldr
                WHERE ID = @projectId
            `);

        res.json({ message: 'Project updated successfully' });

    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete project
router.delete('/project/:id', async (req, res) => {
    console.log('Project Maintenance delete project requested', req.params.id);
    try {
        const projectId = parseInt(req.params.id);
        const pool = await sql.connect(config);

        await pool.request()
            .input('projectId', sql.Int, projectId)
            .query('DELETE FROM Projects WHERE ID = @projectId');

        res.json({ message: 'Project deleted successfully' });

    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
