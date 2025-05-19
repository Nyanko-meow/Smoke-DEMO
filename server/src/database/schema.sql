-- Users Table
-- Xóa nếu đã tồn tại
DROP DATABASE IF EXISTS SMOKEKING;
CREATE DATABASE SMOKEKING
GO
USE [SMOKEKING]
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
-- Chèn dữ liệu mẫu
INSERT INTO Users (
    Email, Password, FirstName, LastName, Role, Avatar, PhoneNumber, Address,
    IsActive, ActivationToken, ActivationExpires, EmailVerified, CreatedAt, UpdatedAt, LastLoginAt,
    RefreshToken, RefreshTokenExpiry
)
VALUES 
-- Guest user
('guest@example.com', 'hashed_password1', 'Guest', 'User', 'guest', NULL, '0123456789', '123 Guest St',
 0, 'token_guest', DATEADD(DAY, 1, GETDATE()), 0, GETDATE(), GETDATE(), NULL, NULL, NULL),

-- Member user
('member@example.com', 'hashed_password2', 'Member', 'User', 'member', 'avatar2.jpg', '0987654321', '456 Member Rd',
 1, NULL, NULL, 1, GETDATE(), GETDATE(), GETDATE(), 'refreshtoken_member', DATEADD(DAY, 7, GETDATE())),

-- Coach user
('coach@example.com', 'hashed_password3', 'Coach', 'Smith', 'coach', 'coach.jpg', '0111222333', '789 Coach Blvd',
 1, NULL, NULL, 1, GETDATE(), GETDATE(), GETDATE(), 'refreshtoken_coach', DATEADD(DAY, 7, GETDATE())),

-- Admin user
('admin@example.com', 'hashed_password4', 'Admin', 'Root', 'admin', 'admin.png', '0999888777', '321 Admin Ave',
 1, NULL, NULL, 1, GETDATE(), GETDATE(), GETDATE(), 'refreshtoken_admin', DATEADD(DAY, 30, GETDATE()));


-- Login History Table
CREATE TABLE LoginHistory (
    HistoryID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    LoginTime DATETIME DEFAULT GETDATE(),
    IPAddress NVARCHAR(50),
    UserAgent NVARCHAR(255),
    Status NVARCHAR(20) CHECK (Status IN ('success', 'failed')),
    Notes NVARCHAR(MAX)
);

-- Login Attempts Table
CREATE TABLE LoginAttempts (
    AttemptID INT IDENTITY(1,1) PRIMARY KEY,
    Email NVARCHAR(255),
    IPAddress NVARCHAR(50),
    AttemptTime DATETIME DEFAULT GETDATE(),
    Success BIT DEFAULT 0
);

-- Membership Plans Table
CREATE TABLE MembershipPlans (
    PlanID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX),
    Price DECIMAL(10,2) NOT NULL,
    Duration INT NOT NULL, -- in days
    Features NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- User Memberships Table
CREATE TABLE UserMemberships (
    MembershipID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    PlanID INT FOREIGN KEY REFERENCES MembershipPlans(PlanID),
    StartDate DATETIME NOT NULL,
    EndDate DATETIME NOT NULL,
    Status NVARCHAR(20) CHECK (Status IN ('active', 'expired', 'cancelled')),
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Smoking Status Table
CREATE TABLE SmokingStatus (
    StatusID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    CigarettesPerDay INT,
    CigarettePrice DECIMAL(10,2),
    SmokingFrequency NVARCHAR(50),
    LastUpdated DATETIME DEFAULT GETDATE()
);

-- Quit Plans Table
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

-- Progress Tracking Table
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

-- Achievements Table
CREATE TABLE Achievements (
    AchievementID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX),
    Type NVARCHAR(50),
    Criteria NVARCHAR(MAX),
    BadgeImage NVARCHAR(255)
);

-- User Achievements Table
CREATE TABLE UserAchievements (
    UserAchievementID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    AchievementID INT FOREIGN KEY REFERENCES Achievements(AchievementID),
    EarnedDate DATETIME DEFAULT GETDATE()
);

-- Notifications Table
CREATE TABLE Notifications (
    NotificationID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    Title NVARCHAR(255) NOT NULL,
    Message NVARCHAR(MAX),
    Type NVARCHAR(50),
    IsRead BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Consultations Table
CREATE TABLE Consultations (
    ConsultationID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    CoachID INT FOREIGN KEY REFERENCES Users(UserID),
    Date DATETIME NOT NULL,
    Status NVARCHAR(20) CHECK (Status IN ('scheduled', 'completed', 'cancelled')),
    Notes NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Payments Table
CREATE TABLE Payments (
    PaymentID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    Amount DECIMAL(10,2) NOT NULL,
    PaymentDate DATETIME DEFAULT GETDATE(),
    PaymentMethod NVARCHAR(50),
    Status NVARCHAR(20) CHECK (Status IN ('pending', 'completed', 'failed')),
    TransactionID NVARCHAR(255)
);

-- Feedback Table
CREATE TABLE Feedback (
    FeedbackID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    Rating INT CHECK (Rating BETWEEN 1 AND 5),
    Comment NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- User Survey Table
CREATE TABLE UserSurvey (
    SurveyID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    SmokingDuration NVARCHAR(50),
    CigarettesPerDay INT,
    SmokingTime NVARCHAR(MAX),
    QuitReason NVARCHAR(MAX),
    PreviousAttempts NVARCHAR(MAX),
    SupportNeeds NVARCHAR(MAX),
    MonthlyBudget DECIMAL(10,2),
    PreferredPlatform NVARCHAR(50),
    ImportantMetrics NVARCHAR(MAX),
    SocialSharing BIT,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Blog Posts Table
CREATE TABLE BlogPosts (
    PostID INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(255) NOT NULL,
    Content NVARCHAR(MAX),
    AuthorID INT FOREIGN KEY REFERENCES Users(UserID),
    Status NVARCHAR(20) CHECK (Status IN ('draft', 'published', 'archived')),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Comments Table
CREATE TABLE Comments (
    CommentID INT IDENTITY(1,1) PRIMARY KEY,
    PostID INT FOREIGN KEY REFERENCES BlogPosts(PostID),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    Content NVARCHAR(MAX),
    Status NVARCHAR(20) CHECK (Status IN ('pending', 'approved', 'rejected')),
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Community Posts Table
CREATE TABLE CommunityPosts (
    PostID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    Title NVARCHAR(255),
    Content NVARCHAR(MAX),
    Type NVARCHAR(50),
    Status NVARCHAR(20) CHECK (Status IN ('active', 'archived', 'deleted')),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Community Comments Table
CREATE TABLE CommunityComments (
    CommentID INT IDENTITY(1,1) PRIMARY KEY,
    PostID INT FOREIGN KEY REFERENCES CommunityPosts(PostID),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    Content NVARCHAR(MAX),
    Status NVARCHAR(20) CHECK (Status IN ('active', 'deleted')),
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Health Metrics Table
CREATE TABLE HealthMetrics (
    MetricID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    Date DATE NOT NULL,
    BloodPressure NVARCHAR(20),
    HeartRate INT,
    OxygenLevel DECIMAL(5,2),
    Notes NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON Users(Email);
CREATE INDEX idx_users_role ON Users(Role);
CREATE INDEX idx_memberships_user ON UserMemberships(UserID);
CREATE INDEX idx_memberships_status ON UserMemberships(Status);
CREATE INDEX idx_quitplans_user ON QuitPlans(UserID);
CREATE INDEX idx_quitplans_status ON QuitPlans(Status);
CREATE INDEX idx_progress_user ON ProgressTracking(UserID);
CREATE INDEX idx_progress_date ON ProgressTracking(Date);
CREATE INDEX idx_notifications_user ON Notifications(UserID);
CREATE INDEX idx_notifications_read ON Notifications(IsRead);
CREATE INDEX idx_consultations_user ON Consultations(UserID);
CREATE INDEX idx_consultations_coach ON Consultations(CoachID);
CREATE INDEX idx_payments_user ON Payments(UserID);
CREATE INDEX idx_payments_status ON Payments(Status);
CREATE INDEX idx_survey_user ON UserSurvey(UserID);
CREATE INDEX idx_blog_status ON BlogPosts(Status);
CREATE INDEX idx_community_status ON CommunityPosts(Status); 