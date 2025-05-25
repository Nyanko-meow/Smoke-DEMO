const sql = require('mssql');
const bcrypt = require('bcryptjs');

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

async function fixCoachLogin() {
    try {
        await sql.connect(config);
        console.log('🔌 Connected to database');

        const coachEmail = 'coach@example.com';

        // Kiểm tra tài khoản coach hiện tại
        const currentCoach = await sql.query`
            SELECT * FROM Users WHERE Email = ${coachEmail}
        `;

        if (currentCoach.recordset.length === 0) {
            console.log('❌ Coach account not found! Creating new one...');

            // Tạo coach mới với password "password"
            const hashedPassword = await bcrypt.hash('password', 10);

            await sql.query`
                INSERT INTO Users (Email, Password, FirstName, LastName, Role, Avatar, PhoneNumber, Address,
                    IsActive, ActivationToken, ActivationExpires, EmailVerified, CreatedAt, UpdatedAt, LastLoginAt,
                    RefreshToken, RefreshTokenExpiry)
                VALUES (${coachEmail}, ${hashedPassword}, 'Coach', 'Smith', 'coach', 'coach.jpg', '0111222333', '789 Coach Blvd',
                    1, NULL, NULL, 1, GETDATE(), GETDATE(), GETDATE(), 'refreshtoken_coach', DATEADD(DAY, 7, GETDATE()))
            `;

            console.log('✅ Created new coach account');
        } else {
            console.log('📋 Found existing coach account');
            const coach = currentCoach.recordset[0];

            console.log('Current coach status:', {
                UserID: coach.UserID,
                Email: coach.Email,
                Role: coach.Role,
                IsActive: coach.IsActive,
                EmailVerified: coach.EmailVerified,
                HasPassword: !!coach.Password
            });

            // Fix account status
            await sql.query`
                UPDATE Users 
                SET IsActive = 1, 
                    EmailVerified = 1,
                    Role = 'coach'
                WHERE Email = ${coachEmail}
            `;

            console.log('✅ Updated coach account status');
        }

        // Set the correct password (from schema.sql - this hash = "password")
        const correctPasswordHash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

        await sql.query`
            UPDATE Users 
            SET Password = ${correctPasswordHash}
            WHERE Email = ${coachEmail}
        `;

        console.log('✅ Set correct password hash from schema');

        // Verify the fix
        const verifyCoach = await sql.query`
            SELECT UserID, Email, Password, FirstName, LastName, Role, IsActive, EmailVerified
            FROM Users 
            WHERE Email = ${coachEmail}
        `;

        if (verifyCoach.recordset.length > 0) {
            const coach = verifyCoach.recordset[0];

            // Test password
            const isPasswordValid = await bcrypt.compare('password', coach.Password);

            console.log('🔐 Final verification:', {
                UserID: coach.UserID,
                Email: coach.Email,
                Name: `${coach.FirstName} ${coach.LastName}`,
                Role: coach.Role,
                IsActive: coach.IsActive,
                EmailVerified: coach.EmailVerified,
                PasswordValid: isPasswordValid
            });

            if (isPasswordValid && coach.IsActive && coach.EmailVerified && coach.Role === 'coach') {
                console.log('🎉 SUCCESS! Coach login should work now!');
                console.log('📝 Login credentials:');
                console.log('   Email: coach@example.com');
                console.log('   Password: password');
                console.log('');
                console.log('🔗 Try accessing: http://localhost:3000/coach/login');
            } else {
                console.log('❌ Still has issues:', {
                    passwordValid: isPasswordValid,
                    isActive: coach.IsActive,
                    emailVerified: coach.EmailVerified,
                    roleCorrect: coach.Role === 'coach'
                });
            }
        }

        // Also create a quit plan for testing chat if needed
        await sql.query`
            DELETE FROM QuitPlans WHERE UserID = 2 AND CoachID = 3
        `;

        await sql.query`
            INSERT INTO QuitPlans (UserID, CoachID, StartDate, TargetDate, Reason, MotivationLevel, DetailedPlan, Status)
            VALUES (2, 3, GETDATE(), DATEADD(DAY, 30, GETDATE()), 'Test chat feature', 8, 'Test plan for chat functionality', 'active')
        `;

        console.log('✅ Created test quit plan for chat functionality');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Full error:', error);
    } finally {
        await sql.close();
    }
}

fixCoachLogin(); 