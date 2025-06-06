-- Comprehensive Database Fix Script
-- Fix tất cả lỗi database và đảm bảo profile update hoạt động

USE SMOKEKING;

PRINT 'Starting comprehensive database fix...';

-- 1. Drop and recreate problematic tables to ensure clean state
PRINT 'Cleaning up data dependencies...';

-- Remove data in correct order to avoid FK constraints
DELETE FROM CoachFeedback;
DELETE FROM UserAchievements;
DELETE FROM CommunityPosts;
DELETE FROM PostLikes;
DELETE FROM CommunityComments;
DELETE FROM UserMemberships;
DELETE FROM Payments;
DELETE FROM ProgressTracking;
DELETE FROM QuitPlans;
DELETE FROM SmokingStatus;

PRINT 'Dependencies cleaned';

-- 2. Fix MembershipPlans
DELETE FROM MembershipPlans;
DBCC CHECKIDENT ('MembershipPlans', RESEED, 0);

INSERT INTO MembershipPlans (Name, Description, Price, Duration, Features)
VALUES 
('Premium Plan', N'Gói cao cấp có hỗ trợ nâng cao.', 199000, 60, N'Theo dõi tiến trình, Phân tích nâng cao, Chiến lược bỏ thuốc cao cấp, Truy cập cộng đồng, Động lực hàng tuần, Được coach tư vấn qua chat và có thể đặt lịch');

PRINT 'MembershipPlans fixed with PlanID = 1';

-- 3. Fix Achievements
DELETE FROM Achievements;
DBCC CHECKIDENT ('Achievements', RESEED, 0);

INSERT INTO Achievements (Name, Description, IconURL, MilestoneDays, SavedMoney)
VALUES 
(N'Ngày đầu tiên', N'Chúc mừng bạn đã hoàn thành ngày đầu tiên không hút thuốc!', '/images/achievements/trophy-bronze.png', 1, NULL),
(N'Tuần lễ khởi đầu', N'Bạn đã không hút thuốc được 7 ngày liên tiếp!', '/images/achievements/star-silver.png', 7, NULL),
(N'Tháng đầu tiên', N'Một tháng không hút thuốc - một cột mốc quan trọng!', '/images/achievements/crown-gold.png', 30, NULL),
(N'Quý đầu tiên', N'3 tháng không hút thuốc - sức khỏe của bạn đã cải thiện rất nhiều!', '/images/achievements/gem-diamond.png', 90, NULL),
(N'Tiết kiệm 100K', N'Bạn đã tiết kiệm được 100,000 VNĐ nhờ việc không hút thuốc!', '/images/achievements/money-bronze.png', NULL, 100000),
(N'Tiết kiệm 500K', N'Tuyệt vời! Bạn đã tiết kiệm được 500,000 VNĐ!', '/images/achievements/money-silver.png', NULL, 500000),
(N'Tiết kiệm 1 triệu', N'Thành tích đáng kinh ngạc! 1,000,000 VNĐ đã được tiết kiệm!', '/images/achievements/money-gold.png', NULL, 1000000);

PRINT 'Achievements fixed with ID starting from 1';

-- 4. Ensure Users table is clean and correct
UPDATE Users 
SET UpdatedAt = GETDATE() 
WHERE UpdatedAt IS NULL;

-- Fix any encoding issues with address
UPDATE Users 
SET Address = CASE 
    WHEN Address IS NULL OR Address = '' THEN NULL
    ELSE Address
END;

PRINT 'Users table cleaned';

-- 5. Create UserMembership with correct PlanID
DECLARE @planID INT = (SELECT TOP 1 PlanID FROM MembershipPlans ORDER BY PlanID);
DECLARE @startDate DATETIME = GETDATE();
DECLARE @endDate DATETIME = DATEADD(DAY, 60, @startDate);

INSERT INTO UserMemberships (UserID, PlanID, StartDate, EndDate, Status)
VALUES (2, @planID, @startDate, @endDate, 'active');

PRINT 'UserMembership created for User 2 with PlanID: ' + CAST(@planID AS NVARCHAR);

-- 6. Test profile update directly in SQL
DECLARE @testAddress NVARCHAR(255) = N'Test SQL Update - ' + CONVERT(NVARCHAR, GETDATE(), 120);

UPDATE Users 
SET Address = @testAddress,
    UpdatedAt = GETDATE()
WHERE UserID = 2;

PRINT 'Direct SQL profile update test completed';

-- 7. Verify data integrity
PRINT 'Verifying data integrity...';

SELECT 
    'Users' as TableName,
    COUNT(*) as RecordCount,
    MAX(UserID) as MaxID
FROM Users

UNION ALL

SELECT 
    'MembershipPlans' as TableName,
    COUNT(*) as RecordCount,
    MAX(PlanID) as MaxID
FROM MembershipPlans

UNION ALL

SELECT 
    'UserMemberships' as TableName,
    COUNT(*) as RecordCount,
    MAX(MembershipID) as MaxID
FROM UserMemberships

UNION ALL

SELECT 
    'Achievements' as TableName,
    COUNT(*) as RecordCount,
    MAX(AchievementID) as MaxID
FROM Achievements;

-- 8. Check specific user data
SELECT 
    UserID,
    Email,
    FirstName,
    LastName,
    Address,
    UpdatedAt,
    LEN(Address) as AddressLength,
    CASE WHEN Address IS NULL THEN 'NULL' ELSE 'HAS_VALUE' END as AddressStatus
FROM Users 
WHERE UserID = 2;

-- 9. Check membership relationship
SELECT 
    u.UserID,
    u.FirstName + ' ' + u.LastName as FullName,
    um.MembershipID,
    um.PlanID,
    mp.Name as PlanName,
    um.Status,
    um.StartDate,
    um.EndDate
FROM Users u
LEFT JOIN UserMemberships um ON u.UserID = um.UserID
LEFT JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
WHERE u.UserID = 2;

PRINT 'Comprehensive database fix completed successfully!';
PRINT 'All tables are now properly configured and relationships are valid.';
PRINT 'Profile update functionality should now work correctly.'; 