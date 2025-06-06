USE SMOKEKING;
GO

-- Clear existing membership plans and reset identity
DELETE FROM MembershipPlans;
DBCC CHECKIDENT ('MembershipPlans', RESEED, 0);

-- Insert chỉ 1 gói Premium Plan (PlanID sẽ là 1)
INSERT INTO MembershipPlans (Name, Description, Price, Duration, Features)
VALUES 
('Premium Plan', 'Gói cao cấp có hỗ trợ nâng cao.', 199000, 60, 'Theo dõi tiến trình, Phân tích nâng cao, Chiến lược bỏ thuốc cao cấp, Truy cập cộng đồng, Động lực hàng tuần, Được coach tư vấn qua chat và có thể đặt lịch');

-- Verify the insert
SELECT 'Plan created successfully:' as Message;
SELECT PlanID, Name, Price, Duration FROM MembershipPlans ORDER BY PlanID;

PRINT 'MembershipPlans table fixed successfully!'; 