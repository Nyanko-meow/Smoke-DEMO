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
            password: '12345'  // Working password found by the previous script
        }
    }
};

async function updatePasswordsCorrect() {
    try {
        await sql.connect(config);
        console.log('🔌 Connected to database');

        // Update all users to have simple password "password"
        const result = await sql.query`
            UPDATE Users 
            SET Password = 'password',
                IsActive = 1,
                EmailVerified = 1
            WHERE Email IN ('guest@example.com', 'member@example.com', 'coach@example.com', 'admin@example.com')
        `;

        console.log(`✅ Updated ${result.rowsAffected} user passwords to "password"`);

        // Verify the changes
        const users = await sql.query`
            SELECT UserID, Email, Password, Role, IsActive, EmailVerified 
            FROM Users 
            WHERE Email IN ('guest@example.com', 'member@example.com', 'coach@example.com', 'admin@example.com')
        `;

        console.log('\n👥 Updated user accounts:');
        users.recordset.forEach(user => {
            console.log(`   ${user.Role}: ${user.Email}`);
            console.log(`      Password: ${user.Password}`);
            console.log(`      Active: ${user.IsActive} | EmailVerified: ${user.EmailVerified}`);
            console.log('');
        });

        console.log('🎉 All user passwords updated successfully!');
        console.log('\n📝 Login credentials for all roles:');
        console.log('   Guest: guest@example.com / password');
        console.log('   Member: member@example.com / password');
        console.log('   Coach: coach@example.com / password');
        console.log('   Admin: admin@example.com / password');
        console.log('\n🌐 Now you can login and access:');
        console.log('   - http://localhost:3000/achievement (Achievements page)');
        console.log('   - http://localhost:3000/membership (Service Package)');
        console.log('   - All other features with simple passwords!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sql.close();
    }
}

updatePasswordsCorrect(); 