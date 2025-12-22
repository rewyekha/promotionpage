const express = require("express");
const path = require("path");
const session = require("express-session");
require('dotenv').config(); // Load environment variables
const app = express();
const routes = require("./routes/Default");
const contentsRoute = require("./routes/contents");
const builderIntroRoutes = require("./routes/builderIntro");
const buildScheduleRoute = require("./routes/buildSchedule");
const projectPromotionRoutes = require("./routes/projectPromotion");
const projectPromotionToolBarRoutes = require("./routes/projectPromotionToolBar");
const projectPromotionGridRoutes = require("./routes/projectPromotionGrid");
const BuildStatusRouter = require("./routes/BuildStatus");
const BuildStatusToolBarRouter = require("./routes/BuildStatusToolBar");
const BuildStatusGridRouter = require("./routes/BuildStatusGrid");
const BuildStatusDetailRouter = require("./routes/buildDetails");
const WhatsInThisBuildRouter = require("./routes/WhatsInThisBuild");
const WhatsInThisBuildToolbarRouter = require("./routes/WhatsInThisBuildToolbar");
const WhatsInThisBuildGridRouter = require("./routes/WhatsInThisBuildGrid");
const ObsoleteProjectsRouter = require("./routes/ObsoleteProjects");
const UnassignedProjectsRouter = require("./routes/UnassignedProjects");
const ManagerAssignmentRouter = require("./routes/ManagerAssignment");
const ManagerAssignmentToolbarRouter = require("./routes/ManagerAssignmentToolbar");
const ManagerAssignmentGridRouter = require("./routes/ManagerAssignmentGrid");
const PromotionHistoryRouter = require("./routes/PromotionHistory");
const PromotionHistoryToolbarRouter = require("./routes/PromotionHistoryToolBar");  
const PromotionHistoryGridRouter = require("./routes/PromotionHistoryGrid");
const DeveloperAssignmentRouter = require("./routes/DeveloperAssignment");
const DeveloperAssignmentToolBarRouter = require("./routes/DeveloperAssignmentToolBar");
const DeveloperAssignmentGridRouter = require("./routes/DeveloperAssignmentGrid");
const RoleAssignmentRouter = require("./routes/RoleAssignment");
const RoleAssignmentToolBarRouter = require("./routes/RoleAssignmentToolBar");
const RoleAssignmentGridRouter = require("./routes/RoleAssignmentGrid");
const projectMaintenanceRoutes = require("./routes/projectMaintenanceRoutes");
const moduleMaintenanceRoutes = require("./routes/moduleMaintenanceRoutes");
// const ProjectMaintenanceToolBarRouter = require("./routes/ProjectMaintenanceToolBar");
// const ProjectMaintenanceGridRouter = require("./routes/ProjectMaintenanceGrid");



const bodyParser = require("body-parser");
const userRouter = require("./routes/user");

// Session middleware for user state management
app.use(session({
  secret: 'balsa-build-session-secret-2024',
  resave: true,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true if using HTTPS
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true
  },
  name: 'balsa.session.id' // Custom session name
}));

// Middleware
// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Cache-busting middleware for development
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
  }
  next();
});

// Windows Authentication Middleware (EXACT REPLICA of original ASP LOGON_USER pattern)
app.use(async (req, res, next) => {
  console.log('=== Windows Authentication Debug (ASP Pattern) ===');
  console.log(`Request from IP: ${req.ip}, User-Agent: ${req.get('User-Agent')}`);
  console.log('All auth-related headers:', Object.keys(req.headers).filter(h => 
    h.toLowerCase().includes('user') || 
    h.toLowerCase().includes('auth') || 
    h.toLowerCase().includes('logon')
  ));
  
  // Log IIS server variables
  console.log('IIS Server Variables:', {
    'x-iisnode-logon_user': req.headers['x-iisnode-logon_user'],
    'x-iinode-remote_user': req.headers['x-iinode-remote_user'],
    'x-iisnode-auth_user': req.headers['x-iisnode-auth_user'],
    'x-iisnode-remote_user': req.headers['x-iisnode-remote_user'],
    'logon_user': req.headers['logon_user'],
    'remote_user': req.headers['remote_user'],
    'auth_user': req.headers['auth_user'],
    'auth_type': req.headers['auth_type']
  });

  // Extract LOGON_USER exactly like original ASP: Request.ServerVariables("LOGON_USER")
  let logonUser = req.headers['logon_user'] ||           // Direct IIS server variable
    req.headers['auth_user'] ||                          // Alternative auth header
    req.headers['remote_user'] ||                        // Standard auth header
    req.headers['x-iisnode-logon_user'] ||               // iisnode promoted header
    req.headers['x-iisnode-auth_user'] ||                // Alternative iisnode header
    req.headers['x-iisnode-remote_user'];                // Another iisnode header

  console.log('Raw LOGON_USER value:', logonUser);

  // If no Windows Auth headers and running direct Node.js (development)
  if (!logonUser && (req.hostname === 'localhost' || req.hostname === '127.0.0.1')) {
    // For direct Node.js access, simulate Windows user (development only)
    logonUser = (process.env.USERDOMAIN || 'DOMAIN') + '\\' + (process.env.USERNAME || 'testuser');
    console.log('Development mode - simulated LOGON_USER:', logonUser);
  }

  if (logonUser) {
    // Extract username exactly like original ASP code:
    // sDeveloperID = Mid(Request.ServerVariables("LOGON_USER"),Instr(Request.ServerVariables("LOGON_USER"),"\")+1)
    let sDeveloperID = logonUser;
    if (logonUser.includes('\\')) {
      const backslashPos = logonUser.indexOf('\\');
      sDeveloperID = logonUser.substring(backslashPos + 1); // Same as Mid() in ASP
    }

    req.user = {
      fullUser: logonUser,        // Full domain\username
      developerId: sDeveloperID,  // Username only (same variable name as ASP)
      domain: logonUser.includes('\\') ? logonUser.split('\\')[0] : '',
      authenticated: true,
      sessionId: req.sessionID    // Add session tracking
    };

    // Store user in session for persistence across requests
    req.session.user = req.user;
    
    console.log('Windows Authentication SUCCESS:', req.user);
  } else {
    // Check if user exists in session (for subsequent requests)
    if (req.session && req.session.user) {
      req.user = req.session.user;
      console.log('User restored from session:', req.user);
    } else {
      console.log('Windows Authentication FAILED - No LOGON_USER found and no session');
      req.user = { authenticated: false };
      
      // For remote access issues, provide more detailed error
      if (req.ip !== '127.0.0.1' && req.ip !== '::1') {
        console.log('REMOTE ACCESS DETECTED - This may require additional IIS configuration');
        console.log('Remote IP:', req.ip);
        console.log('Ensure Windows Authentication is enabled in IIS and trusted domains are configured');
      }
    }
  }

  next();
});

// Routes (if you want more control)
app.use("/", routes);
app.use("/", contentsRoute);
app.use("/", projectPromotionRoutes);
app.use("/", projectPromotionToolBarRoutes);
app.use("/", projectPromotionGridRoutes);
app.use("/", builderIntroRoutes);
app.use("/", buildScheduleRoute);
app.use("/", userRouter);
app.use("/", BuildStatusRouter);
app.use("/", BuildStatusToolBarRouter);
app.use("/", BuildStatusGridRouter);
app.use("/", BuildStatusDetailRouter);
app.use("/", WhatsInThisBuildRouter);
app.use("/", WhatsInThisBuildToolbarRouter);
app.use("/", WhatsInThisBuildGridRouter);
app.use("/", ObsoleteProjectsRouter);
app.use("/", UnassignedProjectsRouter);
app.use("/", ManagerAssignmentRouter);
app.use("/", ManagerAssignmentToolbarRouter);
app.use("/", ManagerAssignmentGridRouter);
app.use("/", PromotionHistoryRouter);
app.use("/", PromotionHistoryToolbarRouter);
app.use("/", PromotionHistoryGridRouter);
app.use("/", DeveloperAssignmentRouter);
app.use("/", DeveloperAssignmentToolBarRouter);
app.use("/", DeveloperAssignmentGridRouter);
app.use("/", RoleAssignmentRouter);
app.use("/", RoleAssignmentToolBarRouter);
app.use("/", RoleAssignmentGridRouter);
app.use("/project-maintenance", projectMaintenanceRoutes);
app.use("/projectmaintenance", projectMaintenanceRoutes);
app.use("/module-maintenance", moduleMaintenanceRoutes);
app.use("/modulemaintenance", moduleMaintenanceRoutes);
app.use("/api/module-maintenance", moduleMaintenanceRoutes);
// app.use("/", ProjectMaintenanceToolBarRouter);
// app.use("/", ProjectMaintenanceGridRouter);




// Serve static files from /public
app.use(express.static(path.join(__dirname, "public")));
app.use('/StyleSheets', express.static(path.join(__dirname, 'StyleSheets')));
app.use('/Images', express.static(path.join(__dirname, 'Images')));

// ------------------ Start server ------------------
const PORT = process.env.PORT || 3000;

console.log('About to start server...');
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Server listening at http://localhost:${PORT}`);
});

server.on('error', (err) => {
    console.error('Server error:', err);
});

// Open the default browser to the app's URL
// Comment out the auto-open for now
// open(`http://localhost:${PORT}`);
