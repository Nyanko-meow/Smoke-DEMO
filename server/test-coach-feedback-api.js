const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:4000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'smokeking_secret_key_ultra_secure_2024';

async function testCoachFeedbackAPI() {
    console.log('🧪 Testing Coach Feedback API...\n');

    try {
        // 1. Create coach token
        console.log('🔑 Creating coach token...');
        const coachPayload = {
            id: 3, // coach@example.com UserID
            email: 'coach@example.com',
            role: 'coach'
        };

        const coachToken = jwt.sign(coachPayload, JWT_SECRET, { expiresIn: '24h' });
        console.log('✅ Coach token created');

        // 2. Test get coach feedback endpoint
        console.log('\n📋 Testing GET /api/coach/feedback...');
        try {
            const response = await axios.get(`${BASE_URL}/coach/feedback`, {
                headers: {
                    'Authorization': `Bearer ${coachToken}`
                },
                params: {
                    page: 1,
                    limit: 10,
                    status: 'active'
                }
            });

            if (response.status === 200) {
                console.log('✅ GET /api/coach/feedback - SUCCESS');
                console.log('📊 Response data:');
                console.log('   - Total feedback:', response.data.data.pagination.total);
                console.log('   - Average rating:', response.data.data.statistics.averageRating);
                console.log('   - Total reviews:', response.data.data.statistics.totalReviews);
                console.log('   - Rating distribution:', response.data.data.statistics.ratingDistribution);

                if (response.data.data.feedback.length > 0) {
                    console.log('   - Sample feedback:');
                    const sample = response.data.data.feedback[0];
                    console.log(`     * From: ${sample.MemberName}`);
                    console.log(`     * Rating: ${sample.Rating}/5`);
                    console.log(`     * Comment: ${sample.Comment?.substring(0, 50)}...`);
                }
            } else {
                console.log('❌ GET /api/coach/feedback - FAILED');
                console.log('   Status:', response.status);
            }
        } catch (error) {
            console.log('❌ GET /api/coach/feedback - ERROR');
            console.log('   Error:', error.response?.data?.message || error.message);
            console.log('   Status:', error.response?.status);
        }

        // 3. Test with different filters
        console.log('\n🔍 Testing with different filters...');

        const filters = ['active', 'hidden', 'deleted'];
        for (const status of filters) {
            try {
                const response = await axios.get(`${BASE_URL}/coach/feedback`, {
                    headers: {
                        'Authorization': `Bearer ${coachToken}`
                    },
                    params: {
                        page: 1,
                        limit: 5,
                        status: status
                    }
                });

                console.log(`✅ Filter "${status}": ${response.data.data.pagination.total} feedback(s)`);
            } catch (error) {
                console.log(`❌ Filter "${status}": ${error.response?.data?.message || error.message}`);
            }
        }

        // 4. Test pagination
        console.log('\n📄 Testing pagination...');
        try {
            const response = await axios.get(`${BASE_URL}/coach/feedback`, {
                headers: {
                    'Authorization': `Bearer ${coachToken}`
                },
                params: {
                    page: 1,
                    limit: 2,
                    status: 'active'
                }
            });

            console.log('✅ Pagination test:');
            console.log('   - Page:', response.data.data.pagination.page);
            console.log('   - Limit:', response.data.data.pagination.limit);
            console.log('   - Total:', response.data.data.pagination.total);
            console.log('   - Total pages:', response.data.data.pagination.totalPages);
            console.log('   - Items returned:', response.data.data.feedback.length);
        } catch (error) {
            console.log('❌ Pagination test failed:', error.response?.data?.message || error.message);
        }

        // 5. Test unauthorized access
        console.log('\n🔒 Testing unauthorized access...');
        try {
            const response = await axios.get(`${BASE_URL}/coach/feedback`);
            console.log('❌ Unauthorized access should have failed but succeeded');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Unauthorized access properly blocked');
            } else {
                console.log('❌ Unexpected error:', error.response?.data?.message || error.message);
            }
        }

        // 6. Test with member token (should fail)
        console.log('\n👤 Testing with member token (should fail)...');
        const memberPayload = {
            id: 2,
            email: 'member@example.com',
            role: 'member'
        };
        const memberToken = jwt.sign(memberPayload, JWT_SECRET, { expiresIn: '24h' });

        try {
            const response = await axios.get(`${BASE_URL}/coach/feedback`, {
                headers: {
                    'Authorization': `Bearer ${memberToken}`
                }
            });
            console.log('❌ Member access should have failed but succeeded');
        } catch (error) {
            if (error.response?.status === 403) {
                console.log('✅ Member access properly blocked (403 Forbidden)');
            } else {
                console.log('❌ Unexpected error:', error.response?.data?.message || error.message);
            }
        }

        console.log('\n🎉 Coach Feedback API test completed!');

    } catch (error) {
        console.error('💥 Test failed with error:', error.message);
    }
}

// Run the test
testCoachFeedbackAPI(); 