const sql = require('mssql');

// Database configuration
const config = {
    user: 'sa',
    password: '12345',
    server: 'localhost',
    database: 'SMOKEKING',
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
};

async function clearTestPayments() {
    try {
        console.log('🔗 Connecting to database...');
        const pool = await sql.connect(config);

        console.log('🗑️ Clearing test payment data...');

        // Clear PaymentConfirmations first (foreign key constraint)
        await pool.request().query(`DELETE FROM PaymentConfirmations`);
        console.log('✅ Cleared PaymentConfirmations');

        // Clear UserMemberships for test users
        await pool.request().query(`DELETE FROM UserMemberships WHERE UserID IN (2, 3, 4)`);
        console.log('✅ Cleared UserMemberships for test users');

        // Clear Payments for test users  
        await pool.request().query(`DELETE FROM Payments WHERE UserID IN (2, 3, 4)`);
        console.log('✅ Cleared Payments for test users');

        // Reset user roles back to guest (except admin and coach)
        await pool.request().query(`
            UPDATE Users 
            SET Role = 'guest' 
            WHERE UserID IN (2, 3, 4) AND Role NOT IN ('admin', 'coach')
        `);
        console.log('✅ Reset user roles to guest (except admin and coach)');

        // Clear notifications
        await pool.request().query(`DELETE FROM Notifications WHERE UserID IN (2, 3, 4)`);
        console.log('✅ Cleared test notifications');

        console.log('🎉 Test data cleared successfully! Ready for testing new flow.');

        // Close connection
        await pool.close();
        console.log('🔌 Database connection closed');

    } catch (error) {
        console.error('❌ Error clearing test data:', error);
        process.exit(1);
    }
}

// Run the function
clearTestPayments(); 