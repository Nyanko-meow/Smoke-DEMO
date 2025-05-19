-- Check if database exists, if not create it
IF NOT EXISTS (SELECT name FROM master.dbo.sysdatabases WHERE name = 'SMOKEKING')
BEGIN
    CREATE DATABASE SMOKEKING;
    PRINT 'Database SMOKEKING created successfully.';
END
ELSE
BEGIN
    PRINT 'Database SMOKEKING already exists.';
END
GO

-- Use the SMOKEKING database
USE SMOKEKING;
GO

-- Check if Users table exists to determine if schema is already created
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Users')
BEGIN
    PRINT 'Schema does not exist. Creating tables...';
    
    -- Run the schema.sql script here or manually execute it
    -- Note: You cannot include the contents of another script here directly
    PRINT 'Please run the schema.sql script next to create all tables.';
END
ELSE
BEGIN
    PRINT 'Schema already exists. No tables were created.';
END
GO 