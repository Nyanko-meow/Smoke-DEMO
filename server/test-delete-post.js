const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test user credentials
const testUser = {
    email: 'member@example.com',
    password: 'H12345678@'
};

async function testDeletePost() {
    try {
        console.log('🚀 Testing delete post functionality...\n');

        // 1. Login to get token
        console.log('1. 🔐 Logging in...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, testUser);

        if (!loginResponse.data.success) {
            throw new Error('Login failed');
        }

        const token = loginResponse.data.token;
        console.log('✅ Login successful');

        const headers = { Authorization: `Bearer ${token}` };

        // 2. Get community posts to find one to delete
        console.log('\n2. 📋 Getting community posts...');
        const postsResponse = await axios.get(`${BASE_URL}/community/posts`);

        if (!postsResponse.data.success || postsResponse.data.data.length === 0) {
            console.log('❌ No posts found. Creating a test post first...');

            // Create a test post
            const createResponse = await axios.post(`${BASE_URL}/community/posts`, {
                title: 'Test Post để xóa',
                content: 'Đây là bài viết test để kiểm tra tính năng xóa'
            }, { headers });

            if (createResponse.data.success) {
                console.log('✅ Test post created:', createResponse.data.data.PostID);

                // Test deleting the just created post
                const deleteResponse = await axios.delete(`${BASE_URL}/community/posts/${createResponse.data.data.PostID}`, { headers });

                console.log('\n3. 🗑️ Delete response:');
                console.log(JSON.stringify(deleteResponse.data, null, 2));

                if (deleteResponse.data.success) {
                    console.log('✅ Post deleted successfully!');
                } else {
                    console.log('❌ Failed to delete post');
                }
            }
        } else {
            const userPosts = postsResponse.data.data.filter(post => post.UserID === 2); // Assuming UserID 2 is our test user

            if (userPosts.length > 0) {
                const postToDelete = userPosts[0];
                console.log(`📝 Found user post to delete: "${postToDelete.Title}"`);

                // Test deleting user's own post
                console.log('\n3. 🗑️ Testing delete own post...');
                const deleteResponse = await axios.delete(`${BASE_URL}/community/posts/${postToDelete.PostID}`, { headers });

                console.log('Delete response:');
                console.log(JSON.stringify(deleteResponse.data, null, 2));

                if (deleteResponse.data.success) {
                    console.log('✅ Post deleted successfully!');
                } else {
                    console.log('❌ Failed to delete post');
                }
            } else {
                console.log('❌ No posts from this user found to delete');
            }
        }

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

testDeletePost(); 