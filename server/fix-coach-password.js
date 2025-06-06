const sql = require('mssql');
const bcrypt = require('bcryptjs');

const config = {
    user: 'sa',
    password: '12345',
    server: 'localhost',
    database: 'SMOKEKING',
    port: 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function fixCoachPassword() {
    try {
        await sql.connect(config);
        console.log('🔗 Connected to database');

        // Hash the password "coach123"
        const hashedPassword = await bcrypt.hash('coach123', 10);
        console.log('🔒 Hashed password created');

        // Update coach password
        await sql.query`
            UPDATE Users 
            SET PasswordHash = ${hashedPassword}
            WHERE Email = 'coach@example.com' AND Role = 'coach'
        `;

        console.log('✅ Coach password updated to "coach123"');

        // Verify the update
        const result = await sql.query`
            SELECT UserID, Email, FirstName, LastName, Role 
            FROM Users 
            WHERE Email = 'coach@example.com' AND Role = 'coach'
        `;

        console.log('👨‍🏫 Coach info:', result.recordset[0]);

        await sql.close();
        console.log('🎉 Password update completed!');

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

fixCoachPassword(); 