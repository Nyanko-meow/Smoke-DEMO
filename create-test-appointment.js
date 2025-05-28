const BASE_URL = 'http://localhost:4000';

async function createTestAppointment() {
    try {
        console.log('🧪 Creating Test Appointment...\n');

        // Step 1: Login as member
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
        console.log('✅ Login successful');

        // Step 2: Get coaches
        console.log('\n2️⃣ Getting coaches...');
        const coachesResponse = await fetch(`${BASE_URL}/api/coaches`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const coachesData = await coachesResponse.json();
        console.log('✅ Coaches loaded:', coachesData.data?.length || 0);

        if (!coachesData.data || coachesData.data.length === 0) {
            console.log('⚠️ No coaches available');
            return;
        }

        const firstCoach = coachesData.data[0];
        console.log('👨‍🏫 Selected coach:', firstCoach.name, 'ID:', firstCoach.id);

        // Step 3: Create appointment
        console.log('\n3️⃣ Creating appointment...');
        const appointmentDate = new Date();
        appointmentDate.setDate(appointmentDate.getDate() + 1); // Tomorrow
        appointmentDate.setHours(14, 0, 0, 0); // 2:00 PM

        const appointmentData = {
            coachId: firstCoach.id,
            appointmentDate: appointmentDate.toISOString(),
            type: 'video',
            notes: 'Test appointment for cancellation testing'
        };

        console.log('📋 Appointment data:', appointmentData);

        const createResponse = await fetch(`${BASE_URL}/api/chat/appointment`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(appointmentData)
        });

        console.log('📊 Create response status:', createResponse.status);

        const createData = await createResponse.json();
        console.log('📊 Create response data:', createData);

        if (createResponse.ok && createData.success) {
            console.log('✅ Appointment created successfully!');
            console.log('🆔 Appointment ID:', createData.data?.appointmentId);
        } else {
            console.log('❌ Failed to create appointment');
        }

        console.log('\n🎉 Test appointment creation completed!');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
    }
}

// Wait for server to start
setTimeout(() => {
    createTestAppointment();
}, 2000); 