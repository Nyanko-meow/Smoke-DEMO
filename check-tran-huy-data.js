const sql = require('mssql');

const config = {
    user: 'sa',
    password: '12345',
    server: 'localhost',
    database: 'SMOKEKING',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function checkTranHuyData() {
    try {
        await sql.connect(config);
        console.log('🔍 Checking Tran Huy data...');

        const userId = 6; // Tran Huy's UserID

        // Check survey answers
        const surveyQuery = `
            SELECT usa.*, sq.QuestionText 
            FROM UserSurveyAnswers usa
            LEFT JOIN SurveyQuestions sq ON usa.QuestionID = sq.QuestionID
            WHERE usa.UserID = ${userId}
            ORDER BY usa.QuestionID
        `;
        const surveyResult = await sql.query(surveyQuery);
        console.log('📋 Survey answers for Tran Huy:', surveyResult.recordset);

        // Check quit plans
        const quitPlanQuery = `
            SELECT * FROM QuitPlans WHERE UserID = ${userId}
        `;
        const quitPlanResult = await sql.query(quitPlanQuery);
        console.log('🎯 Quit plans for Tran Huy:', quitPlanResult.recordset);

        // If no survey data, create some sample data
        if (surveyResult.recordset.length === 0) {
            console.log('📝 Creating sample survey data for Tran Huy...');

            // First, check what questions exist
            const questionsQuery = `SELECT * FROM SurveyQuestions ORDER BY QuestionID`;
            const questionsResult = await sql.query(questionsQuery);
            console.log('❓ Available questions:', questionsResult.recordset);

            if (questionsResult.recordset.length > 0) {
                // Create sample answers for first few questions
                const sampleAnswers = [
                    { questionId: 1, answer: '15 điếu/ngày' },
                    { questionId: 2, answer: '5 năm' },
                    { questionId: 3, answer: 'Vì sức khỏe' },
                    { questionId: 4, answer: '8/10' }
                ];

                for (const answer of sampleAnswers) {
                    const insertQuery = `
                        INSERT INTO UserSurveyAnswers (UserID, QuestionID, Answer, SubmittedAt)
                        VALUES (${userId}, ${answer.questionId}, '${answer.answer}', GETDATE())
                    `;
                    await sql.query(insertQuery);
                }
                console.log('✅ Sample survey answers created');
            }
        }

        // If no quit plan, create one
        if (quitPlanResult.recordset.length === 0) {
            console.log('📝 Creating sample quit plan for Tran Huy...');

            const insertPlanQuery = `
                INSERT INTO QuitPlans (UserID, Reason, MotivationLevel, StartDate, TargetDate, Status, DetailedPlan, CreatedAt)
                VALUES (
                    ${userId}, 
                    'Cải thiện sức khỏe và tiết kiệm tiền',
                    8,
                    GETDATE(),
                    DATEADD(day, 30, GETDATE()),
                    'Active',
                    'Kế hoạch cai thuốc dần dần trong 30 ngày với sự hỗ trợ của gia đình',
                    GETDATE()
                )
            `;
            await sql.query(insertPlanQuery);
            console.log('✅ Sample quit plan created');
        }

        // Re-check data after creation
        const finalSurveyResult = await sql.query(surveyQuery);
        const finalQuitPlanResult = await sql.query(quitPlanQuery);

        console.log('📊 Final survey data:', finalSurveyResult.recordset.length, 'answers');
        console.log('🎯 Final quit plan data:', finalQuitPlanResult.recordset.length, 'plans');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sql.close();
    }
}

checkTranHuyData(); 