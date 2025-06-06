const sql = require('mssql');

const config = {
    user: 'sa',
    password: '12345',
    server: 'localhost',
    database: 'SMOKEKING',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        connectTimeout: 30000,
        requestTimeout: 30000
    }
};

async function fixAllPasswordsPlain() {
    try {
        console.log('🔧 Fixing all passwords to plain text format...');

        await sql.connect(config);
        console.log('✅ Connected to database');

        // Update all users to have plain text password "H12345678"
        const result = await sql.query`
            UPDATE Users 
            SET Password = 'H12345678',
                IsActive = 1,
                EmailVerified = 1
            WHERE Email IN ('guest@example.com', 'member@example.com', 'coach@example.com', 'admin@example.com')
        `;

        console.log(`✅ Updated ${result.rowsAffected} user passwords`);

        // Verify the changes
        const users = await sql.query`
            SELECT UserID, Email, Password, Role, IsActive, EmailVerified 
            FROM Users 
            WHERE Email IN ('guest@example.com', 'member@example.com', 'coach@example.com', 'admin@example.com')
            ORDER BY UserID
        `;

        console.log('\n👥 Updated user accounts:');
        users.recordset.forEach(user => {
            console.log(`   ${user.Role.toUpperCase()}: ${user.Email}`);
            console.log(`      Password: ${user.Password}`);
            console.log(`      Active: ${user.IsActive} | EmailVerified: ${user.EmailVerified}`);
            console.log('');
        });

        console.log('🎉 All passwords fixed successfully!');
        console.log('\n📝 Login credentials for all roles:');
        console.log('   Guest: guest@example.com / H12345678');
        console.log('   Member: member@example.com / H12345678');
        console.log('   Coach: coach@example.com / H12345678');
        console.log('   Admin: admin@example.com / H12345678');

        console.log('\n✅ No more bcrypt hashing - all passwords are plain text!');
        console.log('🔑 You can now login to coach dashboard with: coach@example.com / H12345678');

    } catch (error) {
        console.error('❌ Error fixing passwords:', error);
    } finally {
        await sql.close();
        console.log('🔌 Database connection closed');
    }
}

fixAllPasswordsPlain(); 