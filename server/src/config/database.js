const sql = require('mssql');
const dotenv = require('dotenv');

dotenv.config();

const dbConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '12345',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'SMOKEKING',
    port: parseInt(process.env.DB_PORT || '1433'),
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

const pool = new sql.ConnectionPool(dbConfig);

const connectDB = async () => {
    try {
        await pool.connect();
        console.log('Connected to SQL Server database successfully');
        console.log(`Database: ${dbConfig.database} on ${dbConfig.server}`);
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
};

module.exports = {
    pool,
    connectDB,
    sql
}; 