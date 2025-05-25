const jwt = require('jsonwebtoken');
const sql = require('mssql');

const config = {
    server: 'localhost',
    database: 'SMOKEKING',
    options: {
        encrypt: false,
        trustServerCertificate: true
    },
    authentication: {
        type: 'default',
        options: {
            userName: 'sa',
            password: '12345'
        }
    }
};

async function debugAuthMiddleware() {
    try {
        await sql.connect(config);
        console.log('🔌 Connected to database');

        const JWT_SECRET = 'smokeking_secret_key_ultra_secure_2024';

        // 1. Create token for coach
        const payload = {
            id: 3,  // Coach UserID
            email: 'coach@example.com',
            role: 'coach'
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
        console.log('\n🔑 Created token:', token.substring(0, 50) + '...');

        // 2. Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('\n✅ Decoded token:', decoded);

        // 3. Get user from database (simulate auth middleware)
        const result = await sql.query`
            SELECT UserID, Email, FirstName, LastName, Role 
            FROM Users 
            WHERE UserID = ${decoded.id}
        `;

        if (result.recordset.length === 0) {
            console.log('❌ User not found in database');
            return;
        }

        const user = result.recordset[0];
        console.log('\n👤 User from database:', user);

        // 4. Test role authorization
        const requiredRoles = ['coach'];
        const userRole = user.Role;

        console.log('\n🔍 Role authorization test:');
        console.log(`   User role: "${userRole}"`);
        console.log(`   Required roles: [${requiredRoles.map(r => `"${r}"`).join(', ')}]`);
        console.log(`   Role match: ${requiredRoles.includes(userRole)}`);

        // 5. Test exact string comparison
        console.log('\n🔬 String comparison test:');
        console.log(`   userRole === 'coach': ${userRole === 'coach'}`);
        console.log(`   userRole.trim() === 'coach': ${userRole.trim() === 'coach'}`);
        console.log(`   userRole length: ${userRole.length}`);
        console.log(`   userRole charCodes: [${Array.from(userRole).map(c => c.charCodeAt(0)).join(', ')}]`);

        await sql.close();
        console.log('\n✅ Debug completed!');

    } catch (error) {
        console.error('❌ Debug failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

debugAuthMiddleware(); 