const axios = require('axios');

async function debugMemberSurveyAPI() {
    try {
        console.log('🐛 Debug Member Survey API - Testing 500 Error...');

        // First login as coach to get token
        console.log('1️⃣ Logging in as coach...');
        const loginResponse = await axios.post('http://localhost:4000/api/coach/login', {
            email: 'coach@example.com',
            password: 'H12345678@'
        });

        if (!loginResponse.data.success) {
            console.log('❌ Coach login failed:', loginResponse.data);
            return;
        }

        const token = loginResponse.data.token;
        console.log('✅ Coach logged in successfully');

        // Test getting member surveys list first
        console.log('\n2️⃣ Getting member surveys list...');
        const memberListResponse = await axios.get('http://localhost:4000/api/coach/member-surveys', {
            headers: { Authorization: `Bearer ${token}` },
            params: { page: 1, limit: 10 }
        });

        console.log('📋 Member surveys list:', memberListResponse.data);

        if (memberListResponse.data.members && memberListResponse.data.members.length > 0) {
            // Test each member ID that appears in the list
            for (const member of memberListResponse.data.members) {
                console.log(`\n3️⃣ Testing member survey details for: ${member.FirstName} ${member.LastName} (ID: ${member.UserID})`);

                try {
                    const memberSurveyResponse = await axios.get(`http://localhost:4000/api/coach/member-surveys/${member.UserID}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    console.log(`✅ Success for member ${member.UserID}:`, {
                        memberInfo: memberSurveyResponse.data.member,
                        answersCount: memberSurveyResponse.data.answers?.length || 0
                    });

                } catch (error) {
                    console.log(`❌ ERROR for member ${member.UserID} (${member.FirstName} ${member.LastName}):`);
                    console.log(`   Status: ${error.response?.status}`);
                    console.log(`   Message: ${error.response?.data?.message || error.message}`);
                    console.log(`   Full response:`, error.response?.data);

                    // This is likely where our 500 error is happening
                    if (error.response?.status === 500) {
                        console.log('🔍 500 Error Details:');
                        console.log('   URL:', `http://localhost:4000/api/coach/member-surveys/${member.UserID}`);
                        console.log('   Headers:', { Authorization: `Bearer ${token.substring(0, 20)}...` });
                        console.log('   Member UserID:', member.UserID, typeof member.UserID);
                    }
                }
            }
        } else {
            console.log('❌ No members found in the list');
        }

    } catch (error) {
        console.error('❌ Debug script error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the debug script
debugMemberSurveyAPI(); 