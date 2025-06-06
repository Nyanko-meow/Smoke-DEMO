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

async function checkDatabaseSchema() {
    try {
        console.log('🔍 Checking database schema for member survey functionality...');

        await sql.connect(config);
        console.log('✅ Connected to database');

        // Check Users table structure
        console.log('\n📋 Checking Users table structure...');
        const usersSchema = await sql.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Users'
            ORDER BY ORDINAL_POSITION
        `);
        console.log('Users table columns:', usersSchema.recordset);

        // Check QuitPlans table structure  
        console.log('\n📋 Checking QuitPlans table structure...');
        const quitPlansSchema = await sql.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'QuitPlans'
            ORDER BY ORDINAL_POSITION
        `);
        console.log('QuitPlans table columns:', quitPlansSchema.recordset);

        // Check UserMemberships table structure
        console.log('\n📋 Checking UserMemberships table structure...');
        const membershipSchema = await sql.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'UserMemberships'
            ORDER BY ORDINAL_POSITION
        `);
        console.log('UserMemberships table columns:', membershipSchema.recordset);

        // Check SurveyQuestions table structure
        console.log('\n📋 Checking SurveyQuestions table structure...');
        const surveyQuestionsSchema = await sql.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'SurveyQuestions'
            ORDER BY ORDINAL_POSITION
        `);
        console.log('SurveyQuestions table columns:', surveyQuestionsSchema.recordset);

        // Check UserSurveyAnswers table structure
        console.log('\n📋 Checking UserSurveyAnswers table structure...');
        const surveyAnswersSchema = await sql.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'UserSurveyAnswers'
            ORDER BY ORDINAL_POSITION
        `);
        console.log('UserSurveyAnswers table columns:', surveyAnswersSchema.recordset);

        // Check specific data for member ID 2
        console.log('\n🔍 Checking data for Member User (ID: 2)...');
        const member2Data = await sql.query(`
            SELECT 
                u.UserID, u.FirstName, u.LastName, u.Email, u.Role,
                qp.QuitPlanID, qp.CoachID, qp.Status as QuitPlanStatus, qp.StartDate as AssignmentDate
            FROM Users u
            LEFT JOIN QuitPlans qp ON u.UserID = qp.UserID
            WHERE u.UserID = 2
        `);
        console.log('Member 2 data:', member2Data.recordset);

        // Check coach assignment for member 2
        const member2Assignment = await sql.query(`
            SELECT * FROM QuitPlans WHERE UserID = 2 AND Status = 'active'
        `);
        console.log('Member 2 active assignments:', member2Assignment.recordset);

        // Test the exact query from the API
        console.log('\n🧪 Testing exact API query for member 2...');
        const coachId = 1; // Assuming coach ID is 1
        const testQuery = await sql.query(`
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
            WHERE u.UserID = 2
            AND u.Role IN ('member', 'guest')
            AND qp.CoachID = ${coachId}
            AND qp.Status = 'active'
        `);
        console.log('Test query result for member 2:', testQuery.recordset);

        // Test survey questions query
        console.log('\n🧪 Testing survey questions query...');
        const surveyTest = await sql.query(`
            SELECT 
                sq.QuestionID,
                sq.QuestionText,
                sq.QuestionType,
                sq.Category,
                usa.Answer as AnswerText,
                usa.SubmittedAt
            FROM SurveyQuestions sq
            LEFT JOIN UserSurveyAnswers usa ON sq.QuestionID = usa.QuestionID AND usa.UserID = 2
            ORDER BY sq.QuestionID
        `);
        console.log(`Survey questions test - found ${surveyTest.recordset.length} questions`);
        if (surveyTest.recordset.length > 0) {
            console.log('First 3 questions:', surveyTest.recordset.slice(0, 3));
        }

    } catch (error) {
        console.error('❌ Database check error:', error);
    } finally {
        await sql.close();
    }
}

checkDatabaseSchema(); 