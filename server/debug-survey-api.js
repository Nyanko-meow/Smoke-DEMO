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

async function debugSurveyAPI() {
    try {
        await sql.connect(config);
        console.log('🔗 Connected to database');

        const memberId = 6;
        const coachId = 3;

        console.log(`\n1. 🔍 Checking assignment for member ${memberId} and coach ${coachId}...`);

        const assignmentCheck = await sql.query`
            SELECT 
                u.UserID, 
                u.FirstName, 
                u.LastName, 
                u.Email,
                u.Role,
                qp.Status as QuitPlanStatus,
                qp.StartDate as AssignmentDate,
                qp.CoachID,
                um.Status as MembershipStatus,
                um.StartDate as MembershipStartDate,
                um.EndDate as MembershipEndDate
            FROM Users u
            INNER JOIN QuitPlans qp ON u.UserID = qp.UserID
            LEFT JOIN UserMemberships um ON u.UserID = um.UserID AND um.Status = 'active'
            WHERE u.UserID = ${memberId}
            AND u.Role IN ('member', 'guest')
            AND qp.CoachID = ${coachId}
            AND qp.Status = 'active'
        `;

        console.log('📋 Assignment check result:', assignmentCheck.recordset);

        if (assignmentCheck.recordset.length === 0) {
            console.log('❌ No assignment found');
            return;
        }

        console.log(`\n2. 📊 Checking survey questions and answers...`);

        const answersResult = await sql.query`
            SELECT 
                sq.QuestionID,
                sq.QuestionText,
                sq.QuestionType,
                sq.Category,
                usa.Answer as AnswerText,
                usa.SubmittedAt
            FROM SurveyQuestions sq
            LEFT JOIN UserSurveyAnswers usa ON sq.QuestionID = usa.QuestionID AND usa.UserID = ${memberId}
            ORDER BY sq.QuestionID
        `;

        console.log(`✅ Found ${answersResult.recordset.length} survey questions`);

        if (answersResult.recordset.length === 0) {
            console.log('⚠️ No survey questions found. Checking table names...');

            // Check table names
            const tables = await sql.query`
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_TYPE = 'BASE TABLE'
                AND TABLE_NAME LIKE '%Survey%'
                ORDER BY TABLE_NAME
            `;

            console.log('📋 Survey-related tables:', tables.recordset);
            return;
        }

        const answeredCount = answersResult.recordset.filter(a => a.AnswerText && a.AnswerText.trim()).length;
        console.log(`📝 Member has answered ${answeredCount} questions`);

        console.log(`\n3. 📑 Sample questions and answers:`);
        answersResult.recordset.slice(0, 5).forEach((item, index) => {
            console.log(`${index + 1}. ${item.QuestionText}`);
            console.log(`   Answer: ${item.AnswerText || 'Not answered'}`);
            console.log(`   Submitted: ${item.SubmittedAt || 'N/A'}`);
            console.log('');
        });

        console.log('\n✅ Survey data debug completed successfully!');

        await sql.close();

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

debugSurveyAPI(); 