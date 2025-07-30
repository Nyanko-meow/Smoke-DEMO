try {
    // Load environment variables
    require('dotenv').config({ path: '../../.env' });
} catch (error) {
    console.log('No .env file found, using default configuration');
}

const sql = require('mssql');

// Database configuration with fallbacks
const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '12345',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'SMOKEKING',
    options: {
        trustServerCertificate: true,
        enableArithAbort: true,
        encrypt: false
    }
};

// Log configuration (without password)
console.log('Using connection config:', {
    user: config.user,
    server: config.server,
    database: config.database
});

async function getUsersData() {
    try {
        // Connect to the database
        await sql.connect(config);

        // Execute query
        const result = await sql.query`SELECT UserID, Email, FirstName, LastName, Role, IsActive FROM Users`;

        // Display results
        console.log('Users data:');
        console.table(result.recordset);

        // Close the connection
        await sql.close();
    } catch (err) {
        console.error('Database error:', err);
        // Ensure the connection is closed in case of error
        if (sql.connected) await sql.close();
    }
}

// Run the function
getUsersData(); 