USE SMOKEKING;
GO

-- Kiểm tra gói hiện tại
PRINT 'Checking current plans...';
SELECT PlanID, Name, Price, Duration FROM MembershipPlans ORDER BY PlanID;

-- Xóa Pro Plan nếu tồn tại
IF EXISTS (SELECT 1 FROM MembershipPlans WHERE Name = 'Pro Plan')
BEGIN
    PRINT 'Pro Plan found. Deleting...';
    
    -- Hủy tất cả membership của Pro Plan
    UPDATE UserMemberships 
    SET Status = 'cancelled'
    WHERE PlanID IN (SELECT PlanID FROM MembershipPlans WHERE Name = 'Pro Plan');
    
    -- Xóa Pro Plan
    DELETE FROM MembershipPlans WHERE Name = 'Pro Plan';
    
    PRINT 'Pro Plan deleted successfully!';
END
ELSE
BEGIN
    PRINT 'Pro Plan not found.';
END

-- Hiển thị kết quả
PRINT 'Remaining plans:';
SELECT PlanID, Name, Price, Duration FROM MembershipPlans ORDER BY PlanID; 