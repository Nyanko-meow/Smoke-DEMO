const http = require('http');

function testQuitPlanAPI() {
    console.log('🧪 Testing /api/quit-plan endpoint for templates...\n');

    // This will simulate a request with auth token
    // In real app, we'd need to login first to get token
    const options = {
        hostname: 'localhost',
        port: 4000,
        path: '/api/quit-plan',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token', // We'll need a real token
        }
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            console.log(`📊 Status: ${res.statusCode}`);

            try {
                const jsonData = JSON.parse(data);
                console.log(`📦 Response:`, JSON.stringify(jsonData, null, 2));

                if (jsonData.success) {
                    console.log(`✅ API Success!`);
                    console.log(`📋 Existing plans: ${jsonData.data ? jsonData.data.length : 0}`);
                    console.log(`🎯 Plan template: ${jsonData.planTemplate ? jsonData.planTemplate.length : 0} phases`);
                    console.log(`💳 Payment info: ${jsonData.paymentInfo ? 'Available' : 'Not available'}`);

                    if (jsonData.planTemplate && jsonData.planTemplate.length > 0) {
                        console.log('\n📝 Template phases:');
                        jsonData.planTemplate.forEach((phase, index) => {
                            console.log(`   ${index + 1}. ${phase.PhaseName} (${phase.DurationDays} ngày)`);
                        });
                    }
                } else {
                    console.log(`❌ API Error: ${jsonData.message}`);
                }
            } catch (error) {
                console.log('❌ JSON parse error:', error.message);
                console.log('📄 Raw response:', data);
            }
        });
    });

    req.on('error', (error) => {
        console.log('❌ Request failed:', error.message);
        console.log('💡 This is expected since we need a real auth token');
        console.log('💡 The important thing is that the server responds');

        // Let's test without auth to see server response
        testWithoutAuth();
    });

    req.end();
}

function testWithoutAuth() {
    console.log('\n🔓 Testing without auth (should get 401/403)...');

    const options = {
        hostname: 'localhost',
        port: 4000,
        path: '/api/quit-plan',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            console.log(`📊 Status without auth: ${res.statusCode}`);
            console.log(`📄 Response: ${data.substring(0, 200)}...`);

            if (res.statusCode === 401 || res.statusCode === 403) {
                console.log('✅ Server is running and auth middleware is working');
            }
        });
    });

    req.on('error', (error) => {
        console.log('❌ Request without auth failed:', error.message);
        console.log('💡 Server might not be running on port 4000');
    });

    req.end();
}

// Wait for server to start
console.log('⏳ Waiting for server to start...');
setTimeout(() => {
    testQuitPlanAPI();
}, 3000); 