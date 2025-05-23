-- Xóa CSDL nếu đã tồn tại
DROP DATABASE IF EXISTS SMOKEKING;
GO

-- Tạo lại CSDL
CREATE DATABASE SMOKEKING;
GO

USE SMOKEKING;
GO

-- Users Table
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Email NVARCHAR(255) UNIQUE NOT NULL,
    Password NVARCHAR(255) NOT NULL,
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    Role NVARCHAR(20) NOT NULL CHECK (Role IN ('guest', 'member', 'coach', 'admin')),
    Avatar NVARCHAR(255),
    PhoneNumber NVARCHAR(20),
    Address NVARCHAR(255),
    IsActive BIT DEFAULT 0,
    ActivationToken NVARCHAR(255),
    ActivationExpires DATETIME,
    EmailVerified BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    LastLoginAt DATETIME,
    RefreshToken NVARCHAR(255),
    RefreshTokenExpiry DATETIME
);

-- Insert mẫu người dùng
INSERT INTO Users (Email, Password, FirstName, LastName, Role, Avatar, PhoneNumber, Address,
    IsActive, ActivationToken, ActivationExpires, EmailVerified, CreatedAt, UpdatedAt, LastLoginAt,
    RefreshToken, RefreshTokenExpiry)
VALUES 
('guest@example.com', 'H12345678@', 'Guest', 'User', 'guest', NULL, '0123456789', '123 Guest St',
 0, 'token_guest', DATEADD(DAY, 1, GETDATE()), 0, GETDATE(), GETDATE(), NULL, NULL, NULL),
('member@example.com', 'H12345678@', 'Member', 'User', 'member', 'avatar2.jpg', '0987654321', '456 Member Rd',
 1, NULL, NULL, 1, GETDATE(), GETDATE(), GETDATE(), 'refreshtoken_member', DATEADD(DAY, 7, GETDATE())),
('coach@example.com', 'H12345678@', 'Coach', 'Smith', 'coach', 'coach.jpg', '0111222333', '789 Coach Blvd',
 1, NULL, NULL, 1, GETDATE(), GETDATE(), GETDATE(), 'refreshtoken_coach', DATEADD(DAY, 7, GETDATE())),
('admin@example.com', 'H12345678@', 'Admin', 'Root', 'admin', 'admin.png', '0999888777', '321 Admin Ave',
 1, NULL, NULL, 1, GETDATE(), GETDATE(), GETDATE(), 'refreshtoken_admin', DATEADD(DAY, 30, GETDATE()));

-- Login History
CREATE TABLE LoginHistory (
    HistoryID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    LoginTime DATETIME DEFAULT GETDATE(),
    IPAddress NVARCHAR(50),
    UserAgent NVARCHAR(255),
    Status NVARCHAR(20) CHECK (Status IN ('success', 'failed')),
    Notes NVARCHAR(MAX)
);

-- Login Attempts
CREATE TABLE LoginAttempts (
    AttemptID INT IDENTITY(1,1) PRIMARY KEY,
    Email NVARCHAR(255),
    IPAddress NVARCHAR(50),
    AttemptTime DATETIME DEFAULT GETDATE(),
    Success BIT DEFAULT 0
);

-- Membership Plans
CREATE TABLE MembershipPlans (
    PlanID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX),
    Price DECIMAL(10,2) NOT NULL,
    Duration INT NOT NULL,
    Features NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Insert các Plan mẫu
INSERT INTO MembershipPlans (Name, Description, Price, Duration, Features)
VALUES 
('Basic Plan', 'A basic plan for quitting support.', 99.00, 30, 'Progress tracking, Basic quitting tips, Community access'),
('Premium Plan', 'A premium plan with advanced support.', 199.00, 60, 'Progress tracking, Advanced analytics, Premium quitting strategies, Community access, Weekly motivation'),
('Pro Plan', 'The best plan with full support and coaching.', 299.00, 90, 'Progress tracking, Advanced analytics, Pro quitting strategies, Community access, Daily motivation, Personalized coaching, Health improvement dashboard');

-- User Memberships
CREATE TABLE UserMemberships (
    MembershipID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    PlanID INT FOREIGN KEY REFERENCES MembershipPlans(PlanID),
    StartDate DATETIME NOT NULL,
    EndDate DATETIME NOT NULL,
    Status NVARCHAR(20) CHECK (Status IN ('active', 'expired', 'cancelled')),
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Smoking Status
CREATE TABLE SmokingStatus (
    StatusID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    CigarettesPerDay INT,
    CigarettePrice DECIMAL(10,2),
    SmokingFrequency NVARCHAR(50),
    LastUpdated DATETIME DEFAULT GETDATE()
);

-- Quit Plans
CREATE TABLE QuitPlans (
    PlanID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    StartDate DATETIME NOT NULL,
    TargetDate DATETIME NOT NULL,
    Reason NVARCHAR(MAX),
    MotivationLevel INT CHECK (MotivationLevel BETWEEN 1 AND 10),
    DetailedPlan NVARCHAR(MAX),
    Status NVARCHAR(20) CHECK (Status IN ('active', 'completed', 'cancelled')),
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Progress Tracking
CREATE TABLE ProgressTracking (
    ProgressID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    Date DATE NOT NULL,
    CigarettesSmoked INT,
    CravingLevel INT CHECK (CravingLevel BETWEEN 1 AND 10),
    MoneySpent DECIMAL(10,2),
    HealthNotes NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Payments
CREATE TABLE Payments (
    PaymentID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    PlanID INT FOREIGN KEY REFERENCES MembershipPlans(PlanID),
    Amount DECIMAL(10,2) NOT NULL,
    PaymentDate DATETIME DEFAULT GETDATE(),
    PaymentMethod NVARCHAR(50) CHECK (PaymentMethod IN ('BankTransfer', 'Cash')),
    Status NVARCHAR(20) CHECK (Status IN ('pending', 'confirmed', 'rejected')),
    TransactionID NVARCHAR(255),
    StartDate DATETIME,
    EndDate DATETIME,
    Note NVARCHAR(MAX)
);

-- Payment Confirmations
CREATE TABLE PaymentConfirmations (
    ConfirmationID INT IDENTITY(1,1) PRIMARY KEY,
    PaymentID INT FOREIGN KEY REFERENCES Payments(PaymentID),
    ConfirmationDate DATETIME DEFAULT GETDATE(),
    ConfirmedByUserID INT FOREIGN KEY REFERENCES Users(UserID),
    ConfirmationCode NVARCHAR(255),
    Notes NVARCHAR(MAX)
);

-- Survey Questions Table
CREATE TABLE SurveyQuestions (
    QuestionID INT IDENTITY(1,1) PRIMARY KEY,
    QuestionText NVARCHAR(MAX) NOT NULL
);

-- User Survey Answers
CREATE TABLE UserSurveyAnswers (
    AnswerID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    QuestionID INT FOREIGN KEY REFERENCES SurveyQuestions(QuestionID),
    Answer NVARCHAR(MAX),
    SubmittedAt DATETIME DEFAULT GETDATE()
);

-- Insert 10 câu hỏi khảo sát
INSERT INTO SurveyQuestions (QuestionText)
VALUES 
(N'Bạn đã hút thuốc trong bao lâu rồi?'),
(N'Trung bình mỗi ngày bạn hút bao nhiêu điếu?'),
(N'Khoảng thời gian và hoàn cảnh nào bạn thường hút nhất?'),
(N'Lý do chính bạn muốn cai thuốc là gì?'),
(N'Bạn đã từng cố gắng cai thuốc trước đây không? Kết quả ra sao?'),
(N'Bạn mong muốn nhận hỗ trợ gì nhất từ một nền tảng (thông báo, cộng đồng, huấn luyện viên…)?'),
(N'Bạn sẵn sàng chi trả bao nhiêu mỗi tháng để sử dụng dịch vụ hỗ trợ cai thuốc?'),
(N'Bạn ưu tiên sử dụng nền tảng trên thiết bị di động hay web?'),
(N'Các chỉ số nào bạn quan tâm nhất khi theo dõi tiến trình (ngày không hút, tiền tiết kiệm, sức khỏe…)?'),
(N'Bạn có thường chia sẻ tiến trình/câu chuyện của mình lên mạng xã hội không?');

-- Blog Posts
CREATE TABLE BlogPosts (
    PostID INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(255) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    AuthorID INT FOREIGN KEY REFERENCES Users(UserID),
    PublishedAt DATETIME DEFAULT GETDATE(),
    IsPublished BIT DEFAULT 1
);

-- Comments
CREATE TABLE Comments (
    CommentID INT IDENTITY(1,1) PRIMARY KEY,
    PostID INT FOREIGN KEY REFERENCES BlogPosts(PostID),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    CommentText NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Ví dụ Insert Payment & Membership
DECLARE @userID INT = 2;
DECLARE @planID INT = 1;
DECLARE @amount DECIMAL(10,2) = (SELECT Price FROM MembershipPlans WHERE PlanID = @planID);
DECLARE @duration INT = (SELECT Duration FROM MembershipPlans WHERE PlanID = @planID);
DECLARE @startDate DATETIME = GETDATE();
DECLARE @endDate DATETIME = DATEADD(DAY, @duration, @startDate);

INSERT INTO Payments (UserID, PlanID, Amount, PaymentMethod, Status, TransactionID, StartDate, EndDate, Note)
VALUES (@userID, @planID, @amount, 'BankTransfer', 'confirmed', 'TX123456789', @startDate, @endDate, N'Đăng ký qua trang web');

INSERT INTO UserMemberships (UserID, PlanID, StartDate, EndDate, Status)
VALUES (@userID, @planID, @startDate, @endDate, 'active');
