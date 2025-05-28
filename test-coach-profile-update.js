const axios = require('axios');

async function testCoachProfileUpdate() {
    try {
        console.log('🧪 Testing coach profile update...');

        // First, login as coach to get token
        const loginResponse = await axios.post('http://localhost:4000/api/coach/login', {
            email: 'coach@smokeking.com',
            password: 'coach123'
        }, {
            withCredentials: true
        });

        if (!loginResponse.data.success) {
            console.error('❌ Login failed:', loginResponse.data.message);
            return;
        }

        console.log('✅ Login successful, token:', loginResponse.data.token.substring(0, 20) + '...');
        const token = loginResponse.data.token;

        // Test profile update with minimal data
        const updateData = {
            firstName: 'Coachhh',
            lastName: 'Smithhhh',
            phoneNumber: '0111222333',
            address: '789 Coach Blvd',
            avatar: 'coach.jpg',
            // Professional fields
            specialization: 'Cai thuốc lá, Tư vấn nghiện và hành vi',
            yearsOfExperience: 8,
            education: 'Bằng thạc sĩ về tâm lý học và nghiên cứu về addiction',
            certifications: 'Chứng chỉ Life Coach quốc tế, Chứng chỉ tư vấn hành vi',
            license: 'GP-2024-VN-001234',
            bio: 'Có 8 năm kinh nghiệm trong lĩnh vực tư vấn cai thuốc lá và nghiện các chất gây hại.',
            methodology: 'Kết hợp liệu pháp nhận thức hành vi (CBT) với coaching cá nhân',
            successStory: 'Đã giúp hơn 500 khách hàng cai thuốc lá thành công',
            languages: 'Tiếng Việt (bản ngữ), English (thành thạo)',
            communicationStyle: 'Thân thiện, kiên nhẫn và khuyến khích tích cực',
            workingHours: 'Thứ 2-6: 8:00-17:00, Thứ 7: 9:00-15:00',
            website: 'https://coach-smith.com',
            linkedin: 'https://linkedin.com/in/coach-smith',
            hourlyRate: 750000,
            consultationFee: 200000,
            servicesOffered: 'Tư vấn cá nhân, nhóm hỗ trợ, theo dõi tiến trình 24/7'
        };

        console.log('📤 Sending update request...');
        console.log('Update data:', JSON.stringify(updateData, null, 2));

        const updateResponse = await axios.put('http://localhost:4000/api/coach/profile', updateData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            withCredentials: true
        });

        if (updateResponse.data.success) {
            console.log('✅ Profile update successful!');
            console.log('Response:', updateResponse.data);
        } else {
            console.log('❌ Profile update failed:', updateResponse.data.message);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        console.error('Status:', error.response?.status);
        console.error('Headers:', error.response?.headers);

        if (error.response?.data?.error) {
            console.error('Server error details:', error.response.data.error);
        }
    }
}

// Run test
testCoachProfileUpdate(); 