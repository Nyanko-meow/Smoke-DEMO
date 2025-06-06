-- Fix Database Script
-- Sửa các lỗi và đảm bảo database hoạt động đúng

USE SMOKEKING;

-- 1. Fix Identity columns - Reset all identity values properly
PRINT 'Fixing identity columns...';

-- Reset identity for all tables
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Users')
BEGIN
    DECLARE @maxUserID INT = (SELECT ISNULL(MAX(UserID), 0) FROM Users);
    DBCC CHECKIDENT ('Users', RESEED, @maxUserID);
    PRINT 'Fixed Users identity - Max ID: ' + CAST(@maxUserID AS NVARCHAR);
END

IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'MembershipPlans')
BEGIN
    DECLARE @maxPlanID INT = (SELECT ISNULL(MAX(PlanID), 0) FROM MembershipPlans);
    DBCC CHECKIDENT ('MembershipPlans', RESEED, @maxPlanID);
    PRINT 'Fixed MembershipPlans identity - Max ID: ' + CAST(@maxPlanID AS NVARCHAR);
END

IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'UserMemberships')
BEGIN
    DECLARE @maxMembershipID INT = (SELECT ISNULL(MAX(MembershipID), 0) FROM UserMemberships);
    DBCC CHECKIDENT ('UserMemberships', RESEED, @maxMembershipID);
    PRINT 'Fixed UserMemberships identity - Max ID: ' + CAST(@maxMembershipID AS NVARCHAR);
END

IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Achievements')
BEGIN
    DECLARE @maxAchievementID INT = (SELECT ISNULL(MAX(AchievementID), 0) FROM Achievements);
    DBCC CHECKIDENT ('Achievements', RESEED, @maxAchievementID);
    PRINT 'Fixed Achievements identity - Max ID: ' + CAST(@maxAchievementID AS NVARCHAR);
END

-- 2. Check and fix foreign key relationships
PRINT 'Checking foreign key relationships...';

-- Remove any invalid UserMemberships that reference non-existent PlanIDs
DELETE FROM UserMemberships 
WHERE PlanID NOT IN (SELECT PlanID FROM MembershipPlans);
PRINT 'Removed invalid UserMemberships records';

-- 3. Ensure sample data exists
PRINT 'Ensuring sample data exists...';

-- Check if MembershipPlans has data
IF NOT EXISTS (SELECT 1 FROM MembershipPlans)
BEGIN
    PRINT 'Inserting MembershipPlans sample data...';
    INSERT INTO MembershipPlans (Name, Description, Price, Duration, Features)
    VALUES 
    ('Premium Plan', 'Gói cao cấp có hỗ trợ nâng cao.', 199000, 60, 'Theo dõi tiến trình, Phân tích nâng cao, Chiến lược bỏ thuốc cao cấp, Truy cập cộng đồng, Động lực hàng tuần, Được coach tư vấn qua chat và có thể đặt lịch');
    PRINT 'MembershipPlans sample data inserted';
END

-- Check if Achievements has data
IF NOT EXISTS (SELECT 1 FROM Achievements)
BEGIN
    PRINT 'Inserting Achievements sample data...';
    INSERT INTO Achievements (Name, Description, IconURL, MilestoneDays, SavedMoney)
    VALUES 
    (N'Ngày đầu tiên', N'Chúc mừng bạn đã hoàn thành ngày đầu tiên không hút thuốc!', '/images/achievements/trophy-bronze.png', 1, NULL),
    (N'Tuần lễ khởi đầu', N'Bạn đã không hút thuốc được 7 ngày liên tiếp!', '/images/achievements/star-silver.png', 7, NULL),
    (N'Tháng đầu tiên', N'Một tháng không hút thuốc - một cột mốc quan trọng!', '/images/achievements/crown-gold.png', 30, NULL),
    (N'Quý đầu tiên', N'3 tháng không hút thuốc - sức khỏe của bạn đã cải thiện rất nhiều!', '/images/achievements/gem-diamond.png', 90, NULL),
    (N'Tiết kiệm 100K', N'Bạn đã tiết kiệm được 100,000 VNĐ nhờ việc không hút thuốc!', '/images/achievements/money-bronze.png', NULL, 100000),
    (N'Tiết kiệm 500K', N'Tuyệt vời! Bạn đã tiết kiệm được 500,000 VNĐ!', '/images/achievements/money-silver.png', NULL, 500000),
    (N'Tiết kiệm 1 triệu', N'Thành tích đáng kinh ngạc! 1,000,000 VNĐ đã được tiết kiệm!', '/images/achievements/money-gold.png', NULL, 1000000);
    PRINT 'Achievements sample data inserted';
END

-- 4. Fix UserMemberships with correct PlanID
PRINT 'Fixing UserMemberships...';

-- Get the actual PlanID that exists
DECLARE @actualPlanID INT = (SELECT TOP 1 PlanID FROM MembershipPlans ORDER BY PlanID);

IF @actualPlanID IS NOT NULL
BEGIN
    -- Remove existing invalid membership for user 2
    DELETE FROM UserMemberships WHERE UserID = 2;
    
    -- Insert correct membership
    DECLARE @startDate DATETIME = GETDATE();
    DECLARE @duration INT = (SELECT Duration FROM MembershipPlans WHERE PlanID = @actualPlanID);
    DECLARE @endDate DATETIME = DATEADD(DAY, @duration, @startDate);
    
    INSERT INTO UserMemberships (UserID, PlanID, StartDate, EndDate, Status)
    VALUES (2, @actualPlanID, @startDate, @endDate, 'active');
    
    PRINT 'UserMembership fixed for UserID 2 with PlanID: ' + CAST(@actualPlanID AS NVARCHAR);
END

-- 5. Update all users to ensure they have valid data
PRINT 'Updating user data...';

UPDATE Users 
SET UpdatedAt = GETDATE() 
WHERE UpdatedAt IS NULL;

-- 6. Check data integrity
PRINT 'Checking data integrity...';

-- Check Users table
DECLARE @userCount INT = (SELECT COUNT(*) FROM Users);
PRINT 'Total users: ' + CAST(@userCount AS NVARCHAR);

-- Check MembershipPlans table
DECLARE @planCount INT = (SELECT COUNT(*) FROM MembershipPlans);
PRINT 'Total membership plans: ' + CAST(@planCount AS NVARCHAR);

-- Check UserMemberships table
DECLARE @membershipCount INT = (SELECT COUNT(*) FROM UserMemberships);
PRINT 'Total active memberships: ' + CAST(@membershipCount AS NVARCHAR);

-- Check Achievements table
DECLARE @achievementCount INT = (SELECT COUNT(*) FROM Achievements);
PRINT 'Total achievements: ' + CAST(@achievementCount AS NVARCHAR);

-- 7. Verify all tables exist
PRINT 'Verifying all required tables exist...';

DECLARE @tableList TABLE (TableName NVARCHAR(255));
INSERT INTO @tableList VALUES 
('Users'), ('MembershipPlans'), ('UserMemberships'), ('SmokingStatus'),
('QuitPlans'), ('ProgressTracking'), ('Payments'), ('BlogPosts'),
('Achievements'), ('UserAchievements'), ('CommunityPosts'), ('Messages'),
('Conversations'), ('CoachProfiles'), ('CoachReviews'), ('CoachFeedback');

DECLARE @missingTables NVARCHAR(MAX) = '';
SELECT @missingTables = @missingTables + TableName + ', '
FROM @tableList t
WHERE NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_NAME = t.TableName AND TABLE_SCHEMA = 'dbo'
);

IF LEN(@missingTables) > 0
BEGIN
    PRINT 'Missing tables: ' + LEFT(@missingTables, LEN(@missingTables) - 1);
END
ELSE
BEGIN
    PRINT 'All required tables exist!';
END

PRINT 'Database fix completed successfully!'; 