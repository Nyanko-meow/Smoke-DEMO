const axios = require('axios');

// Test member details endpoint
async function testMemberDetails() {
    const baseURL = 'http://localhost:3000/api';

    try {
        // First login as coach
        console.log('🔐 Logging in as coach...');
        const loginResponse = await axios.post(`${baseURL}/coach/login`, {
            email: 'coach@example.com',
            password: 'password'
        });

        const authToken = loginResponse.data.token;
        console.log('✅ Coach login successful');

        // Test headers with token
        const headers = {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        };

        // First get list of members to get a member ID
        console.log('\n📋 Getting members list...');
        const membersResponse = await axios.get(`${baseURL}/coach/members`, { headers });

        console.log(`✅ Found ${membersResponse.data.total} members`);

        if (membersResponse.data.data.length > 0) {
            const firstMember = membersResponse.data.data[0];
            console.log(`📝 Testing with member: ${firstMember.fullName} (ID: ${firstMember.id})`);

            // Test member details endpoint
            console.log('\n🔍 Getting member details...');
            const detailsResponse = await axios.get(`${baseURL}/coach/members/${firstMember.id}/details`, { headers });

            console.log('✅ Member details retrieved successfully');
            console.log('\n📊 Member Details:');
            console.log('=====================================');

            const member = detailsResponse.data.data;

            // Basic info
            console.log(`👤 Tên: ${member.fullName}`);
            console.log(`📧 Email: ${member.email}`);
            console.log(`📱 Role: ${member.role}`);
            console.log(`🏠 Địa chỉ: ${member.address || 'Chưa cập nhật'}`);
            console.log(`☎️ Số điện thoại: ${member.phoneNumber || 'Chưa cập nhật'}`);

            // Membership info
            console.log('\n💎 Thông tin gói:');
            if (member.membership) {
                console.log(`   📦 Gói: ${member.membership.planName}`);
                console.log(`   💰 Giá: ${member.membership.planPrice.toLocaleString()} VNĐ`);
                console.log(`   📅 Bắt đầu: ${new Date(member.membership.startDate).toLocaleDateString('vi-VN')}`);
                console.log(`   📅 Kết thúc: ${new Date(member.membership.endDate).toLocaleDateString('vi-VN')}`);
                console.log(`   ⏰ Còn lại: ${member.membership.daysRemaining} ngày`);
                console.log(`   🎯 Tính năng: ${member.membership.planFeatures.join(', ')}`);
            } else {
                console.log('   ❌ Chưa đăng ký gói nào');
            }

            // Quit smoking status - KEY FEATURE
            console.log('\n🚬 Trạng thái cai thuốc:');
            console.log(`   📈 Trạng thái: ${member.quitSmokingStatus.status.toUpperCase()}`);
            console.log(`   📝 Mô tả: ${member.quitSmokingStatus.description}`);
            console.log(`   💡 Khuyến nghị: ${member.quitSmokingStatus.recommendation}`);

            if (member.quitSmokingStatus.metrics) {
                console.log(`   📊 Thống kê tuần qua:`);
                console.log(`      - Trung bình điếu/ngày: ${member.quitSmokingStatus.metrics.recentAvgCigarettes}`);
                console.log(`      - Mức độ thèm thuốc: ${member.quitSmokingStatus.metrics.recentAvgCraving}/10`);
                console.log(`      - Ngày không hút: ${member.quitSmokingStatus.metrics.daysSmokeFree}`);
                console.log(`      - Tổng ngày theo dõi: ${member.quitSmokingStatus.metrics.totalProgressDays}`);
            }

            // Quit plan
            console.log('\n📋 Kế hoạch cai thuốc:');
            if (member.quitPlan) {
                console.log(`   🎯 Ngày bắt đầu: ${new Date(member.quitPlan.startDate).toLocaleDateString('vi-VN')}`);
                console.log(`   🏁 Ngày mục tiêu: ${new Date(member.quitPlan.targetDate).toLocaleDateString('vi-VN')}`);
                console.log(`   💪 Mức độ động lực: ${member.quitPlan.motivationLevel}/10`);
                console.log(`   📝 Lý do cai thuốc: ${member.quitPlan.reason || 'Chưa nhập'}`);
                console.log(`   📅 Số ngày thực hiện: ${member.quitPlan.daysInPlan}`);
            } else {
                console.log('   ❌ Chưa có kế hoạch cai thuốc');
            }

            // Statistics
            console.log('\n📈 Thống kê tổng quan:');
            console.log(`   📊 Ngày theo dõi: ${member.statistics.totalDaysTracked}`);
            console.log(`   🚬 TB điếu/ngày: ${member.statistics.averageCigarettesPerDay}`);
            console.log(`   😰 TB mức thèm: ${member.statistics.averageCravingLevel}/10`);
            console.log(`   💰 Tiền tiết kiệm: ${member.statistics.totalMoneySaved.toLocaleString()} VNĐ`);
            console.log(`   🏆 Kỷ lục không hút: ${member.statistics.bestDaysSmokeFree} ngày`);
            console.log(`   📈 xu hướng: ${member.statistics.progressTrend}`);

            // Achievements
            console.log('\n🏆 Thành tích:');
            console.log(`   🎖️ Tổng số: ${member.achievementCount} huy hiệu`);
            if (member.achievements.length > 0) {
                member.achievements.slice(0, 3).forEach(achievement => {
                    console.log(`   - ${achievement.Name}: ${achievement.Description}`);
                });
                if (member.achievements.length > 3) {
                    console.log(`   ... và ${member.achievements.length - 3} huy hiệu khác`);
                }
            }

            // Recent progress
            console.log('\n📅 Tiến trình gần đây (7 ngày):');
            if (member.recentProgress.length > 0) {
                member.recentProgress.forEach(progress => {
                    const date = new Date(progress.Date).toLocaleDateString('vi-VN');
                    console.log(`   ${date}: ${progress.CigarettesSmoked || 0} điếu, thèm ${progress.CravingLevel || 0}/10`);
                });
            } else {
                console.log('   📝 Chưa có dữ liệu tiến trình');
            }

            console.log('\n=====================================');
            console.log('✅ Test member details completed successfully!');

        } else {
            console.log('❌ No members found to test');
        }

    } catch (error) {
        console.error('❌ Error testing member details:', error.response?.data || error.message);
    }
}

// Test với member ID cụ thể
async function testSpecificMember(memberId) {
    const baseURL = 'http://localhost:3000/api';

    try {
        // Login as coach
        const loginResponse = await axios.post(`${baseURL}/coach/login`, {
            email: 'coach@example.com',
            password: 'password'
        });

        const headers = {
            'Authorization': `Bearer ${loginResponse.data.token}`,
            'Content-Type': 'application/json'
        };

        console.log(`🔍 Getting details for member ID: ${memberId}`);
        const detailsResponse = await axios.get(`${baseURL}/coach/members/${memberId}/details`, { headers });

        console.log('✅ Success!');
        console.log(JSON.stringify(detailsResponse.data.data, null, 2));

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

// Run tests
if (require.main === module) {
    console.log('🧪 Testing Member Details API');
    console.log('============================\n');

    // Test with first available member
    testMemberDetails();

    // Uncomment to test with specific member ID
    // testSpecificMember(2);
}

module.exports = { testMemberDetails, testSpecificMember }; 