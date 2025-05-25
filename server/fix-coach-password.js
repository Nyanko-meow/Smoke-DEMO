const bcrypt = require('bcryptjs');
const { pool, connectDB } = require('./src/config/database');

async function fixCoachPassword() {
    try {
        console.log('🔧 Fixing coach password...');

        // Connect to database
        await connectDB();

        // Hash the password H12345678@
        const password = 'H12345678@';
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        console.log('🔐 Original password:', password);
        console.log('🔐 Hashed password:', hashedPassword);

        // Update coach password in database
        const result = await pool.request()
            .input('hashedPassword', hashedPassword)
            .input('email', 'coach@example.com')
            .query(`
                UPDATE Users 
                SET Password = @hashedPassword, UpdatedAt = GETDATE()
                WHERE Email = @email AND Role = 'coach'
            `);

        console.log('✅ Password updated for coach@example.com');
        console.log('📊 Rows affected:', result.rowsAffected[0]);

        // Verify the update by checking the user
        const checkResult = await pool.request()
            .input('email', 'coach@example.com')
            .query(`
                SELECT UserID, Email, FirstName, LastName, Role, IsActive, EmailVerified
                FROM Users 
                WHERE Email = @email
            `);

        if (checkResult.recordset.length > 0) {
            const user = checkResult.recordset[0];
            console.log('👤 Updated user info:');
            console.log('   UserID:', user.UserID);
            console.log('   Email:', user.Email);
            console.log('   Name:', user.FirstName, user.LastName);
            console.log('   Role:', user.Role);
            console.log('   IsActive:', user.IsActive);
            console.log('   EmailVerified:', user.EmailVerified);
        }

        // Test password verification
        const testResult = await pool.request()
            .input('email', 'coach@example.com')
            .query(`
                SELECT Password FROM Users WHERE Email = @email
            `);

        if (testResult.recordset.length > 0) {
            const storedPassword = testResult.recordset[0].Password;
            const isValid = await bcrypt.compare(password, storedPassword);
            console.log('🔍 Password verification test:', isValid ? '✅ PASSED' : '❌ FAILED');
        }

        console.log('🎉 Coach password fix completed successfully!');
        console.log('💡 You can now login with:');
        console.log('   Email: coach@example.com');
        console.log('   Password: H12345678@');

    } catch (error) {
        console.error('❌ Error fixing coach password:', error);
    } finally {
        process.exit(0);
    }
}

// Run the fix
fixCoachPassword(); 