const { pool, sql } = require('./config/database');

// Function to fetch all users from the database
async function fetchUsers() {
    try {
        // Ensure the pool is connected
        await pool.connect();

        // Query to select all users
        const result = await pool.request().query('SELECT * FROM Users');

        // Print the results
        console.log('\n===== USERS DATA =====');
        console.log(JSON.stringify(result.recordset, null, 2));
        console.log(`Total users: ${result.recordset.length}`);

        // Print a more readable version
        console.log('\n===== USER DETAILS =====');
        result.recordset.forEach(user => {
            console.log(`\nID: ${user.UserID}`);
            console.log(`Name: ${user.FirstName} ${user.LastName}`);
            console.log(`Email: ${user.Email}`);
            console.log(`Role: ${user.Role}`);
            console.log(`Active: ${user.IsActive ? 'Yes' : 'No'}`);
            console.log(`Created: ${user.CreatedAt}`);
            console.log('------------------------');
        });

    } catch (error) {
        console.error('Error fetching users:', error);
    } finally {
        // Don't close the pool here if it's used elsewhere in the application
        // This is just a demonstration script, in a real app you'd manage the pool differently
        // pool.close();
    }
}

// Execute the function
fetchUsers(); 