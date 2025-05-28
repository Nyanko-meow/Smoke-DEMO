const http = require('http');

function testAPI() {
    const options = {
        hostname: 'localhost',
        port: 4000,
        path: '/api/coaches',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(options, (res) => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Headers: ${JSON.stringify(res.headers)}`);

        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            console.log('Response:', data);
            process.exit(0);
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with request: ${e.message}`);
        process.exit(1);
    });

    req.setTimeout(5000, () => {
        console.error('Request timeout');
        req.destroy();
        process.exit(1);
    });

    req.end();
}

console.log('Testing /api/coaches endpoint...');
testAPI(); 