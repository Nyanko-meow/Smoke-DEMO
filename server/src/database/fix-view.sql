-- Fix script for VIEW creation
USE SMOKEKING;
GO

-- Drop existing view if exists
IF OBJECT_ID('CoachRatingStats', 'V') IS NOT NULL
    DROP VIEW CoachRatingStats;
GO

-- Coach Statistics View (để tính toán thống kê đánh giá)
CREATE VIEW CoachRatingStats AS
SELECT 
    c.UserID as CoachID,
    c.FirstName + ' ' + c.LastName as CoachName,
    COUNT(cf.FeedbackID) as TotalReviews,
    AVG(CAST(cf.Rating as FLOAT)) as AverageRating,
    COUNT(CASE WHEN cf.Rating = 5 THEN 1 END) as FiveStarCount,
    COUNT(CASE WHEN cf.Rating = 4 THEN 1 END) as FourStarCount,
    COUNT(CASE WHEN cf.Rating = 3 THEN 1 END) as ThreeStarCount,
    COUNT(CASE WHEN cf.Rating = 2 THEN 1 END) as TwoStarCount,
    COUNT(CASE WHEN cf.Rating = 1 THEN 1 END) as OneStarCount
FROM Users c
LEFT JOIN CoachFeedback cf ON c.UserID = cf.CoachID AND cf.Status = 'active'
WHERE c.Role = 'coach'
GROUP BY c.UserID, c.FirstName, c.LastName;
GO

-- Also create missing tables if they don't exist
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[RefundRequests]') AND type in (N'U'))
BEGIN
    CREATE TABLE RefundRequests (
        RefundRequestID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NOT NULL,
        PaymentID INT NOT NULL,
        MembershipID INT NULL,
        RefundAmount DECIMAL(10,2) NOT NULL,
        RefundReason NVARCHAR(MAX),
        BankAccountNumber NVARCHAR(50),
        BankName NVARCHAR(100),
        AccountHolderName NVARCHAR(100),
        Status NVARCHAR(20) DEFAULT 'pending' CHECK (Status IN ('pending', 'approved', 'rejected', 'completed')),
        RequestedAt DATETIME DEFAULT GETDATE(),
        ProcessedAt DATETIME NULL,
        ProcessedByUserID INT NULL,
        AdminNotes NVARCHAR(MAX),
        
        FOREIGN KEY (UserID) REFERENCES Users(UserID),
        FOREIGN KEY (PaymentID) REFERENCES Payments(PaymentID),
        FOREIGN KEY (MembershipID) REFERENCES UserMemberships(MembershipID),
        FOREIGN KEY (ProcessedByUserID) REFERENCES Users(UserID)
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Refunds]') AND type in (N'U'))
BEGIN
    CREATE TABLE Refunds (
        RefundID INT IDENTITY(1,1) PRIMARY KEY,
        RefundRequestID INT NOT NULL,
        UserID INT NOT NULL,
        RefundAmount DECIMAL(10,2) NOT NULL,
        RefundMethod NVARCHAR(50) CHECK (RefundMethod IN ('BankTransfer', 'Cash', 'WalletCredit')),
        TransactionID NVARCHAR(255),
        Status NVARCHAR(20) DEFAULT 'completed' CHECK (Status IN ('completed', 'failed')),
        RefundDate DATETIME DEFAULT GETDATE(),
        ProcessedByUserID INT NOT NULL,
        Notes NVARCHAR(MAX),
        
        FOREIGN KEY (RefundRequestID) REFERENCES RefundRequests(RefundRequestID),
        FOREIGN KEY (UserID) REFERENCES Users(UserID),
        FOREIGN KEY (ProcessedByUserID) REFERENCES Users(UserID)
    );
END
GO

PRINT 'All views and tables created successfully!'; 