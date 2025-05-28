const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

// Test data
const testData = {
    coach: {
        email: 'coach@example.com',
        password: 'H12345678@'
    },
    member: {
        email: 'member@example.com',
        password: 'H12345678@'
    }
};

let coachToken = '';
let memberToken = '';
let coachId = '';
let memberId = '';

async function loginCoach() {
    try {
        console.log('🔐 Logging in as coach...');
        const response = await axios.post(`${BASE_URL}/api/coach/login`, {
            email: testData.coach.email,
            password: testData.coach.password
        });

        if (response.data.success) {
            coachToken = response.data.token;
            coachId = response.data.user.id;
            console.log('✅ Coach login successful');
            console.log('   Token:', coachToken.substring(0, 20) + '...');
            console.log('   Coach ID:', coachId);
        }
    } catch (error) {
        console.error('❌ Coach login failed:', error.response?.data?.message || error.message);
        throw error;
    }
}

async function loginMember() {
    try {
        console.log('🔐 Logging in as member...');
        const response = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: testData.member.email,
            password: testData.member.password
        });

        if (response.data.success) {
            memberToken = response.data.token;
            memberId = response.data.user.id;
            console.log('✅ Member login successful');
            console.log('   Token:', memberToken.substring(0, 20) + '...');
            console.log('   Member ID:', memberId);
        }
    } catch (error) {
        console.error('❌ Member login failed:', error.response?.data?.message || error.message);
        throw error;
    }
}

async function testCoachScheduleAPI() {
    try {
        console.log('\n📅 Testing Coach Schedule API...');

        const appointmentDate = new Date();
        appointmentDate.setDate(appointmentDate.getDate() + 1); // Tomorrow
        appointmentDate.setHours(14, 0, 0, 0); // 2:00 PM

        const response = await axios.post(`${BASE_URL}/api/coach/schedule`, {
            memberId: memberId,
            appointmentDate: appointmentDate.toISOString(),
            duration: 45,
            type: 'video',
            notes: 'Test appointment from coach'
        }, {
            headers: {
                'Authorization': `Bearer ${coachToken}`
            }
        });

        if (response.data.success) {
            console.log('✅ Coach schedule API successful');
            console.log('   Appointment ID:', response.data.data.appointmentId);
            console.log('   Date:', response.data.data.appointmentDate);
            console.log('   Meeting Link:', response.data.data.meetingLink);
            return response.data.data.appointmentId;
        }
    } catch (error) {
        console.error('❌ Coach schedule API failed:', error.response?.data?.message || error.message);
        throw error;
    }
}

async function testChatAppointmentAPI() {
    try {
        console.log('\n💬 Testing Chat Appointment API...');

        const appointmentDate = new Date();
        appointmentDate.setDate(appointmentDate.getDate() + 2); // Day after tomorrow
        appointmentDate.setHours(10, 30, 0, 0); // 10:30 AM

        const response = await axios.post(`${BASE_URL}/api/chat/appointment`, {
            receiverId: coachId,
            appointmentDate: appointmentDate.toISOString(),
            duration: 30,
            type: 'chat',
            notes: 'Test appointment from member via chat'
        }, {
            headers: {
                'Authorization': `Bearer ${memberToken}`
            }
        });

        if (response.data.success) {
            console.log('✅ Chat appointment API successful');
            console.log('   Appointment ID:', response.data.data.appointmentId);
            console.log('   Date:', response.data.data.appointmentDate);
            return response.data.data.appointmentId;
        }
    } catch (error) {
        console.error('❌ Chat appointment API failed:', error.response?.data?.message || error.message);
        throw error;
    }
}

async function testGetAppointments() {
    try {
        console.log('\n📋 Testing Get Appointments API...');

        // Test coach appointments
        const coachResponse = await axios.get(`${BASE_URL}/api/coach/appointments`, {
            headers: {
                'Authorization': `Bearer ${coachToken}`
            }
        });

        if (coachResponse.data.success) {
            console.log('✅ Coach appointments API successful');
            console.log('   Total appointments:', coachResponse.data.data.length);
            coachResponse.data.data.forEach((apt, index) => {
                console.log(`   ${index + 1}. ${apt.member.fullName} - ${new Date(apt.appointmentDate).toLocaleString()} (${apt.status})`);
            });
        }

        // Test member appointments via chat API
        const memberResponse = await axios.get(`${BASE_URL}/api/chat/appointments`, {
            headers: {
                'Authorization': `Bearer ${memberToken}`
            }
        });

        if (memberResponse.data.success) {
            console.log('✅ Member appointments API successful');
            console.log('   Total appointments:', memberResponse.data.data.length);
            memberResponse.data.data.forEach((apt, index) => {
                console.log(`   ${index + 1}. Coach ${apt.coach.fullName} - ${new Date(apt.appointmentDate).toLocaleString()} (${apt.status})`);
            });
        }
    } catch (error) {
        console.error('❌ Get appointments API failed:', error.response?.data?.message || error.message);
        throw error;
    }
}

async function testUpdateAppointment(appointmentId) {
    try {
        console.log('\n✏️ Testing Update Appointment API...');

        const response = await axios.patch(`${BASE_URL}/api/coach/appointments/${appointmentId}`, {
            status: 'confirmed',
            notes: 'Updated notes - appointment confirmed'
        }, {
            headers: {
                'Authorization': `Bearer ${coachToken}`
            }
        });

        if (response.data.success) {
            console.log('✅ Update appointment API successful');
            console.log('   Status:', response.data.data.status);
            console.log('   Notes:', response.data.data.notes);
        }
    } catch (error) {
        console.error('❌ Update appointment API failed:', error.response?.data?.message || error.message);
        throw error;
    }
}

async function testAvailableSlots() {
    try {
        console.log('\n🕐 Testing Available Slots API...');

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];

        const response = await axios.get(`${BASE_URL}/api/coach/available-slots`, {
            headers: {
                'Authorization': `Bearer ${coachToken}`
            },
            params: {
                date: dateStr,
                duration: 30
            }
        });

        if (response.data.success) {
            console.log('✅ Available slots API successful');
            console.log('   Date:', response.data.data.date);
            console.log('   Working hours:', response.data.data.workingHours.start, '-', response.data.data.workingHours.end);
            console.log('   Available slots:', response.data.data.totalSlots);

            if (response.data.data.availableSlots.length > 0) {
                console.log('   First 3 slots:');
                response.data.data.availableSlots.slice(0, 3).forEach((slot, index) => {
                    const startTime = new Date(slot.startTime).toLocaleTimeString();
                    console.log(`     ${index + 1}. ${startTime} (${slot.duration} min)`);
                });
            }
        }
    } catch (error) {
        console.error('❌ Available slots API failed:', error.response?.data?.message || error.message);
        throw error;
    }
}

async function runTests() {
    try {
        console.log('🚀 Starting Appointment API Tests...\n');

        // Step 1: Login
        await loginCoach();
        await loginMember();

        // Step 2: Test coach schedule API
        const appointmentId = await testCoachScheduleAPI();

        // Step 3: Test chat appointment API
        await testChatAppointmentAPI();

        // Step 4: Test get appointments
        await testGetAppointments();

        // Step 5: Test update appointment
        if (appointmentId) {
            await testUpdateAppointment(appointmentId);
        }

        // Step 6: Test available slots
        await testAvailableSlots();

        console.log('\n🎉 All tests completed successfully!');

    } catch (error) {
        console.error('\n💥 Test failed:', error.message);
        process.exit(1);
    }
}

// Run tests
runTests(); 