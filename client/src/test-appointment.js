// Test file để kiểm tra API đặt lịch
const axios = require('axios');

const testAppointment = async () => {
    try {
        // Thay đổi token này bằng token thực tế của bạn
        const token = 'YOUR_TOKEN_HERE';

        const response = await axios.post('https://smokeking.wibu.me:4000/api/chat/appointment', {
            receiverId: 3, // ID của coach
            appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Ngày mai
            duration: 30,
            type: 'chat',
            notes: 'Test appointment'
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Success:', response.data);
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
};

// Uncomment để chạy test
// testAppointment();

module.exports = { testAppointment }; 