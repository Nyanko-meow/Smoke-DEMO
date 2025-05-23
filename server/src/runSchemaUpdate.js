const fs = require('fs');
const path = require('path');
const { sql, pool } = require('./config/database');

async function testDatabaseConnection() {
    try {
        console.log('Testing database connection...');

        // Ensure the pool is connected
        await pool.connect();

        // Test with a simple query
        const result = await pool.request().query('SELECT @@VERSION as version');
        console.log('Database connection successful');
        console.log('SQL Server version:', result.recordset[0].version);

        // Try to check if database exists
        const dbResult = await pool.request().query(`
            SELECT DB_NAME() as current_db,
                   SERVERPROPERTY('ServerName') as server_name,
                   @@VERSION as version
        `);

        console.log('Connected to database:', dbResult.recordset[0].current_db);
        console.log('On server:', dbResult.recordset[0].server_name);

        return true;
    } catch (error) {
        console.error('Database connection test failed:', error);
        return false;
    }
}

async function runSchemaUpdate() {
    try {
        console.log('Running schema update for survey questions...');

        // Test database connection first
        const connectionSuccess = await testDatabaseConnection();
        if (!connectionSuccess) {
            console.error('Aborting schema update due to database connection failure');
            return false;
        }

        // Read the schema update SQL file
        const schemaUpdatePath = path.join(__dirname, 'database', 'updateSchema.sql');

        if (!fs.existsSync(schemaUpdatePath)) {
            console.error(`Schema update file not found at: ${schemaUpdatePath}`);
            return false;
        }

        console.log(`Reading schema file from: ${schemaUpdatePath}`);
        const schemaUpdateSql = fs.readFileSync(schemaUpdatePath, 'utf8');

        // Split by GO statements (MSSQL batch separator)
        const sqlBatches = schemaUpdateSql.split(/\nGO\s*\n/);

        // Execute each batch
        for (const batch of sqlBatches) {
            if (batch.trim()) {
                try {
                    console.log(`Executing batch: ${batch.substring(0, 100)}...`);
                    await pool.request().query(batch);
                    console.log('Batch executed successfully');
                } catch (batchError) {
                    console.error('Error executing batch:', batchError);
                    console.error('Batch SQL:', batch);
                    // Continue with next batch even if this one fails
                }
            }
        }

        console.log('Schema update completed successfully');
        return true;
    } catch (error) {
        console.error('Error running schema update:', error);
        return false;
    }
}

// Test endpoint function for debug purposes
async function testSurveyQuestionsTable() {
    try {
        console.log('Testing SurveyQuestions table...');

        // Query the SurveyQuestions table
        const result = await pool.request().query(`
            SELECT TOP 10 * FROM SurveyQuestions
        `);

        console.log(`Found ${result.recordset.length} questions in the table`);

        if (result.recordset.length > 0) {
            console.log('First question:', result.recordset[0]);
        } else {
            console.log('No questions found in the table');
        }

        return result.recordset;
    } catch (error) {
        console.error('Error testing SurveyQuestions table:', error);
        return null;
    }
}

// Run the function if called directly
if (require.main === module) {
    runSchemaUpdate().then(success => {
        if (success) {
            // Test the SurveyQuestions table after update
            return testSurveyQuestionsTable();
        }
    }).then(() => {
        console.log('Schema update script completed');
        process.exit(0);
    }).catch(err => {
        console.error('Schema update failed:', err);
        process.exit(1);
    });
}

module.exports = { runSchemaUpdate, testDatabaseConnection, testSurveyQuestionsTable }; 