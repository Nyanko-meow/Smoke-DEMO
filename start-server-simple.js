// Simple server startup script
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting SmokeKing Server...');

const serverPath = path.join(__dirname, 'server', 'src', 'index.js');
const serverProcess = spawn('node', [serverPath], {
    cwd: __dirname,
    stdio: 'inherit'
});

serverProcess.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
});

serverProcess.on('close', (code) => {
    console.log(`🔴 Server process exited with code ${code}`);
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    console.log('\n🔴 Shutting down server...');
    serverProcess.kill();
    process.exit();
}); 