const sql = require("mssql");

// configure your db connection
/**const config = {
  user: "sa",
  password: "ciglobal123",
  server: "localhost",
  database: "BalsaBldrDB",
  options: {
    encrypt: false,
    trustServerCertificate: true,
    //instanceName: "SQLSERVER"
  }
}; **/

const config = {
  user: process.env.DB_USER || "sage500",
  password: process.env.DB_PASSWORD || "CIglobal@123",
  server: process.env.DB_SERVER || "promotionpage.database.windows.net",
  database: process.env.DB_DATABASE || "BalsaBldrDB",
  options: {
    encrypt: process.env.NODE_ENV === 'production' ? true : false,
    trustServerCertificate: process.env.NODE_ENV !== 'production' ? true : false,
    //instanceName: "SQLSERVER"
  }
};
// Create connection pool promise
const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('Connected to SQL Server');
    return pool;
  })
  .catch(err => {
    console.log('Database Connection Failed! Bad Config: ', err);
    return null;
  });

// Generic query function
async function query(sqlQuery , params = {}) {
  try {
    const pool = await sql.connect(config);
    const request = pool.request();

    // Add parameters to the request
    for (const key in params) {
      request.input(key, params[key]);
    }

    const result = await request.query(sqlQuery);
    return result.recordset;
  } catch (err) {
    console.error("Database error:", err);
    return [];
  }
}

// Specific helper: get developer by ID
async function getDeveloperById(devId) {
  try {
    const pool = await sql.connect(config);
    const result = await pool
      .request()
      .input("DeveloperID", sql.VarChar, devId)
      .query("SELECT * FROM Developers WHERE DeveloperID = @DeveloperID");

    return result.recordset[0]; // return first row
  } catch (err) {
    console.error("Error fetching developer:", err);
    return null;
  }
}

module.exports = { query, getDeveloperById, sql, poolPromise };
