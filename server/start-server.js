const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting SmokeKing Server...');
console.log('📍 Server directory:', __dirname);

// Function to check if port is in use
function checkPort(port) {
    return new Promise((resolve) => {
        const net = require('net');
        const server = net.createServer();
        
        server.listen(port, () => {
            server.once('close', () => {
                resolve(false); // Port is available
            });
            server.close();
        });
        
        server.on('error', () => {
            resolve(true); // Port is in use
        });
    });
}

// Main function to start server
async function startServer() {
    try {
        // Check if port 4000 is already in use
        const portInUse = await checkPort(4000);
        
        if (portInUse) {
            console.log('⚠️ Port 4000 is already in use');
            console.log('💡 Please stop any existing server or use a different port');
            console.log('🔍 You can check what\'s using port 4000 with: netstat -ano | findstr :4000');
            process.exit(1);
        }
        
        console.log('✅ Port 4000 is available');
        
        // Start the server
        const serverProcess = spawn('node', ['src/index.js'], {
            cwd: __dirname,
            stdio: 'inherit',
            shell: true
        });
        
        // Handle server process events
        serverProcess.on('error', (error) => {
            console.error('❌ Failed to start server:', error);
            process.exit(1);
        });
        
        serverProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`❌ Server process exited with code ${code}`);
                process.exit(code);
            }
        });
        
        // Handle process termination
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down server...');
            serverProcess.kill('SIGINT');
        });
        
        process.on('SIGTERM', () => {
            console.log('\n🛑 Shutting down server...');
            serverProcess.kill('SIGTERM');
        });
        
        console.log('✅ Server process started successfully');
        console.log('🌐 Server will be available at: http://localhost:4000');
        console.log('📊 API documentation: http://localhost:4000/api');
        console.log('🛑 Press Ctrl+C to stop the server');
        
    } catch (error) {
        console.error('❌ Error starting server:', error);
        process.exit(1);
    }
}

// Start the server
startServer(); 