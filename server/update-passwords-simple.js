const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'sa',
    server: 'DESKTOP-615IDKR\\SQLEXPRESS',
    database: 'SMOKEKING',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function updatePasswords() {
    try {
        console.log('🔄 Connecting to database...');
        await sql.connect(config);
        console.log('✅ Connected to database');

        // Update all user passwords to plain text
        const result = await sql.query`
            UPDATE Users 
            SET Password = '12345678'
            WHERE UserID IN (1, 2, 3, 4)
        `;

        console.log('✅ Updated passwords for all users');
        console.log(`📊 Rows affected: ${result.rowsAffected[0]}`);

        // Verify the update
        const users = await sql.query`
            SELECT UserID, Email, Password, Role 
            FROM Users 
            WHERE UserID IN (1, 2, 3, 4)
        `;

        console.log('\n📋 Updated user accounts:');
        users.recordset.forEach(user => {
            console.log(`- ${user.Email} (${user.Role}): ${user.Password}`);
        });

        console.log('\n✅ All passwords updated successfully!');
        console.log('🔑 All users can now login with password: 12345678');

    } catch (error) {
        console.error('❌ Error updating passwords:', error);
    } finally {
        await sql.close();
        console.log('🔌 Database connection closed');
    }
}

updatePasswords(); 