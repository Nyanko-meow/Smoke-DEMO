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

async function checkSurveySchema() {
    try {
        await sql.connect(config);
        console.log('🔗 Connected to database');

        console.log('\n1. 📋 UserSurveyAnswers table schema:');
        const userSurveySchema = await sql.query`
            SELECT 
                COLUMN_NAME,
                DATA_TYPE,
                IS_NULLABLE,
                CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'UserSurveyAnswers'
            ORDER BY ORDINAL_POSITION
        `;

        userSurveySchema.recordset.forEach(col => {
            console.log(`- ${col.COLUMN_NAME}: ${col.DATA_TYPE}`);
        });

        console.log('\n2. 📋 SurveyQuestions table schema:');
        const surveyQuestionsSchema = await sql.query`
            SELECT 
                COLUMN_NAME,
                DATA_TYPE,
                IS_NULLABLE,
                CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'SurveyQuestions'
            ORDER BY ORDINAL_POSITION
        `;

        surveyQuestionsSchema.recordset.forEach(col => {
            console.log(`- ${col.COLUMN_NAME}: ${col.DATA_TYPE}`);
        });

        console.log('\n3. 📊 Sample data from UserSurveyAnswers:');
        const sampleData = await sql.query`
            SELECT TOP 3 * 
            FROM UserSurveyAnswers
            WHERE UserID = 6
        `;

        sampleData.recordset.forEach(row => {
            console.log(`- Question ${row.QuestionID}: "${row.Answer.substring(0, 50)}..."`);
        });

        console.log('\n4. 📋 Sample data from SurveyQuestions:');
        const sampleQuestions = await sql.query`
            SELECT TOP 3 * 
            FROM SurveyQuestions
        `;

        console.log('SurveyQuestions sample:', sampleQuestions.recordset);

        console.log('\n5. 🧪 Test basic query without Category:');
        const basicQuery = await sql.query`
            SELECT 
                sq.QuestionID,
                sq.QuestionText,
                usa.Answer as AnswerText,
                usa.SubmittedAt
            FROM SurveyQuestions sq
            LEFT JOIN UserSurveyAnswers usa ON sq.QuestionID = usa.QuestionID AND usa.UserID = 6
            ORDER BY sq.QuestionID
        `;

        console.log(`Found ${basicQuery.recordset.length} questions`);
        const answered = basicQuery.recordset.filter(q => q.AnswerText).length;
        console.log(`${answered} answered`);

        await sql.close();

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkSurveySchema(); 