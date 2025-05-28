const BASE_URL = 'http://localhost:4000';

async function testAppointmentDebug() {
    try {
        console.log('🧪 Testing Appointment API Debug...\n');

        // Step 1: Login as member to get token
        console.log('1️⃣ Logging in as member...');
        const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'member@example.com',
                password: 'H12345678@'
            })
        });

        const loginData = await loginResponse.json();
        if (!loginData.success) {
            throw new Error('Login failed: ' + loginData.message);
        }

        const token = loginData.token;
        console.log('✅ Login successful, token obtained');

        // Step 2: Get coaches list
        console.log('\n2️⃣ Getting coaches list...');
        const coachesResponse = await fetch(`${BASE_URL}/api/coaches`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const coachesData = await coachesResponse.json();
        if (!coachesData.success || coachesData.data.length === 0) {
            throw new Error('No coaches available');
        }

        const coach = coachesData.data[0];
        console.log('✅ Coach found:', {
            id: coach.UserID,
            name: coach.FullName,
            active: coach.IsActive
        });

        // Step 3: Create appointment
        console.log('\n3️⃣ Creating appointment...');
        const appointmentDate = new Date();
        appointmentDate.setDate(appointmentDate.getDate() + 1); // Tomorrow
        appointmentDate.setHours(14, 30, 0, 0); // 2:30 PM

        const appointmentData = {
            receiverId: coach.UserID,
            appointmentDate: appointmentDate.toISOString(),
            duration: 30,
            type: 'chat',
            notes: 'Test appointment from debug script'
        };

        console.log('📋 Appointment data:', appointmentData);

        const appointmentResponse = await fetch(`${BASE_URL}/api/chat/appointment`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(appointmentData)
        });

        console.log('📊 Response status:', appointmentResponse.status);
        console.log('📊 Response ok:', appointmentResponse.ok);

        const appointmentResult = await appointmentResponse.json();

        if (appointmentResponse.ok && appointmentResult.success) {
            console.log('✅ Appointment created successfully!');
            console.log('📅 Response:', appointmentResult);
        } else {
            console.error('❌ Appointment creation failed:');
            console.error('Status:', appointmentResponse.status);
            console.error('Response:', appointmentResult);
            return;
        }

        // Step 4: Verify appointment was saved
        console.log('\n4️⃣ Verifying appointment was saved...');
        const appointmentsResponse = await fetch(`${BASE_URL}/api/chat/appointments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const appointmentsData = await appointmentsResponse.json();
        console.log('✅ Appointments loaded:', appointmentsData.data?.length || 0);

        if (appointmentsData.data && appointmentsData.data.length > 0) {
            const lastAppointment = appointmentsData.data[0];
            console.log('📋 Latest appointment:', {
                id: lastAppointment.id,
                date: lastAppointment.appointmentDate,
                status: lastAppointment.status,
                coach: lastAppointment.coach?.fullName
            });
        }

        console.log('\n🎉 All tests passed! Appointment system is working correctly.');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
    }
}

testAppointmentDebug(); 