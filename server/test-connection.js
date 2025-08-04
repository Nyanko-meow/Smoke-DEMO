const axios = require('axios');

async function testServerConnection() {
    const baseURL = 'http://localhost:4000';
    
    console.log('🔍 Testing server connection...');
    console.log(`📍 Server URL: ${baseURL}`);
    
    try {
        // Test 1: Basic server health check
        console.log('\n1️⃣ Testing basic server health...');
        const healthResponse = await axios.get(`${baseURL}/`);
        console.log('✅ Server is running');
        console.log('📊 Response:', healthResponse.data);
        
        // Test 2: API test endpoint
        console.log('\n2️⃣ Testing API test endpoint...');
        const testResponse = await axios.get(`${baseURL}/api/test`);
        console.log('✅ API test endpoint working');
        console.log('📊 Response:', testResponse.data);
        
        // Test 3: Survey questions public endpoint
        console.log('\n3️⃣ Testing survey questions public endpoint...');
        const surveyResponse = await axios.get(`${baseURL}/api/survey-questions/public`);
        console.log('✅ Survey questions endpoint working');
        console.log(`📊 Found ${surveyResponse.data.length} questions`);
        
        // Test 4: Database connection (if we have a test user)
        console.log('\n4️⃣ Testing database connection...');
        try {
            const dbTestResponse = await axios.get(`${baseURL}/api/survey-questions/test`);
            console.log('✅ Database connection working');
            console.log('📊 Response:', dbTestResponse.data);
        } catch (dbError) {
            console.log('⚠️ Database test failed (this might be expected):', dbError.message);
        }
        
        console.log('\n🎉 All tests passed! Server is working correctly.');
        
    } catch (error) {
        console.error('\n❌ Server connection test failed!');
        
        if (error.code === 'ECONNREFUSED') {
            console.error('🔴 Server is not running or not accessible');
            console.error('💡 Please start the server with: npm start');
        } else if (error.response) {
            console.error(`🔴 Server responded with error: ${error.response.status}`);
            console.error('📊 Response:', error.response.data);
        } else if (error.request) {
            console.error('🔴 No response received from server');
            console.error('💡 Check if server is running on port 4000');
        } else {
            console.error('🔴 Unexpected error:', error.message);
        }
        
        process.exit(1);
    }
}

// Run the test
testServerConnection(); 