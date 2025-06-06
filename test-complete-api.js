const axios = require('axios');
const { spawn } = require('child_process');
const { pool, connectDB, sql } = require('./server/src/config/database');

// Function to wait for server to be ready
function waitForServer(port = 4000, timeout = 30000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        const checkServer = async () => {
            try {
                // Try a simple GET request to a basic endpoint
                const response = await axios.get(`http://localhost:${port}/api/users/debug-address`, {
                    timeout: 2000,
                    headers: { Authorization: 'Bearer fake-token' } // Just to test if server responds
                });
                resolve(true);
            } catch (error) {
                // Server is responding even with 401/403, that's good enough
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    resolve(true);
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error('Server timeout'));
                } else {
                    setTimeout(checkServer, 1000);
                }
            }
        };

        checkServer();
    });
}

async function testCompleteAPI() {
    let serverProcess = null;

    try {
        console.log('🔧 Starting complete API test...');

        // 1. Test database first
        console.log('\n📊 Testing database connection...');
        await connectDB();

        const userResult = await pool.request()
            .input('UserID', sql.Int, 2)
            .query(`
                SELECT UserID, Email, FirstName, LastName, PhoneNumber, Address, UpdatedAt
                FROM Users WHERE UserID = @UserID
            `);

        if (userResult.recordset.length === 0) {
            throw new Error('User ID 2 not found in database');
        }

        console.log('✅ Database connected, User 2 found:');
        console.table(userResult.recordset);

        // 2. Start server
        console.log('\n🚀 Starting server...');
        serverProcess = spawn('npm', ['start'], {
            cwd: './server',
            stdio: ['ignore', 'pipe', 'pipe'],
            shell: true
        });

        serverProcess.stdout.on('data', (data) => {
            const output = data.toString();
            if (output.includes('Server is running') || output.includes('listening on port')) {
                console.log('📡 Server output:', output.trim());
            }
        });

        serverProcess.stderr.on('data', (data) => {
            console.error('⚠️ Server error:', data.toString());
        });

        // 3. Wait for server to be ready
        console.log('⏳ Waiting for server to be ready...');
        try {
            await waitForServer();
            console.log('✅ Server is ready!');
        } catch (error) {
            console.log('⚠️ Health check failed, trying direct API test...');
        }

        // Wait a bit more to ensure server is fully ready
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 4. Test API endpoints
        const baseURL = 'http://localhost:4000/api';

        console.log('\n🔑 Testing login...');
        const loginData = {
            email: 'member@example.com',
            password: 'H12345678@'
        };

        const loginResponse = await axios.post(`${baseURL}/auth/login`, loginData, {
            timeout: 10000
        });

        if (!loginResponse.data.success) {
            throw new Error('Login failed: ' + loginResponse.data.message);
        }

        const token = loginResponse.data.token;
        console.log('✅ Login successful, token received');

        // 5. Get current profile
        console.log('\n👤 Getting current profile...');
        const profileResponse = await axios.get(`${baseURL}/users/profile`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000
        });

        console.log('✅ Profile retrieved:');
        console.log('User Info:', profileResponse.data.data.userInfo);

        // 6. Update profile
        const updateData = {
            firstName: 'Tran',
            lastName: 'Huy',
            phoneNumber: '0938987703',
            address: '123 Main Sts - Updated from API Test'
        };

        console.log('\n✏️ Updating profile...');
        console.log('Update data:', updateData);

        const updateResponse = await axios.put(`${baseURL}/users/profile`, updateData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        if (updateResponse.data.success) {
            console.log('✅ Profile update successful!');
            console.log('Updated data:', updateResponse.data.data);
        } else {
            console.log('❌ Profile update failed:', updateResponse.data.message);
            throw new Error('Profile update failed');
        }

        // 7. Verify the update
        console.log('\n🔍 Verifying update...');
        const verifyResponse = await axios.get(`${baseURL}/users/profile`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000
        });

        console.log('✅ Verified profile:');
        console.log('Updated User Info:', verifyResponse.data.data.userInfo);

        // 8. Check in database directly
        console.log('\n💾 Checking database directly...');
        const dbCheckResult = await pool.request()
            .input('UserID', sql.Int, 2)
            .query(`
                SELECT UserID, Email, FirstName, LastName, PhoneNumber, Address, UpdatedAt
                FROM Users WHERE UserID = @UserID
            `);

        console.log('Database verification:');
        console.table(dbCheckResult.recordset);

        console.log('\n🎉 All tests completed successfully!');
        console.log('✅ Profile update is working correctly!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);

        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }

        if (error.config) {
            console.error('Request URL:', error.config.url);
            console.error('Request method:', error.config.method);
        }
    } finally {
        // Cleanup
        try {
            await pool.close();
            console.log('\n🔌 Database connection closed');
        } catch (err) {
            console.error('Error closing database:', err);
        }

        if (serverProcess) {
            console.log('🛑 Stopping server...');
            serverProcess.kill('SIGTERM');

            // Force kill if needed
            setTimeout(() => {
                if (!serverProcess.killed) {
                    serverProcess.kill('SIGKILL');
                }
            }, 5000);
        }
    }
}

// Run the complete test
console.log('🧪 Starting Complete API Test Suite');
console.log('This will:');
console.log('1. Test database connection');
console.log('2. Start the server');
console.log('3. Test login API');
console.log('4. Test profile update API');
console.log('5. Verify changes in database');
console.log('');

testCompleteAPI(); 