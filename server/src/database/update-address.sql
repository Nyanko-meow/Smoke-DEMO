-- Update any NULL addresses to empty strings
UPDATE Users
SET Address = ''
WHERE Address IS NULL;

-- Check all users to verify address and creation date
SELECT 
    UserID,
    Email,
    FirstName,
    LastName,
    Address,
    CASE WHEN Address IS NULL THEN 'NULL' 
         WHEN Address = '' THEN 'EMPTY STRING'
         ELSE 'HAS VALUE: ' + Address
    END as AddressStatus,
    CreatedAt,
    CONVERT(VARCHAR, CreatedAt, 120) as CreatedAtFormatted
FROM Users; 