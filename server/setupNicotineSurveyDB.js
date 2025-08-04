const { sql, pool } = require('./src/config/database');

async function addSurveyColumns() {
    try {
        console.log('🔧 Adding new columns to NicotineSurveyResults table...');
        
        // Connect to database
        await pool.connect();
        console.log('✅ Connected to database');

        // Check and add new columns
        const columnsToAdd = [
            { name: 'PackYear', type: 'DECIMAL(5,2)' },
            { name: 'CigarettesPerDay', type: 'INT' },
            { name: 'SuccessProbability', type: 'INT' },
            { name: 'DailySavings', type: 'DECIMAL(10,2)' },
            { name: 'MonthlySavings', type: 'DECIMAL(10,2)' },
            { name: 'YearlySavings', type: 'DECIMAL(10,2)' },
            { name: 'PackageName', type: 'NVARCHAR(100)' },
            { name: 'PackagePrice', type: 'DECIMAL(10,2)' },
            { name: 'PriceRange', type: 'NVARCHAR(50)' },
            { name: 'Age', type: 'INT' },
            { name: 'YearsSmoked', type: 'INT' },
            { name: 'Motivation', type: 'NVARCHAR(200)' }
        ];

        for (const column of columnsToAdd) {
            // Check if column exists
            const columnExists = await pool.request()
                .input('columnName', column.name)
                .query(`
                    SELECT COUNT(*) as count 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = 'NicotineSurveyResults' 
                    AND COLUMN_NAME = @columnName
                `);

            if (columnExists.recordset[0].count === 0) {
                console.log(`📝 Adding column ${column.name}...`);
                await pool.request().query(`
                    ALTER TABLE NicotineSurveyResults 
                    ADD ${column.name} ${column.type} NULL
                `);
                console.log(`✅ Added ${column.name}`);
            } else {
                console.log(`⏭️ Column ${column.name} already exists`);
            }
        }

        // Update stored procedure to handle new columns
        console.log('🔄 Updating stored procedure sp_SaveNicotineSurvey...');
        
        await pool.request().query(`
            IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_SaveNicotineSurvey')
                DROP PROCEDURE sp_SaveNicotineSurvey
        `);

        await pool.request().query(`
            CREATE PROCEDURE sp_SaveNicotineSurvey
                @UserID INT,
                @MembershipID INT,
                @TotalScore DECIMAL(4,1),
                @AddictionLevel NVARCHAR(100),
                @AddictionLevelDescription NVARCHAR(500),
                @Answers NVARCHAR(MAX), -- JSON string of answers
                @PackYear DECIMAL(5,2) = NULL,
                @CigarettesPerDay INT = NULL,
                @SuccessProbability INT = NULL,
                @DailySavings DECIMAL(10,2) = NULL,
                @MonthlySavings DECIMAL(10,2) = NULL,
                @YearlySavings DECIMAL(10,2) = NULL,
                @PackageName NVARCHAR(100) = NULL,
                @PackagePrice DECIMAL(10,2) = NULL,
                @PriceRange NVARCHAR(50) = NULL,
                @Age INT = NULL,
                @YearsSmoked INT = NULL,
                @Motivation NVARCHAR(200) = NULL
            AS
            BEGIN
                SET NOCOUNT ON;
                
                BEGIN TRANSACTION;
                
                BEGIN TRY
                    -- Insert survey result with all fields
                    INSERT INTO NicotineSurveyResults (
                        UserID, MembershipID, TotalScore, AddictionLevel, AddictionLevelDescription,
                        PackYear, CigarettesPerDay, SuccessProbability,
                        DailySavings, MonthlySavings, YearlySavings,
                        PackageName, PackagePrice, PriceRange,
                        Age, YearsSmoked, Motivation
                    )
                    VALUES (
                        @UserID, @MembershipID, @TotalScore, @AddictionLevel, @AddictionLevelDescription,
                        @PackYear, @CigarettesPerDay, @SuccessProbability,
                        @DailySavings, @MonthlySavings, @YearlySavings,
                        @PackageName, @PackagePrice, @PriceRange,
                        @Age, @YearsSmoked, @Motivation
                    );
                    
                    DECLARE @ResultID INT = SCOPE_IDENTITY();
                    
                    -- Parse and insert answers
                    INSERT INTO NicotineSurveyAnswers (ResultID, QuestionID, AnswerText, Score)
                    SELECT 
                        @ResultID,
                        CAST(JSON_VALUE(Answer.value, '$.questionId') AS INT),
                        JSON_VALUE(Answer.value, '$.answerText'),
                        CAST(JSON_VALUE(Answer.value, '$.score') AS DECIMAL(3,1))
                    FROM OPENJSON(@Answers) AS Answer;
                    
                    -- Also save to NicotineAddictionScores table for compatibility
                    INSERT INTO NicotineAddictionScores (UserID, MembershipID, TotalScore, AddictionLevel)
                    VALUES (@UserID, @MembershipID, @TotalScore, @AddictionLevel);
                    
                    COMMIT TRANSACTION;
                    
                    SELECT @ResultID as ResultID, 'Survey saved successfully' as Message;
                END TRY
                BEGIN CATCH
                    ROLLBACK TRANSACTION;
                    THROW;
                END CATCH
            END
        `);
        console.log('✅ Updated sp_SaveNicotineSurvey procedure');

        console.log('🎉 Successfully added all new columns and updated stored procedure!');
        
    } catch (error) {
        console.error('❌ Error adding columns:', error);
        throw error;
    }
}

// Run the function
addSurveyColumns()
    .then(() => {
        console.log('✅ Setup completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    }); 