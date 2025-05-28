const BASE_URL = 'http://localhost:4000';

async function testCancelFix() {
    try {
        console.log('🧪 Testing Cancel Appointment Fix...\n');

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

        // Step 2: Get appointments
        console.log('\n2️⃣ Getting appointments...');
        const appointmentsResponse = await fetch(`${BASE_URL}/api/chat/appointments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const appointmentsData = await appointmentsResponse.json();
        console.log('✅ Appointments loaded:', appointmentsData.data?.length || 0);

        if (!appointmentsData.data || appointmentsData.data.length === 0) {
            console.log('⚠️ No appointments to test cancellation');
            return;
        }

        // Step 3: Test cancel first appointment
        const testAppointment = appointmentsData.data.find(apt => apt.status === 'scheduled');
        if (!testAppointment) {
            console.log('⚠️ No scheduled appointments to cancel');
            return;
        }

        console.log(`\n3️⃣ Testing cancel appointment ${testAppointment.id}...`);
        console.log('📋 Appointment details:', {
            id: testAppointment.id,
            status: testAppointment.status,
            date: testAppointment.appointmentDate
        });

        const cancelResponse = await fetch(`${BASE_URL}/api/chat/appointments/${testAppointment.id}/cancel`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });

        console.log('📊 Cancel response status:', cancelResponse.status);
        console.log('📊 Cancel response ok:', cancelResponse.ok);

        const cancelData = await cancelResponse.json();
        console.log('📊 Cancel response data:', cancelData);

        if (cancelResponse.ok && cancelData.success) {
            console.log('✅ Cancel successful!');
        } else {
            console.log('❌ Cancel failed with response:', cancelData);
        }

        // Step 4: Verify cancellation
        console.log('\n4️⃣ Verifying cancellation...');
        const verifyResponse = await fetch(`${BASE_URL}/api/chat/appointments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const verifyData = await verifyResponse.json();
        const cancelledAppointment = verifyData.data?.find(apt => apt.id === testAppointment.id);

        if (cancelledAppointment) {
            console.log('📋 Appointment status after cancel:', cancelledAppointment.status);
            if (cancelledAppointment.status === 'cancelled') {
                console.log('✅ Cancellation verified successfully!');
            } else {
                console.log('⚠️ Appointment status not updated');
            }
        } else {
            console.log('⚠️ Appointment not found after cancel');
        }

        console.log('\n🎉 Cancel test completed!');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
    }
}

// Wait for server to start
setTimeout(() => {
    testCancelFix();
}, 3000); 