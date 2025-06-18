-- Add file-related columns to Messages table
USE SMOKEKING;
GO

-- Check if columns already exist before adding them
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Messages' AND COLUMN_NAME = 'FileUrl')
BEGIN
    ALTER TABLE Messages ADD FileUrl NVARCHAR(500) NULL;
    PRINT 'Added FileUrl column to Messages table';
END
ELSE
BEGIN
    PRINT 'FileUrl column already exists in Messages table';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Messages' AND COLUMN_NAME = 'FileName')
BEGIN
    ALTER TABLE Messages ADD FileName NVARCHAR(255) NULL;
    PRINT 'Added FileName column to Messages table';
END
ELSE
BEGIN
    PRINT 'FileName column already exists in Messages table';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Messages' AND COLUMN_NAME = 'FileSize')
BEGIN
    ALTER TABLE Messages ADD FileSize BIGINT NULL;
    PRINT 'Added FileSize column to Messages table';
END
ELSE
BEGIN
    PRINT 'FileSize column already exists in Messages table';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Messages' AND COLUMN_NAME = 'FileType')
BEGIN
    ALTER TABLE Messages ADD FileType NVARCHAR(100) NULL;
    PRINT 'Added FileType column to Messages table';
END
ELSE
BEGIN
    PRINT 'FileType column already exists in Messages table';
END

-- Update MessageType check constraint to include 'file' type
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS WHERE CONSTRAINT_NAME LIKE '%Messages%MessageType%')
BEGIN
    -- Drop existing constraint
    DECLARE @ConstraintName NVARCHAR(200)
    SELECT @ConstraintName = CONSTRAINT_NAME 
    FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
    WHERE CONSTRAINT_NAME LIKE '%Messages%MessageType%'
    
    DECLARE @SQL NVARCHAR(MAX) = 'ALTER TABLE Messages DROP CONSTRAINT ' + @ConstraintName
    EXEC sp_executesql @SQL
    PRINT 'Dropped existing MessageType constraint';
END

-- Add new constraint with 'file' type
ALTER TABLE Messages ADD CONSTRAINT CK_Messages_MessageType 
CHECK (MessageType IN ('text', 'image', 'file', 'plan_update'));
PRINT 'Added new MessageType constraint with file support';

-- Verify the changes
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Messages' 
AND COLUMN_NAME IN ('FileUrl', 'FileName', 'FileSize', 'FileType')
ORDER BY COLUMN_NAME;

PRINT 'File columns added successfully to Messages table!'; 