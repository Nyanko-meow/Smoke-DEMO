USE SMOKEKING;

-- Create simple payment record for leghenkiz@gmail.com user (UserID 6)
INSERT INTO Payments (
    UserID, 
    PlanID, 
    Amount, 
    PaymentDate, 
    PaymentMethod, 
    Status
) VALUES (
    6, 
    1, 
    199000.00, 
    '2025-06-03', 
    'bank_transfer', 
    'pending'
);

-- Also create payment for member@example.com for testing (UserID 2)
INSERT INTO Payments (
    UserID, 
    PlanID, 
    Amount, 
    PaymentDate, 
    PaymentMethod, 
    Status
) VALUES (
    2, 
    1, 
    199000.00, 
    '2025-06-03', 
    'bank_transfer', 
    'pending'
);

-- Check created payments
SELECT 
    PaymentID,
    UserID,
    PlanID,
    Amount,
    PaymentDate,
    PaymentMethod,
    Status
FROM Payments 
WHERE UserID IN (2, 6);

PRINT 'Payment records created successfully!'; 