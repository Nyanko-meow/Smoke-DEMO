const { pool } = require('./src/config/database');

async function checkUser() {
    try {
        console.log('🔍 Checking if user with ID 2 exists...\n');

        const result = await pool.request()
            .input('UserID', 2)
            .query('SELECT UserID, Email, FirstName, LastName, Role FROM Users WHERE UserID = @UserID');

        if (result.recordset.length === 0) {
            console.log('❌ User with ID 2 not found!');

            // Let's see what users do exist
            console.log('\n📋 Checking all users...');
            const allUsers = await pool.request().query('SELECT UserID, Email, Role FROM Users ORDER BY UserID');
            console.log('All users:', allUsers.recordset);

        } else {
            console.log('✅ User found:');
            console.log(result.recordset[0]);
        }

        // Also check if member@example.com exists with any ID
        console.log('\n🔍 Checking member@example.com with any ID...');
        const memberCheck = await pool.request()
            .input('Email', 'member@example.com')
            .query('SELECT UserID, Email, FirstName, LastName, Role FROM Users WHERE Email = @Email');

        if (memberCheck.recordset.length === 0) {
            console.log('❌ member@example.com not found!');
        } else {
            console.log('✅ member@example.com found:');
            console.log(memberCheck.recordset[0]);
        }

    } catch (error) {
        console.error('❌ Database error:', error.message);
    } finally {
        process.exit(0);
    }
}

checkUser(); 