const { pool } = require('./server/src/config/database');

async function fixCoach() {
    try {
        await pool.connect();

        const result = await pool.request().query(`
            UPDATE Users 
            SET IsActive = 1 
            WHERE Email = 'coach@example.com' AND Role = 'coach'
        `);

        console.log('✅ Coach activated');

        // Verify the update
        const check = await pool.request().query(`
            SELECT UserID, Email, FirstName, LastName, IsActive 
            FROM Users 
            WHERE Email = 'coach@example.com' AND Role = 'coach'
        `);

        console.log('Coach status:', check.recordset[0]);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.close();
        process.exit(0);
    }
}

fixCoach(); 