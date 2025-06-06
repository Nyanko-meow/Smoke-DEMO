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

async function checkCoachAccount() {
    try {
        await sql.connect(config);
        console.log('🔌 Connected to database');

        // Kiểm tra tài khoản coach
        const coaches = await sql.query`
            SELECT UserID, Email, FirstName, LastName, Role, IsActive, EmailVerified, Password
            FROM Users 
            WHERE Role = 'coach'
        `;

        console.log('👥 Found coaches:', coaches.recordset.map(c => ({
            UserID: c.UserID,
            Email: c.Email,
            Name: `${c.FirstName} ${c.LastName}`,
            Role: c.Role,
            IsActive: c.IsActive,
            EmailVerified: c.EmailVerified,
            HasPassword: !!c.Password
        })));

        // Tìm coach cụ thể
        const coachEmail = 'coach@example.com';
        const specificCoach = await sql.query`
            SELECT * FROM Users WHERE Email = ${coachEmail}
        `;

        if (specificCoach.recordset.length === 0) {
            console.log('❌ Coach account not found! Creating...');

            // Tạo password hash
            const plainPassword = 'password'; // hoặc password bạn muốn
            const hashedPassword = await bcrypt.hash(plainPassword, 10);

            await sql.query`
                INSERT INTO Users (Email, Password, FirstName, LastName, Role, IsActive, EmailVerified)
                VALUES (${coachEmail}, ${hashedPassword}, 'Coach', 'Smith', 'coach', 1, 1)
            `;

            console.log('✅ Created coach account with email:', coachEmail, 'password:', plainPassword);
        } else {
            const coach = specificCoach.recordset[0];
            console.log('📋 Found coach:', {
                UserID: coach.UserID,
                Email: coach.Email,
                Name: `${coach.FirstName} ${coach.LastName}`,
                IsActive: coach.IsActive,
                EmailVerified: coach.EmailVerified
            });

            // Fix account if needed
            if (!coach.IsActive || !coach.EmailVerified) {
                await sql.query`
                    UPDATE Users 
                    SET IsActive = 1, EmailVerified = 1
                    WHERE UserID = ${coach.UserID}
                `;
                console.log('✅ Fixed coach account activation');
            }

            // Reset password to known value
            const newPassword = 'password';
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await sql.query`
                UPDATE Users 
                SET Password = ${hashedPassword}
                WHERE UserID = ${coach.UserID}
            `;

            console.log('✅ Reset coach password to:', newPassword);
        }

        // Verify login credentials
        const testLogin = await sql.query`
            SELECT UserID, Email, Password, Role, IsActive, EmailVerified
            FROM Users 
            WHERE Email = ${coachEmail} AND Role = 'coach'
        `;

        if (testLogin.recordset.length > 0) {
            const user = testLogin.recordset[0];
            const isPasswordValid = await bcrypt.compare('password', user.Password);

            console.log('🔐 Login test:', {
                email: user.Email,
                role: user.Role,
                isActive: user.IsActive,
                emailVerified: user.EmailVerified,
                passwordValid: isPasswordValid
            });

            if (isPasswordValid && user.IsActive && user.EmailVerified) {
                console.log('🎉 Coach login should work now!');
                console.log('📝 Use credentials:');
                console.log('   Email: coach@example.com');
                console.log('   Password: password');
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Full error:', error);
    } finally {
        await sql.close();
    }
}

checkCoachAccount(); 