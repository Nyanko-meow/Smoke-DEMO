const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testNewChatUI() {
    console.log('🎨 TESTING NEW CHAT UI...\n');

    try {
        // Test 1: Login as coach
        console.log('1. Testing coach login...');
        const coachLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'coach@example.com',
            password: 'H12345678@'
        });

        if (!coachLogin.data.success) {
            throw new Error('Coach login failed');
        }

        const coachToken = coachLogin.data.token;
        console.log('✅ Coach login successful');

        // Test 2: Login as member
        console.log('\n2. Testing member login...');
        const memberLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'member@example.com',
            password: 'H12345678@'
        });

        if (!memberLogin.data.success) {
            throw new Error('Member login failed');
        }

        const memberToken = memberLogin.data.token;
        console.log('✅ Member login successful');

        // Test 3: Create some test messages for UI testing
        console.log('\n3. Creating test messages for UI...');

        // Get or create conversation
        const coachConversations = await axios.get(
            `${BASE_URL}/api/chat/coach/conversations`,
            {
                headers: {
                    'Authorization': `Bearer ${coachToken}`
                }
            }
        );

        let conversationId;
        if (coachConversations.data.data.length === 0) {
            const createConv = await axios.post(
                `${BASE_URL}/api/chat/coach/start-conversation`,
                {
                    memberId: 2 // Member ID from schema
                },
                {
                    headers: {
                        'Authorization': `Bearer ${coachToken}`
                    }
                }
            );
            conversationId = createConv.data.data.conversationId;
        } else {
            conversationId = coachConversations.data.data[0].ConversationID;
        }

        // Create test messages to showcase the new UI
        const testMessages = [
            {
                sender: 'member',
                content: 'Chào coach! Em mới bắt đầu hành trình cai thuốc và cần sự hỗ trợ từ coach ạ.',
                token: memberToken
            },
            {
                sender: 'coach',
                content: 'Chào bạn! Tôi rất vui được hỗ trợ bạn trong hành trình cai thuốc. Bạn đã hút thuốc được bao lâu rồi?',
                token: coachToken,
                conversationId: conversationId
            },
            {
                sender: 'member',
                content: 'Em hút thuốc được khoảng 5 năm rồi ạ. Mỗi ngày khoảng 10-15 điếu. Em thấy khó khăn nhất là khi stress hoặc sau bữa ăn.',
                token: memberToken
            },
            {
                sender: 'coach',
                content: 'Tôi hiểu cảm giác của bạn. Đây là những thời điểm "trigger" rất phổ biến. Chúng ta sẽ cùng nhau xây dựng một kế hoạch cụ thể để đối phó với những tình huống này nhé! 💪',
                token: coachToken,
                conversationId: conversationId
            },
            {
                sender: 'member',
                content: 'Cảm ơn coach! Em cảm thấy có động lực hơn rồi. Coach có thể chia sẻ một số tips để vượt qua cơn thèm thuốc không ạ?',
                token: memberToken
            },
            {
                sender: 'coach',
                content: `Tất nhiên! Đây là một số tips hiệu quả:

1. 🌬️ Thở sâu: Hít vào 4 giây, giữ 4 giây, thở ra 6 giây
2. 💧 Uống nước lạnh ngay lập tức
3. 🚶‍♂️ Đi bộ hoặc vận động nhẹ 5-10 phút
4. 🍎 Ăn trái cây hoặc nhai kẹo cao su
5. 📱 Gọi điện cho bạn bè hoặc gia đình

Hãy thử và cho tôi biết cách nào hiệu quả nhất với bạn nhé!`,
                token: coachToken,
                conversationId: conversationId
            }
        ];

        for (let i = 0; i < testMessages.length; i++) {
            const msg = testMessages[i];

            if (msg.sender === 'member') {
                await axios.post(
                    `${BASE_URL}/api/chat/coach/chat/send`,
                    {
                        content: msg.content
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${msg.token}`
                        }
                    }
                );
            } else {
                await axios.post(
                    `${BASE_URL}/api/chat/conversation/${msg.conversationId}/send`,
                    {
                        content: msg.content
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${msg.token}`
                        }
                    }
                );
            }

            // Small delay between messages
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log('✅ Test messages created successfully');

        console.log('\n🎉 NEW CHAT UI TEST COMPLETED!');
        console.log('\n📋 What\'s New:');
        console.log('✨ Messenger-style message bubbles');
        console.log('✨ Beautiful gradient backgrounds');
        console.log('✨ Smooth animations and hover effects');
        console.log('✨ Modern card design with rounded corners');
        console.log('✨ Online status indicators with pulse animation');
        console.log('✨ Improved typing indicators');
        console.log('✨ Message read status (✓✓)');
        console.log('✨ Enhanced modal design');
        console.log('✨ Better responsive design');

        console.log('\n🚀 Frontend Testing:');
        console.log('1. Coach: http://localhost:3000/coach/dashboard');
        console.log('   - Login: coach@example.com / H12345678@');
        console.log('   - Go to Chat section to see the new UI');
        console.log('');
        console.log('2. Member: http://localhost:3000');
        console.log('   - Login: member@example.com / H12345678@');
        console.log('   - Go to Chat section to see the new UI');

        console.log('\n💡 UI Features to Test:');
        console.log('- Message bubbles with tails (like Messenger)');
        console.log('- Hover effects on messages and buttons');
        console.log('- Smooth send button animation when typing');
        console.log('- Beautiful appointment modal');
        console.log('- Online status pulse animation');
        console.log('- Gradient header with glassmorphism effects');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        if (error.response?.status === 404) {
            console.log('\n💡 Tip: Make sure the server is running on port 4000');
        }
    }
}

testNewChatUI(); 