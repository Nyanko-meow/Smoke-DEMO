const { pool, connectDB, sql } = require('./server/src/config/database');

async function testProfileUpdate() {
    try {
        console.log('🔍 Testing profile update functionality...');

        // Connect to database
        await connectDB();

        // Find a test user (assuming user with ID 2 exists based on schema)
        const userId = 2;

        console.log('\n1. Getting current user data...');
        const getCurrentUser = await pool.request()
            .input('UserID', sql.Int, userId)
            .query(`
                SELECT UserID, Email, FirstName, LastName, PhoneNumber, Address, UpdatedAt
                FROM Users 
                WHERE UserID = @UserID
            `);

        if (getCurrentUser.recordset.length === 0) {
            console.log('❌ User not found');
            return;
        }

        const currentUser = getCurrentUser.recordset[0];
        console.log('Current user data:', currentUser);

        // Test updating address
        const newAddress = '456 Updated Address Test';

        console.log('\n2. Updating address...');
        const updateResult = await pool.request()
            .input('UserID', sql.Int, userId)
            .input('FirstName', sql.NVarChar, currentUser.FirstName)
            .input('LastName', sql.NVarChar, currentUser.LastName)
            .input('PhoneNumber', sql.NVarChar, currentUser.PhoneNumber || null)
            .input('Address', sql.NVarChar, newAddress)
            .query(`
                UPDATE Users
                SET FirstName = @FirstName,
                    LastName = @LastName,
                    PhoneNumber = @PhoneNumber,
                    Address = @Address,
                    UpdatedAt = GETDATE()
                OUTPUT INSERTED.UserID, INSERTED.Email, INSERTED.FirstName, INSERTED.LastName, 
                       INSERTED.PhoneNumber, INSERTED.Address, INSERTED.UpdatedAt
                WHERE UserID = @UserID
            `);

        if (updateResult.recordset.length > 0) {
            console.log('✅ Update successful!');
            console.log('Updated user data:', updateResult.recordset[0]);
        } else {
            console.log('❌ Update failed - no rows affected');
        }

        // Verify the update
        console.log('\n3. Verifying update...');
        const verifyResult = await pool.request()
            .input('UserID', sql.Int, userId)
            .query(`
                SELECT UserID, Email, FirstName, LastName, PhoneNumber, Address, UpdatedAt
                FROM Users 
                WHERE UserID = @UserID
            `);

        console.log('Verified user data:', verifyResult.recordset[0]);

        console.log('\n🎉 Test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            number: error.number,
            state: error.state,
            class: error.class,
            procedure: error.procedure,
            lineNumber: error.lineNumber
        });
    } finally {
        // Close connection
        try {
            await pool.close();
            console.log('Database connection closed');
        } catch (err) {
            console.error('Error closing connection:', err);
        }
    }
}

// Run the test
testProfileUpdate(); 