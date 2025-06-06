const sql = require('mssql');

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

async function setupCoachMembers() {
    try {
        await sql.connect(config);
        console.log('🔗 Connected to database');

        // 1. Check existing data
        console.log('\n=== CHECKING EXISTING DATA ===');

        const coaches = await sql.query`SELECT UserID, FirstName, LastName, Email, Role FROM Users WHERE Role = 'coach'`;
        console.log('👨‍🏫 Coaches:', coaches.recordset);

        const members = await sql.query`SELECT UserID, FirstName, LastName, Email, Role FROM Users WHERE Role = 'member'`;
        console.log('👥 Members:', members.recordset);

        const existingPlans = await sql.query`SELECT * FROM QuitPlans`;
        console.log('📋 Existing QuitPlans:', existingPlans.recordset);

        // 2. Create coach if none exists
        if (coaches.recordset.length === 0) {
            console.log('\n🆕 Creating test coach...');
            await sql.query`
                INSERT INTO Users (Email, FirstName, LastName, PasswordHash, Role, IsActive, EmailVerified, CreatedAt)
                VALUES ('coach@test.com', 'John', 'Smith', '$2b$10$hashedpassword', 'coach', 1, 1, GETDATE())
            `;
            console.log('✅ Test coach created');
        }

        // 3. Get coach and member IDs
        const coachResult = await sql.query`SELECT TOP 1 UserID FROM Users WHERE Role = 'coach'`;
        const memberResult = await sql.query`SELECT UserID FROM Users WHERE Role = 'member'`;

        if (coachResult.recordset.length === 0) {
            console.log('❌ No coach found');
            return;
        }

        if (memberResult.recordset.length === 0) {
            console.log('❌ No members found');
            return;
        }

        const coachId = coachResult.recordset[0].UserID;
        console.log(`\n🎯 Using Coach ID: ${coachId}`);

        // 4. Assign members to coach via QuitPlans
        console.log('\n📝 Creating QuitPlan assignments...');

        for (const member of memberResult.recordset) {
            const memberId = member.UserID;

            // Check if already assigned
            const existing = await sql.query`
                SELECT * FROM QuitPlans 
                WHERE UserID = ${memberId} AND CoachID = ${coachId} AND Status = 'active'
            `;

            if (existing.recordset.length === 0) {
                await sql.query`
                    INSERT INTO QuitPlans (
                        UserID, 
                        CoachID, 
                        StartDate, 
                        TargetDate, 
                        Status, 
                        Reason,
                        MotivationLevel,
                        CreatedAt
                    )
                    VALUES (
                        ${memberId}, 
                        ${coachId}, 
                        GETDATE(), 
                        DATEADD(month, 3, GETDATE()), 
                        'active',
                        'Cai thuốc để cải thiện sức khỏe',
                        8,
                        GETDATE()
                    )
                `;
                console.log(`✅ Assigned member ${memberId} to coach ${coachId}`);
            } else {
                console.log(`⚠️ Member ${memberId} already assigned to coach ${coachId}`);
            }
        }

        // 5. Create some conversation data for chat
        console.log('\n💬 Setting up conversations...');

        for (const member of memberResult.recordset) {
            const memberId = member.UserID;

            // Check if conversation exists
            const existingConv = await sql.query`
                SELECT * FROM Conversations 
                WHERE MemberID = ${memberId} AND CoachID = ${coachId}
            `;

            if (existingConv.recordset.length === 0) {
                await sql.query`
                    INSERT INTO Conversations (MemberID, CoachID, CreatedAt, LastMessageAt, IsActive)
                    VALUES (${memberId}, ${coachId}, GETDATE(), GETDATE(), 1)
                `;
                console.log(`💬 Created conversation for member ${memberId}`);
            }
        }

        // 6. Verify assignments
        console.log('\n🔍 VERIFICATION - Coach-Member Assignments:');
        const assignments = await sql.query`
            SELECT 
                qp.PlanID,
                qp.UserID as MemberID,
                m.FirstName + ' ' + m.LastName as MemberName,
                m.Email as MemberEmail,
                qp.CoachID,
                c.FirstName + ' ' + c.LastName as CoachName,
                qp.Status,
                qp.CreatedAt
            FROM QuitPlans qp
            INNER JOIN Users m ON qp.UserID = m.UserID
            INNER JOIN Users c ON qp.CoachID = c.UserID
            WHERE qp.Status = 'active'
        `;

        console.log('📋 Final assignments:', assignments.recordset);

        // 7. Test the coach members API query
        console.log('\n🧪 Testing coach members API query...');
        const apiTestResult = await sql.query`
            SELECT DISTINCT
                u.UserID,
                u.Email,
                u.FirstName,
                u.LastName,
                u.Role,
                u.PhoneNumber,
                u.Address,
                u.Avatar,
                u.IsActive,
                u.EmailVerified,
                u.CreatedAt,
                u.LastLoginAt,
                qp_latest.PlanID as QuitPlanID,
                qp_latest.StartDate as QuitStartDate,
                qp_latest.TargetDate as QuitTargetDate,
                qp_latest.Status as QuitPlanStatus,
                qp_latest.MotivationLevel,
                qp_latest.CoachID
            FROM Users u
            INNER JOIN (
                SELECT qp.*,
                       ROW_NUMBER() OVER (PARTITION BY qp.UserID ORDER BY qp.CreatedAt DESC) as rn
                FROM QuitPlans qp
                WHERE qp.CoachID = ${coachId}
                    AND qp.Status = 'active'
            ) qp_latest ON u.UserID = qp_latest.UserID AND qp_latest.rn = 1
            WHERE u.Role IN ('guest', 'member') 
                AND u.IsActive = 1
            ORDER BY u.CreatedAt DESC
        `;

        console.log(`✅ API query result: ${apiTestResult.recordset.length} members found for coach`);
        apiTestResult.recordset.forEach(member => {
            console.log(`  - ${member.FirstName} ${member.LastName} (${member.Email})`);
        });

        await sql.close();
        console.log('\n🎉 Setup completed successfully!');

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

setupCoachMembers(); 