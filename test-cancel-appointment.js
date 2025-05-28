const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

// Test với token thật từ console log hoặc localStorage
const memberToken = 'YOUR_MEMBER_TOKEN_HERE'; // Replace with actual token

async function testCancelAppointment() {
    try {
        console.log('🧪 Testing Cancel Appointment API...\n');

        // Step 1: Test server connectivity
        console.log('1️⃣ Testing server connectivity...');
        try {
            const healthCheck = await axios.get(`${BASE_URL}/api/test`);
            console.log('✅ Server is running');
        } catch (error) {
            console.error('❌ Server not accessible:', error.message);
            return;
        }

        // Step 2: Get appointments list first
        console.log('\n2️⃣ Getting appointments list...');
        try {
            const appointmentsResponse = await axios.get(`${BASE_URL}/api/chat/appointments`, {
                headers: {
                    'Authorization': `Bearer ${memberToken}`
                }
            });

            console.log('✅ Appointments loaded:', appointmentsResponse.data.data?.length || 0);

            if (appointmentsResponse.data.data && appointmentsResponse.data.data.length > 0) {
                const testAppointment = appointmentsResponse.data.data[0];
                console.log('📋 Test appointment:', {
                    id: testAppointment.id,
                    status: testAppointment.status,
                    date: testAppointment.appointmentDate
                });

                // Step 3: Test PATCH method
                console.log('\n3️⃣ Testing PATCH cancel method...');
                try {
                    const patchResponse = await axios.patch(
                        `${BASE_URL}/api/chat/appointments/${testAppointment.id}/cancel`,
                        {},
                        {
                            headers: {
                                'Authorization': `Bearer ${memberToken}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );
                    console.log('✅ PATCH method successful:', patchResponse.data.message);
                    return; // Success, no need to try other methods
                } catch (patchError) {
                    console.error('❌ PATCH failed:', {
                        status: patchError.response?.status,
                        message: patchError.response?.data?.message || patchError.message,
                        code: patchError.code
                    });
                }

                // Step 4: Test POST fallback
                console.log('\n4️⃣ Testing POST fallback method...');
                try {
                    const postResponse = await axios.post(
                        `${BASE_URL}/api/chat/appointments/${testAppointment.id}/cancel`,
                        { action: 'cancel' },
                        {
                            headers: {
                                'Authorization': `Bearer ${memberToken}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );
                    console.log('✅ POST method successful:', postResponse.data.message);
                    return; // Success
                } catch (postError) {
                    console.error('❌ POST failed:', {
                        status: postError.response?.status,
                        message: postError.response?.data?.message || postError.message,
                        code: postError.code
                    });
                }

                // Step 5: Test PUT fallback
                console.log('\n5️⃣ Testing PUT fallback method...');
                try {
                    const putResponse = await axios.put(
                        `${BASE_URL}/api/chat/appointments/${testAppointment.id}`,
                        { status: 'cancelled' },
                        {
                            headers: {
                                'Authorization': `Bearer ${memberToken}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );
                    console.log('✅ PUT method successful:', putResponse.data.message);
                } catch (putError) {
                    console.error('❌ PUT failed:', {
                        status: putError.response?.status,
                        message: putError.response?.data?.message || putError.message,
                        code: putError.code
                    });
                }

                // Step 6: Test with fetch API
                console.log('\n6️⃣ Testing with native fetch...');
                try {
                    const fetchResponse = await fetch(`${BASE_URL}/api/chat/appointments/${testAppointment.id}/cancel`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${memberToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({})
                    });

                    if (fetchResponse.ok) {
                        const data = await fetchResponse.json();
                        console.log('✅ Fetch method successful:', data.message);
                    } else {
                        console.error('❌ Fetch failed:', fetchResponse.status, fetchResponse.statusText);
                    }
                } catch (fetchError) {
                    console.error('❌ Fetch failed:', fetchError.message);
                }

            } else {
                console.log('⚠️  No appointments found to test cancel');
            }

        } catch (authError) {
            console.error('❌ Auth failed:', {
                status: authError.response?.status,
                message: authError.response?.data?.message || authError.message
            });
        }

        // Step 7: Test CORS preflight
        console.log('\n7️⃣ Testing CORS preflight...');
        try {
            const optionsResponse = await axios.options(`${BASE_URL}/api/chat/appointments/1/cancel`);
            console.log('✅ CORS preflight successful:', optionsResponse.status);
        } catch (error) {
            console.error('❌ CORS preflight failed:', error.message);
        }

    } catch (error) {
        console.error('💥 Test suite failed:', error.message);
    }
}

async function testServerCors() {
    console.log('\n🌐 Testing Server CORS Configuration...');

    const testEndpoints = [
        { method: 'GET', url: '/api/chat/appointments' },
        { method: 'PATCH', url: '/api/chat/appointments/1/cancel' },
        { method: 'POST', url: '/api/chat/appointments/1/cancel' },
        { method: 'PUT', url: '/api/chat/appointments/1' },
        { method: 'OPTIONS', url: '/api/chat/appointments/1/cancel' }
    ];

    for (const endpoint of testEndpoints) {
        try {
            const response = await axios({
                method: endpoint.method,
                url: `${BASE_URL}${endpoint.url}`,
                headers: {
                    'Authorization': `Bearer ${memberToken}`,
                    'Content-Type': 'application/json',
                    'Origin': 'http://localhost:3000'
                },
                data: endpoint.method !== 'GET' && endpoint.method !== 'OPTIONS' ? {} : undefined
            });
            console.log(`✅ ${endpoint.method} ${endpoint.url}:`, response.status);
        } catch (error) {
            console.error(`❌ ${endpoint.method} ${endpoint.url}:`, {
                status: error.response?.status,
                message: error.response?.data?.message || error.message,
                headers: error.response?.headers
            });
        }
    }
}

// Main execution
if (require.main === module) {
    console.log('🚀 Starting Cancel Appointment Test Suite...');
    console.log('📝 Make sure to replace memberToken with actual token from localStorage');
    console.log('🔧 Make sure server is running on port 4000\n');

    testCancelAppointment()
        .then(() => {
            console.log('\n' + '='.repeat(50));
            return testServerCors();
        })
        .then(() => {
            console.log('\n✨ Test suite completed');
        })
        .catch(err => {
            console.error('\n💥 Test suite failed:', err.message);
        });
}

module.exports = { testCancelAppointment, testServerCors }; 