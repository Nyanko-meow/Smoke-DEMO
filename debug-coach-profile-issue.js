const { pool, connectDB, sql } = require('./server/src/config/database');

async function debugCoachProfileIssue() {
    try {
        console.log('🔍 Debugging coach profile update issue...');

        // Connect to database
        await connectDB();

        const userId = 7; // Coach user ID from create script

        console.log('1. Testing basic user update...');

        // Test 1: Basic user update
        try {
            const updateUserRequest = pool.request();
            await updateUserRequest
                .input('UserID', sql.Int, userId)
                .input('FirstName', sql.NVarChar, 'DebugCoach')
                .input('LastName', sql.NVarChar, 'DebugSmith')
                .input('PhoneNumber', sql.NVarChar, '0999888777')
                .input('Address', sql.NVarChar, 'Debug Address')
                .input('Avatar', sql.NVarChar, 'debug.jpg')
                .query(`
                    UPDATE Users SET 
                        FirstName = @FirstName,
                        LastName = @LastName,
                        PhoneNumber = @PhoneNumber,
                        Address = @Address,
                        Avatar = @Avatar,
                        UpdatedAt = GETDATE()
                    WHERE UserID = @UserID
                `);
            console.log('✅ Basic user update successful');
        } catch (error) {
            console.error('❌ Basic user update failed:', error.message);
            return;
        }

        console.log('2. Checking if coach profile exists...');

        // Test 2: Check coach profile
        const profileCheck = await pool.request()
            .input('UserID', sql.Int, userId)
            .query('SELECT ProfileID FROM CoachProfiles WHERE UserID = @UserID');

        console.log(`Coach profile exists: ${profileCheck.recordset.length > 0}`);

        if (profileCheck.recordset.length > 0) {
            console.log('3. Testing coach profile update...');

            // Test 3: Update existing profile
            try {
                const updateProfileRequest = pool.request();
                await updateProfileRequest
                    .input('UserID', sql.Int, userId)
                    .input('Specialization', sql.NVarChar, 'Debug Specialization')
                    .input('Experience', sql.Int, 10)
                    .input('Bio', sql.NVarChar, 'Debug bio content')
                    .input('HourlyRate', sql.Decimal(10, 2), 500000)
                    .query(`
                        UPDATE CoachProfiles SET 
                            Specialization = @Specialization,
                            Experience = @Experience,
                            Bio = @Bio,
                            HourlyRate = @HourlyRate,
                            UpdatedAt = GETDATE()
                        WHERE UserID = @UserID
                    `);
                console.log('✅ Coach profile update successful');
            } catch (error) {
                console.error('❌ Coach profile update failed:', error.message);
                return;
            }
        } else {
            console.log('3. Testing coach profile creation...');

            // Test 3: Create new profile
            try {
                const createProfileRequest = pool.request();
                await createProfileRequest
                    .input('UserID', sql.Int, userId)
                    .input('Specialization', sql.NVarChar, 'Debug Specialization')
                    .input('Experience', sql.Int, 10)
                    .input('Bio', sql.NVarChar, 'Debug bio content')
                    .input('HourlyRate', sql.Decimal(10, 2), 500000)
                    .query(`
                        INSERT INTO CoachProfiles (
                            UserID, Specialization, Experience, Bio, HourlyRate, IsAvailable, CreatedAt, UpdatedAt
                        ) VALUES (
                            @UserID, @Specialization, @Experience, @Bio, @HourlyRate, 1, GETDATE(), GETDATE()
                        )
                    `);
                console.log('✅ Coach profile creation successful');
            } catch (error) {
                console.error('❌ Coach profile creation failed:', error.message);
                return;
            }
        }

        console.log('4. Testing transaction approach...');

        // Test 4: Full transaction approach
        try {
            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            // Update user
            const updateUserRequest = new sql.Request(transaction);
            await updateUserRequest
                .input('UserID', sql.Int, userId)
                .input('FirstName', sql.NVarChar, 'TransactionCoach')
                .input('LastName', sql.NVarChar, 'TransactionSmith')
                .query(`
                    UPDATE Users SET 
                        FirstName = @FirstName,
                        LastName = @LastName,
                        UpdatedAt = GETDATE()
                    WHERE UserID = @UserID
                `);

            // Update profile
            const updateProfileRequest = new sql.Request(transaction);
            await updateProfileRequest
                .input('UserID', sql.Int, userId)
                .input('Specialization', sql.NVarChar, 'Transaction Specialization')
                .query(`
                    UPDATE CoachProfiles SET 
                        Specialization = @Specialization,
                        UpdatedAt = GETDATE()
                    WHERE UserID = @UserID
                `);

            await transaction.commit();
            console.log('✅ Transaction approach successful');
        } catch (error) {
            console.error('❌ Transaction approach failed:', error.message);
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error('❌ Transaction rollback failed:', rollbackError.message);
            }
            return;
        }

        console.log('🎉 All tests passed! The database operations work correctly.');
        console.log('The issue might be in the middleware or request handling.');

    } catch (error) {
        console.error('❌ Debug failed:', error);
    }
}

debugCoachProfileIssue(); 