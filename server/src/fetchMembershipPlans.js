const { pool } = require('./config/database');

/**
 * Fetches all membership plans from the database
 * @returns {Promise<Array>} Array of membership plans
 */
async function fetchMembershipPlans() {
    try {
        // Wait for connection pool to be ready
        await pool.connect();

        // Execute the SQL query
        const result = await pool.request().query('SELECT * FROM MembershipPlans');

        // Log success message
        console.log('Data fetched from SQL database successfully');

        // Return the recordset (array of plans)
        return result.recordset;
    } catch (error) {
        console.error('Error fetching membership plans:', error);
        throw error;
    }
}

// Execute the function if this file is run directly
if (require.main === module) {
    fetchMembershipPlans()
        .then(plans => {
            console.log('Membership Plans:');
            console.table(plans);
            console.log('Fetched data from SQL database successfully');
        })
        .catch(err => {
            console.error('Failed to fetch membership plans:', err);
        });
}

// Export the function for use in other files
module.exports = { fetchMembershipPlans }; 