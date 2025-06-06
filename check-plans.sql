USE SMOKEKING;
GO

-- Check current plans data
SELECT 'Current MembershipPlans data:' as Info;
SELECT PlanID, Name, Price, Duration, Features, CreatedAt FROM MembershipPlans;

-- Check total count
SELECT 'Total Plans Count:' as Info, COUNT(*) as TotalPlans FROM MembershipPlans;

-- Check IDENTITY current value
SELECT 'Current IDENTITY value:' as Info;
SELECT IDENT_CURRENT('MembershipPlans') as CurrentIdentity;

-- Check if there are any payments referencing non-existent plans
SELECT 'Payments with invalid PlanID:' as Info;
SELECT DISTINCT p.PlanID, COUNT(*) as PaymentCount
FROM Payments p
LEFT JOIN MembershipPlans mp ON p.PlanID = mp.PlanID
WHERE mp.PlanID IS NULL
GROUP BY p.PlanID;

-- Check UserMemberships with invalid PlanID
SELECT 'UserMemberships with invalid PlanID:' as Info;
SELECT DISTINCT um.PlanID, COUNT(*) as MembershipCount
FROM UserMemberships um
LEFT JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
WHERE mp.PlanID IS NULL
GROUP BY um.PlanID; 