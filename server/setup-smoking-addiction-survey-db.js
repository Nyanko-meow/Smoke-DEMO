const fs = require('fs');
const path = require('path');
const { pool } = require('./src/config/database');

async function setupSmokingAddictionSurveyDB() {
    try {
        console.log('🚀 Starting smoking addiction survey database setup...');
        
        // Read and execute the SQL tables creation
        const sqlFilePath = path.join(__dirname, 'src/database/create-smoking-addiction-survey-tables.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        
        console.log('📝 Creating smoking addiction survey tables...');
        
        // Execute the SQL statements
        await pool.request().query(sqlContent);
        console.log('✅ SQL executed successfully');
        
        // Test the tables by checking if they exist
        console.log('🧪 Testing tables...');
        
        const tablesCheck = await pool.request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME IN ('SmokingAddictionSurveyResults', 'SmokingAddictionSurveyAnswers')
        `);
        
        console.log(`✅ Found ${tablesCheck.recordset.length} smoking addiction survey tables:`);
        tablesCheck.recordset.forEach(table => {
            console.log(`   - ${table.TABLE_NAME}`);
        });
        
        // Test inserting and retrieving a sample record
        console.log('🧪 Testing sample data insertion...');
        
        const testResult = await pool.request()
            .input('UserID', 1)
            .input('MembershipID', 1)
            .input('FTNDScore', 5.0)
            .input('CigarettesPerDay', 15)
            .input('PackYear', 7.5)
            .input('AddictionLevel', 'Moderate')
            .input('AddictionSeverity', 'Moderate nicotine dependence')
            .input('SuccessProbability', 65)
            .input('PriceRangeId', 'range2')
            .input('PackageName', 'Thuốc lá bình dân')
            .input('PackagePrice', 25000)
            .input('PriceRange', '21.000đ - 30.000đ/gói')
            .input('DailySavings', 18750)
            .input('MonthlySavings', 562500)
            .input('YearlySavings', 6843750)
            .input('Age', 30)
            .input('YearsSmoked', 10)
            .input('Motivation', 'Cải thiện sức khỏe')
            .query(`
                INSERT INTO SmokingAddictionSurveyResults (
                    UserID, MembershipID, FTNDScore, CigarettesPerDay, PackYear,
                    AddictionLevel, AddictionSeverity, SuccessProbability,
                    PriceRangeId, PackageName, PackagePrice, PriceRange,
                    DailySavings, MonthlySavings, YearlySavings,
                    Age, YearsSmoked, Motivation
                )
                OUTPUT INSERTED.ResultID
                VALUES (
                    @UserID, @MembershipID, @FTNDScore, @CigarettesPerDay, @PackYear,
                    @AddictionLevel, @AddictionSeverity, @SuccessProbability,
                    @PriceRangeId, @PackageName, @PackagePrice, @PriceRange,
                    @DailySavings, @MonthlySavings, @YearlySavings,
                    @Age, @YearsSmoked, @Motivation
                )
            `);
        
        const resultId = testResult.recordset[0].ResultID;
        console.log(`✅ Test record created with ID: ${resultId}`);
        
        // Clean up test record
        await pool.request()
            .input('ResultID', resultId)
            .query('DELETE FROM SmokingAddictionSurveyResults WHERE ResultID = @ResultID');
        
        console.log('🧹 Test record cleaned up');
        
        console.log('✅ Smoking addiction survey database setup completed successfully!');
        console.log('📋 Available features:');
        console.log('   - POST /api/smoking-addiction-survey (save survey results)');
        console.log('   - GET /api/smoking-addiction-survey/my-results (get saved results)');
        console.log('📋 Database tables:');
        console.log('   - SmokingAddictionSurveyResults (calculated results)');
        console.log('   - SmokingAddictionSurveyAnswers (raw answers)');
        
    } catch (error) {
        console.error('❌ Smoking addiction survey database setup failed:', error);
        throw error;
    }
}

// Run the setup
if (require.main === module) {
    setupSmokingAddictionSurveyDB()
        .then(() => {
            console.log('🎉 Setup script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Setup script failed:', error);
            process.exit(1);
        });
}

module.exports = { setupSmokingAddictionSurveyDB };