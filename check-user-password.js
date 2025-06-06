const sql = require('mssql');
const bcrypt = require('bcrypt');

const config = {
    server: 'localhost',
    database: 'SMOKEKING',
    authentication: {
        type: 'default',
        options: {
            userName: 'sa',
            password: '12345'
        }
    },
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function checkUserPassword() {
    try {
        await sql.connect(config);
        console.log('✅ Connected to database');

        // Get user information
        const user = await sql.query`
            SELECT UserID, FirstName, LastName, Email, PhoneNumber, Password, Role, IsActive
            FROM Users 
            WHERE Email = 'leghenkiz@gmail.com'
        `;

        if (user.recordset.length === 0) {
            console.log('❌ User not found');
            return;
        }

        const userData = user.recordset[0];
        console.log('\n👤 User Information:');
        console.log('- UserID:', userData.UserID);
        console.log('- Name:', userData.FirstName, userData.LastName);
        console.log('- Email:', userData.Email);
        console.log('- Phone:', userData.PhoneNumber);
        console.log('- Role:', userData.Role);
        console.log('- IsActive:', userData.IsActive);
        console.log('- Password Hash:', userData.Password ? userData.Password.substring(0, 20) + '...' : 'NULL');

        // Test password verification
        const passwords = ['123456', 'password', '123', '1234', 'admin'];

        console.log('\n🔑 Testing passwords:');
        for (const testPassword of passwords) {
            try {
                const isMatch = await bcrypt.compare(testPassword, userData.Password);
                console.log(`- "${testPassword}": ${isMatch ? '✅ MATCH' : '❌ No match'}`);
            } catch (error) {
                console.log(`- "${testPassword}": ❌ Error testing - ${error.message}`);
            }
        }

        // Check if the password field is properly hashed
        if (userData.Password && userData.Password.length < 20) {
            console.log('\n⚠️  Warning: Password might not be properly hashed (too short)');

            // Try direct comparison for unhashed passwords
            console.log('\n🔍 Testing direct password comparison:');
            for (const testPassword of passwords) {
                const directMatch = userData.Password === testPassword;
                console.log(`- "${testPassword}": ${directMatch ? '✅ DIRECT MATCH' : '❌ No direct match'}`);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sql.close();
    }
}

checkUserPassword(); 