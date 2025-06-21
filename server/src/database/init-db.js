const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

/**
 * Initialize the database with schema
 */
const initializeDatabase = async () => {
    try {
        console.log('Starting database initialization...');

        // Read the schema file
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Split the schema into individual statements
        const statements = schema
            .replace(/--.*$/gm, '') // Remove comments
            .replace(/\r\n/g, '\n') // Normalize line endings
            .split(';')
            .map(statement => statement.trim())
            .filter(statement => statement.length > 0);

        // Execute each statement
        for (const statement of statements) {
            await pool.request().query(statement);
            console.log('Executed SQL statement successfully');
        }

        console.log('Database initialization completed successfully');
    } catch (error) {
        console.error('Database initialization failed:', error);
        throw error;
    }
};

// Export the function
module.exports = { initializeDatabase };

// Execute directly if this file is run directly
if (require.main === module) {
    const { connectDB } = require('../config/database');

    connectDB()
        .then(() => initializeDatabase())
        .then(() => {
            console.log('Database setup completed');
            process.exit(0);
        })
        .catch(err => {
            console.error('Database setup failed:', err);
            process.exit(1);
        });
} 