const sql = require('mssql');

const config = {
    server: 'localhost',
    database: 'SMOKEKING',
    options: {
        encrypt: false,
        trustServerCertificate: true
    },
    authentication: {
        type: 'ntlm',
        options: {
            domain: '',
            userName: '',
            password: ''
        }
    }
};

async function checkAchievements() {
    try {
        console.log('Connecting to database...');
        const pool = await sql.connect(config);

        const result = await pool.request().query('SELECT AchievementID, Name, IconURL FROM Achievements ORDER BY AchievementID');

        console.log('\n📋 Current achievements in database:');
        result.recordset.forEach(row => {
            console.log(`   ${row.AchievementID}. ${row.Name}: "${row.IconURL}"`);
        });

        await pool.close();
        console.log('\n✨ Check complete!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkAchievements(); 