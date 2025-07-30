const { pool, connectDB } = require('./src/config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function testAdminLogin() {
    try {
        console.log('Connecting to database...');
        await connectDB();
        
        const email = 'admin@example.com';
        const password = 'H12345678@';
        
        console.log('Testing admin login with:', { email, password });
        
        // Check if user exists and has admin role
        const result = await pool.request()
            .input('Email', email)
            .query(`
                SELECT UserID, Email, Password, FirstName, LastName, Role, IsActive, EmailVerified
                FROM Users 
                WHERE Email = @Email AND Role = 'admin'
            `);

        console.log('Query result:', result.recordset);

        if (result.recordset.length === 0) {
            console.log('❌ No admin user found');
            return;
        }

        const user = result.recordset[0];
        console.log('Found user:', {
            UserID: user.UserID,
            Email: user.Email,
            Role: user.Role,
            IsActive: user.IsActive,
            Password: user.Password
        });

        // Check if account is active
        if (!user.IsActive) {
            console.log('❌ Account is not active');
            return;
        }

        // Verify password
        if (password !== user.Password) {
            console.log('❌ Password mismatch');
            console.log('Expected:', password);
            console.log('Actual:', user.Password);
            return;
        }

        console.log('✅ Password verified successfully');

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.UserID,
                email: user.Email,
                role: user.Role
            },
            process.env.JWT_SECRET || 'smokeking_secret_key_ultra_secure_2024',
            { expiresIn: process.env.JWT_EXPIRE || '8h' }
        );

        console.log('✅ JWT token generated:', token.substring(0, 50) + '...');

        console.log('✅ Admin login test completed successfully');
        
    } catch (error) {
        console.error('❌ Error during admin login test:', error);
    } finally {
        process.exit();
    }
}

testAdminLogin(); 