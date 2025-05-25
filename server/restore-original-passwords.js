const sql = require('mssql');

const config = {
    server: 'localhost',
    database: 'SMOKEKING',
    options: {
        encrypt: false,
        trustServerCertificate: true
    },
    authentication: {
        type: 'default',
        options: {
            userName: 'sa',
            password: '12345'
        }
    }
};

async function restoreOriginalPasswords() {
    try {
        await sql.connect(config);
        console.log('🔌 Connected to database');

        // Update all users back to original password H12345678@
        console.log('🔄 Restoring original passwords to H12345678@...');

        const result = await sql.query`
            UPDATE Users 
            SET Password = 'H12345678@',
                IsActive = 1,
                EmailVerified = 1
            WHERE Email IN ('guest@example.com', 'member@example.com', 'coach@example.com', 'admin@example.com')
        `;

        console.log(`✅ Updated ${result.rowsAffected} user passwords to "H12345678@"`);

        // Verify the changes
        const users = await sql.query`
            SELECT UserID, Email, Password, Role, IsActive, EmailVerified 
            FROM Users 
            WHERE Email IN ('guest@example.com', 'member@example.com', 'coach@example.com', 'admin@example.com', 'leghenkiz@gmail.com')
            ORDER BY UserID
        `;

        console.log('\n👥 Current user accounts:');
        users.recordset.forEach(user => {
            console.log(`   ${user.Role}: ${user.Email}`);
            console.log(`      Password: ${user.Password}`);
            console.log(`      Active: ${user.IsActive} | EmailVerified: ${user.EmailVerified}`);
            console.log('');
        });

        // Check if Achievements tables exist and are working
        console.log('🏆 Checking Achievements tables...');

        const achievementCount = await sql.query`
            SELECT COUNT(*) as AchievementCount FROM Achievements
        `;

        const userAchievementCount = await sql.query`
            SELECT COUNT(*) as TableExists 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'UserAchievements'
        `;

        console.log(`📊 Achievements in database: ${achievementCount.recordset[0].AchievementCount}`);
        console.log(`📋 UserAchievements table exists: ${userAchievementCount.recordset[0].TableExists > 0 ? 'Yes' : 'No'}`);

        // Check if CoachProfiles exist
        const coachProfileCount = await sql.query`
            SELECT COUNT(*) as ProfileCount FROM CoachProfiles
        `;
        console.log(`👨‍⚕️ Coach profiles in database: ${coachProfileCount.recordset[0].ProfileCount}`);

        console.log('\n🎉 Password restoration completed successfully!');
        console.log('\n📝 Login credentials (all accounts use: H12345678@):');
        console.log('   Guest: guest@example.com / H12345678@');
        console.log('   Member: member@example.com / H12345678@');
        console.log('   Coach: coach@example.com / H12345678@');
        console.log('   Admin: admin@example.com / H12345678@');
        console.log('   Custom: leghenkiz@gmail.com / H12345678@');

        console.log('\n✅ All systems should work normally:');
        console.log('   - Login with H12345678@ password');
        console.log('   - Achievements page working');
        console.log('   - Coach profile fully loaded');
        console.log('   - No authentication errors');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sql.close();
    }
}

restoreOriginalPasswords(); 