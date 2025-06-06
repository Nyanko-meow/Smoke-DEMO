-- Add bank account fields to CancellationRequests table
USE SMOKEKING;
GO

-- Add new columns for bank account information
ALTER TABLE CancellationRequests 
ADD BankAccountNumber NVARCHAR(50),
    BankName NVARCHAR(100),
    AccountHolderName NVARCHAR(100),
    TransferConfirmed BIT DEFAULT 0, -- Admin confirms transfer sent
    RefundReceived BIT DEFAULT 0, -- User confirms refund received
    TransferDate DATETIME NULL, -- When admin confirms transfer
    ReceivedDate DATETIME NULL; -- When user confirms received

GO

-- Update status constraint to include new statuses
ALTER TABLE CancellationRequests DROP CONSTRAINT IF EXISTS CK__Cancellat__Statu__XXX;
GO

ALTER TABLE CancellationRequests 
ADD CONSTRAINT CK_CancellationRequests_Status 
CHECK (Status IN ('pending', 'approved', 'rejected', 'completed', 'transfer_confirmed', 'refund_received'));
GO

PRINT 'Bank account fields added to CancellationRequests table successfully!'; 