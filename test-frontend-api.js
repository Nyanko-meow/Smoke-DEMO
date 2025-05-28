const http = require('http');

// Test API như frontend sẽ gọi
function testFrontendAPI() {
    console.log('🧪 Testing API from frontend perspective...');

    const options = {
        hostname: 'localhost',
        port: 4000,
        path: '/api/coaches',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Origin': 'http://localhost:3000',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    };

    const req = http.request(options, (res) => {
        console.log('✅ Status:', res.statusCode);
        console.log('✅ Headers:', res.headers);

        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                console.log('✅ Success:', json.success);
                console.log('✅ Message:', json.message);
                console.log('✅ Coaches count:', json.data ? json.data.length : 0);

                if (json.data && json.data.length > 0) {
                    console.log('✅ First coach details:');
                    const coach = json.data[0];
                    console.log('   - ID:', coach.UserID);
                    console.log('   - Name:', coach.FullName);
                    console.log('   - Email:', coach.Email);
                    console.log('   - Active:', coach.IsActive);
                    console.log('   - Available:', coach.IsAvailable);
                    console.log('   - Bio:', coach.Bio ? coach.Bio.substring(0, 50) + '...' : 'No bio');
                    console.log('   - Rating:', coach.AverageRating);
                    console.log('   - Reviews:', coach.ReviewCount);
                }

                console.log('🎉 API test successful! Frontend should be able to load coaches.');

            } catch (e) {
                console.error('❌ JSON Parse Error:', e.message);
                console.log('Raw response:', data.substring(0, 200) + '...');
            }
            process.exit(0);
        });
    });

    req.on('error', (e) => {
        console.error('❌ Request Error:', e.message);
        process.exit(1);
    });

    req.setTimeout(5000, () => {
        console.error('❌ Request timeout');
        req.destroy();
        process.exit(1);
    });

    req.end();
}

testFrontendAPI(); 