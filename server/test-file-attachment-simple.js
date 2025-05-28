const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:4000/api';

// Test credentials
const MEMBER_CREDENTIALS = {
    email: 'member@example.com',
    password: 'H12345678@'
};

async function testFileAttachment() {
    console.log('🧪 Testing File Attachment Functionality\n');

    try {
        // 1. Login as member
        console.log('1. Logging in as member...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, MEMBER_CREDENTIALS);
        const token = loginResponse.data.token;
        console.log('✅ Login successful');

        // 2. Create a test file
        console.log('\n2. Creating test file...');
        const testFilePath = path.join(__dirname, 'test-file.txt');
        const testContent = `Test File for Chat Attachment
Created: ${new Date().toISOString()}
This is a test file to verify the file attachment functionality in the chat system.

Features being tested:
- File upload to chat
- File storage
- File metadata saving
- File download
`;
        fs.writeFileSync(testFilePath, testContent);
        console.log('✅ Test file created:', testFilePath);

        // 3. Send file via chat
        console.log('\n3. Sending file via chat...');
        const formData = new FormData();
        formData.append('file', fs.createReadStream(testFilePath));
        formData.append('content', 'Đây là file test từ member gửi cho coach');
        formData.append('messageType', 'file');

        const sendResponse = await axios.post(
            `${BASE_URL}/chat/send-with-file`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    ...formData.getHeaders()
                }
            }
        );

        console.log('✅ File sent successfully!');
        console.log('Message ID:', sendResponse.data.data.MessageID);
        console.log('File Name:', sendResponse.data.data.FileName);
        console.log('File URL:', sendResponse.data.data.FileURL);
        console.log('File Size:', sendResponse.data.data.FileSize, 'bytes');

        // 4. Get message attachments
        console.log('\n4. Getting message attachments...');
        const messageId = sendResponse.data.data.MessageID;
        const attachmentsResponse = await axios.get(
            `${BASE_URL}/chat/message/${messageId}/attachments`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        console.log('✅ Attachments retrieved:');
        attachmentsResponse.data.data.forEach(attachment => {
            console.log(`- ${attachment.FileName} (${attachment.FileSize} bytes)`);
            console.log(`  URL: ${attachment.FileURL}`);
            console.log(`  Type: ${attachment.MimeType}`);
        });

        // 5. Test file download
        console.log('\n5. Testing file download...');
        const fileName = sendResponse.data.data.FileURL.split('/').pop();
        const downloadResponse = await axios.get(
            `${BASE_URL}/chat/files/${fileName}`,
            {
                responseType: 'text'
            }
        );

        console.log('✅ File downloaded successfully!');
        console.log('Content preview:', downloadResponse.data.substring(0, 100) + '...');

        // 6. Test member conversation
        console.log('\n6. Testing member conversation...');
        const conversationResponse = await axios.get(
            `${BASE_URL}/chat/member/conversation`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        console.log('✅ Member conversation retrieved:');
        console.log('Conversation ID:', conversationResponse.data.data.conversation.ConversationID);
        console.log('Coach:', conversationResponse.data.data.coach.FullName);

        // 7. Get conversation messages
        console.log('\n7. Getting conversation messages...');
        const conversationId = conversationResponse.data.data.conversation.ConversationID;
        const messagesResponse = await axios.get(
            `${BASE_URL}/chat/conversation/${conversationId}/messages`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        console.log('✅ Messages retrieved:');
        messagesResponse.data.data.forEach(msg => {
            console.log(`- ${msg.SenderRole}: ${msg.Content}`);
            if (msg.FileName) {
                console.log(`  📎 Attachment: ${msg.FileName} (${msg.FileSize} bytes)`);
            }
        });

        // Clean up
        fs.unlinkSync(testFilePath);
        console.log('\n🧹 Test file cleaned up');

        console.log('\n🎉 All tests passed successfully!');
        console.log('\n📋 Summary:');
        console.log('- ✅ File upload working');
        console.log('- ✅ File metadata storage working');
        console.log('- ✅ File download working');
        console.log('- ✅ Chat integration working');
        console.log('- ✅ Message retrieval with attachments working');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);

        // Clean up on error
        const testFilePath = path.join(__dirname, 'test-file.txt');
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
    }
}

// Run the test
if (require.main === module) {
    testFileAttachment();
}

module.exports = { testFileAttachment }; 