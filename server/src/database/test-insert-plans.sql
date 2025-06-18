-- Test script to insert MembershipPlans
USE SMOKEKING;
GO

-- Clear existing membership plans before inserting
DELETE FROM MembershipPlans;
DBCC CHECKIDENT ('MembershipPlans', RESEED, 1);

-- Insert plan mẫu
INSERT INTO MembershipPlans (Name, Description, Price, Duration, Features)
VALUES 
('Premium Plan', 'Gói cao cấp có hỗ trợ nâng cao.', 199000, 60, 'Theo dõi tiến trình, Phân tích nâng cao, Chiến lược bỏ thuốc cao cấp, Truy cập cộng đồng, Động lực hàng tuần, Được coach tư vấn qua chat và có thể đặt lịch');

-- Verify the insert
SELECT PlanID, Name, Price, Duration FROM MembershipPlans;

PRINT 'MembershipPlan inserted successfully!'; 