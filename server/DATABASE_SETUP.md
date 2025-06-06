# Database Setup Guide

This guide will help you set up the SQL Server database for the Smoking Cessation Platform.

## Prerequisites

1. SQL Server installed (Express edition is sufficient)
2. SQL Server Management Studio (SSMS) or Azure Data Studio

## Option 1: Using the Setup Script

1. Run the database setup utility:
   ```
   npm run setup:db
   ```
2. Follow the prompts to configure your database connection settings
3. The utility will create a `.env` file with the correct database configuration

## Option 2: Manual Setup

### Step 1: Create the Database

1. Open SQL Server Management Studio (SSMS)
2. Connect to your SQL Server instance
3. Run the following SQL script to create the database:
   ```sql
   USE master;
   GO
   
   IF NOT EXISTS (SELECT name FROM master.dbo.sysdatabases WHERE name = 'SMOKEKING')
   BEGIN
       CREATE DATABASE SMOKEKING;
       PRINT 'Database SMOKEKING created successfully.';
   END
   GO
   ```

### Step 2: Execute the Schema Script

1. Open the database in SSMS
2. Open the `server/src/database/schema.sql` file
3. Execute the script to create all the necessary tables

### Step 3: Set Up Environment Variables

Create a `.env` file in the `server` directory with the following content:

```
# API configuration
PORT=3001
JWT_SECRET=smokeking_secret_key_ultra_secure_2024
JWT_EXPIRE=24h
JWT_COOKIE_EXPIRE=30
NODE_ENV=development

# Database configuration
DB_USER=your_sql_username
DB_PASSWORD=your_sql_password
DB_SERVER=localhost
DB_DATABASE=SMOKEKING
DB_PORT=1433
DB_ENCRYPT=false

# CORS settings
CORS_ORIGIN=*

# Subscription checker
ENABLE_SUBSCRIPTION_CHECKER=true
SUBSCRIPTION_CHECK_INTERVAL=86400000
```

Replace `your_sql_username` and `your_sql_password` with your SQL Server credentials.

## Troubleshooting

### Connection Errors

If you see errors like "Login failed for user", please check:

1. SQL Server authentication mode is set to "SQL Server and Windows Authentication mode"
2. The SQL user has the correct password
3. The SQL user has permissions to access the SMOKEKING database

To enable SQL Server authentication:
1. Right-click on your SQL Server instance in SSMS
2. Select "Properties" > "Security"
3. Set "Server authentication" to "SQL Server and Windows Authentication mode"
4. Restart the SQL Server service

### Creating a SQL Server Login

If you need to create a new SQL login:

1. In SSMS, expand "Security" > right-click on "Logins" > "New Login"
2. Enter a login name (e.g., 'sa' or create a new one)
3. Select "SQL Server authentication"
4. Enter a password and uncheck "Enforce password policy" for development
5. Set the default database to "SMOKEKING"
6. In the "Server Roles" page, select "sysadmin" for full access
7. Click "OK" to create the login

### Test the Connection

To verify your database connection:

1. Update your `.env` file with the correct credentials
2. Run the server in development mode:
   ```
   npm run dev
   ```

## Next Steps

After successfully setting up the database:

1. The subscription plans will be automatically seeded on server startup
2. You can create a test user or use the existing ones
3. Test the subscription flow using the test scripts:
   ```
   npm run test:subscription
   npm run test:payment
   ``` 