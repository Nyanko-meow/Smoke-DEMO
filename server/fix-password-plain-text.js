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
            password: 'Tran0210203@'
        }
    }
};

async function updateToPlainTextPasswords() {
    try {
        await sql.connect(config);
        console.log('🔌 Connected to database');

        // Update all users to have plain text password "password"
        const result = await sql.query`
            UPDATE Users 
            SET Password = 'password',
                IsActive = 1,
                EmailVerified = 1
            WHERE Email IN ('guest@example.com', 'member@example.com', 'coach@example.com', 'admin@example.com')
        `;

        console.log('✅ Updated all user passwords to plain text "password"');
        console.log('📊 Rows affected:', result.rowsAffected[0]);

        // Verify the update
        const users = await sql.query`
            SELECT UserID, Email, Password, Role, IsActive, EmailVerified
            FROM Users 
            WHERE Email IN ('guest@example.com', 'member@example.com', 'coach@example.com', 'admin@example.com')
            ORDER BY UserID
        `;

        console.log('📋 Updated users:');
        users.recordset.forEach(user => {
            console.log(`   ${user.Role}: ${user.Email} | Password: ${user.Password} | Active: ${user.IsActive} | Verified: ${user.EmailVerified}`);
        });

        // Create test quit plan for chat
        await sql.query`
            DELETE FROM QuitPlans WHERE UserID = 2 AND CoachID = 3
        `;

        await sql.query`
            INSERT INTO QuitPlans (UserID, CoachID, StartDate, TargetDate, Reason, MotivationLevel, DetailedPlan, Status)
            VALUES (2, 3, GETDATE(), DATEADD(DAY, 30, GETDATE()), 'Test chat feature', 8, 'Test plan for chat functionality', 'active')
        `;

        console.log('✅ Created test quit plan for chat functionality');

        console.log('\n🎉 SUCCESS! All passwords are now plain text!');
        console.log('📝 Login credentials for all accounts:');
        console.log('   Guest: guest@example.com / password');
        console.log('   Member: member@example.com / password');
        console.log('   Coach: coach@example.com / password');
        console.log('   Admin: admin@example.com / password');
        console.log('\n🔗 Try logging in at:');
        console.log('   - Member login: http://localhost:3000/login');
        console.log('   - Coach login: http://localhost:3000/coach/login');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Full error:', error);
    } finally {
        await sql.close();
    }
}

updateToPlainTextPasswords(); 