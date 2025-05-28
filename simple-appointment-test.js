const http = require('http');

function testAppointmentSimple() {
    const options = {
        hostname: 'localhost',
        port: 4000,
        path: '/api/chat/appointment',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'  // Sẽ fail nhưng ít nhất kiểm tra server có chạy không
        }
    };

    const req = http.request(options, (res) => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Server is responding!`);

        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            console.log('Response:', data);
        });
    });

    req.on('error', (e) => {
        console.error(`Connection failed: ${e.message}`);
        console.error('Server is not running or not accessible');
    });

    req.setTimeout(3000, () => {
        console.error('Request timeout - server may not be running');
        req.destroy();
    });

    // Send test data
    const testData = JSON.stringify({
        receiverId: 3,
        appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        duration: 30,
        type: 'chat',
        notes: 'test'
    });

    req.write(testData);
    req.end();
}

console.log('🔍 Testing server connection...');
testAppointmentSimple(); 