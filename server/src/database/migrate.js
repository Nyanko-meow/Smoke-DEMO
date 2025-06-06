const fs = require('fs');
const path = require('path');
const { sql, pool } = require('../config/database');

// Read and execute the schema.sql file
async function runMigration() {
    try {
        console.log('Starting database migration...');
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaScript = fs.readFileSync(schemaPath, 'utf8');

        // Split the script by GO statements to allow for batched execution
        const batches = schemaScript.split(/\r?\nGO\r?\n/);

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i].trim();
            if (batch) {
                await pool.request().batch(batch);
                console.log(`Executed batch ${i + 1}/${batches.length}`);
            }
        }

        console.log('Database migration completed successfully');
    } catch (error) {
        console.error('Error during migration:', error);
    }
}

// Run the migration
runMigration().then(() => {
    console.log('Migration process finished');
    process.exit(0);
}).catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
}); 