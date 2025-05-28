const axios = require('axios');

const memberToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJVc2VySUQiOjE3LCJSb2xlIjoibWVtYmVyIiwiaWF0IjoxNzM0NzEzMzQ3LCJleHAiOjE3MzQ3OTk3NDd9.N4Q1YYXjNJhq6TDwcqm_Sb2srhHShwdVc7BpOHInOJg';
const BASE_URL = 'http://localhost:4000';

async function testAppointmentCancel() {
    console.log('🧪 Testing Appointment Cancel for Member...\n');

    try {
        // 1. Test server connection
        console.log('1️⃣ Testing server connection...');
        const serverTest = await axios.get(`${BASE_URL}/api/test`);
        console.log('✅ Server:', serverTest.data.message);

        // 2. Test auth with member token
        console.log('\n2️⃣ Testing member authentication...');
        const authTest = await axios.get(`${BASE_URL}/api/chat/appointments`, {
            headers: { 'Authorization': `Bearer ${memberToken}` }
        });
        console.log('✅ Auth successful, appointments:', authTest.data.data?.length || 0);

        if (authTest.data.data && authTest.data.data.length > 0) {
            const appointment = authTest.data.data[0];
            console.log('📋 Testing with appointment:', {
                id: appointment.id,
                status: appointment.status,
                date: appointment.appointmentDate
            });

            // 3. Test PATCH cancel
            console.log('\n3️⃣ Testing PATCH cancel...');
            try {
                const cancelResponse = await axios.patch(
                    `${BASE_URL}/api/chat/appointments/${appointment.id}/cancel`,
                    {},
                    {
                        headers: {
                            'Authorization': `Bearer ${memberToken}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                console.log('✅ PATCH Cancel successful:', cancelResponse.data);
            } catch (patchError) {
                console.error('❌ PATCH Cancel failed:', {
                    status: patchError.response?.status,
                    statusText: patchError.response?.statusText,
                    data: patchError.response?.data,
                    message: patchError.message
                });

                // 4. Test POST fallback
                console.log('\n4️⃣ Testing POST fallback...');
                try {
                    const postResponse = await axios.post(
                        `${BASE_URL}/api/chat/appointments/${appointment.id}/cancel`,
                        { action: 'cancel' },
                        {
                            headers: {
                                'Authorization': `Bearer ${memberToken}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );
                    console.log('✅ POST Cancel successful:', postResponse.data);
                } catch (postError) {
                    console.error('❌ POST Cancel failed:', {
                        status: postError.response?.status,
                        statusText: postError.response?.statusText,
                        data: postError.response?.data,
                        message: postError.message
                    });

                    // 5. Test PUT fallback
                    console.log('\n5️⃣ Testing PUT fallback...');
                    try {
                        const putResponse = await axios.put(
                            `${BASE_URL}/api/chat/appointments/${appointment.id}`,
                            { status: 'cancelled' },
                            {
                                headers: {
                                    'Authorization': `Bearer ${memberToken}`,
                                    'Content-Type': 'application/json'
                                }
                            }
                        );
                        console.log('✅ PUT Cancel successful:', putResponse.data);
                    } catch (putError) {
                        console.error('❌ PUT Cancel failed:', {
                            status: putError.response?.status,
                            statusText: putError.response?.statusText,
                            data: putError.response?.data,
                            message: putError.message
                        });
                    }
                }
            }
        } else {
            console.log('⚠️ No appointments found to test');
        }

    } catch (error) {
        console.error('💥 Test failed:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data
        });
    }
}

// Run test
testAppointmentCancel(); 