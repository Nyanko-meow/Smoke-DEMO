-- Quick fix for ID values to start from 1

USE SMOKEKING;

-- Fix MembershipPlans
DELETE FROM UserMemberships; -- Remove dependencies first
DELETE FROM MembershipPlans;
DBCC CHECKIDENT ('MembershipPlans', RESEED, 1);

INSERT INTO MembershipPlans (Name, Description, Price, Duration, Features)
VALUES 
('Premium Plan', 'Gói cao cấp có hỗ trợ nâng cao.', 199000, 60, 'Theo dõi tiến trình, Phân tích nâng cao, Chiến lược bỏ thuốc cao cấp, Truy cập cộng đồng, Động lực hàng tuần, Được coach tư vấn qua chat và có thể đặt lịch');

-- Fix Achievements
DELETE FROM UserAchievements; -- Remove dependencies first
DELETE FROM Achievements;
DBCC CHECKIDENT ('Achievements', RESEED, 1);

INSERT INTO Achievements (Name, Description, IconURL, MilestoneDays, SavedMoney)
VALUES 
(N'Ngày đầu tiên', N'Chúc mừng bạn đã hoàn thành ngày đầu tiên không hút thuốc!', '/images/achievements/trophy-bronze.png', 1, NULL),
(N'Tuần lễ khởi đầu', N'Bạn đã không hút thuốc được 7 ngày liên tiếp!', '/images/achievements/star-silver.png', 7, NULL),
(N'Tháng đầu tiên', N'Một tháng không hút thuốc - một cột mốc quan trọng!', '/images/achievements/crown-gold.png', 30, NULL),
(N'Quý đầu tiên', N'3 tháng không hút thuốc - sức khỏe của bạn đã cải thiện rất nhiều!', '/images/achievements/gem-diamond.png', 90, NULL),
(N'Tiết kiệm 100K', N'Bạn đã tiết kiệm được 100,000 VNĐ nhờ việc không hút thuốc!', '/images/achievements/money-bronze.png', NULL, 100000),
(N'Tiết kiệm 500K', N'Tuyệt vời! Bạn đã tiết kiệm được 500,000 VNĐ!', '/images/achievements/money-silver.png', NULL, 500000),
(N'Tiết kiệm 1 triệu', N'Thành tích đáng kinh ngạc! 1,000,000 VNĐ đã được tiết kiệm!', '/images/achievements/money-gold.png', NULL, 1000000);

-- Now recreate UserMembership with correct PlanID
DECLARE @correctPlanID INT = (SELECT TOP 1 PlanID FROM MembershipPlans ORDER BY PlanID);
DECLARE @startDate DATETIME = GETDATE();
DECLARE @duration INT = (SELECT Duration FROM MembershipPlans WHERE PlanID = @correctPlanID);
DECLARE @endDate DATETIME = DATEADD(DAY, @duration, @startDate);

INSERT INTO UserMemberships (UserID, PlanID, StartDate, EndDate, Status)
VALUES (2, @correctPlanID, @startDate, @endDate, 'active');

PRINT 'Quick ID fix completed successfully!';
PRINT 'MembershipPlans PlanID: ' + CAST(@correctPlanID AS NVARCHAR);

-- Verify the fix
SELECT 'MembershipPlans' as TableName, PlanID, Name FROM MembershipPlans
UNION ALL
SELECT 'UserMemberships' as TableName, CAST(PlanID AS NVARCHAR), CAST(UserID AS NVARCHAR) + ' -> ' + CAST(PlanID AS NVARCHAR) FROM UserMemberships; 