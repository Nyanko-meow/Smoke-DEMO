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
            password: 'Tran0210203@'
        }
    }
};

async function createTestPlan() {
    try {
        await sql.connect(config);
        console.log('🔌 Connected to database');

        // Kiểm tra user tồn tại
        const users = await sql.query`
            SELECT UserID, FirstName, LastName, Role, Email 
            FROM Users 
            WHERE UserID IN (2, 3)
            ORDER BY UserID
        `;

        console.log('👥 Found users:', users.recordset);

        // Xóa quit plan cũ nếu có
        await sql.query`
            DELETE FROM QuitPlans 
            WHERE UserID = 2 AND CoachID = 3
        `;

        // Tạo quit plan cho member (UserID=2) với coach (UserID=3)
        const result = await sql.query`
            INSERT INTO QuitPlans (UserID, CoachID, StartDate, TargetDate, Reason, MotivationLevel, DetailedPlan, Status)
            VALUES (2, 3, GETDATE(), DATEADD(DAY, 30, GETDATE()), 'Test chat feature', 8, 'Test plan for chat', 'active')
        `;

        console.log('✅ Created test quit plan for member-coach chat');

        // Kiểm tra data
        const check = await sql.query`
            SELECT p.PlanID, p.UserID, p.CoachID, p.Status,
                   m.FirstName + ' ' + m.LastName as MemberName,
                   c.FirstName + ' ' + c.LastName as CoachName
            FROM QuitPlans p
            JOIN Users m ON p.UserID = m.UserID
            JOIN Users c ON p.CoachID = c.UserID
            WHERE p.UserID = 2 AND p.CoachID = 3 AND p.Status = 'active'
        `;

        console.log('📋 Current active plans:', check.recordset);

        if (check.recordset.length > 0) {
            console.log('🎉 Chat should now work between member and coach!');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Full error:', error);
    } finally {
        await sql.close();
    }
}

createTestPlan(); 