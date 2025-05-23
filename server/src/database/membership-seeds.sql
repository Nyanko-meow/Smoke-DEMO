-- Kiểm tra xem bảng đã tồn tại chưa
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='MembershipPlans' AND xtype='U')
BEGIN
    CREATE TABLE MembershipPlans (
        PlanID INT IDENTITY(1,1) PRIMARY KEY,
        Code VARCHAR(20) NOT NULL,
        Name NVARCHAR(100) NOT NULL,
        Description NVARCHAR(500),
        Price DECIMAL(10, 2) NOT NULL,
        Duration INT NOT NULL, -- in days
        Features NVARCHAR(MAX),
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE()
    );
END;

-- Kiểm tra xem đã có dữ liệu chưa
IF NOT EXISTS (SELECT * FROM MembershipPlans)
BEGIN
    -- Chèn dữ liệu mẫu
    INSERT INTO MembershipPlans (Code, Name, Description, Price, Duration, Features)
    VALUES 
    ('BASIC', N'Basic Plan', N'Gói cơ bản cho người mới bắt đầu', 99.00, 30, 
     N'Progress tracking, Basic quitting tips, Community access'),
    
    ('PREMIUM', N'Premium Plan', N'Gói cao cấp với nhiều tính năng hơn', 199.00, 60, 
     N'Progress tracking, Advanced analytics, Premium quitting strategies, Community access, Weekly motivation'),
    
    ('PRO', N'Pro Plan', N'Gói chuyên nghiệp với đầy đủ tính năng', 299.00, 90, 
     N'Progress tracking, Advanced analytics, Pro quitting strategies, Community access, Daily motivation, Personalized coaching, Health improvement dashboard');
END;

-- Kiểm tra xem bảng UserMemberships đã tồn tại chưa
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='UserMemberships' AND xtype='U')
BEGIN
    CREATE TABLE UserMemberships (
        MembershipID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NOT NULL,
        PlanID INT NOT NULL,
        StartDate DATETIME NOT NULL DEFAULT GETDATE(),
        EndDate DATETIME NOT NULL,
        Status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, expired, cancelled
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (UserID) REFERENCES Users(UserID),
        FOREIGN KEY (PlanID) REFERENCES MembershipPlans(PlanID)
    );
END;

-- Kiểm tra xem bảng Payments đã tồn tại chưa
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Payments' AND xtype='U')
BEGIN
    CREATE TABLE Payments (
        PaymentID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NOT NULL,
        Amount DECIMAL(10, 2) NOT NULL,
        PaymentMethod VARCHAR(50) NOT NULL,
        TransactionID VARCHAR(100),
        Status VARCHAR(20) NOT NULL, -- completed, pending, failed
        PaymentDate DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (UserID) REFERENCES Users(UserID)
    );
END;

-- Kiểm tra xem bảng PaymentConfirmations đã tồn tại chưa
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PaymentConfirmations' AND xtype='U')
BEGIN
    CREATE TABLE PaymentConfirmations (
        ConfirmationID INT IDENTITY(1,1) PRIMARY KEY,
        PaymentID INT NOT NULL,
        MembershipID INT NOT NULL,
        ConfirmationCode VARCHAR(50) NOT NULL,
        ConfirmationDate DATETIME DEFAULT GETDATE(),
        ConfirmedBy VARCHAR(100) DEFAULT 'System',
        Notes NVARCHAR(500),
        FOREIGN KEY (PaymentID) REFERENCES Payments(PaymentID),
        FOREIGN KEY (MembershipID) REFERENCES UserMemberships(MembershipID)
    );
END; 