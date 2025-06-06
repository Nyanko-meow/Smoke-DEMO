const http = require('http');

function testPendingPaymentsAPI() {
    console.log('🧪 Testing Admin Pending Payments API...\n');

    const options = {
        hostname: 'localhost',
        port: 4000,
        path: '/api/admin/pending-payments',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            // Note: In real usage, this would need a valid admin token
            // For testing, we'll see what happens without auth
        }
    };

    const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            console.log(`📊 Status Code: ${res.statusCode}`);
            console.log(`📋 Headers:`, res.headers);

            try {
                const jsonData = JSON.parse(data);
                console.log(`📦 Response:`, JSON.stringify(jsonData, null, 2));

                if (jsonData.success && jsonData.data) {
                    console.log(`✅ Found ${jsonData.data.length} pending payments`);
                    if (jsonData.data.length > 0) {
                        console.log('📋 First payment:');
                        const first = jsonData.data[0];
                        console.log(`   ID: ${first.PaymentID}, User: ${first.FirstName} ${first.LastName}, Plan: ${first.PlanName}`);
                    }
                } else {
                    console.log(`❌ API returned error: ${jsonData.message}`);
                }
            } catch (error) {
                console.log('❌ Error parsing JSON response:', error.message);
                console.log('📄 Raw response:', data);
            }
        });
    });

    req.on('error', (error) => {
        console.log('❌ Request failed:', error.message);
        console.log('💡 Make sure the server is running on port 4000');
    });

    req.end();
}

// Wait a bit for server to start, then test
console.log('⏳ Waiting for server to start...');
setTimeout(() => {
    testPendingPaymentsAPI();
}, 3000); 