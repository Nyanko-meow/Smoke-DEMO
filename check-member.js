const { pool } = require('./server/src/config/database');

async function checkMember() {
    try {
        await pool.connect();
        const result = await pool.request().query(`
            SELECT UserID, Email, Password, Role, IsActive, EmailVerified 
            FROM Users 
            WHERE Email = 'member@example.com'
        `);

        if (result.recordset.length > 0) {
            console.log('Member info:', result.recordset[0]);
        } else {
            console.log('Member not found');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.close();
        process.exit(0);
    }
}

checkMember(); 