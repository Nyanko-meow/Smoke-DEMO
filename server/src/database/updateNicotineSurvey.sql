USE SMOKEKING;
GO

-- Clear existing survey questions
DELETE FROM SurveyQuestions;
DBCC CHECKIDENT ('SurveyQuestions', RESEED, 1);

-- Insert new nicotine addiction assessment questions
INSERT INTO SurveyQuestions (QuestionText, QuestionType, DisplayOrder, IsActive, Category, Options)
VALUES 
-- Question 1: Time to first cigarette
(N'Bạn hút điếu đầu tiên sau khi thức dậy bao lâu?', 'select', 1, 1, 'nicotine_addiction', 
 N'["Trong 5 phút", "6–30 phút", "31–60 phút", "Sau 60 phút"]'),

-- Question 2: Hardest cigarette to give up
(N'Điếu thuốc nào bạn cảm thấy khó bỏ nhất?', 'select', 2, 1, 'nicotine_addiction',
 N'["Điếu đầu tiên trong ngày", "Điếu khác"]'),

-- Question 3: Cigarettes per day
(N'Bạn hút bao nhiêu điếu thuốc mỗi ngày?', 'select', 3, 1, 'nicotine_addiction',
 N'["≤10", "11–20", "21–30", "≥31"]'),

-- Question 4: More smoking in morning
(N'Bạn có hút thuốc nhiều hơn vào buổi sáng không?', 'select', 4, 1, 'nicotine_addiction',
 N'["Có", "Không"]'),

-- Question 5: Smoking when sick
(N'Bạn có hút thuốc ngay cả khi đang bị bệnh, phải nằm nghỉ không?', 'select', 5, 1, 'nicotine_addiction',
 N'["Có", "Không"]'),

-- Question 6: Difficulty without smoking
(N'Bạn có cảm thấy rất khó chịu nếu không được hút thuốc trong vài giờ?', 'select', 6, 1, 'nicotine_addiction',
 N'["Có", "Không"]'),

-- Question 7: Failed quit attempts
(N'Bạn có cố gắng bỏ thuốc trong năm qua nhưng thất bại?', 'select', 7, 1, 'nicotine_addiction',
 N'["Có", "Không"]'),

-- Question 8: Smoking in forbidden situations
(N'Bạn có hút thuốc trong những tình huống bị cấm hoặc gây hại cho người khác?', 'select', 8, 1, 'nicotine_addiction',
 N'["Thường xuyên", "Thỉnh thoảng", "Không bao giờ"]'),

-- Question 9: Smoking when stressed
(N'Bạn có hút thuốc khi bị stress, lo âu hoặc tức giận?', 'select', 9, 1, 'nicotine_addiction',
 N'["Luôn luôn", "Đôi khi", "Không bao giờ"]'),

-- Question 10: Withdrawal symptoms
(N'Nếu bạn không hút thuốc vài giờ, bạn có các triệu chứng như bứt rứt, lo lắng, mất tập trung?', 'select', 10, 1, 'nicotine_addiction',
 N'["Có", "Không"]');

PRINT 'Updated survey questions for nicotine addiction assessment';

-- Create table to store nicotine addiction scores
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'NicotineAddictionScores')
BEGIN
    CREATE TABLE NicotineAddictionScores (
        ScoreID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NOT NULL,
        TotalScore DECIMAL(4,1) NOT NULL,
        AddictionLevel NVARCHAR(50) NOT NULL,
        SurveyDate DATETIME DEFAULT GETDATE(),
        MembershipID INT NULL,
        FOREIGN KEY (UserID) REFERENCES Users(UserID),
        FOREIGN KEY (MembershipID) REFERENCES UserMemberships(MembershipID)
    );
    
    PRINT 'Created NicotineAddictionScores table';
END

-- Create index for faster lookups
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_NicotineAddictionScores_UserID')
BEGIN
    CREATE INDEX IX_NicotineAddictionScores_UserID ON NicotineAddictionScores(UserID);
    PRINT 'Created index on NicotineAddictionScores table';
END 