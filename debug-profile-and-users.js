const axios = require('axios');
const sql = require('mssql');

const API_BASE = 'http://localhost:4000/api';

// Database config
const dbConfig = {
    user: 'sa',
    password: '12345',
    server: 'localhost',
    database: 'SMOKEKING',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function debugProfileAndUsers() {
    let pool;

    try {
        console.log('🔍 Debugging Profile Update & Admin User Display Issues\n');

        // Connect to database
        console.log('1. Connecting to database...');
        pool = await sql.connect(dbConfig);
        console.log('✅ Database connected\n');

        // Check all users in database
        console.log('2. Checking all users in database...');
        const allUsers = await pool.query(`
            SELECT UserID, Email, FirstName, LastName, Role, IsActive, CreatedAt, UpdatedAt
            FROM Users 
            ORDER BY UserID
        `);

        console.log('--- All Users in Database ---');
        console.table(allUsers.recordset);
        console.log(`Total users: ${allUsers.recordset.length}\n`);

        // Find Tran Huy specifically
        const tranHuyUsers = await pool.query(`
            SELECT * FROM Users 
            WHERE FirstName LIKE '%Tran%' OR LastName LIKE '%Huy%' 
               OR FirstName LIKE '%Huy%' OR LastName LIKE '%Tran%'
               OR UserID = 6
        `);

        console.log('--- Users matching Tran/Huy or ID 6 ---');
        if (tranHuyUsers.recordset.length > 0) {
            console.table(tranHuyUsers.recordset);
        } else {
            console.log('❌ No users found matching Tran Huy\n');
        }

        // Test API endpoints
        console.log('3. Testing login and profile update...');

        // Test login with member account
        let memberToken = null;
        try {
            const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
                email: 'member@example.com',
                password: 'H12345678@'
            });

            if (loginResponse.data.success) {
                memberToken = loginResponse.data.token;
                console.log('✅ Member login successful');
                console.log('User data from login:', loginResponse.data.user);
            } else {
                console.log('❌ Member login failed:', loginResponse.data.message);
            }
        } catch (error) {
            console.log('❌ Member login error:', error.response?.data?.message || error.message);
        }

        // Test profile update if logged in
        if (memberToken) {
            try {
                console.log('\n4. Testing profile update...');

                // Get current profile first
                const profileResponse = await axios.get(`${API_BASE}/users/profile`, {
                    headers: { Authorization: `Bearer ${memberToken}` }
                });

                if (profileResponse.data.success) {
                    console.log('✅ Profile fetch successful');
                    console.log('Current profile:', profileResponse.data.data.userInfo);

                    // Try updating profile
                    const updateData = {
                        firstName: profileResponse.data.data.userInfo.firstName,
                        lastName: profileResponse.data.data.userInfo.lastName,
                        phoneNumber: profileResponse.data.data.userInfo.phoneNumber,
                        address: 'TEST ADDRESS - ' + new Date().toISOString()
                    };

                    console.log('\nTrying to update with data:', updateData);

                    const updateResponse = await axios.put(`${API_BASE}/users/profile`, updateData, {
                        headers: { Authorization: `Bearer ${memberToken}` }
                    });

                    if (updateResponse.data.success) {
                        console.log('✅ Profile update successful!');
                        console.log('Updated data:', updateResponse.data.data);
                    } else {
                        console.log('❌ Profile update failed:', updateResponse.data.message);
                    }
                } else {
                    console.log('❌ Profile fetch failed:', profileResponse.data.message);
                }
            } catch (error) {
                console.log('❌ Profile update error:', error.response?.data?.message || error.message);
                console.log('Error details:', error.response?.data);
            }
        }

        // Test admin endpoints
        console.log('\n5. Testing admin endpoints...');

        // Try admin login
        let adminToken = null;
        try {
            const adminLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
                email: 'admin@example.com',
                password: 'H12345678@'
            });

            if (adminLoginResponse.data.success) {
                adminToken = adminLoginResponse.data.token;
                console.log('✅ Admin login successful');
            } else {
                console.log('❌ Admin login failed:', adminLoginResponse.data.message);
            }
        } catch (error) {
            console.log('❌ Admin login error:', error.response?.data?.message || error.message);
        }

        // Test admin user listing if logged in
        if (adminToken) {
            try {
                const adminUsersResponse = await axios.get(`${API_BASE}/admin/users`, {
                    headers: { Authorization: `Bearer ${adminToken}` }
                });

                if (adminUsersResponse.data.success) {
                    console.log('✅ Admin users fetch successful');
                    console.log(`Found ${adminUsersResponse.data.data.length} users via admin API`);
                    console.log('Users from admin API:');
                    console.table(adminUsersResponse.data.data.map(u => ({
                        UserID: u.UserID,
                        FullName: u.FullName,
                        Email: u.Email,
                        Role: u.Role,
                        IsActive: u.IsActive
                    })));

                    // Check if Tran Huy appears in admin results
                    const tranHuyInAdmin = adminUsersResponse.data.data.find(u =>
                        u.FullName?.includes('Tran') || u.FullName?.includes('Huy') ||
                        u.FirstName?.includes('Tran') || u.LastName?.includes('Huy')
                    );

                    if (tranHuyInAdmin) {
                        console.log('✅ Found Tran Huy in admin results:', tranHuyInAdmin);
                    } else {
                        console.log('❌ Tran Huy NOT found in admin results');
                    }
                } else {
                    console.log('❌ Admin users fetch failed:', adminUsersResponse.data.message);
                }
            } catch (error) {
                console.log('❌ Admin users fetch error:', error.response?.data?.message || error.message);
            }
        }

        // Check database schema to see if there are any issues
        console.log('\n6. Checking database schema...');
        try {
            const schemaCheck = await pool.query(`
                SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'Users'
                ORDER BY ORDINAL_POSITION
            `);

            console.log('--- Users table schema ---');
            console.table(schemaCheck.recordset);
        } catch (error) {
            console.log('❌ Schema check error:', error.message);
        }

    } catch (error) {
        console.error('❌ Script error:', error);
    } finally {
        if (pool) {
            await pool.close();
        }
    }
}

debugProfileAndUsers(); 