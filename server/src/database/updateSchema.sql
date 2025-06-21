USE SMOKEKING;
GO

-- Check if SurveyQuestions table exists
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'SurveyQuestions')
BEGIN
    CREATE TABLE SurveyQuestions (
        QuestionID INT IDENTITY(1,1) PRIMARY KEY,
        QuestionText NVARCHAR(MAX) NOT NULL,
        QuestionType NVARCHAR(50) NOT NULL DEFAULT 'text',
        DisplayOrder INT NOT NULL DEFAULT 1,
        IsActive BIT NOT NULL DEFAULT 1,
        Category NVARCHAR(100) NULL,
        Options NVARCHAR(MAX) NULL
    );
    
    PRINT 'Created SurveyQuestions table';
END

-- Check if UserSurveyAnswers table exists
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'UserSurveyAnswers')
BEGIN
    CREATE TABLE UserSurveyAnswers (
        AnswerID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NOT NULL,
        QuestionID INT NOT NULL,
        AnswerText NVARCHAR(MAX) NULL,
        SubmittedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME NULL,
        FOREIGN KEY (UserID) REFERENCES Users(UserID),
        FOREIGN KEY (QuestionID) REFERENCES SurveyQuestions(QuestionID)
    );
    
    PRINT 'Created UserSurveyAnswers table';
END
ELSE
BEGIN
    -- Check if IsActive column exists in SurveyQuestions table
    IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'SurveyQuestions' AND COLUMN_NAME = 'IsActive'
    )
    BEGIN
        -- Add IsActive column with default value 1 (true)
        ALTER TABLE SurveyQuestions
        ADD IsActive BIT NOT NULL DEFAULT 1;
        
        PRINT 'Added IsActive column to SurveyQuestions table';
    END

    -- Check if DisplayOrder column exists in SurveyQuestions table
    IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'SurveyQuestions' AND COLUMN_NAME = 'DisplayOrder'
    )
    BEGIN
        -- Add DisplayOrder column with default order based on QuestionID
        ALTER TABLE SurveyQuestions
        ADD DisplayOrder INT;
        
        -- Update DisplayOrder to match QuestionID (assuming QuestionID is the primary key)
        UPDATE SurveyQuestions
        SET DisplayOrder = QuestionID;
        
        -- Make DisplayOrder NOT NULL after setting initial values
        ALTER TABLE SurveyQuestions
        ALTER COLUMN DisplayOrder INT NOT NULL;
        
        PRINT 'Added DisplayOrder column to SurveyQuestions table';
    END

    -- Check if QuestionType column exists
    IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'SurveyQuestions' AND COLUMN_NAME = 'QuestionType'
    )
    BEGIN
        -- Add QuestionType column (text, select, number, etc.)
        ALTER TABLE SurveyQuestions
        ADD QuestionType NVARCHAR(50) NOT NULL DEFAULT 'text';
        
        PRINT 'Added QuestionType column to SurveyQuestions table';
    END

    -- Check if Options column exists (for select-type questions)
    IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'SurveyQuestions' AND COLUMN_NAME = 'Options'
    )
    BEGIN
        -- Add Options column for select-type questions (JSON string of options)
        ALTER TABLE SurveyQuestions
        ADD Options NVARCHAR(MAX) NULL;
        
        PRINT 'Added Options column to SurveyQuestions table';
    END

    -- Check if Category column exists
    IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'SurveyQuestions' AND COLUMN_NAME = 'Category'
    )
    BEGIN
        -- Add Category column
        ALTER TABLE SurveyQuestions
        ADD Category NVARCHAR(100) NULL;
        
        PRINT 'Added Category column to SurveyQuestions table';
    END

    -- Check if Answer column exists in UserSurveyAnswers
    IF EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'UserSurveyAnswers' AND COLUMN_NAME = 'Answer'
    )
    BEGIN
        -- Rename the existing Answer column to AnswerText
        EXEC sp_rename 'UserSurveyAnswers.Answer', 'AnswerText', 'COLUMN';
        
        PRINT 'Renamed Answer column to AnswerText in UserSurveyAnswers table';
    END

    -- Check if AnswerText column exists in UserSurveyAnswers
    IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'UserSurveyAnswers' AND COLUMN_NAME = 'AnswerText'
    )
    BEGIN
        -- Add AnswerText column if neither Answer nor AnswerText exists
        ALTER TABLE UserSurveyAnswers
        ADD AnswerText NVARCHAR(MAX) NULL;
        
        PRINT 'Added AnswerText column to UserSurveyAnswers table';
    END

    -- Check if UpdatedAt column exists in UserSurveyAnswers
    IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'UserSurveyAnswers' AND COLUMN_NAME = 'UpdatedAt'
    )
    BEGIN
        -- Add UpdatedAt column
        ALTER TABLE UserSurveyAnswers
        ADD UpdatedAt DATETIME NULL;
        
        -- Set initial values equal to SubmittedAt
        UPDATE UserSurveyAnswers
        SET UpdatedAt = SubmittedAt;
        
        PRINT 'Added UpdatedAt column to UserSurveyAnswers table';
    END
END

-- Insert questions if the table is empty
IF NOT EXISTS (SELECT TOP 1 * FROM SurveyQuestions)
BEGIN
    PRINT 'No questions found in SurveyQuestions table. Adding sample questions.';
    
    -- Insert 10 câu hỏi khảo sát
    INSERT INTO SurveyQuestions (QuestionText, QuestionType, DisplayOrder, IsActive, Category)
    VALUES 
    (N'Bạn đã hút thuốc trong bao lâu rồi?', 'text', 1, 1, 'background'),
    (N'Trung bình mỗi ngày bạn hút bao nhiêu điếu?', 'number', 2, 1, 'background'),
    (N'Khoảng thời gian và hoàn cảnh nào bạn thường hút nhất?', 'text', 3, 1, 'habit'),
    (N'Lý do chính bạn muốn cai thuốc là gì?', 'text', 4, 1, 'motivation'),
    (N'Bạn đã từng cố gắng cai thuốc trước đây không? Kết quả ra sao?', 'text', 5, 1, 'background'),
    (N'Bạn mong muốn nhận hỗ trợ gì nhất từ một nền tảng (thông báo, cộng đồng, huấn luyện viên…)?', 'text', 6, 1, 'preference'),
    (N'Bạn sẵn sàng chi trả bao nhiêu mỗi tháng để sử dụng dịch vụ hỗ trợ cai thuốc?', 'number', 7, 1, 'preference'),
    (N'Bạn ưu tiên sử dụng nền tảng trên thiết bị di động hay web?', 'select', 8, 1, 'preference'),
    (N'Các chỉ số nào bạn quan tâm nhất khi theo dõi tiến trình (ngày không hút, tiền tiết kiệm, sức khỏe…)?', 'text', 9, 1, 'preference'),
    (N'Bạn có thường chia sẻ tiến trình/câu chuyện của mình lên mạng xã hội không?', 'select', 10, 1, 'preference');

    -- Update options for select-type questions
    UPDATE SurveyQuestions
    SET Options = N'["Web trên máy tính", "Ứng dụng di động", "Cả hai"]'
    WHERE QuestionType = 'select' AND QuestionText LIKE N'%ưu tiên%';

    UPDATE SurveyQuestions
    SET Options = N'["Có", "Không", "Thỉnh thoảng"]'
    WHERE QuestionType = 'select' AND QuestionText LIKE N'%chia sẻ%';
    
    PRINT 'Added 10 sample questions to SurveyQuestions table';
END
ELSE
BEGIN
    -- Update the QuestionType for existing questions to make the form display correctly
    UPDATE SurveyQuestions
    SET QuestionType = CASE
        WHEN QuestionText LIKE N'%bao lâu%' THEN 'text' -- Smoking duration
        WHEN QuestionText LIKE N'%bao nhiêu điếu%' THEN 'number' -- Cigarettes per day
        WHEN QuestionText LIKE N'%thời gian%' OR QuestionText LIKE N'%hoàn cảnh%' THEN 'text' -- Smoking time
        WHEN QuestionText LIKE N'%lý do%' THEN 'text' -- Quit reason
        WHEN QuestionText LIKE N'%cố gắng cai%' THEN 'text' -- Previous attempts
        WHEN QuestionText LIKE N'%mong muốn%' OR QuestionText LIKE N'%hỗ trợ%' THEN 'text' -- Support needs
        WHEN QuestionText LIKE N'%chi trả%' OR QuestionText LIKE N'%bao nhiêu%' THEN 'number' -- Budget
        WHEN QuestionText LIKE N'%ưu tiên%' OR QuestionText LIKE N'%thiết bị%' THEN 'select' -- Platform preference
        WHEN QuestionText LIKE N'%chỉ số%' OR QuestionText LIKE N'%quan tâm%' THEN 'text' -- Important metrics
        WHEN QuestionText LIKE N'%chia sẻ%' OR QuestionText LIKE N'%mạng xã hội%' THEN 'select' -- Social sharing
        ELSE 'text' -- Default to text for any other questions
    END
    WHERE QuestionType = 'text';

    -- Add options for select-type questions if they don't have options yet
    UPDATE SurveyQuestions
    SET Options = N'["Web trên máy tính", "Ứng dụng di động", "Cả hai"]'
    WHERE QuestionType = 'select' AND QuestionText LIKE N'%ưu tiên%' AND (Options IS NULL OR Options = '');

    UPDATE SurveyQuestions
    SET Options = N'["Có", "Không", "Thỉnh thoảng"]'
    WHERE QuestionType = 'select' AND QuestionText LIKE N'%chia sẻ%' AND (Options IS NULL OR Options = '');
END

PRINT 'Schema update completed.'; 