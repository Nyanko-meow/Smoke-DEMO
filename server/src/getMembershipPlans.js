const { pool } = require('./config/database');

/**
 * Fetches membership plans from SQL database
 */
async function getMembershipPlans() {
    try {
        // Ensure database connection is established
        await pool.connect();

        console.log('Fetching membership plans from SQL database...');

        // Execute query to get all membership plans
        const result = await pool.request().query(`
            SELECT * FROM MembershipPlans
            ORDER BY Price ASC
        `);

        // Get the recordset (array of plans)
        const plans = result.recordset;

        // Display the plans
        console.log('\nMembership Plans:');
        console.table(plans);

        // Log success message
        console.log('\nFetched data from SQL database successfully');

        return plans;
    } catch (error) {
        console.error('Error fetching membership plans:', error);
        throw error;
    } finally {
        // Note: We're not closing the pool here since it might be used elsewhere
        // In a real application, you would manage the pool lifecycle appropriately
    }
}

// Run the function if this file is executed directly
if (require.main === module) {
    // Connect to database and then fetch membership plans
    require('./config/database').connectDB()
        .then(() => getMembershipPlans())
        .catch(error => {
            console.error('Failed to get membership plans:', error);
            process.exit(1);
        });
}

module.exports = { getMembershipPlans }; 