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

async function updateAchievements() {
    try {
        console.log('🔄 Connecting to database...');
        const pool = await sql.connect(config);

        // Update achievements to use emojis instead of image paths
        const updates = [
            { id: 1, emoji: '🏆', name: 'Ngày đầu tiên' },
            { id: 2, emoji: '⭐', name: 'Tuần lễ khởi đầu' },
            { id: 3, emoji: '👑', name: 'Tháng đầu tiên' },
            { id: 4, emoji: '💎', name: 'Quý đầu tiên' },
            { id: 5, emoji: '💰', name: 'Tiết kiệm 100K' },
            { id: 6, emoji: '💵', name: 'Tiết kiệm 500K' },
            { id: 7, emoji: '🤑', name: 'Tiết kiệm 1 triệu' }
        ];

        console.log('🔄 Updating achievements to use emoji icons...');

        for (const update of updates) {
            await pool.request()
                .input('id', sql.Int, update.id)
                .input('emoji', sql.NVarChar, update.emoji)
                .query('UPDATE Achievements SET IconURL = @emoji WHERE AchievementID = @id');
            console.log(`✅ Updated "${update.name}" (ID: ${update.id}) to emoji: ${update.emoji}`);
        }

        console.log('\n🎉 All achievements updated successfully!');

        // Verify the updates
        const result = await pool.request().query('SELECT AchievementID, Name, IconURL FROM Achievements ORDER BY AchievementID');
        console.log('\n📋 Current achievements:');
        result.recordset.forEach(row => {
            console.log(`   ${row.AchievementID}. ${row.Name}: ${row.IconURL}`);
        });

        await pool.close();
        console.log('\n✨ Database connection closed. Update complete!');

    } catch (error) {
        console.error('❌ Error updating achievements:', error.message);
        process.exit(1);
    }
}

updateAchievements(); 