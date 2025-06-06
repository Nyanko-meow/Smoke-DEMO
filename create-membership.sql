USE SMOKEKING;

-- Create membership for leghenkiz@gmail.com user
INSERT INTO UserMemberships (UserID, PlanID, StartDate, EndDate, Status) 
VALUES (6, 1, '2025-06-03', '2025-08-02', 'active');

-- Also create membership for member@example.com for testing
INSERT INTO UserMemberships (UserID, PlanID, StartDate, EndDate, Status) 
VALUES (2, 1, '2025-06-03', '2025-08-02', 'active');

-- Check created memberships
SELECT 
    um.MembershipID,
    um.UserID,
    u.Email,
    um.PlanID,
    mp.Name as PlanName,
    um.StartDate,
    um.EndDate,
    um.Status
FROM UserMemberships um
JOIN Users u ON um.UserID = u.UserID
JOIN MembershipPlans mp ON um.PlanID = mp.PlanID;

PRINT 'Memberships created successfully!'; 