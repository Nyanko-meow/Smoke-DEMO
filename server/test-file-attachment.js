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

const COACH_CREDENTIALS = {
    email: 'coach@example.com',
    password: 'H12345678@'
};

let memberToken = '';
let coachToken = '';

async function login(credentials) {
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, credentials);
        return response.data.token;
    } catch (error) {
        console.error('Login error:', error.response?.data || error.message);
        throw error;
    }
}

async function createTestFile() {
    const testFilePath = path.join(__dirname, 'test-attachment.txt');
    const content = `Test file attachment
Created at: ${new Date().toISOString()}
This is a test file for chat attachment functionality.

Features to test:
- File upload
- File download
- File display in chat
- File metadata storage
`;

    fs.writeFileSync(testFilePath, content);
    return testFilePath;
}

async function testSendFileAttachment() {
    console.log('\n🧪 Testing file attachment functionality...\n');

    try {
        // 1. Login as member and coach
        console.log('1. Logging in...');
        memberToken = await login(MEMBER_CREDENTIALS);
        coachToken = await login(COACH_CREDENTIALS);
        console.log('✅ Login successful');

        // 2. Create test file
        console.log('\n2. Creating test file...');
        const testFilePath = await createTestFile();
        console.log('✅ Test file created:', testFilePath);

        // 3. Member sends file to coach
        console.log('\n3. Member sending file to coach...');
        const formData = new FormData();
        formData.append('file', fs.createReadStream(testFilePath));
        formData.append('content', 'Xin chào coach! Đây là file báo cáo tiến trình của em.');
        formData.append('messageType', 'file');

        const sendFileResponse = await axios.post(
            `${BASE_URL}/chat/send-with-file`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${memberToken}`,
                    ...formData.getHeaders()
                }
            }
        );

        console.log('✅ File sent successfully:', {
            messageId: sendFileResponse.data.data.MessageID,
            fileName: sendFileResponse.data.data.FileName,
            fileUrl: sendFileResponse.data.data.FileURL,
            fileSize: sendFileResponse.data.data.FileSize
        });

        const messageId = sendFileResponse.data.data.MessageID;

        // 4. Get message attachments
        console.log('\n4. Getting message attachments...');
        const attachmentsResponse = await axios.get(
            `${BASE_URL}/chat/message/${messageId}/attachments`,
            {
                headers: {
                    'Authorization': `Bearer ${memberToken}`
                }
            }
        );

        console.log('✅ Attachments retrieved:', attachmentsResponse.data.data);

        // 5. Test file download
        console.log('\n5. Testing file download...');
        const fileName = sendFileResponse.data.data.FileURL.split('/').pop();
        const downloadResponse = await axios.get(
            `${BASE_URL}/chat/files/${fileName}`,
            {
                responseType: 'text'
            }
        );

        console.log('✅ File downloaded successfully. Content preview:');
        console.log(downloadResponse.data.substring(0, 100) + '...');

        // 6. Coach gets conversation messages (should include file)
        console.log('\n6. Coach checking messages...');
        const coachConversationsResponse = await axios.get(
            `${BASE_URL}/chat/coach/conversations`,
            {
                headers: {
                    'Authorization': `Bearer ${coachToken}`
                }
            }
        );

        if (coachConversationsResponse.data.data.length > 0) {
            const conversationId = coachConversationsResponse.data.data[0].ConversationID;

            const messagesResponse = await axios.get(
                `${BASE_URL}/chat/conversation/${conversationId}/messages`,
                {
                    headers: {
                        'Authorization': `Bearer ${coachToken}`
                    }
                }
            );

            console.log('✅ Coach can see messages with attachments:');
            messagesResponse.data.data.forEach(msg => {
                console.log(`- ${msg.SenderRole}: ${msg.Content}`);
                if (msg.FileName) {
                    console.log(`  📎 Attachment: ${msg.FileName} (${msg.FileSize} bytes)`);
                }
            });

            // 7. Coach sends file back
            console.log('\n7. Coach sending file back...');
            const coachFormData = new FormData();

            // Create another test file for coach
            const coachTestFile = path.join(__dirname, 'coach-response.txt');
            fs.writeFileSync(coachTestFile, `Coach response file
Created at: ${new Date().toISOString()}
This is a response from the coach with additional resources.`);

            coachFormData.append('file', fs.createReadStream(coachTestFile));
            coachFormData.append('content', 'Cảm ơn bạn đã gửi báo cáo! Đây là tài liệu hỗ trợ từ coach.');
            coachFormData.append('messageType', 'file');

            const coachSendResponse = await axios.post(
                `${BASE_URL}/chat/conversation/${conversationId}/send-with-file`,
                coachFormData,
                {
                    headers: {
                        'Authorization': `Bearer ${coachToken}`,
                        ...coachFormData.getHeaders()
                    }
                }
            );

            console.log('✅ Coach file sent successfully:', {
                messageId: coachSendResponse.data.data.MessageID,
                fileName: coachSendResponse.data.data.FileName
            });

            // 8. Member checks updated conversation
            console.log('\n8. Member checking updated conversation...');
            const memberConversationResponse = await axios.get(
                `${BASE_URL}/chat/member/conversation`,
                {
                    headers: {
                        'Authorization': `Bearer ${memberToken}`
                    }
                }
            );

            const memberConversationId = memberConversationResponse.data.data.conversation.ConversationID;

            const updatedMessagesResponse = await axios.get(
                `${BASE_URL}/chat/conversation/${memberConversationId}/messages`,
                {
                    headers: {
                        'Authorization': `Bearer ${memberToken}`
                    }
                }
            );

            console.log('✅ Member can see all messages with attachments:');
            updatedMessagesResponse.data.data.forEach(msg => {
                console.log(`- ${msg.SenderRole}: ${msg.Content}`);
                if (msg.FileName) {
                    console.log(`  📎 Attachment: ${msg.FileName} (${msg.FileSize} bytes)`);
                }
            });

            // Clean up test files
            fs.unlinkSync(testFilePath);
            fs.unlinkSync(coachTestFile);
            console.log('\n🧹 Test files cleaned up');
        }

        console.log('\n🎉 All file attachment tests passed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);

        // Clean up on error
        try {
            const testFilePath = path.join(__dirname, 'test-attachment.txt');
            const coachTestFile = path.join(__dirname, 'coach-response.txt');
            if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath);
            if (fs.existsSync(coachTestFile)) fs.unlinkSync(coachTestFile);
        } catch (cleanupError) {
            // Ignore cleanup errors
        }
    }
}

// Run the test
if (require.main === module) {
    testSendFileAttachment();
}

module.exports = { testSendFileAttachment }; 