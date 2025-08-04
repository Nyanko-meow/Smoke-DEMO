const { pool } = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function updateSurveyProcedure() {
    try {
        console.log('🔄 Updating survey eligibility stored procedure...');
        
        // Read the SQL script
        const scriptPath = path.join(__dirname, 'src/database/create-survey-procedures.sql');
        const script = fs.readFileSync(scriptPath, 'utf8');
        
        // Execute the script
        await pool.request().query(script);
        
        console.log('✅ Stored procedure updated successfully!');
        console.log('📝 Fixed message encoding for survey completion message');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating stored procedure:', error);
        process.exit(1);
    }
}

updateSurveyProcedure();