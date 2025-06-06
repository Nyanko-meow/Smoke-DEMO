const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';

async function testFixedEndpoints() {
    try {
        console.log('🔧 Testing Fixed Profile Update Endpoints\n');

        // Test login first
        console.log('1. Testing login...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'member@example.com',
            password: 'H12345678@'
        });

        if (!loginResponse.data.success) {
            console.log('❌ Login failed:', loginResponse.data.message);
            return;
        }

        const token = loginResponse.data.token;
        console.log('✅ Login successful');
        console.log('User from login:', loginResponse.data.user);

        // Test correct profile endpoint /user/profile (GET)
        console.log('\n2. Testing GET /user/profile...');
        try {
            const profileResponse = await axios.get(`${API_BASE}/user/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (profileResponse.data.success) {
                console.log('✅ Profile fetch successful!');
                console.log('Profile data:', profileResponse.data.data);
            } else {
                console.log('❌ Profile fetch failed:', profileResponse.data.message);
            }
        } catch (error) {
            console.log('❌ Profile fetch error:', error.response?.data?.message || error.message);
        }

        // Test profile update endpoint /user/profile (PUT)
        console.log('\n3. Testing PUT /user/profile...');
        try {
            const updateData = {
                firstName: 'Member',
                lastName: 'User Updated',
                phoneNumber: '0987654321',
                address: 'Fixed Address Test - ' + new Date().toISOString()
            };

            console.log('Update data:', updateData);

            const updateResponse = await axios.put(`${API_BASE}/user/profile`, updateData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (updateResponse.data.success) {
                console.log('✅ Profile update successful!');
                console.log('Updated data:', updateResponse.data.data);
            } else {
                console.log('❌ Profile update failed:', updateResponse.data.message);
            }
        } catch (error) {
            console.log('❌ Profile update error:', error.response?.data?.message || error.message);
            if (error.response?.data) {
                console.log('Error details:', error.response.data);
            }
        }

        // Test that admin users endpoint still works
        console.log('\n4. Testing admin login and user listing...');
        try {
            const adminLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
                email: 'admin@example.com',
                password: 'H12345678@'
            });

            if (adminLoginResponse.data.success) {
                const adminToken = adminLoginResponse.data.token;
                console.log('✅ Admin login successful');

                const adminUsersResponse = await axios.get(`${API_BASE}/admin/users`, {
                    headers: { Authorization: `Bearer ${adminToken}` }
                });

                if (adminUsersResponse.data.success) {
                    console.log('✅ Admin users fetch successful');
                    console.log(`Found ${adminUsersResponse.data.data.length} users`);

                    // Check for Tran Huy
                    const tranHuy = adminUsersResponse.data.data.find(u =>
                        u.FullName?.includes('Tran Huy') ||
                        (u.FirstName?.includes('Tran') && u.LastName?.includes('Huy'))
                    );

                    if (tranHuy) {
                        console.log('✅ Tran Huy found in admin interface:', {
                            UserID: tranHuy.UserID,
                            FullName: tranHuy.FullName,
                            Email: tranHuy.Email,
                            Role: tranHuy.Role
                        });
                    } else {
                        console.log('❌ Tran Huy not found in admin interface');
                    }
                } else {
                    console.log('❌ Admin users fetch failed:', adminUsersResponse.data.message);
                }
            } else {
                console.log('❌ Admin login failed:', adminLoginResponse.data.message);
            }
        } catch (error) {
            console.log('❌ Admin test error:', error.response?.data?.message || error.message);
        }

        console.log('\n🎉 Testing completed!');

    } catch (error) {
        console.error('❌ Script error:', error.message);
    }
}

// Note: Make sure server is running on port 4000 before running this test
console.log('📋 Note: Make sure the server is running on port 4000 before running this test');
console.log('You can start it with: cd server && npm start\n');

testFixedEndpoints(); 