/**
 * Database Setup Utility
 * 
 * This script helps set up the database connection by creating a .env file
 * with the correct database credentials.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const envPath = path.join(__dirname, '../../.env');

console.log('Database Connection Setup');
console.log('=========================');
console.log('This utility will help you set up your database connection.');
console.log('Press Enter to accept the default values shown in brackets.\n');

const askQuestion = (question, defaultAnswer) => {
    return new Promise((resolve) => {
        rl.question(`${question} [${defaultAnswer}]: `, (answer) => {
            resolve(answer || defaultAnswer);
        });
    });
};

const createEnvFile = async () => {
    try {
        // Check if .env file already exists
        if (fs.existsSync(envPath)) {
            const overwrite = await askQuestion('A .env file already exists. Overwrite it? (yes/no)', 'no');
            if (overwrite.toLowerCase() !== 'yes') {
                console.log('Setup aborted. Existing .env file was not modified.');
                rl.close();
                return;
            }
        }

        // Ask for database connection details
        const dbUser = await askQuestion('Database username', 'sa');
        const dbPassword = await askQuestion('Database password', '12345');
        const dbServer = await askQuestion('Database server', 'localhost');
        const dbDatabase = await askQuestion('Database name', 'SMOKEKING');
        const dbPort = await askQuestion('Database port', '1433');

        // Prepare the .env file content
        const envContent = `# API configuration
PORT=3001
JWT_SECRET=smokeking_secret_key_ultra_secure_2024
JWT_EXPIRE=24h
JWT_COOKIE_EXPIRE=30
NODE_ENV=development

# Database configuration
DB_USER=${dbUser}
DB_PASSWORD=${dbPassword}
DB_SERVER=${dbServer}
DB_DATABASE=${dbDatabase}
DB_PORT=${dbPort}
DB_ENCRYPT=false

# CORS settings
CORS_ORIGIN=*

# Subscription checker
ENABLE_SUBSCRIPTION_CHECKER=true
SUBSCRIPTION_CHECK_INTERVAL=86400000  # 24 hours in milliseconds
`;

        // Write the .env file
        fs.writeFileSync(envPath, envContent);
        console.log('\n.env file created successfully!');
        console.log(`Location: ${envPath}`);
        console.log('\nYou can now start the server with:');
        console.log('npm run dev');

    } catch (error) {
        console.error('Error creating .env file:', error);
    } finally {
        rl.close();
    }
};

// Start the setup process
createEnvFile();

// When the readline interface is closed, exit the process
rl.on('close', () => {
    process.exit(0);
}); 