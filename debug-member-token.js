const jwt = require('jsonwebtoken');
const sql = require('mssql');

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

async function debugMemberToken() {
    try {
        await sql.connect(config);
        console.log('🔌 Connected to database');

        // 1. Get member user
        console.log('\n👤 Checking member user...');
        const memberUser = await sql.query`
            SELECT UserID, Email, FirstName, LastName, Role, IsActive, EmailVerified
            FROM Users 
            WHERE Email = 'member@example.com'
        `;

        if (memberUser.recordset.length === 0) {
            console.log('❌ Member user not found!');
            return;
        }

        const member = memberUser.recordset[0];
        console.log('Member details:', {
            UserID: member.UserID,
            Email: member.Email,
            Role: member.Role,
            IsActive: member.IsActive,
            EmailVerified: member.EmailVerified
        });

        // 2. Generate token
        console.log('\n🔑 Generating member token...');
        const JWT_SECRET = process.env.JWT_SECRET || 'smokeking_secret_key_ultra_secure_2024';

        const payload = {
            id: member.UserID,
            email: member.Email,
            role: member.Role
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
        console.log('Generated token:', token);

        // 3. Verify token
        console.log('\n✅ Verifying token...');
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Decoded token:', decoded);

        // 4. Test authorization
        console.log('\n🔍 Testing authorization...');
        const requiredRoles = ['member', 'guest'];
        const userRole = member.Role;

        console.log(`User role: "${userRole}"`);
        console.log(`Required roles: [${requiredRoles.map(r => `"${r}"`).join(', ')}]`);
        console.log(`Authorization result: ${requiredRoles.includes(userRole)}`);

        // 5. Test with coach feedback endpoint logic
        console.log('\n🎯 Testing coach feedback logic...');

        // Check if coach exists (using coach@example.com)
        const coachCheck = await sql.query`
            SELECT UserID FROM Users 
            WHERE Email = 'coach@example.com' AND Role = 'coach' AND IsActive = 1
        `;

        console.log('Coach exists:', coachCheck.recordset.length > 0);

        if (coachCheck.recordset.length > 0) {
            const coachId = coachCheck.recordset[0].UserID;
            console.log('Coach ID:', coachId);

            // Check existing feedback
            const existingFeedback = await sql.query`
                SELECT FeedbackID 
                FROM CoachFeedback
                WHERE MemberID = ${member.UserID} 
                AND CoachID = ${coachId}
                AND AppointmentID IS NULL
            `;

            console.log('Existing feedback count:', existingFeedback.recordset.length);
        }

        console.log('\n🎉 Debug completed! Use this token in Authorization header:');
        console.log(`Bearer ${token}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sql.close();
    }
}

debugMemberToken(); 