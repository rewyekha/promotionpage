const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Comprehensive migration analysis data based on workspace examination
const migrationData = [
    {
        category: "Application Architecture",
        module: "Server Framework",
        legacyImplementation: "Classic ASP with VBScript on IIS with direct database connections in pages",
        modernImplementation: "Node.js with Express.js framework, middleware architecture, session management",
        enhancementDescription: "Scalable server architecture; middleware pattern; better separation of concerns; modern async/await patterns; improved performance and maintainability"
    },
    {
        category: "Authentication & Security",
        module: "Windows Authentication",
        legacyImplementation: "Request.ServerVariables('LOGON_USER') in ASP pages",
        modernImplementation: "Express middleware extracting Windows auth headers (req.headers['logon_user'], x-iisnode-logon_user)",
        enhancementDescription: "Centralized authentication middleware; session persistence; secure header extraction; development mode fallback; consistent user context across all routes"
    },
    {
        category: "Database Layer",
        module: "Database Connectivity",
        legacyImplementation: "Direct ADO connections in ASP pages with string concatenation SQL",
        modernImplementation: "Connection pooling with mssql npm package; parameterized queries; async/await patterns",
        enhancementDescription: "SQL injection protection; connection pooling for performance; modern async patterns; centralized database configuration; better error handling"
    },
    {
        category: "Module Maintenance",
        module: "Module CRUD Operations",
        legacyImplementation: "ModuleMaintenanceAction.asp with inline SQL INSERT/UPDATE/DELETE statements",
        modernImplementation: "RESTful API endpoints in moduleMaintenanceRoutes.js with proper HTTP methods (GET, POST, PUT, DELETE)",
        enhancementDescription: "RESTful API design; proper HTTP status codes; JSON responses; async error handling; separation of business logic from presentation"
    },
    {
        category: "Module Maintenance",
        module: "Module Listing",
        legacyImplementation: "Server-side HTML generation with ADO recordset loops in ModuleMaintenanceList.asp",
        modernImplementation: "API endpoint returning JSON data consumed by frontend JavaScript with dynamic DOM manipulation",
        enhancementDescription: "API-driven architecture; client-side rendering; improved user experience; real-time updates; better performance"
    },
    {
        category: "Module Maintenance",
        module: "Filtering & Search",
        legacyImplementation: "Session-based filtering with server-side state management in VBScript",
        modernImplementation: "Client-side filtering with applyFilter() function and API-based search endpoints",
        enhancementDescription: "Stateless server design; improved performance; real-time filtering; better user experience; no server session dependencies"
    },
    {
        category: "Project Maintenance",
        module: "Project CRUD Operations",
        legacyImplementation: "ProjectMaintenanceForm.asp with embedded SQL queries and VBScript logic",
        modernImplementation: "Modular Express routes in projectMaintenanceRoutes.js with proper REST endpoints",
        enhancementDescription: "Clean separation of concerns; RESTful API design; parameterized queries; async/await error handling; modular code structure"
    },
    {
        category: "Project Maintenance",
        module: "Project Data Lookup",
        legacyImplementation: "Multiple database calls embedded in ASP pages for dropdowns and lists",
        modernImplementation: "Centralized /lookup-data endpoint providing all reference data in single API call",
        enhancementDescription: "Reduced database load; single API call for multiple lookups; cached reference data; improved performance; better frontend experience"
    },
    {
        category: "Project Maintenance",
        module: "Project Filtering",
        legacyImplementation: "Dynamic SQL WHERE clause building with string concatenation (AppendWhereClause function)",
        modernImplementation: "Safe dynamic filter construction using parameterized queries and Express route handlers",
        enhancementDescription: "SQL injection prevention; safer filter logic; maintainable code; proper parameter binding; error handling"
    },
    {
        category: "User Management",
        module: "User Registration",
        legacyImplementation: "UserRegistration.asp with inline form validation and direct database operations",
        modernImplementation: "Dedicated user routes with client-side and server-side validation using Express validators",
        enhancementDescription: "Dual validation (client/server); modern form handling; proper error responses; session management; secure user operations"
    },
    {
        category: "User Management", 
        module: "User Authentication",
        legacyImplementation: "Manual session handling and password validation in VBScript",
        modernImplementation: "Express-session middleware with persistent session store and secure cookie handling",
        enhancementDescription: "Secure session management; configurable session options; proper cookie security; extensible authentication framework"
    },
    {
        category: "Frontend Architecture",
        module: "HTML Generation",
        legacyImplementation: "Server-side HTML generation mixed with VBScript logic in ASP pages",
        modernImplementation: "Clean HTML templates with client-side JavaScript for dynamic content",
        enhancementDescription: "Separation of presentation and logic; improved maintainability; modern web standards; better performance; enhanced user interaction"
    },
    {
        category: "Frontend Architecture",
        module: "Client-Side Scripting",
        legacyImplementation: "Limited client-side interaction with basic JavaScript",
        modernImplementation: "Modern ES6+ JavaScript with fetch API, async/await, and DOM manipulation",
        enhancementDescription: "Modern JavaScript features; improved user experience; real-time updates; better error handling; responsive interface"
    },
    {
        category: "API Design",
        module: "Data Exchange",
        legacyImplementation: "Form posts and page reloads for all user interactions",
        modernImplementation: "RESTful JSON APIs with proper HTTP methods and status codes",
        enhancementDescription: "Modern API standards; JSON data format; proper HTTP semantics; better integration capabilities; improved performance"
    },
    {
        category: "Error Handling",
        module: "Error Management",
        legacyImplementation: "VBScript 'On Error Resume Next' with basic error suppression",
        modernImplementation: "Structured try/catch blocks with proper error responses and logging",
        enhancementDescription: "Proper error propagation; user-friendly error messages; detailed error logging; graceful error recovery; better debugging"
    },
    {
        category: "Code Organization",
        module: "File Structure",
        legacyImplementation: "Monolithic ASP pages with mixed HTML, VBScript, and SQL",
        modernImplementation: "Modular Express routes, separate database layer, clean HTML templates",
        enhancementDescription: "Clear separation of concerns; modular architecture; reusable components; maintainable codebase; better testing capabilities"
    },
    {
        category: "Development Environment",
        module: "Package Management",
        legacyImplementation: "No formal dependency management; manual script inclusion",
        modernImplementation: "NPM package management with package.json and dependency tracking",
        enhancementDescription: "Formal dependency management; version control for packages; easy deployment; reproducible builds; security updates"
    },
    {
        category: "Testing Infrastructure",
        module: "API Testing",
        legacyImplementation: "Manual testing through web interface",
        modernImplementation: "Comprehensive Postman collections and automated test scripts",
        enhancementDescription: "Automated testing capabilities; comprehensive test coverage; CI/CD ready; regression testing; API documentation through tests"
    },
    {
        category: "Deployment & Configuration",
        module: "Server Configuration",
        legacyImplementation: "IIS with ASP.NET configuration for classic ASP",
        modernImplementation: "IIS with iisnode for Node.js applications, web.config for Node.js optimization",
        enhancementDescription: "Modern runtime environment; better performance; scalability options; improved monitoring; configuration management"
    },
    {
        category: "Session Management",
        module: "User State Management",
        legacyImplementation: "Server-side session state with ASP Session object",
        modernImplementation: "Express-session with configurable session store and security options",
        enhancementDescription: "Secure session handling; configurable storage options; session security features; better session lifecycle management"
    },
    {
        category: "Build Management",
        module: "Build Status Views",
        legacyImplementation: "Multiple ASP pages for build status (BuildStatus.asp, BuildStatusGrid.asp, BuildStatusToolBar.asp)",
        modernImplementation: "Modular Express routes (BuildStatus.js, BuildStatusGrid.js, BuildStatusToolBar.js) with API endpoints",
        enhancementDescription: "Component-based architecture; reusable modules; API-driven data; improved maintainability; better user experience"
    },
    {
        category: "Build Management",
        module: "Build Details & History",
        legacyImplementation: "Server-side generated build details and promotion history pages",
        modernImplementation: "API endpoints serving JSON data for dynamic frontend rendering",
        enhancementDescription: "Real-time data updates; improved performance; better user interaction; mobile-friendly interface; enhanced search capabilities"
    },
    {
        category: "Developer Management",
        module: "Developer Assignment",
        legacyImplementation: "DeveloperAssignment.asp with inline CRUD operations",
        modernImplementation: "Dedicated developer assignment routes with proper API design",
        enhancementDescription: "RESTful operations; better data validation; improved user interface; audit trail capabilities; role-based access control"
    },
    {
        category: "Project Management",
        module: "Project Promotion",
        legacyImplementation: "ProjectPromotion.asp with server-side processing",
        modernImplementation: "Modular promotion workflows with API-driven processes",
        enhancementDescription: "Workflow automation; better tracking; improved user experience; audit capabilities; notification systems"
    },
    {
        category: "Code Quality",
        module: "Code Standards",
        legacyImplementation: "Mixed coding styles across ASP pages; no formal standards",
        modernImplementation: "Consistent JavaScript ES6+ standards; modular code organization; proper error handling",
        enhancementDescription: "Improved code readability; consistent patterns; better maintainability; easier onboarding; reduced technical debt"
    },
    {
        category: "Security Enhancements",
        module: "Data Protection",
        legacyImplementation: "Direct database access from client-facing pages",
        modernImplementation: "Backend API layer protecting database; input validation; parameterized queries",
        enhancementDescription: "Enhanced security posture; SQL injection prevention; data access control; audit trail; input sanitization"
    },
    {
        category: "Performance Optimization",
        module: "Data Loading",
        legacyImplementation: "Synchronous page loads with complete page refreshes",
        modernImplementation: "Asynchronous data loading with AJAX/fetch; progressive loading",
        enhancementDescription: "Improved page load times; better user experience; reduced server load; progressive enhancement; mobile optimization"
    },
    {
        category: "Configuration Management",
        module: "Environment Configuration",
        legacyImplementation: "Hardcoded configuration values in ASP pages",
        modernImplementation: "Environment variables and configuration files; environment-specific settings",
        enhancementDescription: "Environment-specific deployments; secure configuration management; easier maintenance; deployment flexibility"
    }
];

// Additional metadata for the report
const reportMetadata = {
    projectName: "Balsa Builder Application",
    migrationDate: new Date().toISOString().split('T')[0],
    sourceFramework: "Classic ASP with VBScript",
    targetFramework: "Node.js with Express.js",
    totalComponents: migrationData.length,
    majorCategories: [...new Set(migrationData.map(item => item.category))].length,
    databaseEngine: "Microsoft SQL Server",
    authenticationMethod: "Windows Authentication",
    deploymentTarget: "IIS with iisnode"
};

// Create summary statistics
const categoryStats = migrationData.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
}, {});

// Generate the Excel workbook
function generateMigrationReport() {
    console.log('Generating comprehensive migration report...');
    
    const workbook = XLSX.utils.book_new();
    
    // 1. Executive Summary Sheet
    const summaryData = [
        ['Balsa Builder - ASP to Node.js Migration Report'],
        ['Generated on:', reportMetadata.migrationDate],
        [''],
        ['Migration Overview'],
        ['Source Framework:', reportMetadata.sourceFramework],
        ['Target Framework:', reportMetadata.targetFramework],
        ['Database Engine:', reportMetadata.databaseEngine],
        ['Authentication:', reportMetadata.authenticationMethod],
        ['Deployment Target:', reportMetadata.deploymentTarget],
        [''],
        ['Migration Statistics'],
        ['Total Components Migrated:', reportMetadata.totalComponents],
        ['Major Categories:', reportMetadata.majorCategories],
        [''],
        ['Components by Category'],
        ...Object.entries(categoryStats).map(([category, count]) => [category, count])
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    // Style the summary sheet
    summarySheet['A1'] = { v: summaryData[0][0], s: { font: { bold: true, sz: 16 } } };
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary');
    
    // 2. Detailed Migration Analysis Sheet
    const migrationHeaders = [
        'Category',
        'Module/Feature',
        'Legacy Implementation (ASP/VBScript)',
        'Modern Implementation (Node.js/Express/JS)',
        'Enhancement/Benefit Description'
    ];
    
    const migrationSheetData = [
        migrationHeaders,
        ...migrationData.map(item => [
            item.category,
            item.module,
            item.legacyImplementation,
            item.modernImplementation,
            item.enhancementDescription
        ])
    ];
    
    const migrationSheet = XLSX.utils.aoa_to_sheet(migrationSheetData);
    
    // Set column widths
    migrationSheet['!cols'] = [
        { wch: 25 }, // Category
        { wch: 30 }, // Module/Feature
        { wch: 50 }, // Legacy Implementation
        { wch: 50 }, // Modern Implementation
        { wch: 60 }  // Enhancement Description
    ];
    
    XLSX.utils.book_append_sheet(workbook, migrationSheet, 'Detailed Migration Analysis');
    
    // 3. Technical Architecture Comparison Sheet
    const architectureComparison = [
        ['Aspect', 'Legacy (ASP/VBScript)', 'Modern (Node.js/Express)', 'Benefits'],
        ['Application Server', 'IIS with Classic ASP', 'IIS with iisnode + Node.js/Express', 'Better performance, modern runtime'],
        ['Database Access', 'ADO with direct connections', 'mssql npm package with connection pooling', 'Better performance, security, scalability'],
        ['Session Management', 'ASP Session object', 'express-session middleware', 'More secure, configurable, scalable'],
        ['Authentication', 'LOGON_USER server variable', 'Express middleware with header extraction', 'Centralized, testable, maintainable'],
        ['Error Handling', 'On Error Resume Next', 'try/catch with structured responses', 'Better debugging, user experience'],
        ['API Design', 'Form posts and page reloads', 'RESTful JSON APIs', 'Modern standards, better integration'],
        ['Frontend', 'Server-side HTML generation', 'Client-side rendering with APIs', 'Better user experience, performance'],
        ['Code Organization', 'Monolithic ASP pages', 'Modular Express routes', 'Maintainable, testable, reusable'],
        ['Development Tools', 'Manual testing', 'NPM, Postman, automated tests', 'Better development workflow'],
        ['Deployment', 'Manual file copying', 'Package-based deployment', 'Reproducible, version controlled']
    ];
    
    const architectureSheet = XLSX.utils.aoa_to_sheet(architectureComparison);
    architectureSheet['!cols'] = [
        { wch: 20 }, // Aspect
        { wch: 35 }, // Legacy
        { wch: 35 }, // Modern
        { wch: 40 }  // Benefits
    ];
    
    XLSX.utils.book_append_sheet(workbook, architectureSheet, 'Architecture Comparison');
    
    // 4. Key Benefits Summary Sheet
    const keyBenefits = [
        ['Key Migration Benefits'],
        [''],
        ['Security Improvements'],
        ['• SQL injection prevention through parameterized queries'],
        ['• Secure session management with configurable options'],
        ['• Input validation on both client and server sides'],
        ['• Database credentials not exposed to client-side code'],
        [''],
        ['Performance Enhancements'],
        ['• Connection pooling for database operations'],
        ['• Asynchronous operations with async/await patterns'],
        ['• Client-side rendering reducing server load'],
        ['• Progressive loading and real-time updates'],
        [''],
        ['Maintainability Improvements'],
        ['• Modular code architecture with clear separation of concerns'],
        ['• Consistent coding standards and modern JavaScript features'],
        ['• Comprehensive testing infrastructure with Postman collections'],
        ['• Proper error handling and logging mechanisms'],
        [''],
        ['User Experience Enhancements'],
        ['• Real-time data updates without page reloads'],
        ['• Improved filtering and search capabilities'],
        ['• Mobile-friendly responsive interface'],
        ['• Better error messages and user feedback'],
        [''],
        ['Development Process Improvements'],
        ['• NPM package management for dependencies'],
        ['• Automated testing capabilities'],
        ['• Version-controlled deployments'],
        ['• Better debugging and monitoring capabilities']
    ];
    
    const benefitsSheet = XLSX.utils.aoa_to_sheet(keyBenefits.map(item => [item]));
    benefitsSheet['!cols'] = [{ wch: 80 }];
    
    XLSX.utils.book_append_sheet(workbook, benefitsSheet, 'Key Benefits');
    
    // 5. Implementation Timeline & Dependencies
    const implementationData = [
        ['Implementation Phase', 'Components', 'Dependencies', 'Status'],
        ['Phase 1: Core Infrastructure', 'Express server, Database layer, Authentication', 'Node.js, NPM packages', 'Completed'],
        ['Phase 2: Module Maintenance', 'Module CRUD, Filtering, List views', 'Core infrastructure', 'Completed'],
        ['Phase 3: Project Maintenance', 'Project CRUD, Lookup data, Filtering', 'Core infrastructure', 'Completed'],
        ['Phase 4: User Management', 'Registration, Authentication, Profiles', 'Session management', 'Completed'],
        ['Phase 5: Build Management', 'Build status, History, Promotion workflows', 'All previous phases', 'Completed'],
        ['Phase 6: Testing & Documentation', 'Postman collections, API tests, Documentation', 'All functionality', 'Completed'],
        ['Phase 7: Deployment & Production', 'IIS configuration, Production deployment', 'All phases', 'In Progress']
    ];
    
    const implementationSheet = XLSX.utils.aoa_to_sheet(implementationData);
    implementationSheet['!cols'] = [
        { wch: 30 }, // Phase
        { wch: 40 }, // Components
        { wch: 30 }, // Dependencies
        { wch: 15 }  // Status
    ];
    
    XLSX.utils.book_append_sheet(workbook, implementationSheet, 'Implementation Timeline');
    
    // Write the file
    const fileName = `Balsa_Builder_Migration_Report_${reportMetadata.migrationDate}.xlsx`;
    const filePath = path.join(__dirname, fileName);
    
    XLSX.writeFile(workbook, filePath);
    
    console.log(`\n✅ Migration report generated successfully!`);
    console.log(`📁 File: ${fileName}`);
    console.log(`📍 Location: ${filePath}`);
    console.log(`\n📊 Report Summary:`);
    console.log(`   • Total components analyzed: ${reportMetadata.totalComponents}`);
    console.log(`   • Categories covered: ${reportMetadata.majorCategories}`);
    console.log(`   • Worksheets created: 5`);
    console.log(`\n🔍 Report includes:`);
    console.log(`   • Executive Summary`);
    console.log(`   • Detailed Migration Analysis`);
    console.log(`   • Architecture Comparison`);
    console.log(`   • Key Benefits Summary`);
    console.log(`   • Implementation Timeline`);
    
    return filePath;
}

// Run the report generation
if (require.main === module) {
    generateMigrationReport();
}

module.exports = { generateMigrationReport, migrationData, reportMetadata };