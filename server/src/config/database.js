const sql = require('mssql');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const dbConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '12345',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'SMOKEKING',
    port: parseInt(process.env.DB_PORT || '1433'),
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true' || false,
        trustServerCertificate: true,
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

const pool = new sql.ConnectionPool(dbConfig);
const poolConnect = pool.connect();

const connectDB = async () => {
    try {
        await poolConnect;
        console.log('Connected to SQL Server database successfully');
        console.log(`Database: ${dbConfig.database} on ${dbConfig.server}`);

        // After successful connection, run seed data
        await seedSubscriptionPlans();
    } catch (error) {
        console.error('Database connection failed:', error);
        console.log('Please check your database connection settings in .env file or create one with the following variables:');
        console.log('DB_USER=sa');
        console.log('DB_PASSWORD=your_password');
        console.log('DB_SERVER=localhost');
        console.log('DB_DATABASE=SMOKEKING');
        console.log('DB_PORT=1433');
        process.exit(1);
    }
};

// Seed subscription plans
const seedSubscriptionPlans = async () => {
    try {
        // Seed subscription plans
        const subscriptionSeedPath = path.join(__dirname, '../database/subscription-seeds.sql');
        if (fs.existsSync(subscriptionSeedPath)) {
            const subscriptionSeedQuery = fs.readFileSync(subscriptionSeedPath, 'utf8');
            await pool.request().query(subscriptionSeedQuery);
            console.log('Subscription seed data processed');
        } else {
            console.log('Subscription seed file not found');
        }

        // Seed membership plans
        const membershipSeedPath = path.join(__dirname, '../database/membership-seeds.sql');
        if (fs.existsSync(membershipSeedPath)) {
            const membershipSeedQuery = fs.readFileSync(membershipSeedPath, 'utf8');
            await pool.request().query(membershipSeedQuery);
            console.log('Membership plans seed data processed');
        } else {
            console.log('Membership plans seed file not found');
        }
    } catch (err) {
        console.error('Error running seeds:', err);
    }
};

// Add this function to check if connection is valid
const checkConnection = async () => {
    try {
        await poolConnect;
        // Test query
        await pool.request().query('SELECT 1 as test');
        return true;
    } catch (error) {
        console.error('Database connection check failed:', error);
        return false;
    }
};

// Export the function
module.exports = {
    pool,
    connectDB,
    sql,
    checkConnection
}; 