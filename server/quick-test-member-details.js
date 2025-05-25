const axios = require('axios');

async function quickTest() {
    const baseURL = 'http://localhost:3000/api';

    try {
        console.log('🧪 Quick Test: Member Details API');
        console.log('================================\n');

        // Login as coach
        console.log('1. 🔐 Coach login...');
        const loginResponse = await axios.post(`${baseURL}/coach/login`, {
            email: 'coach@example.com',
            password: 'password'
        });

        const token = loginResponse.data.token;
        console.log('✅ Login successful');

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Get members list first
        console.log('\n2. 📋 Getting members list...');
        const membersResponse = await axios.get(`${baseURL}/coach/members`, { headers });

        console.log(`✅ Found ${membersResponse.data.total} members`);

        if (membersResponse.data.data.length > 0) {
            // Test with first member
            const member = membersResponse.data.data[0];
            console.log(`📝 Testing member: ${member.fullName} (ID: ${member.id})`);

            // Get member details
            console.log('\n3. 🔍 Getting member details...');
            const detailsResponse = await axios.get(`${baseURL}/coach/members/${member.id}/details`, { headers });

            const details = detailsResponse.data.data;

            console.log('✅ Member details retrieved!\n');

            // Display key information
            console.log('📊 MEMBER DETAILS SUMMARY:');
            console.log('==========================');

            // Basic info
            console.log('👤 THÔNG TIN CƠ BẢN:');
            console.log(`   Tên: ${details.fullName}`);
            console.log(`   Email: ${details.email}`);
            console.log(`   Role: ${details.role}`);
            console.log(`   Địa chỉ: ${details.address || 'Chưa có'}`);
            console.log(`   SĐT: ${details.phoneNumber || 'Chưa có'}`);

            // Membership
            console.log('\n💎 GÓI DỊCH VỤ:');
            if (details.membership) {
                console.log(`   Gói: ${details.membership.planName}`);
                console.log(`   Giá: ${details.membership.planPrice?.toLocaleString()} VNĐ`);
                console.log(`   Còn lại: ${details.membership.daysRemaining} ngày`);
                console.log(`   Tính năng: ${details.membership.planFeatures?.join(', ')}`);
            } else {
                console.log(`   ❌ Chưa đăng ký gói nào`);
            }

            // Quit smoking status  
            console.log('\n🚬 TRẠNG THÁI CAI THUỐC:');
            console.log(`   Status: ${details.quitSmokingStatus.status}`);
            console.log(`   Mô tả: ${details.quitSmokingStatus.description}`);
            console.log(`   Khuyến nghị: ${details.quitSmokingStatus.recommendation}`);

            // Statistics
            console.log('\n📈 THỐNG KÊ:');
            console.log(`   Ngày theo dõi: ${details.statistics.totalDaysTracked}`);
            console.log(`   TB điếu/ngày: ${details.statistics.averageCigarettesPerDay}`);
            console.log(`   Tiền tiết kiệm: ${details.statistics.totalMoneySaved?.toLocaleString()} VNĐ`);

            // Achievements
            console.log('\n🏆 THÀNH TÍCH:');
            console.log(`   Số huy hiệu: ${details.achievementCount}`);

            // Recent progress
            console.log('\n📅 TIẾN TRÌNH GẦN ĐÂY:');
            console.log(`   ${details.recentProgress.length} ngày gần nhất có dữ liệu`);

            console.log('\n✅ ALL FEATURES WORKING! 🎉');

        } else {
            console.log('❌ No members found');
        }

    } catch (error) {
        console.error('\n❌ Error:', error.response?.data?.message || error.message);

        if (error.response?.status === 401) {
            console.log('💡 Tip: Make sure coach password is "password" or check credentials');
        }

        if (error.code === 'ECONNREFUSED') {
            console.log('💡 Tip: Make sure server is running on port 3000');
            console.log('   Run: npm start or node src/index.js');
        }
    }
}

// Test individual member ID
async function testMemberID(memberID = 2) {
    const baseURL = 'http://localhost:3000/api';

    try {
        console.log(`🔍 Testing specific member ID: ${memberID}`);

        // Login
        const loginResponse = await axios.post(`${baseURL}/coach/login`, {
            email: 'coach@example.com',
            password: 'password'
        });

        const headers = {
            'Authorization': `Bearer ${loginResponse.data.token}`,
            'Content-Type': 'application/json'
        };

        // Get details
        const response = await axios.get(`${baseURL}/coach/members/${memberID}/details`, { headers });

        console.log('✅ Success!');
        console.log('Member details structure:');
        console.log(JSON.stringify(response.data.data, null, 2));

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

// Run the appropriate test
if (process.argv[2] === 'id' && process.argv[3]) {
    testMemberID(parseInt(process.argv[3]));
} else {
    quickTest();
}

module.exports = { quickTest, testMemberID }; 