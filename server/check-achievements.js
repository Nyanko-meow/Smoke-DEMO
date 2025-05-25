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
            password: 'Tran0210203@'
        }
    }
};

async function checkAchievements() {
    try {
        await sql.connect(config);
        console.log('🔌 Connected to database');

        // Check if Achievements table exists
        const tableCheck = await sql.query`
            SELECT COUNT(*) as TableExists 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'Achievements'
        `;

        console.log('📋 Achievements table exists:', tableCheck.recordset[0].TableExists > 0);

        if (tableCheck.recordset[0].TableExists > 0) {
            // Check achievement count
            const countResult = await sql.query`SELECT COUNT(*) as AchievementCount FROM Achievements`;
            console.log('🏆 Total achievements:', countResult.recordset[0].AchievementCount);

            // Check sample achievements
            const achievements = await sql.query`SELECT TOP 5 * FROM Achievements`;
            console.log('📝 Sample achievements:', achievements.recordset);

            // Check if missing IsActive column
            const columnCheck = await sql.query`
                SELECT COUNT(*) as ColumnExists 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'Achievements' AND COLUMN_NAME = 'IsActive'
            `;
            console.log('✅ IsActive column exists:', columnCheck.recordset[0].ColumnExists > 0);

            if (columnCheck.recordset[0].ColumnExists === 0) {
                console.log('❌ Missing IsActive column - adding it...');
                await sql.query`ALTER TABLE Achievements ADD IsActive BIT DEFAULT 1`;
                await sql.query`UPDATE Achievements SET IsActive = 1`;
                console.log('✅ Added IsActive column');
            }
        } else {
            console.log('❌ Achievements table does not exist!');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sql.close();
    }
}

checkAchievements(); 