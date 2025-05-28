const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

// Test member credentials - replace with real token
const memberToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJVc2VySUQiOjE3LCJSb2xlIjoibWVtYmVyIiwiaWF0IjoxNzM0NzEzMzQ3LCJleHAiOjE3MzQ3OTk3NDd9.N4Q1YYXjNJhq6TDwcqm_Sb2srhHShwdVc7BpOHInOJg';

async function testAppointmentCancel() {
    try {
        console.log('🧪 Testing Appointment Cancel API...\n');

        // Step 1: Test basic connectivity
        console.log('1️⃣ Testing basic server connectivity...');
        try {
            const healthCheck = await axios.get(`${BASE_URL}/api/test`);
            console.log('✅ Server is running:', healthCheck.data.message);
        } catch (error) {
            console.error('❌ Server not accessible:', error.message);
            return;
        }

        // Step 2: Test auth middleware
        console.log('\n2️⃣ Testing authentication...');
        try {
            const authTest = await axios.get(`${BASE_URL}/api/chat/appointments`, {
                headers: {
                    'Authorization': `Bearer ${memberToken}`
                }
            });
            console.log('✅ Auth working, appointments loaded:', authTest.data.data?.length || 0);

            if (authTest.data.data && authTest.data.data.length > 0) {
                const testAppointment = authTest.data.data[0];
                console.log('📋 First appointment:', {
                    id: testAppointment.id,
                    status: testAppointment.status,
                    date: testAppointment.appointmentDate
                });

                // Step 3: Test cancel API
                console.log('\n3️⃣ Testing cancel appointment...');
                try {
                    const cancelResponse = await axios.patch(
                        `${BASE_URL}/api/chat/appointments/${testAppointment.id}/cancel`,
                        {},
                        {
                            headers: {
                                'Authorization': `Bearer ${memberToken}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );
                    console.log('✅ Cancel successful:', cancelResponse.data);
                } catch (cancelError) {
                    console.error('❌ Cancel failed:', {
                        status: cancelError.response?.status,
                        message: cancelError.response?.data?.message || cancelError.message,
                        data: cancelError.response?.data
                    });
                }
            } else {
                console.log('⚠️  No appointments found to test cancel');
            }

        } catch (error) {
            console.error('❌ Auth failed:', {
                status: error.response?.status,
                message: error.response?.data?.message || error.message
            });
        }

        // Step 4: Test CORS options
        console.log('\n4️⃣ Testing CORS preflight...');
        try {
            const optionsResponse = await axios.options(`${BASE_URL}/api/chat/appointments/1/cancel`);
            console.log('✅ CORS preflight successful:', optionsResponse.status);
        } catch (error) {
            console.error('❌ CORS preflight failed:', error.message);
        }

        // Step 5: Test without auth
        console.log('\n5️⃣ Testing without authentication...');
        try {
            const noAuthResponse = await axios.patch(`${BASE_URL}/api/chat/appointments/1/cancel`, {});
            console.log('🤔 Unexpected success without auth:', noAuthResponse.data);
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Correctly rejected without auth:', error.response.status);
            } else {
                console.error('❌ Unexpected error:', error.response?.status, error.message);
            }
        }

    } catch (error) {
        console.error('💥 Test failed:', error.message);
    }
}

async function testCORSManually() {
    console.log('\n🌐 Manual CORS Test...');

    try {
        // Manual request with all headers
        const response = await axios({
            method: 'PATCH',
            url: `${BASE_URL}/api/chat/appointments/1/cancel`,
            headers: {
                'Authorization': `Bearer ${memberToken}`,
                'Content-Type': 'application/json',
                'Origin': 'http://localhost:3000',
                'Access-Control-Request-Method': 'PATCH',
                'Access-Control-Request-Headers': 'authorization,content-type'
            },
            data: {}
        });
        console.log('✅ Manual CORS test successful:', response.status);
    } catch (error) {
        console.error('❌ Manual CORS test failed:', {
            status: error.response?.status,
            headers: error.response?.headers,
            data: error.response?.data
        });
    }
}

// Run tests
console.log('🚀 Starting appointment cancel tests...');
testAppointmentCancel()
    .then(() => testCORSManually())
    .then(() => {
        console.log('\n✨ All tests completed!');
        console.log('\n💡 If tests fail:');
        console.log('1. Make sure server is running on port 4000');
        console.log('2. Update memberToken with a valid token');
        console.log('3. Check console for detailed error messages');
        console.log('4. Verify appointment ID exists and user has permission');
    })
    .catch(error => {
        console.error('💥 Test suite failed:', error.message);
    }); 