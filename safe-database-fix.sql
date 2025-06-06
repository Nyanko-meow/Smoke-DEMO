-- Safe Database Fix - Không xóa data, chỉ sửa các vấn đề cần thiết

USE SMOKEKING;

PRINT 'Starting safe database fix...';

-- 1. Fix Users table - đảm bảo UpdatedAt không NULL
UPDATE Users 
SET UpdatedAt = GETDATE() 
WHERE UpdatedAt IS NULL;

UPDATE Users 
SET Address = CASE 
    WHEN Address = '' THEN NULL
    ELSE Address
END;

PRINT 'Users table updated - UpdatedAt and Address fields cleaned';

-- 2. Check and display current MembershipPlans
PRINT 'Current MembershipPlans:';
SELECT PlanID, Name, Price, Duration FROM MembershipPlans;

-- 3. Check and display current UserMemberships
PRINT 'Current UserMemberships:';
SELECT 
    um.MembershipID,
    um.UserID,
    u.FirstName + ' ' + u.LastName as UserName,
    um.PlanID,
    um.Status,
    um.StartDate,
    um.EndDate
FROM UserMemberships um
JOIN Users u ON um.UserID = u.UserID;

-- 4. If no membership exists for user 2, create one
IF NOT EXISTS (SELECT 1 FROM UserMemberships WHERE UserID = 2)
BEGIN
    DECLARE @availablePlanID INT = (SELECT TOP 1 PlanID FROM MembershipPlans ORDER BY PlanID);
    
    IF @availablePlanID IS NOT NULL
    BEGIN
        DECLARE @startDate DATETIME = GETDATE();
        DECLARE @endDate DATETIME = DATEADD(DAY, 60, @startDate);
        
        INSERT INTO UserMemberships (UserID, PlanID, StartDate, EndDate, Status)
        VALUES (2, @availablePlanID, @startDate, @endDate, 'active');
        
        PRINT 'Created membership for User 2 with PlanID: ' + CAST(@availablePlanID AS NVARCHAR);
    END
END
ELSE
BEGIN
    PRINT 'User 2 already has a membership';
END

-- 5. Test profile update directly
DECLARE @originalAddress NVARCHAR(255);
SELECT @originalAddress = Address FROM Users WHERE UserID = 2;

DECLARE @testAddress NVARCHAR(255) = N'Updated Address - ' + CONVERT(NVARCHAR, GETDATE(), 120);

UPDATE Users 
SET FirstName = 'Member',
    LastName = 'User', 
    PhoneNumber = '0987654321',
    Address = @testAddress,
    UpdatedAt = GETDATE()
WHERE UserID = 2;

PRINT 'Profile update test completed';
PRINT 'Original address: ' + ISNULL(@originalAddress, 'NULL');
PRINT 'New address: ' + @testAddress;

-- 6. Verify the update worked
SELECT 
    UserID,
    Email,
    FirstName,
    LastName,
    PhoneNumber,
    Address,
    UpdatedAt,
    CASE WHEN Address IS NULL THEN 'NULL' 
         WHEN Address = '' THEN 'EMPTY' 
         ELSE 'HAS_VALUE (' + CAST(LEN(Address) AS NVARCHAR) + ' chars)'
    END as AddressStatus
FROM Users 
WHERE UserID = 2;

-- 7. Check if there are any obvious issues with constraints
PRINT 'Checking foreign key relationships...';

SELECT 
    'UserMemberships -> Users' as Relationship,
    COUNT(*) as TotalMemberships,
    COUNT(u.UserID) as ValidUserReferences
FROM UserMemberships um
LEFT JOIN Users u ON um.UserID = u.UserID;

SELECT 
    'UserMemberships -> MembershipPlans' as Relationship,
    COUNT(*) as TotalMemberships,
    COUNT(mp.PlanID) as ValidPlanReferences
FROM UserMemberships um
LEFT JOIN MembershipPlans mp ON um.PlanID = mp.PlanID;

-- 8. List all tables to ensure they exist
SELECT 
    TABLE_NAME,
    CASE WHEN TABLE_TYPE = 'BASE TABLE' THEN 'Table' ELSE TABLE_TYPE END as Type
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'dbo' 
ORDER BY TABLE_NAME;

PRINT 'Safe database fix completed successfully!';
PRINT 'Profile update should now work. Please test the API.';

-- 9. Show final verification
PRINT 'Final verification - User 2 data:';
SELECT UserID, Email, FirstName, LastName, PhoneNumber, Address, UpdatedAt FROM Users WHERE UserID = 2; 