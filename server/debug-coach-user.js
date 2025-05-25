const sql = require('mssql');
const jwt = require('jsonwebtoken');

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
            password: '12345'
        }
    }
};

async function debugCoachUser() {
    try {
        await sql.connect(config);
        console.log('🔌 Connected to database');

        // 1. Check coach user in database
        console.log('\n👨‍⚕️ Checking coach user...');
        const coachUser = await sql.query`
            SELECT UserID, Email, FirstName, LastName, Role, IsActive, EmailVerified, Password
            FROM Users 
            WHERE Email = 'coach@example.com'
        `;

        if (coachUser.recordset.length === 0) {
            console.log('❌ Coach user not found!');
            return;
        }

        const coach = coachUser.recordset[0];
        console.log('Coach details:', {
            UserID: coach.UserID,
            Email: coach.Email,
            Role: coach.Role,
            IsActive: coach.IsActive,
            EmailVerified: coach.EmailVerified,
            PasswordHash: coach.Password.substring(0, 10) + '...'
        });

        // 2. Test JWT token creation
        console.log('\n🔑 Testing JWT token creation...');
        const JWT_SECRET = 'smokeking_secret_key_ultra_secure_2024';

        const payload = {
            id: coach.UserID,
            email: coach.Email,
            role: coach.Role
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
        console.log('Generated token:', token.substring(0, 50) + '...');

        // 3. Test token verification
        console.log('\n✅ Testing token verification...');
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Decoded token:', decoded);

        // 4. Check authorization for chat endpoints
        console.log('\n🔍 Testing role authorization...');
        const requiredRole = 'coach';
        const hasPermission = coach.Role === requiredRole;
        console.log(`Role check: user role "${coach.Role}" ${hasPermission ? 'matches' : 'does NOT match'} required role "${requiredRole}"`);

        // 5. Check conversations for this coach
        console.log('\n💬 Checking conversations...');
        const conversations = await sql.query`
            SELECT 
                c.ConversationID,
                c.CoachID,
                c.MemberID,
                member.FirstName + ' ' + member.LastName as MemberName,
                c.LastMessageAt
            FROM Conversations c
            INNER JOIN Users member ON c.MemberID = member.UserID
            WHERE c.CoachID = ${coach.UserID}
        `;

        console.log(`Found ${conversations.recordset.length} conversations for coach:`);
        conversations.recordset.forEach(conv => {
            console.log(`   - ${conv.MemberName} (ID: ${conv.MemberID})`);
        });

        // 6. Check members available
        console.log('\n👥 Checking available members...');
        const members = await sql.query`
            SELECT UserID, FirstName + ' ' + LastName as FullName, Email, Role, IsActive
            FROM Users
            WHERE Role IN ('member', 'guest') AND IsActive = 1
        `;

        console.log(`Found ${members.recordset.length} active members:`);
        members.recordset.forEach(member => {
            console.log(`   - ${member.FullName} (${member.Email}) - ${member.Role}`);
        });

        await sql.close();
        console.log('\n✅ Debug completed!');

    } catch (error) {
        console.error('❌ Debug failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

debugCoachUser(); 