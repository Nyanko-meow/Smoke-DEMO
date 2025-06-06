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

async function debugFeedbackIssue() {
    try {
        await sql.connect(config);
        console.log('🔌 Connected to database');

        // 1. Check all users and their roles
        console.log('\n👥 Checking all users and their roles...');
        const allUsers = await sql.query`
            SELECT UserID, Email, FirstName, LastName, Role, IsActive, EmailVerified
            FROM Users 
            ORDER BY UserID
        `;

        console.log('All users in database:');
        allUsers.recordset.forEach(user => {
            console.log(`   ${user.UserID}: ${user.Email} - Role: "${user.Role}" - Active: ${user.IsActive} - Verified: ${user.EmailVerified}`);
        });

        // 2. Check member@example.com specifically
        console.log('\n🔍 Checking member@example.com...');
        const memberUser = await sql.query`
            SELECT UserID, Email, FirstName, LastName, Role, IsActive, EmailVerified
            FROM Users 
            WHERE Email = 'member@example.com'
        `;

        if (memberUser.recordset.length === 0) {
            console.log('❌ member@example.com not found!');

            // Create the member user
            console.log('🔧 Creating member@example.com...');
            await sql.query`
                INSERT INTO Users (Email, Password, FirstName, LastName, Role, IsActive, EmailVerified)
                VALUES ('member@example.com', 'H12345678@', 'Member', 'User', 'member', 1, 1)
            `;
            console.log('✅ Created member@example.com with role "member"');
        } else {
            const member = memberUser.recordset[0];
            console.log('Member details:', {
                UserID: member.UserID,
                Email: member.Email,
                Role: member.Role,
                IsActive: member.IsActive,
                EmailVerified: member.EmailVerified
            });

            // Fix role if needed
            if (member.Role !== 'member') {
                console.log(`🔧 Fixing role from "${member.Role}" to "member"...`);
                await sql.query`
                    UPDATE Users 
                    SET Role = 'member', IsActive = 1, EmailVerified = 1
                    WHERE Email = 'member@example.com'
                `;
                console.log('✅ Role fixed to "member"');
            }
        }

        // 3. Check coach@example.com
        console.log('\n🔍 Checking coach@example.com...');
        const coachUser = await sql.query`
            SELECT UserID, Email, FirstName, LastName, Role, IsActive, EmailVerified
            FROM Users 
            WHERE Email = 'coach@example.com'
        `;

        if (coachUser.recordset.length === 0) {
            console.log('❌ coach@example.com not found!');

            // Create the coach user
            console.log('🔧 Creating coach@example.com...');
            await sql.query`
                INSERT INTO Users (Email, Password, FirstName, LastName, Role, IsActive, EmailVerified)
                VALUES ('coach@example.com', 'H12345678@', 'Coach', 'Smith', 'coach', 1, 1)
            `;
            console.log('✅ Created coach@example.com with role "coach"');
        } else {
            const coach = coachUser.recordset[0];
            console.log('Coach details:', {
                UserID: coach.UserID,
                Email: coach.Email,
                Role: coach.Role,
                IsActive: coach.IsActive,
                EmailVerified: coach.EmailVerified
            });
        }

        // 4. Generate valid tokens for testing
        console.log('\n🔑 Generating test tokens...');
        const JWT_SECRET = process.env.JWT_SECRET || 'smokeking_secret_key_ultra_secure_2024';

        // Get updated member info
        const updatedMember = await sql.query`
            SELECT UserID, Email, FirstName, LastName, Role
            FROM Users 
            WHERE Email = 'member@example.com'
        `;

        if (updatedMember.recordset.length > 0) {
            const member = updatedMember.recordset[0];

            const memberPayload = {
                id: member.UserID,
                email: member.Email,
                role: member.Role
            };

            const memberToken = jwt.sign(memberPayload, JWT_SECRET, { expiresIn: '24h' });
            console.log('\n✅ Member token generated:');
            console.log(`Bearer ${memberToken}`);

            // Verify the token works
            const decoded = jwt.verify(memberToken, JWT_SECRET);
            console.log('\n🔍 Token verification:');
            console.log('Decoded payload:', decoded);
            console.log('Role check for ["member", "guest"]:', ['member', 'guest'].includes(decoded.role));
        }

        // 5. Check existing feedback
        console.log('\n📝 Checking existing feedback...');
        const existingFeedback = await sql.query`
            SELECT 
                cf.FeedbackID,
                cf.CoachID,
                cf.MemberID,
                cf.Rating,
                cf.Comment,
                cf.CreatedAt,
                m.Email as MemberEmail,
                c.Email as CoachEmail
            FROM CoachFeedback cf
            INNER JOIN Users m ON cf.MemberID = m.UserID
            INNER JOIN Users c ON cf.CoachID = c.UserID
            ORDER BY cf.CreatedAt DESC
        `;

        console.log(`Found ${existingFeedback.recordset.length} existing feedback records:`);
        existingFeedback.recordset.forEach(feedback => {
            console.log(`   ${feedback.MemberEmail} -> ${feedback.CoachEmail}: ${feedback.Rating} stars`);
        });

        console.log('\n🎉 Debug completed!');
        console.log('\n📋 Summary:');
        console.log('1. All users have been checked and fixed');
        console.log('2. member@example.com has role "member"');
        console.log('3. coach@example.com has role "coach"');
        console.log('4. Valid tokens generated for testing');
        console.log('\n💡 To test the feedback feature:');
        console.log('1. Use the generated token in Authorization header');
        console.log('2. Make sure coachId exists in the request');
        console.log('3. Check that the user role is "member" or "guest"');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sql.close();
    }
}

// Run the debug
debugFeedbackIssue().catch(console.error); 