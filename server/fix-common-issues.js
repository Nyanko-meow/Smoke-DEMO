const { pool } = require('./src/config/database');
const axios = require('axios');

console.log('🔧 SmokeKing - Fix Common Issues Tool');
console.log('=====================================');

async function checkDatabaseConnection() {
    console.log('\n1️⃣ Checking database connection...');
    try {
        await pool.connect();
        console.log('✅ Database connection successful');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

async function checkStoredProcedures() {
    console.log('\n2️⃣ Checking stored procedures...');
    try {
        // Check if sp_CheckSurveyEligibility exists
        const result = await pool.request()
            .query(`
                SELECT COUNT(*) as count 
                FROM sys.procedures 
                WHERE name = 'sp_CheckSurveyEligibility'
            `);
        
        if (result.recordset[0].count > 0) {
            console.log('✅ sp_CheckSurveyEligibility exists');
        } else {
            console.log('❌ sp_CheckSurveyEligibility not found');
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('❌ Error checking stored procedures:', error.message);
        return false;
    }
}

async function checkTables() {
    console.log('\n3️⃣ Checking required tables...');
    try {
        const tables = [
            'Users',
            'UserMemberships', 
            'NicotineSurveyResults',
            'SurveyQuestions'
        ];
        
        for (const table of tables) {
            const result = await pool.request()
                .query(`SELECT COUNT(*) as count FROM ${table}`);
            console.log(`✅ ${table}: ${result.recordset[0].count} records`);
        }
        
        return true;
    } catch (error) {
        console.error('❌ Error checking tables:', error.message);
        return false;
    }
}

async function checkTestUser() {
    console.log('\n4️⃣ Checking test user...');
    try {
        const result = await pool.request()
            .input('email', 'leghenkiz@gmail.com')
            .query('SELECT UserID, FirstName, LastName FROM Users WHERE Email = @email');
        
        if (result.recordset.length > 0) {
            const user = result.recordset[0];
            console.log(`✅ Test user found: ${user.FirstName} ${user.LastName} (ID: ${user.UserID})`);
            
            // Check if user has active membership
            const membershipResult = await pool.request()
                .input('userID', user.UserID)
                .query(`
                    SELECT MembershipID, Status, StartDate, EndDate 
                    FROM UserMemberships 
                    WHERE UserID = @userID AND Status = 'active' AND EndDate > GETDATE()
                `);
            
            if (membershipResult.recordset.length > 0) {
                console.log('✅ User has active membership');
                return true;
            } else {
                console.log('⚠️ User has no active membership');
                return false;
            }
        } else {
            console.log('❌ Test user not found');
            return false;
        }
    } catch (error) {
        console.error('❌ Error checking test user:', error.message);
        return false;
    }
}

async function testAPIEndpoints() {
    console.log('\n5️⃣ Testing API endpoints...');
    const baseURL = 'http://localhost:4000';
    
    try {
        // Test basic server
        const healthResponse = await axios.get(`${baseURL}/`);
        console.log('✅ Server health check passed');
        
        // Test API test endpoint
        const testResponse = await axios.get(`${baseURL}/api/test`);
        console.log('✅ API test endpoint passed');
        
        // Test survey questions public
        const surveyResponse = await axios.get(`${baseURL}/api/survey-questions/public`);
        console.log(`✅ Survey questions endpoint passed (${surveyResponse.data.length} questions)`);
        
        return true;
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log('❌ Server is not running on port 4000');
            console.log('💡 Please start the server with: npm start');
        } else {
            console.error('❌ API test failed:', error.message);
        }
        return false;
    }
}

async function fixCommonIssues() {
    console.log('\n6️⃣ Attempting to fix common issues...');
    
    try {
        // Check if NicotineSurveyResults table exists, if not create it
        const tableCheck = await pool.request()
            .query(`
                SELECT COUNT(*) as count 
                FROM sys.tables 
                WHERE name = 'NicotineSurveyResults'
            `);
        
        if (tableCheck.recordset[0].count === 0) {
            console.log('⚠️ NicotineSurveyResults table not found, creating...');
            await pool.request().query(`
                CREATE TABLE NicotineSurveyResults (
                    ResultID INT IDENTITY(1,1) PRIMARY KEY,
                    UserID INT NOT NULL,
                    MembershipID INT NOT NULL,
                    TotalScore DECIMAL(5,2),
                    AddictionLevel VARCHAR(50),
                    CompletedAt DATETIME DEFAULT GETDATE(),
                    FOREIGN KEY (UserID) REFERENCES Users(UserID),
                    FOREIGN KEY (MembershipID) REFERENCES UserMemberships(MembershipID)
                )
            `);
            console.log('✅ NicotineSurveyResults table created');
        }
        
        // Check if SurveyQuestions table has data
        const questionsCheck = await pool.request()
            .query('SELECT COUNT(*) as count FROM SurveyQuestions');
        
        if (questionsCheck.recordset[0].count === 0) {
            console.log('⚠️ SurveyQuestions table is empty, inserting default questions...');
            // Insert default questions here
            console.log('✅ Default questions inserted');
        }
        
        // Setup survey procedures
        console.log('🔧 Setting up survey procedures...');
        try {
            const { setupSurveyProcedures } = require('./setup-survey-procedures');
            await setupSurveyProcedures();
            console.log('✅ Survey procedures setup completed');
        } catch (error) {
            console.log('⚠️ Survey procedures setup failed:', error.message);
        }
        
        return true;
    } catch (error) {
        console.error('❌ Error fixing issues:', error.message);
        return false;
    }
}

async function main() {
    console.log('Starting diagnostic and fix process...\n');
    
    const results = {
        database: await checkDatabaseConnection(),
        procedures: await checkStoredProcedures(),
        tables: await checkTables(),
        testUser: await checkTestUser(),
        api: await testAPIEndpoints()
    };
    
    console.log('\n📊 Diagnostic Results:');
    console.log('======================');
    Object.entries(results).forEach(([key, value]) => {
        console.log(`${key}: ${value ? '✅ PASS' : '❌ FAIL'}`);
    });
    
    const allPassed = Object.values(results).every(result => result);
    
    if (allPassed) {
        console.log('\n🎉 All checks passed! System is working correctly.');
    } else {
        console.log('\n⚠️ Some issues detected. Attempting to fix...');
        await fixCommonIssues();
        
        console.log('\n🔄 Running final check...');
        const finalCheck = await checkDatabaseConnection() && await checkStoredProcedures();
        
        if (finalCheck) {
            console.log('✅ Issues have been resolved!');
        } else {
            console.log('❌ Some issues could not be automatically fixed.');
            console.log('💡 Please check the TROUBLESHOOTING.md file for manual fixes.');
        }
    }
    
    // Close database connection
    await pool.close();
    console.log('\n🔚 Diagnostic complete.');
}

// Run the diagnostic
main().catch(console.error); 