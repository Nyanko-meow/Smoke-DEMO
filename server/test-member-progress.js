const axios = require('axios');

const baseURL = 'http://localhost:4000/api';

async function testMemberProgress() {
    try {
        console.log('🚀 Testing Member Progress API...\n');

        // Step 1: Login as coach
        console.log('1. Logging in as coach...');
        const loginResponse = await axios.post(`${baseURL}/coaches/login`, {
            email: 'coach@example.com',
            password: 'password'
        });

        if (!loginResponse.data.success) {
            throw new Error('Coach login failed: ' + loginResponse.data.message);
        }

        const token = loginResponse.data.token;
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        console.log('✅ Coach logged in successfully');

        // Step 2: Get list of members first
        console.log('\n2. Getting list of members...');
        const membersResponse = await axios.get(`${baseURL}/coach/members`, { headers });

        if (!membersResponse.data.success || membersResponse.data.data.length === 0) {
            console.log('❌ No members found or failed to get members');
            return;
        }

        const members = membersResponse.data.data;
        console.log(`✅ Found ${members.length} members`);

        // Show first few members
        members.slice(0, 3).forEach((member, index) => {
            console.log(`   ${index + 1}. ${member.fullName} (ID: ${member.id}) - ${member.email}`);
        });

        // Step 3: Test member progress API with first member
        const testMemberId = members[0].id;
        console.log(`\n3. Testing member progress API for member ID: ${testMemberId}...`);

        // Test different time periods
        const testPeriods = [7, 14, 30, 60];

        for (const days of testPeriods) {
            console.log(`\n📊 Testing ${days} days period...`);

            const progressResponse = await axios.get(
                `${baseURL}/coach/members/${testMemberId}/progress?days=${days}`,
                { headers }
            );

            if (progressResponse.data.success) {
                const data = progressResponse.data.data;
                console.log(`✅ Success! Got progress data for ${days} days`);
                console.log(`   Member: ${data.member.fullName}`);
                console.log(`   Progress records: ${data.progressData.length}`);
                console.log(`   Analytics status: ${data.analytics.summary.progressStatus}`);
                console.log(`   Days tracked: ${data.analytics.summary.totalDaysTracked}`);
                console.log(`   Avg cigarettes/day: ${data.analytics.summary.averageCigarettesPerDay}`);
                console.log(`   Money saved: ${data.analytics.summary.currentMoneySaved.toLocaleString('vi-VN')} VNĐ`);
                console.log(`   Smoke-free streak: ${data.analytics.summary.currentSmokeFreeStreak} days`);
                console.log(`   Achievements: ${data.achievements.length} total`);

                // Show trends
                if (data.analytics.trends) {
                    console.log(`   Trends:`);
                    console.log(`     - Cigarettes: ${data.analytics.trends.cigarettesTrend}`);
                    console.log(`     - Craving: ${data.analytics.trends.cravingTrend}`);
                    console.log(`     - Money saving: ${data.analytics.trends.moneySavingTrend}`);
                }

                // Show improvements and concerns
                if (data.analytics.improvements && data.analytics.improvements.length > 0) {
                    console.log(`   Improvements (${data.analytics.improvements.length}):`);
                    data.analytics.improvements.forEach((improvement, i) => {
                        console.log(`     ${i + 1}. ${improvement}`);
                    });
                }

                if (data.analytics.concerns && data.analytics.concerns.length > 0) {
                    console.log(`   Concerns (${data.analytics.concerns.length}):`);
                    data.analytics.concerns.forEach((concern, i) => {
                        console.log(`     ${i + 1}. ${concern}`);
                    });
                }
            } else {
                console.log(`❌ Failed: ${progressResponse.data.message}`);
            }
        }

        // Step 4: Test with invalid member ID
        console.log(`\n4. Testing with invalid member ID...`);
        try {
            await axios.get(`${baseURL}/coach/members/99999/progress`, { headers });
            console.log('❌ Should have failed with invalid member ID');
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('✅ Correctly returned 404 for invalid member ID');
            } else {
                console.log(`❌ Unexpected error: ${error.message}`);
            }
        }

        // Step 5: Test with invalid days parameter
        console.log(`\n5. Testing with invalid days parameter...`);
        try {
            await axios.get(`${baseURL}/coach/members/${testMemberId}/progress?days=500`, { headers });
            console.log('❌ Should have failed with invalid days parameter');
        } catch (error) {
            if (error.response?.status === 400) {
                console.log('✅ Correctly returned 400 for invalid days parameter');
            } else {
                console.log(`❌ Unexpected error: ${error.message}`);
            }
        }

        // Step 6: Test chart data structure
        console.log(`\n6. Testing chart data structure...`);
        const chartResponse = await axios.get(
            `${baseURL}/coach/members/${testMemberId}/progress?days=30`,
            { headers }
        );

        if (chartResponse.data.success) {
            const chartData = chartResponse.data.data.analytics.chartData;
            if (chartData && chartData.daily) {
                console.log('✅ Chart data structure is valid');
                console.log(`   Daily data points: ${chartData.daily.length}`);
                if (chartData.daily.length > 0) {
                    const sample = chartData.daily[0];
                    console.log(`   Sample data point:`, {
                        date: sample.date,
                        cigarettes: sample.cigarettes,
                        craving: sample.craving,
                        moneySaved: sample.moneySaved,
                        daysSmokeFree: sample.daysSmokeFree
                    });
                }
            } else {
                console.log('❌ Chart data structure is invalid');
            }
        }

        console.log('\n🎉 All tests completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the test
if (require.main === module) {
    testMemberProgress();
}

module.exports = { testMemberProgress }; 