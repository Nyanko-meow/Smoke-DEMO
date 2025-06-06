const http = require('http');

function testTemplateAPI() {
    console.log('🧪 Testing Template API Endpoints...\n');

    // Test 1: Get all templates
    console.log('1. Testing GET /api/quit-plan/templates/all');
    const options1 = {
        hostname: 'localhost',
        port: 4000,
        path: '/api/quit-plan/templates/all',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const req1 = http.request(options1, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            console.log(`📊 Status: ${res.statusCode}`);
            try {
                const jsonData = JSON.parse(data);
                console.log(`📦 Response:`, JSON.stringify(jsonData, null, 2));

                if (jsonData.success && jsonData.data) {
                    console.log(`✅ Found templates for ${Object.keys(jsonData.data).length} plans`);
                    Object.entries(jsonData.data).forEach(([planId, planData]) => {
                        console.log(`   Plan ${planId}: ${planData.planInfo.planName} - ${planData.phases.length} phases`);
                    });
                } else {
                    console.log(`❌ API error: ${jsonData.message}`);
                }
            } catch (error) {
                console.log('❌ JSON parse error:', error.message);
                console.log('📄 Raw:', data);
            }
            console.log('\n');

            // Test 2: Get specific plan template
            console.log('2. Testing GET /api/quit-plan/template/2 (Premium Plan)');
            const options2 = {
                hostname: 'localhost',
                port: 4000,
                path: '/api/quit-plan/template/2',
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            const req2 = http.request(options2, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    console.log(`📊 Status: ${res.statusCode}`);
                    try {
                        const jsonData = JSON.parse(data);
                        console.log(`📦 Response:`, JSON.stringify(jsonData, null, 2));

                        if (jsonData.success && jsonData.data) {
                            console.log(`✅ Found ${jsonData.data.length} phases for ${jsonData.planInfo.planName}`);
                            jsonData.data.forEach((phase, index) => {
                                console.log(`   ${index + 1}. ${phase.PhaseName} (${phase.DurationDays} ngày)`);
                            });
                        } else {
                            console.log(`❌ API error: ${jsonData.message}`);
                        }
                    } catch (error) {
                        console.log('❌ JSON parse error:', error.message);
                        console.log('📄 Raw:', data);
                    }
                });
            });

            req2.on('error', (error) => {
                console.log('❌ Request 2 failed:', error.message);
            });

            req2.end();
        });
    });

    req1.on('error', (error) => {
        console.log('❌ Request 1 failed:', error.message);
        console.log('💡 Make sure server is running on port 4000');
    });

    req1.end();
}

// Wait for server to be ready
console.log('⏳ Waiting for server to start...');
setTimeout(() => {
    testTemplateAPI();
}, 5000); 