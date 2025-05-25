const bcrypt = require('bcryptjs');
const { pool } = require('./src/config/database');

async function createCoachAccount() {
    try {
        const email = 'coach@test.com';
        const password = 'Coach123@';
        const hashedPassword = await bcrypt.hash(password, 12);

        // Check if coach already exists
        const existingCoach = await pool.request()
            .input('Email', email)
            .query('SELECT UserID FROM Users WHERE Email = @Email');

        if (existingCoach.recordset.length > 0) {
            console.log('Coach account already exists:', email);
            return;
        }

        // Create coach account
        const result = await pool.request()
            .input('Email', email)
            .input('Password', hashedPassword)
            .input('FirstName', 'Coach')
            .input('LastName', 'Test')
            .input('Role', 'coach')
            .query(`
                INSERT INTO Users (Email, Password, FirstName, LastName, Role, IsActive, EmailVerified, CreatedAt, UpdatedAt)
                OUTPUT INSERTED.UserID
                VALUES (@Email, @Password, @FirstName, @LastName, @Role, 1, 1, GETDATE(), GETDATE())
            `);

        console.log('✅ Coach account created successfully!');
        console.log('📧 Email:', email);
        console.log('🔑 Password:', password);
        console.log('👤 UserID:', result.recordset[0].UserID);

    } catch (error) {
        console.error('❌ Error creating coach account:', error);
    } finally {
        process.exit(0);
    }
}

createCoachAccount(); 