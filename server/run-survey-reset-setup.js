const fs = require('fs');
const path = require('path');
const { pool } = require('./src/config/database');

async function runSurveyResetSetup() {
    try {
        console.log('🚀 Starting survey reset setup...');
        
        // Read and execute the SQL procedures
        const sqlFilePath = path.join(__dirname, 'src/database/create-survey-reset-procedures.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        
        console.log('📝 Executing SQL procedures...');
        
        // Split by GO statements and execute each separately
        const sqlStatements = sqlContent.split(/\r?\nGO\r?\n/).filter(stmt => stmt.trim());
        
        for (let i = 0; i < sqlStatements.length; i++) {
            const statement = sqlStatements[i].trim();
            if (statement) {
                console.log(`Executing statement ${i + 1}/${sqlStatements.length}...`);
                try {
                    await pool.request().query(statement);
                    console.log(`✅ Statement ${i + 1} executed successfully`);
                } catch (error) {
                    console.error(`❌ Error in statement ${i + 1}:`, error.message);
                    // Continue with next statement
                }
            }
        }
        
        console.log('🧪 Testing procedures...');
        
        // Test the cleanup procedure
        try {
            const testResult = await pool.request()
                .execute('sp_CleanupExpiredMembershipSurveys');
            console.log('✅ Cleanup procedure test result:', testResult.recordset[0]);
        } catch (error) {
            console.error('❌ Cleanup procedure test failed:', error.message);
        }
        
        console.log('✅ Survey reset setup completed successfully!');
        console.log('📋 Available endpoints:');
        console.log('   - DELETE /api/survey-reset/user/:userId (admin only)');
        console.log('   - DELETE /api/survey-reset/my-data (user)');
        console.log('   - POST /api/survey-reset/cleanup-expired (admin only)');
        console.log('📋 Available procedures:');
        console.log('   - sp_ResetUserSurveyData @UserID');
        console.log('   - sp_CleanupExpiredMembershipSurveys');
        console.log('   - sp_ScheduledSurveyCleanup');
        console.log('📋 Trigger created:');
        console.log('   - tr_MembershipStatusChange (auto-reset on membership cancel/expire)');
        
    } catch (error) {
        console.error('❌ Survey reset setup failed:', error);
    }
}

// Run the setup
if (require.main === module) {
    runSurveyResetSetup()
        .then(() => {
            console.log('🎉 Setup script completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Setup script failed:', error);
            process.exit(1);
        });
}

module.exports = { runSurveyResetSetup };