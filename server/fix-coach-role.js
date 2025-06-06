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

async function fixCoachRole() {
    try {
        console.log('🔗 Connecting to database...');
        const pool = await sql.connect(config);

        console.log('🔍 Checking Coach Smith current role...');

        // Find coach Smith
        const coachResult = await pool.request()
            .input('Email', 'coach@example.com')
            .query(`
                SELECT UserID, FirstName, LastName, Email, Role 
                FROM Users 
                WHERE Email = @Email
            `);

        if (coachResult.recordset.length === 0) {
            console.log('❌ Coach Smith not found with email coach@example.com');
            return;
        }

        const coach = coachResult.recordset[0];
        console.log('📋 Current coach info:', coach);

        if (coach.Role === 'coach') {
            console.log('✅ Coach Smith already has correct role: coach');
        } else {
            console.log(`🔧 Fixing Coach Smith role from '${coach.Role}' to 'coach'...`);

            await pool.request()
                .input('UserID', coach.UserID)
                .query(`
                    UPDATE Users 
                    SET Role = 'coach' 
                    WHERE UserID = @UserID
                `);

            console.log('✅ Coach Smith role fixed to coach');
        }

        // Also check and fix any other coaches that might have been affected
        console.log('🔍 Checking for other coaches with wrong roles...');

        const allCoachesResult = await pool.request().query(`
            SELECT UserID, FirstName, LastName, Email, Role 
            FROM Users 
            WHERE (Email LIKE '%coach%' OR FirstName LIKE '%Coach%' OR LastName LIKE '%Coach%')
              AND Role != 'coach'
        `);

        if (allCoachesResult.recordset.length > 0) {
            console.log('🔧 Found other coaches with wrong roles:', allCoachesResult.recordset);

            for (const user of allCoachesResult.recordset) {
                await pool.request()
                    .input('UserID', user.UserID)
                    .query(`
                        UPDATE Users 
                        SET Role = 'coach' 
                        WHERE UserID = @UserID
                    `);
                console.log(`✅ Fixed role for ${user.FirstName} ${user.LastName} (${user.Email})`);
            }
        } else {
            console.log('✅ No other coaches found with wrong roles');
        }

        console.log('🎉 Coach role fixing completed!');

        // Close connection
        await pool.close();
        console.log('🔌 Database connection closed');

    } catch (error) {
        console.error('❌ Error fixing coach role:', error);
        process.exit(1);
    }
}

// Run the function
fixCoachRole(); 