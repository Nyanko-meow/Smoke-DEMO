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

async function fixSurveySchema() {
    try {
        console.log('🔧 Fixing survey database schema issues...');

        await sql.connect(config);
        console.log('✅ Connected to database');

        // 1. Fix SurveyQuestions table - add missing columns
        console.log('\n📋 Checking and fixing SurveyQuestions table...');

        // Check if QuestionType column exists
        const questionTypeExists = await sql.query(`
            SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'SurveyQuestions' AND COLUMN_NAME = 'QuestionType'
        `);

        if (questionTypeExists.recordset[0].count === 0) {
            console.log('Adding QuestionType column...');
            await sql.query(`
                ALTER TABLE SurveyQuestions 
                ADD QuestionType NVARCHAR(50) NULL
            `);

            // Update existing records with default value
            await sql.query(`
                UPDATE SurveyQuestions 
                SET QuestionType = 'text'
                WHERE QuestionType IS NULL
            `);
            console.log('✅ Added QuestionType column');
        } else {
            console.log('✅ QuestionType column already exists');
        }

        // Check if Category column exists
        const categoryExists = await sql.query(`
            SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'SurveyQuestions' AND COLUMN_NAME = 'Category'
        `);

        if (categoryExists.recordset[0].count === 0) {
            console.log('Adding Category column...');
            await sql.query(`
                ALTER TABLE SurveyQuestions 
                ADD Category NVARCHAR(100) NULL
            `);

            // Update existing records with default value
            await sql.query(`
                UPDATE SurveyQuestions 
                SET Category = 'general'
                WHERE Category IS NULL
            `);
            console.log('✅ Added Category column');
        } else {
            console.log('✅ Category column already exists');
        }

        // 2. Check QuitPlans table structure
        console.log('\n📋 Checking QuitPlans table...');
        const quitPlansColumns = await sql.query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'QuitPlans'
            ORDER BY ORDINAL_POSITION
        `);
        console.log('QuitPlans columns:', quitPlansColumns.recordset.map(c => c.COLUMN_NAME));

        // Check if we need to add CoachID column to QuitPlans
        const coachIdExists = await sql.query(`
            SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'QuitPlans' AND COLUMN_NAME = 'CoachID'
        `);

        if (coachIdExists.recordset[0].count === 0) {
            console.log('Adding CoachID column to QuitPlans...');
            await sql.query(`
                ALTER TABLE QuitPlans 
                ADD CoachID INT NULL
            `);

            // Set default coach ID (assuming coach user ID is 1)
            await sql.query(`
                UPDATE QuitPlans 
                SET CoachID = 1
                WHERE CoachID IS NULL
            `);
            console.log('✅ Added CoachID column');
        } else {
            console.log('✅ CoachID column already exists');
        }

        // Check if we need to add Status column to QuitPlans
        const statusExists = await sql.query(`
            SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'QuitPlans' AND COLUMN_NAME = 'Status'
        `);

        if (statusExists.recordset[0].count === 0) {
            console.log('Adding Status column to QuitPlans...');
            await sql.query(`
                ALTER TABLE QuitPlans 
                ADD Status NVARCHAR(20) NULL
            `);

            // Set default status
            await sql.query(`
                UPDATE QuitPlans 
                SET Status = 'active'
                WHERE Status IS NULL
            `);
            console.log('✅ Added Status column');
        } else {
            console.log('✅ Status column already exists');
        }

        // 3. Verify the fixes by testing queries
        console.log('\n🧪 Testing fixed queries...');

        // Test survey questions query
        const surveyTest = await sql.query(`
            SELECT 
                sq.QuestionID,
                sq.QuestionText,
                sq.QuestionType,
                sq.Category
            FROM SurveyQuestions sq
            ORDER BY sq.QuestionID
        `);
        console.log(`✅ Survey questions query works - found ${surveyTest.recordset.length} questions`);

        // Test QuitPlans with coach assignment
        const quitPlansTest = await sql.query(`
            SELECT 
                qp.PlanID,
                qp.UserID,
                qp.CoachID,
                qp.Status,
                qp.StartDate
            FROM QuitPlans qp
            WHERE qp.Status = 'active'
        `);
        console.log(`✅ QuitPlans query works - found ${quitPlansTest.recordset.length} active plans`);

        // Test the full member survey query
        console.log('\n🧪 Testing full member survey query...');
        const fullTest = await sql.query(`
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
        console.log(`✅ Full survey query works - found ${fullTest.recordset.length} questions for member 2`);

        console.log('\n🎉 Schema fixes completed successfully!');

    } catch (error) {
        console.error('❌ Schema fix error:', error);
    } finally {
        await sql.close();
    }
}

fixSurveySchema(); 