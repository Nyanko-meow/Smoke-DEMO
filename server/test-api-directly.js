const axios = require('axios');
const jwt = require('jsonwebtoken');

async function testCompletedAppointmentsAPI() {
    try {
        console.log('🧪 TESTING COMPLETED APPOINTMENTS API DIRECTLY');
        console.log('='.repeat(60));

        const BASE_URL = 'http://localhost:4000';
        const userId = 6;

        // Generate valid JWT token
        const token = jwt.sign(
            {
                id: userId,
                UserID: userId,
                email: 'leghenkiz@gmail.com',
                Role: 'member'
            },
            process.env.JWT_SECRET || 'smokeking_secret_key_ultra_secure_2024',
            { expiresIn: '24h' }
        );

        console.log('1. Generated token:', token.substring(0, 50) + '...');

        // Test 1: Check if server is running
        console.log('\n2. Testing server connectivity...');
        try {
            const healthCheck = await axios.get(`${BASE_URL}/api/health`);
            console.log('✅ Server is running');
        } catch (error) {
            console.log('❌ Server connectivity issue:', error.message);
            return;
        }

        // Test 2: Test general appointments endpoint
        console.log('\n3. Testing general appointments endpoint...');
        try {
            const appointmentsResponse = await axios.get(`${BASE_URL}/api/chat/appointments`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ General appointments API works');
            console.log('   Data length:', appointmentsResponse.data.data?.length || 0);
        } catch (error) {
            console.log('❌ General appointments API failed:', error.response?.status, error.response?.data?.message);
        }

        // Test 3: Test completed appointments endpoint
        console.log('\n4. Testing completed appointments endpoint...');
        try {
            const completedResponse = await axios.get(`${BASE_URL}/api/chat/appointments/completed`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ Completed appointments API SUCCESS!');
            console.log('   Status:', completedResponse.status);
            console.log('   Data length:', completedResponse.data.data?.length || 0);
            console.log('   Message:', completedResponse.data.message);

            if (completedResponse.data.data && completedResponse.data.data.length > 0) {
                console.log('   Appointments found:');
                completedResponse.data.data.forEach((apt, index) => {
                    console.log(`     ${index + 1}. ID ${apt.id}: ${apt.duration}min ${apt.type} with ${apt.coach.fullName}`);
                });
            }

        } catch (error) {
            console.log('❌ Completed appointments API FAILED:');
            console.log('   Status:', error.response?.status);
            console.log('   Message:', error.response?.data?.message);
            console.log('   Error:', error.message);

            if (error.response?.status === 404) {
                console.log('   This is a 404 - endpoint not found or routing issue');
            }
        }

        // Test 4: Test with curl equivalent 
        console.log('\n5. Curl equivalent command:');
        console.log(`curl -X GET "${BASE_URL}/api/chat/appointments/completed" \\`);
        console.log(`     -H "Authorization: Bearer ${token}" \\`);
        console.log(`     -H "Content-Type: application/json"`);

        // Test 5: Browser console commands
        console.log('\n6. Browser console commands:');
        console.log('// Set auth');
        console.log(`localStorage.setItem('token', '${token}');`);
        console.log(`localStorage.setItem('user', '${JSON.stringify({
            id: userId,
            email: 'leghenkiz@gmail.com',
            firstName: 'Tran',
            lastName: 'Huy',
            role: 'member'
        })}');`);
        console.log('');
        console.log('// Test API');
        console.log(`fetch('${BASE_URL}/api/chat/appointments/completed', {`);
        console.log('  headers: {');
        console.log('    "Authorization": "Bearer " + localStorage.getItem("token"),');
        console.log('    "Content-Type": "application/json"');
        console.log('  }');
        console.log('}).then(r => r.json()).then(data => console.log("API Result:", data))');

    } catch (error) {
        console.error('❌ Test script error:', error.message);
    }
}

if (require.main === module) {
    testCompletedAppointmentsAPI()
        .then(() => {
            console.log('\n✅ Test completed');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error:', error);
            process.exit(1);
        });
}

module.exports = { testCompletedAppointmentsAPI }; 