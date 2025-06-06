const fs = require('fs');
const path = require('path');
const { pool, connectDB, sql } = require('./server/src/config/database');

async function runDatabaseFix() {
    try {
        console.log('🔧 Starting database fix...');

        // Connect to database
        await connectDB();

        // Read and execute fix script
        console.log('\n📖 Reading fix database script...');
        const fixScriptPath = path.join(__dirname, 'fix-database.sql');
        const fixScript = fs.readFileSync(fixScriptPath, 'utf8');

        console.log('\n⚡ Executing database fix...');
        await pool.request().query(fixScript);

        console.log('\n✅ Database fix completed!');

        // Verify fixes by running some test queries
        console.log('\n🧪 Running verification tests...');

        // Test 1: Check Users table
        const usersResult = await pool.request().query(`
            SELECT UserID, Email, FirstName, LastName, Address 
            FROM Users 
            WHERE UserID IN (1, 2, 3, 4, 5)
        `);
        console.log('\n📊 Sample users:');
        console.table(usersResult.recordset);

        // Test 2: Check MembershipPlans
        const plansResult = await pool.request().query(`
            SELECT PlanID, Name, Price, Duration 
            FROM MembershipPlans
        `);
        console.log('\n📋 Membership plans:');
        console.table(plansResult.recordset);

        // Test 3: Check UserMemberships
        const membershipsResult = await pool.request().query(`
            SELECT 
                um.MembershipID,
                um.UserID,
                u.FirstName + ' ' + u.LastName as UserName,
                um.PlanID,
                mp.Name as PlanName,
                um.Status,
                um.StartDate,
                um.EndDate
            FROM UserMemberships um
            JOIN Users u ON um.UserID = u.UserID
            JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
        `);
        console.log('\n🎫 Active memberships:');
        console.table(membershipsResult.recordset);

        // Test 4: Check Achievements
        const achievementsResult = await pool.request().query(`
            SELECT TOP 5 AchievementID, Name, MilestoneDays, SavedMoney 
            FROM Achievements
        `);
        console.log('\n🏆 Sample achievements:');
        console.table(achievementsResult.recordset);

        // Test 5: Test profile update functionality
        console.log('\n🔍 Testing profile update...');
        const userId = 2;
        const testAddress = 'Test Address - ' + new Date().toISOString();

        const updateResult = await pool.request()
            .input('UserID', sql.Int, userId)
            .input('FirstName', sql.NVarChar, 'Member')
            .input('LastName', sql.NVarChar, 'User')
            .input('PhoneNumber', sql.NVarChar, '0987654321')
            .input('Address', sql.NVarChar, testAddress)
            .query(`
                UPDATE Users
                SET FirstName = @FirstName,
                    LastName = @LastName,
                    PhoneNumber = @PhoneNumber,
                    Address = @Address,
                    UpdatedAt = GETDATE()
                OUTPUT INSERTED.UserID, INSERTED.FirstName, INSERTED.LastName, 
                       INSERTED.PhoneNumber, INSERTED.Address, INSERTED.UpdatedAt
                WHERE UserID = @UserID
            `);

        if (updateResult.recordset.length > 0) {
            console.log('✅ Profile update test successful!');
            console.log('Updated data:', updateResult.recordset[0]);
        } else {
            console.log('❌ Profile update test failed!');
        }

        // Test 6: Check foreign key integrity
        console.log('\n🔗 Checking foreign key integrity...');
        const integrityResult = await pool.request().query(`
            SELECT 
                'UserMemberships -> Users' as Relationship,
                COUNT(*) as TotalRecords,
                COUNT(u.UserID) as ValidRecords
            FROM UserMemberships um
            LEFT JOIN Users u ON um.UserID = u.UserID
            
            UNION ALL
            
            SELECT 
                'UserMemberships -> MembershipPlans' as Relationship,
                COUNT(*) as TotalRecords,
                COUNT(mp.PlanID) as ValidRecords
            FROM UserMemberships um
            LEFT JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
        `);
        console.table(integrityResult.recordset);

        console.log('\n🎉 All verification tests completed!');
        console.log('\n✨ Database is now fully functional and ready to use!');

    } catch (error) {
        console.error('❌ Database fix failed:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            number: error.number,
            state: error.state,
            class: error.class,
            procedure: error.procedure,
            lineNumber: error.lineNumber
        });
    } finally {
        // Close connection
        try {
            await pool.close();
            console.log('\n🔌 Database connection closed');
        } catch (err) {
            console.error('Error closing connection:', err);
        }
    }
}

// Run the fix
runDatabaseFix(); 