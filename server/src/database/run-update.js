const fs = require('fs');
const path = require('path');
const { sql, pool } = require('../config/database');

async function runUpdate() {
    try {
        console.log('Running address update script...');
        const scriptPath = path.join(__dirname, 'update-address.sql');
        const script = fs.readFileSync(scriptPath, 'utf8');

        const result = await pool.request().query(script);

        console.log('Address update completed successfully');
        console.log('Updated users:');

        // Log the results of the SELECT query
        if (result.recordsets && result.recordsets.length > 0) {
            console.table(result.recordsets[0]);
        }

        return result;
    } catch (error) {
        console.error('Error during update:', error);
        throw error;
    }
}

// Run the update
runUpdate().then(() => {
    console.log('Update process finished');
    process.exit(0);
}).catch(err => {
    console.error('Update failed:', err);
    process.exit(1);
}); 