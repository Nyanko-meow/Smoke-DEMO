USE SMOKEKING;

-- Create payment record for leghenkiz@gmail.com user (UserID 6)
INSERT INTO Payments (
    UserID, 
    PlanID, 
    Amount, 
    PaymentDate, 
    PaymentMethod, 
    Status,
    StartDate,
    EndDate,
    Note
) VALUES (
    6, 
    1, 
    199000.00, 
    '2025-06-03', 
    'bank_transfer', 
    'pending',
    '2025-06-03',
    '2025-08-02',
    'Test payment for membership cancellation'
);

-- Also create payment for member@example.com for testing (UserID 2)
INSERT INTO Payments (
    UserID, 
    PlanID, 
    Amount, 
    PaymentDate, 
    PaymentMethod, 
    Status,
    StartDate,
    EndDate,
    Note
) VALUES (
    2, 
    1, 
    199000.00, 
    '2025-06-03', 
    'bank_transfer', 
    'pending',
    '2025-06-03',
    '2025-08-02',
    'Test payment for membership cancellation'
);

-- Check created payments
SELECT 
    p.PaymentID,
    p.UserID,
    u.Email,
    p.PlanID,
    mp.Name as PlanName,
    p.Amount,
    p.PaymentDate,
    p.Status,
    p.StartDate,
    p.EndDate
FROM Payments p
JOIN Users u ON p.UserID = u.UserID
JOIN MembershipPlans mp ON p.PlanID = mp.PlanID
WHERE p.UserID IN (2, 6);

PRINT 'Payment records created successfully!'; 