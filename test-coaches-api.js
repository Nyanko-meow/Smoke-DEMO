async function testCoachesAPI() {
    try {
        console.log('🧪 Testing coaches API...');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch('http://localhost:4000/api/coaches', {
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log('✅ API Response Status:', response.status);
        console.log('✅ API Response OK:', response.ok);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error Response:', errorText);
            return;
        }

        const data = await response.json();
        console.log('📊 Data:', JSON.stringify(data, null, 2));

    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('❌ Request timeout');
        } else {
            console.error('❌ Error:', error.message);
            console.error('❌ Stack:', error.stack);
        }
    }
}

testCoachesAPI().then(() => {
    console.log('🏁 Test completed');
    process.exit(0);
}); 