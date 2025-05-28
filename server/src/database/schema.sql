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

-- Insert mẫu người dùng với password bình thường (không hash)
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

ALTER TABLE QuitPlans
ADD CoachID INT FOREIGN KEY REFERENCES Users(UserID);

-- Progress Tracking (Ghi nhật ký tiến trình)
CREATE TABLE ProgressTracking (
    ProgressID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    Date DATE NOT NULL,                            
    CigarettesSmoked INT,                         
    CravingLevel INT CHECK (CravingLevel BETWEEN 1 AND 10),  
    EmotionNotes NVARCHAR(MAX),                   
    MoneySaved DECIMAL(10,2),                     
    DaysSmokeFree INT,                            
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
    MetaDescription NVARCHAR(300), 
    Content NVARCHAR(MAX) NOT NULL,
    ThumbnailURL NVARCHAR(500), 
    
    AuthorID INT NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    PublishedAt DATETIME NULL, 
    
    Status NVARCHAR(20) DEFAULT 'Pending', 
    Views INT DEFAULT 0,

    IsFeatured BIT DEFAULT 0, 

    CONSTRAINT FK_BlogPosts_Users FOREIGN KEY (AuthorID)
        REFERENCES Users(UserID)
);

-- Insert sample blog posts
INSERT INTO BlogPosts (Title, MetaDescription, Content, ThumbnailURL, AuthorID, Status, PublishedAt, Views)
VALUES 
(N'Hành trình cai thuốc của tôi - 30 ngày đầu tiên', 
 N'Chia sẻ những khó khăn và thành công trong 30 ngày đầu tiên cai thuốc lá', 
 N'Xin chào mọi người! Tôi muốn chia sẻ với các bạn hành trình cai thuốc lá của mình trong 30 ngày đầu tiên.

Ngày đầu tiên thực sự rất khó khăn. Tôi đã hút thuốc được 10 năm, mỗi ngày khoảng 1 bao. Khi quyết định cai thuốc, tôi cảm thấy lo lắng và không biết liệu mình có thể thành công hay không.

Những ngày đầu, cơn thèm thuốc xuất hiện liên tục. Tôi đã áp dụng một số phương pháp:
- Uống nhiều nước
- Tập thể dục nhẹ
- Ăn kẹo cao su
- Tìm hoạt động thay thế

Sau 1 tuần, tôi bắt đầu cảm thấy khỏe hơn. Hơi thở không còn mùi thuốc, răng trắng hơn.

Tuần thứ 2 và 3 là thời gian khó khăn nhất. Có những lúc tôi suýt bỏ cuộc, nhưng nghĩ đến sức khỏe của bản thân và gia đình, tôi đã kiên trì.

Bây giờ, sau 30 ngày, tôi cảm thấy tự hào về bản thân. Tôi đã tiết kiệm được một khoản tiền không nhỏ và quan trọng hơn là sức khỏe được cải thiện rõ rệt.

Lời khuyên của tôi cho những ai đang muốn cai thuốc:
1. Hãy có động lực mạnh mẽ
2. Tìm sự hỗ trợ từ gia đình và bạn bè
3. Thay thế thói quen hút thuốc bằng hoạt động tích cực
4. Kiên nhẫn với bản thân

Chúc các bạn thành công!', 
 '/api/images/blog/quit-smoking-journey.jpg',
 2, 'published', GETDATE(), 45),

(N'5 mẹo giúp vượt qua cơn thèm thuốc', 
 N'Những phương pháp hiệu quả để đối phó với cơn thèm thuốc lá', 
 N'Cơn thèm thuốc là một trong những thách thức lớn nhất khi cai thuốc lá. Dưới đây là 5 mẹo đã giúp tôi và nhiều người khác vượt qua:

**1. Kỹ thuật hít thở sâu**
Khi cảm thấy thèm thuốc, hãy thực hiện:
- Hít vào sâu trong 4 giây
- Giữ hơi thở 4 giây  
- Thở ra chậm trong 6 giây
- Lặp lại 5-10 lần

**2. Uống nước lạnh**
Nước lạnh giúp:
- Làm dịu cơn thèm
- Giữ miệng luôn bận rộn
- Thanh lọc cơ thể

**3. Tập thể dục nhẹ**
- Đi bộ 10-15 phút
- Làm một vài động tác yoga
- Chạy bộ tại chỗ

**4. Ăn trái cây hoặc rau củ**
- Cà rót, cần tây giúp làm sạch miệng
- Táo, cam cung cấp vitamin C
- Hạt hướng dương thay thế thói quen cầm nắm

**5. Tìm hoạt động thay thế**
- Chơi game trên điện thoại
- Nghe nhạc
- Gọi điện cho bạn bè
- Đọc sách

Hãy nhớ rằng cơn thèm thuốc thường chỉ kéo dài 3-5 phút. Nếu bạn có thể vượt qua được khoảng thời gian này, bạn đã thành công!

Chúc các bạn cai thuốc thành công!', 
 '/api/images/blog/coping-with-cravings.jpg',
 3, 'published', DATEADD(DAY, -2, GETDATE()), 32),

(N'Lợi ích sức khỏe khi cai thuốc lá', 
 N'Những thay đổi tích cực trong cơ thể sau khi ngừng hút thuốc', 
 N'Cai thuốc lá mang lại rất nhiều lợi ích cho sức khỏe. Dưới đây là timeline những thay đổi tích cực:

**Sau 20 phút:**
- Nhịp tim và huyết áp giảm
- Lưu thông máu cải thiện

**Sau 12 giờ:**
- Nồng độ carbon monoxide trong máu giảm xuống mức bình thường
- Nồng độ oxy tăng

**Sau 24 giờ:**
- Nguy cơ đau tim giảm

**Sau 48 giờ:**
- Khứu giác và vị giác bắt đầu cải thiện
- Các đầu dây thần kinh bắt đầu tái tạo

**Sau 2 tuần - 3 tháng:**
- Lưu thông máu cải thiện
- Chức năng phổi tăng lên đến 30%

**Sau 1-9 tháng:**
- Ho và khó thở giảm
- Lông mao trong phổi hoạt động trở lại bình thường

**Sau 1 năm:**
- Nguy cơ bệnh tim giảm 50%

**Sau 5 năm:**
- Nguy cơ đột quỵ giảm như người không hút thuốc

**Sau 10 năm:**
- Nguy cơ ung thư phổi giảm 50%

**Sau 15 năm:**
- Nguy cơ bệnh tim như người không bao giờ hút thuốc

Ngoài ra, cai thuốc còn mang lại:
- Tiết kiệm tiền bạc
- Hơi thở thơm tho
- Răng trắng hơn
- Da khỏe mạnh hơn
- Tự tin hơn trong giao tiếp

Hãy bắt đầu hành trình cai thuốc ngay hôm nay để tận hưởng những lợi ích tuyệt vời này!', 
 '/api/images/blog/health-benefits.jpg',
 3, 'published', DATEADD(DAY, -5, GETDATE()), 67);

-- Comments
CREATE TABLE Comments (
    CommentID INT IDENTITY(1,1) PRIMARY KEY,
    PostID INT FOREIGN KEY REFERENCES BlogPosts(PostID),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    CommentText NVARCHAR(MAX) NOT NULL,
    Status NVARCHAR(20) DEFAULT 'pending' CHECK (Status IN ('pending', 'approved', 'rejected')),
    CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE Achievements (
    AchievementID INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(255),
    IconURL NVARCHAR(255),
    MilestoneDays INT NULL,
    SavedMoney INT NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Insert sample achievements
INSERT INTO Achievements (Name, Description, IconURL, MilestoneDays, SavedMoney)
VALUES 
(N'Ngày đầu tiên', N'Chúc mừng bạn đã hoàn thành ngày đầu tiên không hút thuốc!', '/images/achievements/trophy-bronze.png', 1, NULL),
(N'Tuần lễ khởi đầu', N'Bạn đã không hút thuốc được 7 ngày liên tiếp!', '/images/achievements/star-silver.png', 7, NULL),
(N'Tháng đầu tiên', N'Một tháng không hút thuốc - một cột mốc quan trọng!', '/images/achievements/crown-gold.png', 30, NULL),
(N'Quý đầu tiên', N'3 tháng không hút thuốc - sức khỏe của bạn đã cải thiện rất nhiều!', '/images/achievements/gem-diamond.png', 90, NULL),
(N'Tiết kiệm 100K', N'Bạn đã tiết kiệm được 100,000 VNĐ nhờ việc không hút thuốc!', '/images/achievements/money-bronze.png', NULL, 100000),
(N'Tiết kiệm 500K', N'Tuyệt vời! Bạn đã tiết kiệm được 500,000 VNĐ!', '/images/achievements/money-silver.png', NULL, 500000),
(N'Tiết kiệm 1 triệu', N'Thành tích đáng kinh ngạc! 1,000,000 VNĐ đã được tiết kiệm!', '/images/achievements/money-gold.png', NULL, 1000000);

CREATE TABLE UserAchievements (
    UserAchievementID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NOT NULL,
    AchievementID INT NOT NULL,
    EarnedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (AchievementID) REFERENCES Achievements(AchievementID)
);

CREATE TABLE CommunityPosts (
    PostID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NOT NULL,
    Title NVARCHAR(255),
    Content NVARCHAR(MAX),
    AchievementID INT NULL, -- Liên kết huy hiệu (nếu có)
    CreatedAt DATETIME DEFAULT GETDATE(),
    Likes INT DEFAULT 0,
    IsPublic BIT DEFAULT 1,

    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (AchievementID) REFERENCES Achievements(AchievementID)
);

CREATE TABLE CommunityComments (
    CommentID INT PRIMARY KEY IDENTITY(1,1),
    PostID INT NOT NULL,
    UserID INT NOT NULL,
    Content NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (PostID) REFERENCES CommunityPosts(PostID),
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

CREATE TABLE PostLikes (
    LikeID INT PRIMARY KEY IDENTITY(1,1),
    PostID INT NOT NULL,
    UserID INT NOT NULL,
    LikedAt DATETIME DEFAULT GETDATE(),

    UNIQUE(PostID, UserID), -- Không cho like trùng
    FOREIGN KEY (PostID) REFERENCES CommunityPosts(PostID),
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
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

-- Chat Messages Table
CREATE TABLE Messages (
    MessageID INT IDENTITY(1,1) PRIMARY KEY,
    SenderID INT NOT NULL,
    ReceiverID INT NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    MessageType NVARCHAR(20) DEFAULT 'text' CHECK (MessageType IN ('text', 'image', 'file', 'plan_update')),
    IsRead BIT DEFAULT 0,
    RelatedPlanID INT NULL, -- Liên kết với QuitPlans nếu tin nhắn liên quan đến kế hoạch
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (SenderID) REFERENCES Users(UserID),
    FOREIGN KEY (ReceiverID) REFERENCES Users(UserID),
    FOREIGN KEY (RelatedPlanID) REFERENCES QuitPlans(PlanID)
);

-- Chat Conversations Table (để quản lý cuộc trò chuyện giữa coach và member)
CREATE TABLE Conversations (
    ConversationID INT IDENTITY(1,1) PRIMARY KEY,
    CoachID INT NOT NULL,
    MemberID INT NOT NULL,
    LastMessageID INT NULL,
    LastMessageAt DATETIME DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),

    UNIQUE(CoachID, MemberID), -- Mỗi cặp coach-member chỉ có 1 conversation
    FOREIGN KEY (CoachID) REFERENCES Users(UserID),
    FOREIGN KEY (MemberID) REFERENCES Users(UserID),
    FOREIGN KEY (LastMessageID) REFERENCES Messages(MessageID)
);

-- Consultation Appointments Table (tùy chọn cho việc đặt lịch tư vấn)
CREATE TABLE ConsultationAppointments (
    AppointmentID INT IDENTITY(1,1) PRIMARY KEY,
    CoachID INT NOT NULL,
    MemberID INT NOT NULL,
    AppointmentDate DATETIME NOT NULL,
    Duration INT DEFAULT 30, -- Thời gian tư vấn (phút)
    Type NVARCHAR(20) CHECK (Type IN ('video', 'audio', 'chat')),
    Status NVARCHAR(20) DEFAULT 'scheduled' CHECK (Status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
    Notes NVARCHAR(MAX),
    MeetingLink NVARCHAR(255), -- Link cho video/audio call
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (CoachID) REFERENCES Users(UserID),
    FOREIGN KEY (MemberID) REFERENCES Users(UserID)
);

-- Message Attachments Table (để lưu file đính kèm nếu cần)
CREATE TABLE MessageAttachments (
    AttachmentID INT IDENTITY(1,1) PRIMARY KEY,
    MessageID INT NOT NULL,
    FileName NVARCHAR(255) NOT NULL,
    FileURL NVARCHAR(500) NOT NULL,
    FileSize BIGINT,
    MimeType NVARCHAR(100),
    CreatedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (MessageID) REFERENCES Messages(MessageID)
);

-- Insert sample conversations and messages
-- Tạo conversation giữa coach (UserID=3) và member (UserID=2)
INSERT INTO Conversations (CoachID, MemberID, LastMessageAt)
VALUES (3, 2, GETDATE());

DECLARE @conversationID INT = SCOPE_IDENTITY();

-- Insert sample messages
INSERT INTO Messages (SenderID, ReceiverID, Content, MessageType, IsRead)
VALUES 
(3, 2, N'Xin chào! Tôi là coach của bạn. Tôi sẽ hỗ trợ bạn trong quá trình cai thuốc. Bạn cảm thấy thế nào về kế hoạch hiện tại?', 'text', 1),
(2, 3, N'Chào coach! Em cảm thấy còn khó khăn trong việc kiểm soát cơn thèm thuốc. Em có thể nhờ coach tư vấn thêm không ạ?', 'text', 1),
(3, 2, N'Tất nhiên rồi! Cơn thèm thuốc là điều bình thường trong giai đoạn đầu. Bạn đã thử các phương pháp nào để đối phó với nó chưa?', 'text', 0);

-- Update conversation với tin nhắn cuối cùng
UPDATE Conversations 
SET LastMessageID = (SELECT MAX(MessageID) FROM Messages WHERE (SenderID = 3 AND ReceiverID = 2) OR (SenderID = 2 AND ReceiverID = 3)),
    LastMessageAt = GETDATE()
WHERE CoachID = 3 AND MemberID = 2;

-- Insert sample consultation appointment
INSERT INTO ConsultationAppointments (CoachID, MemberID, AppointmentDate, Duration, Type, Status, Notes)
VALUES (3, 2, DATEADD(DAY, 2, GETDATE()), 45, 'video', 'scheduled', N'Tư vấn về kế hoạch cai thuốc và các phương pháp đối phó với cơn thèm');

-- Coach Feedback Table (Member đánh giá Coach)
CREATE TABLE CoachProfiles (
    ProfileID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    Bio NVARCHAR(MAX),
    Specialization NVARCHAR(255),
    Experience INT, -- Số năm kinh nghiệm
    HourlyRate DECIMAL(10,2),
    IsAvailable BIT DEFAULT 1,
    YearsOfExperience INT,
    Education NVARCHAR(MAX),
    Certifications NVARCHAR(MAX),
    Languages NVARCHAR(255),
    WorkingHours NVARCHAR(255),
    ConsultationTypes NVARCHAR(255),
    SuccessRate DECIMAL(5,2),
    TotalClients INT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

CREATE TABLE CoachReviews (
    ReviewID INT IDENTITY(1,1) PRIMARY KEY,
    CoachUserID INT NOT NULL,
    ClientName NVARCHAR(255),
    ReviewTitle NVARCHAR(255),
    ReviewContent NVARCHAR(MAX),
    Rating INT NOT NULL CHECK (Rating BETWEEN 1 AND 5),
    IsAnonymous BIT DEFAULT 0,
    IsVerified BIT DEFAULT 0,
    IsPublic BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (CoachUserID) REFERENCES Users(UserID)
);

-- Insert sample coach profiles
INSERT INTO CoachProfiles (UserID, Bio, Specialization, Experience, HourlyRate, IsAvailable, YearsOfExperience, Education, Certifications, Languages, WorkingHours, ConsultationTypes, SuccessRate, TotalClients)
VALUES 
(3, N'Tôi là một coach chuyên nghiệp với nhiều năm kinh nghiệm hỗ trợ người cai thuốc lá. Tôi đã giúp hàng trăm người thành công trong hành trình cai thuốc của họ.', 
 N'Cai thuốc lá, Tư vấn sức khỏe tâm lý', 5, 200000.00, 1, 5, 
 N'Thạc sĩ Tâm lý học - Đại học Y Hà Nội', 
 N'Chứng chỉ tư vấn viên cai thuốc quốc tế, Chứng chỉ CBT (Cognitive Behavioral Therapy)', 
 N'Tiếng Việt, Tiếng Anh', 
 N'Thứ 2-6: 8:00-17:00, Thứ 7: 8:00-12:00', 
 N'Video call, Voice call, Chat', 
 85.5, 150);

-- Insert sample reviews
INSERT INTO CoachReviews (CoachUserID, ClientName, ReviewTitle, ReviewContent, Rating, IsAnonymous, IsVerified, IsPublic)
VALUES 
(3, N'Nguyễn Văn A', N'Coach rất tận tâm', N'Coach Smith đã giúp tôi rất nhiều trong việc cai thuốc. Những lời khuyên của coach rất thiết thực và hiệu quả.', 5, 0, 1, 1),
(3, N'Trần Thị B', N'Phương pháp hiệu quả', N'Tôi đã thử nhiều cách nhưng không thành công. Nhờ có coach mà tôi đã cai được thuốc sau 3 tháng.', 5, 0, 1, 1),
(3, N'Lê Văn C', N'Hỗ trợ tốt', N'Coach luôn sẵn sàng hỗ trợ khi tôi gặp khó khăn. Rất recommend!', 4, 0, 1, 1);

CREATE TABLE CoachFeedback (
    FeedbackID INT IDENTITY(1,1) PRIMARY KEY,
    CoachID INT NOT NULL,
    MemberID INT NOT NULL,
    AppointmentID INT NULL, -- Liên kết với buổi tư vấn (nếu có)
    Rating INT NOT NULL CHECK (Rating BETWEEN 1 AND 5), -- Đánh giá từ 1-5 sao
    Comment NVARCHAR(MAX), -- Nhận xét của member
    Categories NVARCHAR(MAX), -- JSON string chứa đánh giá theo từng tiêu chí
    IsAnonymous BIT DEFAULT 0, -- Có hiển thị tên member hay không
    Status NVARCHAR(20) DEFAULT 'active' CHECK (Status IN ('active', 'hidden', 'deleted')),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (CoachID) REFERENCES Users(UserID),
    FOREIGN KEY (MemberID) REFERENCES Users(UserID),
    FOREIGN KEY (AppointmentID) REFERENCES ConsultationAppointments(AppointmentID),
    UNIQUE(MemberID, CoachID, AppointmentID) -- Mỗi member chỉ đánh giá 1 lần cho 1 coach trong 1 buổi
);

-- Insert sample feedback data
INSERT INTO CoachFeedback (CoachID, MemberID, AppointmentID, Rating, Comment, Categories, IsAnonymous)
VALUES 
(3, 2, NULL, 5, N'Coach Smith rất tận tâm và kiên nhẫn. Những lời khuyên của coach đã giúp em rất nhiều trong việc cai thuốc.', 
 '{"professionalism": 5, "helpfulness": 5, "communication": 5, "knowledge": 4}', 0),
(3, 4, NULL, 4, N'Coach có kiến thức chuyên môn tốt, tuy nhiên em mong muốn có thêm thời gian tư vấn.', 
 '{"professionalism": 4, "helpfulness": 4, "communication": 4, "knowledge": 5}', 1);
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
