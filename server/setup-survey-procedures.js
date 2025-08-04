const { pool } = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function setupSurveyProcedures() {
    try {
        console.log('🔧 Setting up survey stored procedures...');
        
        // Read the SQL file
        const sqlFilePath = path.join(__dirname, 'src/database/create-survey-procedures.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        
        // Execute the SQL
        await pool.request().query(sqlContent);
        
        console.log('✅ Survey stored procedures created successfully!');
        
        // Test the procedure
        console.log('🧪 Testing stored procedure...');
        const testResult = await pool.request()
            .input('userID', 1)
            .input('membershipID', 1)
            .execute('sp_CheckSurveyEligibility');
            
        console.log('✅ Stored procedure test result:', testResult.recordset[0]);
        
    } catch (error) {
        console.error('❌ Error setting up survey procedures:', error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    setupSurveyProcedures()
        .then(() => {
            console.log('🎉 Survey procedures setup completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Survey procedures setup failed:', error);
            process.exit(1);
        });
}

module.exports = { setupSurveyProcedures }; 