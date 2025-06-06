-- Check RefundRequests table structure and add missing bank columns
USE SMOKEKING;
GO

-- Check if RefundRequests table exists
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'RefundRequests')
BEGIN
    PRINT 'RefundRequests table exists'
    
    -- Check which columns exist
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'RefundRequests'
    ORDER BY ORDINAL_POSITION;
    
    -- Check if bank columns exist
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'RefundRequests' AND COLUMN_NAME = 'BankAccountNumber')
    BEGIN
        PRINT 'Adding BankAccountNumber column...'
        ALTER TABLE RefundRequests ADD BankAccountNumber NVARCHAR(50);
    END
    ELSE
        PRINT 'BankAccountNumber column already exists'
    
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'RefundRequests' AND COLUMN_NAME = 'BankName')
    BEGIN
        PRINT 'Adding BankName column...'
        ALTER TABLE RefundRequests ADD BankName NVARCHAR(100);
    END
    ELSE
        PRINT 'BankName column already exists'
    
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'RefundRequests' AND COLUMN_NAME = 'AccountHolderName')
    BEGIN
        PRINT 'Adding AccountHolderName column...'
        ALTER TABLE RefundRequests ADD AccountHolderName NVARCHAR(100);
    END
    ELSE
        PRINT 'AccountHolderName column already exists'
    
    -- Show final structure
    PRINT 'Final RefundRequests table structure:'
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'RefundRequests'
    ORDER BY ORDINAL_POSITION;
    
    -- Check current data
    PRINT 'Current RefundRequests data:'
    SELECT TOP 5 
        RefundRequestID, UserID, BankAccountNumber, BankName, AccountHolderName, RefundReason
    FROM RefundRequests 
    ORDER BY RequestedAt DESC;
    
END
ELSE
BEGIN
    PRINT 'RefundRequests table does not exist'
END

-- Also check Refunds table
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Refunds')
BEGIN
    PRINT 'Refunds table exists'
    
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Refunds'
    ORDER BY ORDINAL_POSITION;
    
    -- Check current data
    PRINT 'Current Refunds data:'
    SELECT TOP 5 *
    FROM Refunds 
    ORDER BY RequestedAt DESC;
END
ELSE
BEGIN
    PRINT 'Refunds table does not exist'
END 