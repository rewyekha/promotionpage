# Balsa Builder API Testing Guide

This folder contains comprehensive testing tools for all Balsa Builder API endpoints and components.

## 📁 Test Files

### 1. `postman-collection.json`
- **Complete Postman collection** with all API endpoints
- Organized into logical groups (Module Maintenance, Project Management, Build Management, etc.)
- Includes sample requests for all CRUD operations
- Pre-configured with test variables

### 2. `postman-environment.json`
- **Postman environment file** with pre-configured variables
- Sets up base URL, test IDs, and authentication headers
- Easy to modify for different environments (dev/staging/prod)

### 3. `api-test-script.js`
- **Standalone JavaScript test script** for comprehensive API testing
- Tests all major endpoints automatically
- Provides detailed success/failure reporting
- Can run in Node.js or browser console

### 4. `run-api-tests.ps1`
- **PowerShell script** to automate test execution
- Checks if server is running
- Executes the JavaScript test script
- Provides colored output and error handling

## 🚀 How to Use

### Option 1: Postman Testing (Recommended)

1. **Import Collection**:
   ```
   File → Import → Select postman-collection.json
   ```

2. **Import Environment**:
   ```
   Manage Environments → Import → Select postman-environment.json
   ```

3. **Set Environment**:
   - Select "Balsa Builder Environment" from the environment dropdown

4. **Run Tests**:
   - Individual requests: Click any request and hit "Send"
   - Full collection: Collection → Run → Configure and Run

### Option 2: Automated Script Testing

1. **Ensure Server is Running**:
   ```powershell
   node app.js
   ```

2. **Run PowerShell Script**:
   ```powershell
   .\run-api-tests.ps1
   ```

3. **Or Run JavaScript Directly** (if you have Node.js with fetch):
   ```bash
   node api-test-script.js
   ```

### Option 3: Browser Console Testing

1. **Open Browser** and navigate to `http://localhost:3000`
2. **Open Developer Console** (F12)
3. **Copy and paste** the contents of `api-test-script.js`
4. **Run tests**:
   ```javascript
   BalsaBuilderTests.runAllTests()
   ```

## 🧪 Test Coverage

The test suite covers all major components:

### Core Application
- ✅ Home page (Default)
- ✅ Contents page
- ✅ News page

### User Management
- ✅ User registration (GET/POST)
- ✅ User profile updates

### Module Maintenance
- ✅ Module CRUD operations (Create, Read, Update, Delete)
- ✅ Module filtering and search
- ✅ Module list views

### Project Maintenance
- ✅ Project CRUD operations
- ✅ Project lookup data
- ✅ Project filtering

### Build Management
- ✅ Build status monitoring
- ✅ Build scheduling
- ✅ Build details and grids

### Project Promotion
- ✅ Promotion workflows
- ✅ Promotion history tracking
- ✅ Promotion status updates

### Assignment Management
- ✅ Manager assignments
- ✅ Developer assignments
- ✅ Role assignments
- ✅ Project assignments

### Reporting
- ✅ What's in this build
- ✅ Obsolete projects
- ✅ Unassigned projects
- ✅ Promotion history

## 🔧 Configuration

### Environment Variables (postman-environment.json)
```json
{
  "baseUrl": "http://localhost:3000",
  "testModuleID": "TEST001", // change it as per your auth 
  "testProjectID": "1",
  "testDeveloperID": "testuser",  // change it as per your auth 
  "authHeader": "DOMAIN\\testuser"  // change it as per your auth 
}
```

### Test Data
- **Test Module ID**: TEST001 (created and deleted during tests)
- **Authentication**: Simulated with `x-iis-logon-user` header
- **Test User**: DOMAIN\testuser

## 📊 Expected Results

### Successful Tests
- Status codes: 200, 201, 302
- Response times: < 5000ms
- Valid HTML/JSON responses

### Test Categories
1. **Page Loading Tests**: Verify all HTML pages load correctly
2. **API Endpoint Tests**: Test all REST endpoints
3. **CRUD Operation Tests**: Test Create, Read, Update, Delete operations
4. **Authentication Tests**: Verify header-based authentication
5. **Error Handling Tests**: Test invalid requests and error responses

## 🐛 Troubleshooting

### Common Issues

1. **Server Not Running**:
   ```
   Error: Failed to fetch
   Solution: Start server with 'node app.js'
   ```

2. **Database Connection Issues**:
   ```
   Error: Database connection failed
   Solution: Check database configuration in db/db.js
   ```

3. **Authentication Errors**:
   ```
   Error: 401 Unauthorized
   Solution: Check x-iis-logon-user header is set
   ```

4. **Module Already Exists**:
   ```
   Error: Module ID already exists
   Solution: Change testModuleID in environment or clean up previous test data
   ```

### Debug Mode
Enable verbose logging by setting environment variable:
```powershell
$env:DEBUG = "true"
```

## 📈 Test Metrics

The test suite provides comprehensive metrics:
- Total tests executed
- Pass/fail counts
- Success rate percentage
- Response time statistics
- Failed test details

Example output:
```
📊 Test Summary:
Total Tests: 45
✅ Passed: 43
❌ Failed: 2
Success Rate: 95.56%
```

## 🔄 Continuous Integration

These tests can be integrated into CI/CD pipelines:

### GitHub Actions Example
```yaml
- name: Run API Tests
  run: |
    npm start &
    sleep 10
    node api-test-script.js
```

### Jenkins Example
```groovy
stage('API Tests') {
    steps {
        powershell './run-api-tests.ps1'
    }
}
```

## 📝 Adding New Tests

To add tests for new endpoints:

1. **Update Postman Collection**: Add new requests to appropriate folders
2. **Update Test Script**: Add new test cases to `api-test-script.js`
3. **Update Environment**: Add new variables if needed
4. **Update Documentation**: Document new test cases

## 🎯 Best Practices

1. **Test Isolation**: Each test should be independent
2. **Data Cleanup**: Clean up test data after tests complete
3. **Error Handling**: Test both success and failure scenarios
4. **Performance**: Monitor response times
5. **Documentation**: Keep test documentation updated

---

**Happy Testing! 🧪✨**