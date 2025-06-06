USE SMOKEKING;

-- Create Refunds table
CREATE TABLE Refunds (
    RefundID INT PRIMARY KEY IDENTITY(1,1),
    PaymentID INT NOT NULL,
    UserID INT NOT NULL,
    OriginalAmount DECIMAL(15,2) NOT NULL,
    RefundAmount DECIMAL(15,2) NOT NULL,
    RefundReason NVARCHAR(500),
    RequestedAt DATETIME DEFAULT GETDATE(),
    ProcessedAt DATETIME NULL,
    Status NVARCHAR(20) DEFAULT 'pending' CHECK (Status IN ('pending', 'approved', 'rejected', 'processed')),
    ProcessedBy INT NULL, -- Admin UserID who processed the refund
    RefundMethod NVARCHAR(50) DEFAULT 'bank_transfer',
    BankAccount NVARCHAR(100),
    Notes NVARCHAR(1000),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    
    FOREIGN KEY (PaymentID) REFERENCES Payments(PaymentID),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (ProcessedBy) REFERENCES Users(UserID)
);

-- Create PaymentConfirmations table if not exists
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PaymentConfirmations')
BEGIN
    CREATE TABLE PaymentConfirmations (
        ConfirmationID INT PRIMARY KEY IDENTITY(1,1),
        PaymentID INT NOT NULL,
        UserID INT NOT NULL,
        Status NVARCHAR(20) DEFAULT 'pending' CHECK (Status IN ('pending', 'confirmed', 'rejected', 'cancelled')),
        ConfirmedBy INT NULL, -- Admin UserID who confirmed
        ConfirmedAt DATETIME NULL,
        RejectedReason NVARCHAR(500),
        Notes NVARCHAR(1000),
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE(),
        
        FOREIGN KEY (PaymentID) REFERENCES Payments(PaymentID),
        FOREIGN KEY (UserID) REFERENCES Users(UserID),
        FOREIGN KEY (ConfirmedBy) REFERENCES Users(UserID)
    );
END

-- Check created tables
SELECT 'Refunds' as TableName, COUNT(*) as RecordCount FROM Refunds
UNION ALL
SELECT 'PaymentConfirmations' as TableName, COUNT(*) as RecordCount FROM PaymentConfirmations;

PRINT 'Refunds and PaymentConfirmations tables created successfully!'; 