USE SMOKEKING;

-- Insert RefundRequests record for already cancelled payment
INSERT INTO RefundRequests (
    UserID, 
    PaymentID, 
    MembershipID, 
    RefundAmount, 
    RefundReason,
    BankAccountNumber,
    BankName, 
    AccountHolderName,
    Status,
    RequestedAt
)
SELECT 
    p.UserID,
    p.PaymentID,
    um.MembershipID,
    p.Amount * 0.5 as RefundAmount,
    'Hủy gói dịch vụ theo yêu cầu của khách hàng' as RefundReason,
    '1234567890' as BankAccountNumber,
    'Vietcombank' as BankName,
    'Nguyễn Văn A' as AccountHolderName,
    'pending' as Status,
    GETDATE() as RequestedAt
FROM Payments p
JOIN UserMemberships um ON p.UserID = um.UserID AND p.PlanID = um.PlanID
WHERE p.Status = 'rejected' 
  AND p.UserID = 2  -- Your user ID
  AND NOT EXISTS (
      SELECT 1 FROM RefundRequests rr 
      WHERE rr.PaymentID = p.PaymentID
  );

-- Check result
SELECT 
    rr.*,
    mp.Name as PlanName
FROM RefundRequests rr
JOIN UserMemberships um ON rr.MembershipID = um.MembershipID  
JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
WHERE rr.UserID = 2; 