-- Create tables for smoking addiction survey results

-- Table to store calculated survey results
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SmokingAddictionSurveyResults' AND xtype='U')
BEGIN
    CREATE TABLE SmokingAddictionSurveyResults (
        ResultID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NOT NULL,
        MembershipID INT NOT NULL,
        FTNDScore DECIMAL(3,1) NOT NULL,
        CigarettesPerDay INT NOT NULL,
        PackYear DECIMAL(5,2) NOT NULL,
        AddictionLevel NVARCHAR(50) NOT NULL,
        AddictionSeverity NVARCHAR(100) NOT NULL,
        SuccessProbability INT NOT NULL,
        PriceRangeId NVARCHAR(20) NOT NULL,
        PackageName NVARCHAR(100) NOT NULL,
        PackagePrice DECIMAL(10,2) NOT NULL,
        PriceRange NVARCHAR(50) NOT NULL,
        DailySavings DECIMAL(10,2) NOT NULL,
        MonthlySavings DECIMAL(10,2) NOT NULL,
        YearlySavings DECIMAL(10,2) NOT NULL,
        Age INT NULL,
        YearsSmoked DECIMAL(4,1) NULL,
        Motivation NVARCHAR(200) NULL,
        SubmittedAt DATETIME DEFAULT GETDATE(),
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME NULL,
        FOREIGN KEY (UserID) REFERENCES Users(UserID),
        FOREIGN KEY (MembershipID) REFERENCES UserMemberships(MembershipID)
    );
    
    PRINT 'Created SmokingAddictionSurveyResults table';
END

-- Table to store raw survey answers for reference
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SmokingAddictionSurveyAnswers' AND xtype='U')
BEGIN
    CREATE TABLE SmokingAddictionSurveyAnswers (
        AnswerID INT IDENTITY(1,1) PRIMARY KEY,
        ResultID INT NOT NULL,
        QuestionKey NVARCHAR(100) NOT NULL,
        AnswerValue NVARCHAR(500) NOT NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (ResultID) REFERENCES SmokingAddictionSurveyResults(ResultID) ON DELETE CASCADE
    );
    
    PRINT 'Created SmokingAddictionSurveyAnswers table';
END

-- Create indexes for better performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SmokingAddictionSurveyResults_UserID')
CREATE INDEX IX_SmokingAddictionSurveyResults_UserID 
ON SmokingAddictionSurveyResults (UserID);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SmokingAddictionSurveyResults_SubmittedAt')
CREATE INDEX IX_SmokingAddictionSurveyResults_SubmittedAt 
ON SmokingAddictionSurveyResults (SubmittedAt);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SmokingAddictionSurveyAnswers_ResultID')
CREATE INDEX IX_SmokingAddictionSurveyAnswers_ResultID 
ON SmokingAddictionSurveyAnswers (ResultID);

PRINT '✅ Smoking addiction survey tables and indexes created successfully';