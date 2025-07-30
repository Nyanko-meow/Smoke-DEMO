const { pool, connectDB } = require('./src/config/database');

async function testAdminUsers() {
    try {
        console.log('Connecting to database...');
        await connectDB();
        
        console.log('Testing database connection...');
        
        const result = await pool.request()
            .query('SELECT UserID, Email, Role, Password FROM Users WHERE Role = \'admin\'');
        
        console.log('Admin users found:', result.recordset);
        
        if (result.recordset.length === 0) {
            console.log('No admin users found in database');
        } else {
            console.log('Admin users:');
            result.recordset.forEach(user => {
                console.log(`- ID: ${user.UserID}, Email: ${user.Email}, Role: ${user.Role}, Password: ${user.Password}`);
            });
        }
        
    } catch (error) {
        console.error('Database error:', error);
    } finally {
        process.exit();
    }
}

testAdminUsers(); 