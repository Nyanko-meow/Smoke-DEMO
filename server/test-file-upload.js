const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:4000';

// Test file upload functionality
async function testFileUpload() {
    try {
        console.log('🧪 Testing file upload functionality...');

        // 1. Login to get token
        console.log('1. Logging in...');
        const loginResponse = await axios.post(`${BASE_URL}/api/test-login`, {
            email: 'coach@example.com',
            password: 'H12345678@'
        });

        if (!loginResponse.data.success) {
            throw new Error('Login failed');
        }

        const token = loginResponse.data.token;
        console.log('✅ Login successful');

        // 2. Create a test file
        const testFilePath = path.join(__dirname, 'test-file.txt');
        fs.writeFileSync(testFilePath, 'This is a test file for upload functionality.');
        console.log('✅ Test file created');

        // 3. Test file upload
        console.log('2. Testing file upload...');
        const formData = new FormData();
        formData.append('file', fs.createReadStream(testFilePath));

        const uploadResponse = await axios.post(`${BASE_URL}/api/upload`, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                ...formData.getHeaders()
            }
        });

        if (!uploadResponse.data.success) {
            throw new Error('File upload failed');
        }

        console.log('✅ File upload successful:', uploadResponse.data);

        // 4. Test sending file message
        console.log('3. Testing file message...');
        const fileMessageResponse = await axios.post(`${BASE_URL}/api/chat/coach/chat/send`, {
            content: `📎 ${uploadResponse.data.fileName}`,
            messageType: 'file',
            fileUrl: uploadResponse.data.fileUrl,
            fileName: uploadResponse.data.fileName,
            fileSize: uploadResponse.data.fileSize,
            fileType: uploadResponse.data.fileType,
            memberId: 2 // Test member ID
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!fileMessageResponse.data.success) {
            throw new Error('File message failed');
        }

        console.log('✅ File message sent successfully:', fileMessageResponse.data);

        // 5. Test file download
        console.log('4. Testing file download...');
        const downloadResponse = await axios.get(`${BASE_URL}${uploadResponse.data.fileUrl}`);

        if (downloadResponse.status === 200) {
            console.log('✅ File download successful');
        } else {
            throw new Error('File download failed');
        }

        // Cleanup
        fs.unlinkSync(testFilePath);
        console.log('✅ Test file cleaned up');

        console.log('\n🎉 All file upload tests passed!');

    } catch (error) {
        console.error('❌ File upload test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

// Test coach chat UI
async function testCoachChatUI() {
    try {
        console.log('\n🧪 Testing coach chat UI...');

        // 1. Login as coach
        const loginResponse = await axios.post(`${BASE_URL}/api/test-login`, {
            email: 'coach@example.com',
            password: 'H12345678@'
        });

        const token = loginResponse.data.token;

        // 2. Get coach conversations
        console.log('1. Getting coach conversations...');
        const conversationsResponse = await axios.get(`${BASE_URL}/api/chat/coach/conversations`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ Coach conversations:', conversationsResponse.data);

        // 3. Get coach members
        console.log('2. Getting coach members...');
        const membersResponse = await axios.get(`${BASE_URL}/api/chat/coach/members`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ Coach members:', membersResponse.data);

        console.log('\n🎉 Coach chat UI tests passed!');

    } catch (error) {
        console.error('❌ Coach chat UI test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

// Run tests
async function runTests() {
    console.log('🚀 Starting file upload and chat tests...\n');

    await testFileUpload();
    await testCoachChatUI();

    console.log('\n✨ All tests completed!');
}

runTests(); 