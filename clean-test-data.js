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

async function cleanTestData() {
    try {
        await sql.connect(config);
        console.log('🧹 Cleaning test data...');

        // Delete all answers for user ID = 2 (the hardcoded user)
        const deleteResult = await sql.query(`
            DELETE FROM UserSurveyAnswers 
            WHERE UserID = 2
        `);
        console.log(`🗑️ Deleted ${deleteResult.rowsAffected[0]} answers for user ID = 2`);

        // Check current data for user ID = 6 (Tran Huy)
        const user6Data = await sql.query(`
            SELECT 
                u.UserID, u.FirstName, u.LastName, u.Email,
                usa.QuestionID, usa.Answer, usa.SubmittedAt
            FROM Users u
            LEFT JOIN UserSurveyAnswers usa ON u.UserID = usa.UserID
            WHERE u.UserID = 6
            ORDER BY usa.QuestionID
        `);
        console.log('📋 Current data for user ID = 6 (Tran Huy):');
        console.table(user6Data.recordset);

        // Check if there's any remaining data for user ID = 2
        const user2Data = await sql.query(`
            SELECT COUNT(*) as Count FROM UserSurveyAnswers WHERE UserID = 2
        `);
        console.log(`🔍 Remaining answers for user ID = 2: ${user2Data.recordset[0].Count}`);

        await sql.close();
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

cleanTestData(); 