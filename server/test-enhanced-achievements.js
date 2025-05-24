const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test user credentials
const testUser = {
    email: 'member@example.com',
    password: 'H12345678@'
};

async function testEnhancedAchievements() {
    try {
        console.log('🚀 Testing Enhanced Achievement System...\n');

        // 1. Login to get token
        console.log('1. 🔐 Logging in...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, testUser);

        if (!loginResponse.data.success) {
            throw new Error('Login failed');
        }

        const token = loginResponse.data.token;
        const userId = loginResponse.data.user.UserID;
        console.log(`✅ Login successful for user ${userId}`);

        const headers = { Authorization: `Bearer ${token}` };

        // 2. Get all achievements
        console.log('\n2. 📋 Getting all achievements...');
        const achievementsResponse = await axios.get(`${BASE_URL}/achievements`, { headers });

        if (achievementsResponse.data.success) {
            console.log(`✅ Found ${achievementsResponse.data.data.length} total achievements`);

            // Show achievements by category
            const categories = {};
            achievementsResponse.data.data.forEach(achievement => {
                if (!categories[achievement.Category]) {
                    categories[achievement.Category] = [];
                }
                categories[achievement.Category].push(achievement);
            });

            console.log('\n📊 Achievements by category:');
            Object.keys(categories).forEach(category => {
                console.log(`- ${category}: ${categories[category].length} achievements`);
            });
        }

        // 3. Check user's earned achievements
        console.log('\n3. 🏆 Getting user\'s earned achievements...');
        const earnedResponse = await axios.get(`${BASE_URL}/achievements/earned`, { headers });

        if (earnedResponse.data.success) {
            console.log(`✅ User has ${earnedResponse.data.data.length} earned achievements`);

            if (earnedResponse.data.data.length > 0) {
                console.log('\n🎖️ Earned achievements:');
                earnedResponse.data.data.forEach(achievement => {
                    console.log(`- ${achievement.IconURL} ${achievement.Name} (${achievement.Points} pts)`);
                });
            }
        }

        // 4. Get user's top badge
        console.log('\n4. 🥇 Getting user\'s top badge...');
        const topBadgeResponse = await axios.get(`${BASE_URL}/achievements/top-badge`, { headers });

        if (topBadgeResponse.data.success && topBadgeResponse.data.data) {
            const badge = topBadgeResponse.data.data;
            console.log(`✅ Top badge: ${badge.IconURL} ${badge.Name} (${badge.Points} pts)`);
        } else {
            console.log('ℹ️ User has no badges yet');
        }

        // 5. Get achievement statistics
        console.log('\n5. 📈 Getting achievement statistics...');
        const statsResponse = await axios.get(`${BASE_URL}/achievements/stats`, { headers });

        if (statsResponse.data.success) {
            const stats = statsResponse.data.data;
            console.log('✅ Achievement Statistics:');
            console.log(`- Total Achievements: ${stats.TotalAchievements}`);
            console.log(`- Earned: ${stats.EarnedCount}`);
            console.log(`- Completion Rate: ${stats.CompletionRate}%`);
            console.log(`- Total Points: ${stats.TotalPoints || 0}`);
            console.log(`- Categories Completed: ${stats.CategoriesCompleted || 0}`);
        }

        // 6. Test achievement checking
        console.log('\n6. 🔍 Testing achievement checking...');
        const checkResponse = await axios.post(`${BASE_URL}/achievements/check`, {}, { headers });

        if (checkResponse.data.success) {
            console.log(`✅ Achievement check completed`);
            console.log(`- Message: ${checkResponse.data.message}`);

            if (checkResponse.data.newAchievements && checkResponse.data.newAchievements.length > 0) {
                console.log('\n🎉 New achievements earned:');
                checkResponse.data.newAchievements.forEach(achievement => {
                    console.log(`- ${achievement.IconURL} ${achievement.Name}`);
                });
            }
        }

        // 7. Test progress update trigger
        console.log('\n7. 📊 Testing progress update trigger...');
        const progressResponse = await axios.post(`${BASE_URL}/achievements/progress-update`, {}, { headers });

        if (progressResponse.data.success) {
            console.log(`✅ Progress update completed`);
            console.log(`- Message: ${progressResponse.data.message}`);
        }

        // 8. Test category-specific achievements
        console.log('\n8. 🎯 Testing category-specific achievements...');
        const categories = ['basic', 'premium', 'pro', 'money', 'special', 'social'];

        for (const category of categories) {
            try {
                const categoryResponse = await axios.get(`${BASE_URL}/achievements/categories/${category}`, { headers });

                if (categoryResponse.data.success) {
                    const categoryAchievements = categoryResponse.data.data;
                    const earnedCount = categoryAchievements.filter(a => a.IsEarned).length;
                    console.log(`- ${category}: ${earnedCount}/${categoryAchievements.length} earned`);
                }
            } catch (error) {
                console.log(`- ${category}: Error fetching`);
            }
        }

        console.log('\n✅ Enhanced Achievement System test completed successfully!');
        console.log('\n💡 Next steps:');
        console.log('1. Run the setup script: node setup-enhanced-achievements.js');
        console.log('2. Add some progress data to trigger achievements');
        console.log('3. Test the frontend achievement display');
        console.log('4. Verify badges appear in comments and profiles');

    } catch (error) {
        console.error('❌ Test failed:');

        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testEnhancedAchievements(); 