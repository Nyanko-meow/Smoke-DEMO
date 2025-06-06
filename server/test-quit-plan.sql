-- Script để test tính năng Quit Plan
-- Cập nhật user với ID = 2 để có role member
UPDATE Users 
SET Role = 'member', IsActive = 1, EmailVerified = 1
WHERE UserID = 2;

-- Hoặc tạo user test mới
INSERT INTO Users (Email, Password, FirstName, LastName, Role, IsActive, EmailVerified)
VALUES ('testmember@example.com', 'H12345678@', 'Test', 'Member', 'member', 1, 1);

-- Tạo membership active cho user test (ID = 2)
DECLARE @testUserID INT = 2;
DECLARE @planID INT = 1; -- Basic Plan
DECLARE @amount DECIMAL(10,2) = (SELECT Price FROM MembershipPlans WHERE PlanID = @planID);
DECLARE @duration INT = (SELECT Duration FROM MembershipPlans WHERE PlanID = @planID);
DECLARE @startDate DATETIME = GETDATE();
DECLARE @endDate DATETIME = DATEADD(DAY, @duration, @startDate);

-- Tạo payment record
INSERT INTO Payments (UserID, PlanID, Amount, PaymentMethod, Status, TransactionID, StartDate, EndDate, Note)
VALUES (@testUserID, @planID, @amount, 'BankTransfer', 'confirmed', 'TEST_TX_001', @startDate, @endDate, N'Test payment for quit plan feature');

-- Tạo membership record
INSERT INTO UserMemberships (UserID, PlanID, StartDate, EndDate, Status)
VALUES (@testUserID, @planID, @startDate, @endDate, 'active');

-- Kiểm tra dữ liệu
SELECT 
    u.UserID, 
    u.Email, 
    u.FirstName, 
    u.LastName, 
    u.Role, 
    u.IsActive,
    um.Status as MembershipStatus,
    um.EndDate as MembershipEndDate,
    mp.Name as PlanName
FROM Users u
LEFT JOIN UserMemberships um ON u.UserID = um.UserID AND um.Status = 'active'
LEFT JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
WHERE u.UserID = @testUserID;

-- Kiểm tra bảng QuitPlans
SELECT COUNT(*) as QuitPlanCount FROM QuitPlans;

-- Test query để kiểm tra quyền truy cập
SELECT 
    u.UserID,
    u.Role,
    CASE 
        WHEN u.Role IN ('member', 'coach', 'admin') THEN 'Access by Role'
        WHEN um.UserID IS NOT NULL THEN 'Access by Membership'
        ELSE 'No Access'
    END as AccessType
FROM Users u
LEFT JOIN UserMemberships um ON u.UserID = um.UserID 
    AND um.Status = 'active' 
    AND um.EndDate > GETDATE()
WHERE u.UserID = @testUserID; 