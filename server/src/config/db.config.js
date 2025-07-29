/**
 * Database configuration for SQL Server
 */
const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'AkoTamaki2002',
    server: process.env.DB_SERVER || 'NYANKO',
    database: process.env.DB_NAME || 'SMOKEKING',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

module.exports = config; 