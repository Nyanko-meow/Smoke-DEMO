const axios = require('axios');

async function testMemberSurveyAPI() {
    try {
        console.log('🧪 Testing member survey API...');

        // First login as coach
        const loginResponse = await axios.post('http://localhost:4000/api/coach/login', {
            email: 'coach@example.com',
            password: 'H12345678@'
        });

        if (!loginResponse.data.success) {
            console.log('❌ Login failed');
            return;
        }

        const token = loginResponse.data.token;
        console.log('✅ Coach logged in successfully');

        // Test getting member survey for Tran Huy (ID: 6)
        console.log('\n🔍 Testing member survey for Tran Huy (ID: 6)...');

        try {
            const memberSurveyResponse = await axios.get('http://localhost:4000/api/coach/member-surveys/6', {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('📋 Member survey response:', memberSurveyResponse.data);

            if (memberSurveyResponse.data.answers) {
                console.log(`\n✅ Found ${memberSurveyResponse.data.answers.length} survey questions`);
                console.log('📊 Answered questions:',
                    memberSurveyResponse.data.answers.filter(a => a.AnswerText && a.AnswerText.trim()).length
                );

                // Show first few answers as sample
                console.log('\n📝 Sample answers:');
                memberSurveyResponse.data.answers.slice(0, 3).forEach((answer, index) => {
                    console.log(`${index + 1}. ${answer.QuestionText}`);
                    console.log(`   Answer: ${answer.AnswerText || 'Not answered'}`);
                    console.log(`   Submitted: ${answer.SubmittedAt || 'N/A'}`);
                    console.log('');
                });
            }

        } catch (error) {
            console.error('❌ Member survey API error for Tran Huy:');
            console.error('Status:', error.response?.status);
            console.error('Data:', error.response?.data);
            console.error('Full error:', error.message);
        }

        // Test getting member survey for Member User (ID: 2)
        console.log('\n🔍 Testing member survey for Member User (ID: 2)...');

        try {
            const memberSurveyResponse2 = await axios.get('http://localhost:4000/api/coach/member-surveys/2', {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('📋 Member User survey response:', memberSurveyResponse2.data);

        } catch (error) {
            console.error('❌ Member User survey API error:');
            console.error('Status:', error.response?.status);
            console.error('Data:', error.response?.data);
            console.error('Full error:', error.message);
        }

        // Also test with a direct database query to verify assignments
        console.log('\n🔍 Testing direct database verification...');
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

        try {
            await sql.connect(config);

            const assignments = await sql.query`
                SELECT 
                    u.UserID,
                    u.FirstName + ' ' + u.LastName as MemberName,
                    u.Email,
                    qp.CoachID,
                    qp.Status as QuitPlanStatus,
                    c.FirstName + ' ' + c.LastName as CoachName
                FROM Users u
                INNER JOIN QuitPlans qp ON u.UserID = qp.UserID
                LEFT JOIN Users c ON qp.CoachID = c.UserID
                WHERE qp.Status = 'active' AND qp.CoachID = 3
            `;

            console.log('📋 Current assignments for coach ID 3:');
            assignments.recordset.forEach(assignment => {
                console.log(`  - Member ${assignment.MemberName} (ID: ${assignment.UserID}) -> Coach ${assignment.CoachName}`);
            });

            await sql.close();

        } catch (dbError) {
            console.error('❌ Database verification error:', dbError.message);
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testMemberSurveyAPI(); 