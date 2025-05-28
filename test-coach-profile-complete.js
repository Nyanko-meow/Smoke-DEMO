const axios = require('axios');

async function testCoachProfileComplete() {
    try {
        console.log('🧪 Testing complete coach profile API...');

        // 1. First login as coach
        console.log('🔐 Logging in as coach...');
        const loginResponse = await axios.post('http://localhost:4000/api/coach/login', {
            email: 'coach@example.com',
            password: 'H12345678'
        });

        if (!loginResponse.data.success) {
            console.error('❌ Login failed:', loginResponse.data.message);
            return;
        }

        console.log('✅ Login successful');
        const token = loginResponse.data.token;

        // 2. Get current profile
        console.log('📋 Getting current profile...');
        const profileResponse = await axios.get('http://localhost:4000/api/coach/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (profileResponse.data.success) {
            console.log('✅ Profile loaded successfully');
            console.log('Current profile data:');
            const data = profileResponse.data.data;
            console.log('- Name:', data.FirstName, data.LastName);
            console.log('- Email:', data.Email);
            console.log('- Phone:', data.PhoneNumber);
            console.log('- Bio:', data.Bio ? data.Bio.substring(0, 50) + '...' : 'No bio');
            console.log('- Specialization:', data.Specialization);
            console.log('- Experience:', data.Experience);
            console.log('- Education:', data.Education);
            console.log('- Certifications:', data.Certifications);
            console.log('- Languages:', data.Languages);
            console.log('- Working Hours:', data.WorkingHours);
            console.log('- Consultation Types:', data.ConsultationTypes);
            console.log('- Hourly Rate:', data.HourlyRate);
        }

        // 3. Test profile update with comprehensive data
        console.log('\n📤 Testing profile update...');
        const updateData = {
            firstName: 'Coach',
            lastName: 'Smith',
            phoneNumber: '0111222333',
            address: '789 Coach Blvd, Hà Nội',
            bio: 'Tôi là một coach chuyên nghiệp với nhiều năm kinh nghiệm hỗ trợ người cai thuốc lá. Đã giúp hàng trăm người thành công trong hành trình cai thuốc.',

            // Professional fields
            specialization: 'Cai thuốc lá, Tư vấn nghiện, Liệu pháp hành vi',
            yearsOfExperience: 8,
            education: 'Thạc sĩ Tâm lý học - Đại học Y Hà Nội\nCử nhân Y khoa - Đại học Y Hà Nội',
            certifications: 'Chứng chỉ tư vấn viên cai thuốc quốc tế\nChứng chỉ CBT (Cognitive Behavioral Therapy)\nChứng chỉ Huấn luyện viên sức khỏe cộng đồng',
            languages: 'Tiếng Việt (bản ngữ), Tiếng Anh (thành thạo)',
            workingHours: 'Thứ 2-6: 8:00-17:00, Thứ 7: 8:00-12:00',
            servicesOffered: 'Video call, Voice call, Chat, Tư vấn nhóm, Theo dõi tiến trình 24/7',
            hourlyRate: 250000
        };

        console.log('Sending update with data:', Object.keys(updateData));

        const updateResponse = await axios.put('http://localhost:4000/api/coach/profile', updateData, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (updateResponse.data.success) {
            console.log('✅ Profile update successful!');
        } else {
            console.log('❌ Profile update failed:', updateResponse.data.message);
        }

        // 4. Get updated profile to verify changes
        console.log('\n📋 Getting updated profile...');
        const updatedProfileResponse = await axios.get('http://localhost:4000/api/coach/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (updatedProfileResponse.data.success) {
            console.log('✅ Updated profile loaded successfully');
            const updatedData = updatedProfileResponse.data.data;
            console.log('Updated profile data:');
            console.log('- Name:', updatedData.FirstName, updatedData.LastName);
            console.log('- Phone:', updatedData.PhoneNumber);
            console.log('- Address:', updatedData.Address);
            console.log('- Bio:', updatedData.Bio ? updatedData.Bio.substring(0, 50) + '...' : 'No bio');
            console.log('- Specialization:', updatedData.Specialization);
            console.log('- Years Experience:', updatedData.YearsOfExperience);
            console.log('- Education:', updatedData.Education ? updatedData.Education.substring(0, 50) + '...' : 'No education');
            console.log('- Languages:', updatedData.Languages);
            console.log('- Working Hours:', updatedData.WorkingHours);
            console.log('- Services:', updatedData.ConsultationTypes);
            console.log('- Hourly Rate:', updatedData.HourlyRate);
        }

        console.log('\n🎉 Complete coach profile test finished successfully!');
        console.log('🔗 You can now test the frontend coach profile page');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        if (error.response?.status) {
            console.error('Status:', error.response.status);
        }
        if (error.response?.data?.error) {
            console.error('Server error:', error.response.data.error);
        }
    }
}

testCoachProfileComplete(); 