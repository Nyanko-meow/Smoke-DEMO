const bcrypt = require('bcryptjs');
const { pool, connectDB } = require('./src/config/database');

async function fixLoginIssues() {
    try {
        console.log('🚀 Starting login issues fix...');
        console.log('==========================================');

        // Step 1: Connect to database
        console.log('1️⃣ Connecting to database...');
        await connectDB();
        console.log('✅ Database connected successfully');

        // Step 2: Check current coach account
        console.log('\n2️⃣ Checking current coach account...');
        const currentUserResult = await pool.request()
            .input('email', 'coach@example.com')
            .query(`
                SELECT UserID, Email, Password, FirstName, LastName, Role, IsActive, EmailVerified
                FROM Users 
                WHERE Email = @email
            `);

        if (currentUserResult.recordset.length === 0) {
            console.log('❌ Coach account not found! Creating new one...');

            // Create coach account if not exists
            const hashedPassword = await bcrypt.hash('H12345678@', 10);
            await pool.request()
                .input('email', 'coach@example.com')
                .input('password', hashedPassword)
                .input('firstName', 'Coach')
                .input('lastName', 'Smith')
                .query(`
                    INSERT INTO Users (Email, Password, FirstName, LastName, Role, IsActive, EmailVerified, CreatedAt, UpdatedAt)
                    VALUES (@email, @password, @firstName, @lastName, 'coach', 1, 1, GETDATE(), GETDATE())
                `);
            console.log('✅ Created new coach account');
        } else {
            const user = currentUserResult.recordset[0];
            console.log('👤 Found coach account:');
            console.log('   UserID:', user.UserID);
            console.log('   Email:', user.Email);
            console.log('   Name:', user.FirstName, user.LastName);
            console.log('   Role:', user.Role);
            console.log('   IsActive:', user.IsActive);
            console.log('   EmailVerified:', user.EmailVerified);

            // Check if password is already hashed
            const isPasswordHashed = user.Password.startsWith('$2a$') || user.Password.startsWith('$2b$');

            if (!isPasswordHashed) {
                console.log('🔧 Password is not hashed, fixing...');
                const hashedPassword = await bcrypt.hash('H12345678@', 10);

                await pool.request()
                    .input('hashedPassword', hashedPassword)
                    .input('email', 'coach@example.com')
                    .query(`
                        UPDATE Users 
                        SET Password = @hashedPassword, UpdatedAt = GETDATE()
                        WHERE Email = @email
                    `);
                console.log('✅ Password hashed and updated');
            } else {
                console.log('✅ Password is already hashed');
            }

            // Ensure account is active and verified
            if (!user.IsActive || !user.EmailVerified) {
                await pool.request()
                    .input('email', 'coach@example.com')
                    .query(`
                        UPDATE Users 
                        SET IsActive = 1, EmailVerified = 1, UpdatedAt = GETDATE()
                        WHERE Email = @email
                    `);
                console.log('✅ Account activated and verified');
            }
        }

        // Step 3: Test password verification
        console.log('\n3️⃣ Testing password verification...');
        const testResult = await pool.request()
            .input('email', 'coach@example.com')
            .query(`
                SELECT Password FROM Users WHERE Email = @email
            `);

        if (testResult.recordset.length > 0) {
            const storedPassword = testResult.recordset[0].Password;
            const isValid = await bcrypt.compare('H12345678@', storedPassword);
            console.log('🔍 Password verification test:', isValid ? '✅ PASSED' : '❌ FAILED');

            if (!isValid) {
                console.log('🔧 Re-hashing password...');
                const newHashedPassword = await bcrypt.hash('H12345678@', 10);
                await pool.request()
                    .input('hashedPassword', newHashedPassword)
                    .input('email', 'coach@example.com')
                    .query(`
                        UPDATE Users 
                        SET Password = @hashedPassword
                        WHERE Email = @email
                    `);
                console.log('✅ Password re-hashed successfully');
            }
        }

        // Step 4: Check for other potential issues
        console.log('\n4️⃣ Checking for other potential issues...');

        // Check if user has any login attempts
        const loginAttemptsResult = await pool.request()
            .input('email', 'coach@example.com')
            .query(`
                SELECT COUNT(*) as AttemptCount 
                FROM LoginAttempts 
                WHERE Email = @email AND AttemptTime > DATEADD(HOUR, -1, GETDATE())
            `);

        const attemptCount = loginAttemptsResult.recordset[0].AttemptCount;
        if (attemptCount > 0) {
            console.log(`⚠️ Found ${attemptCount} recent login attempts, clearing...`);
            await pool.request()
                .input('email', 'coach@example.com')
                .query(`
                    DELETE FROM LoginAttempts 
                    WHERE Email = @email
                `);
            console.log('✅ Login attempts cleared');
        } else {
            console.log('✅ No blocking login attempts found');
        }

        // Step 5: Final verification
        console.log('\n5️⃣ Final verification...');
        const finalResult = await pool.request()
            .input('email', 'coach@example.com')
            .query(`
                SELECT UserID, Email, FirstName, LastName, Role, IsActive, EmailVerified
                FROM Users 
                WHERE Email = @email
            `);

        if (finalResult.recordset.length > 0) {
            const user = finalResult.recordset[0];
            console.log('✅ Final coach account status:');
            console.log('   UserID:', user.UserID);
            console.log('   Email:', user.Email);
            console.log('   Name:', user.FirstName, user.LastName);
            console.log('   Role:', user.Role);
            console.log('   IsActive:', user.IsActive ? 'Yes' : 'No');
            console.log('   EmailVerified:', user.EmailVerified ? 'Yes' : 'No');
        }

        console.log('\n==========================================');
        console.log('🎉 Login issues fix completed successfully!');
        console.log('💡 You can now login with:');
        console.log('   Email: coach@example.com');
        console.log('   Password: H12345678@');
        console.log('   Login URL: http://localhost:4000/api/coaches/login');
        console.log('   Or Auth URL: http://localhost:4000/api/auth/login');
        console.log('==========================================');

    } catch (error) {
        console.error('❌ Error fixing login issues:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Also create a simple test login function
async function testLogin() {
    try {
        console.log('\n🧪 Testing login functionality...');

        const testResult = await pool.request()
            .input('email', 'coach@example.com')
            .query(`
                SELECT UserID, Email, Password, FirstName, LastName, Role, IsActive, EmailVerified
                FROM Users 
                WHERE Email = @email AND Role = 'coach'
            `);

        if (testResult.recordset.length === 0) {
            console.log('❌ Coach account not found');
            return false;
        }

        const user = testResult.recordset[0];

        if (!user.IsActive) {
            console.log('❌ Account not active');
            return false;
        }

        const isPasswordValid = await bcrypt.compare('H12345678@', user.Password);
        if (!isPasswordValid) {
            console.log('❌ Password verification failed');
            return false;
        }

        console.log('✅ Login test PASSED');
        console.log('   All conditions met for successful login');
        return true;

    } catch (error) {
        console.error('❌ Login test failed:', error);
        return false;
    }
}

// Run the fixes
(async () => {
    try {
        await fixLoginIssues();
        await testLogin();
    } catch (error) {
        console.error('Fatal error:', error);
    } finally {
        process.exit(0);
    }
})(); 