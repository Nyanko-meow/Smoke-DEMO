const sql = require('mssql');
require('dotenv').config();

// Use the same database configuration as the main application
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
};

async function clearLoginAttempts() {
    let pool;

    try {
        console.log('🔍 Connecting to database...');
        console.log('Database config:', {
            server: dbConfig.server,
            database: dbConfig.database,
            user: dbConfig.user,
            port: dbConfig.port
        });

        pool = await sql.connect(dbConfig);
        console.log('✅ Connected to database');

        // Check current login attempts
        console.log('\n📊 Checking current login attempts...');
        const checkResult = await pool.request().query(`
            SELECT 
                Email,
                IPAddress,
                COUNT(*) as TotalAttempts,
                SUM(CASE WHEN Success = 0 THEN 1 ELSE 0 END) as FailedAttempts,
                MAX(AttemptTime) as LastAttempt
            FROM LoginAttempts 
            GROUP BY Email, IPAddress
            ORDER BY FailedAttempts DESC
        `);

        if (checkResult.recordset.length > 0) {
            console.log('📋 Current login attempts:');
            checkResult.recordset.forEach(attempt => {
                console.log(`   Email: ${attempt.Email || 'N/A'}, IP: ${attempt.IPAddress}, Failed: ${attempt.FailedAttempts}/${attempt.TotalAttempts}, Last: ${attempt.LastAttempt}`);
            });
        } else {
            console.log('✅ No login attempts found in database');
        }

        // Clear all login attempts
        console.log('\n🧹 Clearing all login attempts...');
        const deleteResult = await pool.request().query('DELETE FROM LoginAttempts');
        console.log(`✅ Cleared ${deleteResult.rowsAffected[0]} login attempt records`);

        // Verify cleanup
        console.log('\n✅ Verifying cleanup...');
        const verifyResult = await pool.request().query('SELECT COUNT(*) as RemainingCount FROM LoginAttempts');
        const remainingCount = verifyResult.recordset[0].RemainingCount;

        if (remainingCount === 0) {
            console.log('✅ All login attempts successfully cleared!');
            console.log('✅ Rate limiting has been disabled - users can now login without restrictions');
        } else {
            console.log(`⚠️  Warning: ${remainingCount} login attempts still remain`);
        }

        console.log('\n🎉 Login restrictions have been completely removed!');
        console.log('📝 Changes made:');
        console.log('   • Rate limiting check disabled in auth.routes.js');
        console.log('   • checkFailedLoginAttempts() function disabled');
        console.log('   • All existing login attempts cleared from database');
        console.log('   • Users can now login unlimited times without being locked');

    } catch (error) {
        console.error('❌ Error clearing login attempts:', error);

        if (error.code === 'ELOGIN') {
            console.error('💡 Database login failed. Please check:');
            console.error('   • Database server is running');
            console.error('   • Username/password is correct');
            console.error('   • Database exists');
            console.error('   • .env file has correct DB_PASSWORD');
        }

        console.error('Error details:', {
            message: error.message,
            code: error.code,
            number: error.number
        });
    } finally {
        if (pool) {
            try {
                await pool.close();
                console.log('\n🔌 Database connection closed');
            } catch (err) {
                console.error('Error closing connection:', err);
            }
        }
    }
}

// If database connection fails, still show the manual instructions
console.log('🎯 RATE LIMITING HAS BEEN DISABLED!');
console.log('📝 Changes made to code:');
console.log('   ✅ Rate limiting check removed from auth.routes.js');
console.log('   ✅ checkFailedLoginAttempts() function disabled');
console.log('   ✅ Users can now login unlimited times');
console.log('\n🚀 You can now login without the 30-minute restriction!');

// Run the script
clearLoginAttempts(); 