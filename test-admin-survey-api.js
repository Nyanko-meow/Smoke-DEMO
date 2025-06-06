const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test admin token - you'll need to get this from admin login
const ADMIN_TOKEN = 'your_admin_token_here'; // Replace with actual admin token

async function testAdminSurveyAPI() {
    try {
        console.log('🔍 Testing Admin Survey API...');

        // Test 1: Get all surveys list
        console.log('\n1. Testing surveys list...');
        try {
            const response1 = await axios.get(`${BASE_URL}/admin/surveys`, {
                headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
                timeout: 5000
            });
            console.log('✅ Surveys list:', response1.data);
        } catch (error) {
            console.log('❌ Surveys list failed:', error.response?.data || error.message);
        }

        // Test 2: Get specific user survey (Tran Huy - UserID 6)
        console.log('\n2. Testing user 6 (Tran Huy) survey details...');
        try {
            const response2 = await axios.get(`${BASE_URL}/admin/surveys/6`, {
                headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
                timeout: 5000
            });
            console.log('✅ User 6 survey details:', JSON.stringify(response2.data, null, 2));
        } catch (error) {
            console.log('❌ User 6 survey failed:', error.response?.data || error.message);
        }

        // Test 3: Direct database query test (no auth needed)
        console.log('\n3. Testing direct survey data...');
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

        await sql.connect(config);

        const result = await sql.query(`
            SELECT 
                sq.QuestionID,
                sq.QuestionText,
                usa.Answer,
                usa.SubmittedAt
            FROM SurveyQuestions sq
            LEFT JOIN UserSurveyAnswers usa ON sq.QuestionID = usa.QuestionID AND usa.UserID = 6
            ORDER BY sq.QuestionID
        `);

        console.log('✅ Direct database query result:');
        result.recordset.forEach(row => {
            console.log(`  Question ${row.QuestionID}: ${row.QuestionText}`);
            console.log(`  Answer: ${row.Answer || 'No answer'}`);
            console.log(`  Submitted: ${row.SubmittedAt || 'Not answered'}`);
            console.log('  ---');
        });

        await sql.close();

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testAdminSurveyAPI(); 