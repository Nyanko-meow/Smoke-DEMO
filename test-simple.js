const http = require('http');

const req = http.get('http://localhost:4000/api/coaches', (res) => {
    console.log('Status:', res.statusCode);

    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('Success:', json.success);
            console.log('Message:', json.message);
            console.log('Data length:', json.data ? json.data.length : 0);
            if (json.data && json.data.length > 0) {
                console.log('First coach:', json.data[0]);
            }
        } catch (e) {
            console.log('Raw response:', data);
        }
        process.exit(0);
    });
});

req.on('error', (e) => {
    console.error('Error:', e.message);
    process.exit(1);
});

req.setTimeout(3000, () => {
    console.error('Timeout');
    req.destroy();
    process.exit(1);
}); 