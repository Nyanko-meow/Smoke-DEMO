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

async function insertMembershipPlans() {
    try {
        // Connect to the database
        await sql.connect(config);

        // Clear existing plans if any
        await sql.query`DELETE FROM MembershipPlans`;

        // Reset identity column
        await sql.query`DBCC CHECKIDENT ('MembershipPlans', RESEED, 0)`;

        // Insert membership plans
        await sql.query`
            INSERT INTO MembershipPlans (Name, Description, Price, Duration, Features)
            VALUES 
            ('Basic Plan', 'Get started on your smoke-free journey with our basic plan.', 99.00, 30, N'Progress tracking
Basic quitting tips
Community access'),
            
            ('Premium Plan', 'Enhanced support for your smoke-free journey.', 199.00, 60, N'Progress tracking
Advanced analytics
Premium quitting strategies
Community access
Weekly motivation'),
            
            ('Pro Plan', 'Maximum support to ensure your success.', 299.00, 90, N'Progress tracking
Advanced analytics
Pro quitting strategies
Community access
Daily motivation
Personalized coaching
Health improvement dashboard')
        `;

        // Verify plans were inserted
        const result = await sql.query`SELECT * FROM MembershipPlans`;
        console.log('Membership plans inserted:');
        console.table(result.recordset);

        // Close the connection
        await sql.close();

        console.log('Membership plans inserted successfully!');
    } catch (err) {
        console.error('Database error:', err);
        // Ensure the connection is closed in case of error
        if (sql.connected) await sql.close();
    }
}

// Run the function
insertMembershipPlans(); 