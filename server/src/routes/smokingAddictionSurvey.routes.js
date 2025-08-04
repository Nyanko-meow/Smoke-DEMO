const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { protect } = require('../middleware/auth.middleware');

/**
 * @route   POST /api/smoking-addiction-survey
 * @desc    Save smoking addiction survey results
 * @access  Private
 */
// Function to ensure tables exist
const ensureTablesExist = async () => {
    try {
        // Check if tables exist
        const tableCheck = await pool.request().query(`
            SELECT COUNT(*) as TableCount
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME IN ('SmokingAddictionSurveyResults', 'SmokingAddictionSurveyAnswers')
        `);

        if (tableCheck.recordset[0].TableCount < 2) {
            console.log('📝 Creating missing smoking addiction survey tables...');
            
            // Create SmokingAddictionSurveyResults table
            await pool.request().query(`
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
                        YearsSmoked INT NULL,
                        Motivation NVARCHAR(200) NULL,
                        SubmittedAt DATETIME DEFAULT GETDATE(),
                        CreatedAt DATETIME DEFAULT GETDATE(),
                        UpdatedAt DATETIME NULL,
                        FOREIGN KEY (UserID) REFERENCES Users(UserID),
                        FOREIGN KEY (MembershipID) REFERENCES UserMemberships(MembershipID)
                    );
                END
            `);

            // Create SmokingAddictionSurveyAnswers table
            await pool.request().query(`
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
                END
            `);

            // Create indexes
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SmokingAddictionSurveyResults_UserID')
                CREATE INDEX IX_SmokingAddictionSurveyResults_UserID 
                ON SmokingAddictionSurveyResults (UserID);

                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SmokingAddictionSurveyResults_SubmittedAt')
                CREATE INDEX IX_SmokingAddictionSurveyResults_SubmittedAt 
                ON SmokingAddictionSurveyResults (SubmittedAt);

                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SmokingAddictionSurveyAnswers_ResultID')
                CREATE INDEX IX_SmokingAddictionSurveyAnswers_ResultID 
                ON SmokingAddictionSurveyAnswers (ResultID);
            `);

            console.log('✅ Smoking addiction survey tables created successfully');
        }
    } catch (error) {
        console.error('❌ Error ensuring tables exist:', error);
        throw error;
    }
};

router.post('/', protect, async (req, res) => {
    try {
        // Ensure tables exist before proceeding
        await ensureTablesExist();

        const {
            ftndScore,
            cigarettesPerDayCalculated,
            packYear,
            addictionLevel,
            addictionSeverity,
            successProbability,
            priceRangeId,
            packageName,
            packagePrice,
            priceRange,
            dailySavings,
            monthlySavings,
            yearlySavings,
            age,
            yearsSmoked,
            motivation,
            ...rawAnswers
        } = req.body;

        console.log('💾 Saving smoking addiction survey for user:', req.user.UserID);
        console.log('📊 Survey data received:', {
            ftndScore,
            cigarettesPerDayCalculated,
            packYear,
            addictionLevel,
            addictionSeverity,
            successProbability,
            priceRangeId,
            packageName,
            packagePrice,
            priceRange,
            age,
            yearsSmoked,
            motivation
        });

        // Validate required fields
        const validationErrors = [];
        
        if (!ftndScore && ftndScore !== 0) validationErrors.push('FTND Score is required');
        if (!cigarettesPerDayCalculated) validationErrors.push('Cigarettes per day is required');
        if (!packYear && packYear !== 0) validationErrors.push('Pack-year is required');
        if (!addictionLevel) validationErrors.push('Addiction level is required');
        if (!addictionSeverity) validationErrors.push('Addiction severity is required');
        if (!successProbability && successProbability !== 0) validationErrors.push('Success probability is required');
        if (!packageName) validationErrors.push('Package name is required');
        if (!packagePrice && packagePrice !== 0) validationErrors.push('Package price is required');
        if (!age) validationErrors.push('Age is required');
        if (!yearsSmoked && yearsSmoked !== 0) validationErrors.push('Years smoked is required');

        if (validationErrors.length > 0) {
            console.log('❌ Validation errors:', validationErrors);
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu khảo sát không đầy đủ',
                errors: validationErrors
            });
        }

        // Ensure correct data types
        const sanitizedData = {
            ftndScore: parseFloat(ftndScore) || 0,
            cigarettesPerDayCalculated: parseInt(cigarettesPerDayCalculated) || 0,
            packYear: parseFloat(packYear) || 0,
            addictionLevel: String(addictionLevel).trim(),
            addictionSeverity: String(addictionSeverity).trim(),
            successProbability: parseInt(successProbability) || 0,
            priceRangeId: String(priceRangeId || 'range2').trim(),
            packageName: String(packageName).trim(),
            packagePrice: parseFloat(packagePrice) || 0,
            priceRange: String(priceRange || 'N/A').trim(),
            dailySavings: parseFloat(dailySavings) || 0,
            monthlySavings: parseFloat(monthlySavings) || 0,
            yearlySavings: parseFloat(yearlySavings) || 0,
            age: parseInt(age) || 0,
            yearsSmoked: parseInt(Math.round(yearsSmoked)) || 0, // Convert to INT as requested
            motivation: String(motivation || 'Cải thiện sức khỏe').trim()
        };

        console.log('✅ Sanitized data:', sanitizedData);

        // Get user's active membership (including pending_cancellation)
        const membershipCheck = await pool.request()
            .input('userID', req.user.UserID)
            .query(`
                SELECT TOP 1 um.MembershipID
                FROM UserMemberships um
                WHERE um.UserID = @userID 
                AND um.Status IN ('active', 'pending_cancellation')
                AND um.EndDate > GETDATE()
                ORDER BY um.StartDate DESC
            `);

        if (membershipCheck.recordset.length === 0) {
            return res.status(400).json({ 
                message: 'Bạn cần có gói membership active để lưu khảo sát.' 
            });
        }

        const activeMembership = membershipCheck.recordset[0];

        const transaction = pool.transaction();
        await transaction.begin();

        try {
            // Insert smoking addiction survey results using sanitized data
            const surveyResult = await transaction.request()
                .input('UserID', req.user.UserID)
                .input('MembershipID', activeMembership.MembershipID)
                .input('FTNDScore', sanitizedData.ftndScore)
                .input('CigarettesPerDay', sanitizedData.cigarettesPerDayCalculated)
                .input('PackYear', sanitizedData.packYear)
                .input('AddictionLevel', sanitizedData.addictionLevel)
                .input('AddictionSeverity', sanitizedData.addictionSeverity)
                .input('SuccessProbability', sanitizedData.successProbability)
                .input('PriceRangeId', sanitizedData.priceRangeId)
                .input('PackageName', sanitizedData.packageName)
                .input('PackagePrice', sanitizedData.packagePrice)
                .input('PriceRange', sanitizedData.priceRange)
                .input('DailySavings', sanitizedData.dailySavings)
                .input('MonthlySavings', sanitizedData.monthlySavings)
                .input('YearlySavings', sanitizedData.yearlySavings)
                .input('Age', sanitizedData.age)
                .input('YearsSmoked', sanitizedData.yearsSmoked)
                .input('Motivation', sanitizedData.motivation)
                .query(`
                    INSERT INTO SmokingAddictionSurveyResults (
                        UserID, MembershipID, FTNDScore, CigarettesPerDay, PackYear,
                        AddictionLevel, AddictionSeverity, SuccessProbability,
                        PriceRangeId, PackageName, PackagePrice, PriceRange,
                        DailySavings, MonthlySavings, YearlySavings,
                        Age, YearsSmoked, Motivation, SubmittedAt
                    )
                    OUTPUT INSERTED.*
                    VALUES (
                        @UserID, @MembershipID, @FTNDScore, @CigarettesPerDay, @PackYear,
                        @AddictionLevel, @AddictionSeverity, @SuccessProbability,
                        @PriceRangeId, @PackageName, @PackagePrice, @PriceRange,
                        @DailySavings, @MonthlySavings, @YearlySavings,
                        @Age, @YearsSmoked, @Motivation, GETDATE()
                    )
                `);

            const resultId = surveyResult.recordset[0].ResultID;

            // Save raw answers for reference
            for (const [questionKey, answerValue] of Object.entries(rawAnswers)) {
                if (answerValue !== undefined && answerValue !== null) {
                    await transaction.request()
                        .input('ResultID', resultId)
                        .input('QuestionKey', questionKey)
                        .input('AnswerValue', String(answerValue))
                        .query(`
                            INSERT INTO SmokingAddictionSurveyAnswers (
                                ResultID, QuestionKey, AnswerValue
                            )
                            VALUES (@ResultID, @QuestionKey, @AnswerValue)
                        `);
                }
            }

            await transaction.commit();

            console.log('✅ Smoking addiction survey saved successfully with ID:', resultId);

            res.status(201).json({
                success: true,
                message: 'Khảo sát đã được lưu thành công',
                data: surveyResult.recordset[0]
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Error saving smoking addiction survey:', error);
        res.status(500).json({
            message: 'Lỗi khi lưu khảo sát',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/smoking-addiction-survey/questions
 * @desc    Get smoking addiction survey questions (compatible with MySurvey.jsx)
 * @access  Private
 */
router.get('/questions', protect, async (req, res) => {
    try {
        // Return hardcoded questions that match the Fagerström Test
        const questions = [
            {
                QuestionID: 1,
                QuestionText: "Sau khi thức dậy, bạn hút thuốc lá điếu đầu tiên trong bao lâu?",
                Category: "timing",
                QuestionType: "select",
                Options: JSON.stringify([
                    "≤5 phút",
                    "6–30 phút", 
                    "31–60 phút",
                    ">60 phút"
                ])
            },
            {
                QuestionID: 2,
                QuestionText: "Điếu thuốc nào trong ngày mà bạn cảm thấy khó từ bỏ nhất?",
                Category: "preference",
                QuestionType: "select",
                Options: JSON.stringify([
                    "Điếu đầu tiên trong ngày",
                    "Các điếu khác"
                ])
            },
            {
                QuestionID: 3,
                QuestionText: "Bạn hút bao nhiêu điếu thuốc mỗi ngày?",
                Category: "quantity",
                QuestionType: "number",
                Options: null
            },
            {
                QuestionID: 4,
                QuestionText: "Bạn có cảm thấy khó khăn khi phải kiềm chế không hút thuốc ở những nơi cấm hút không?",
                Category: "control",
                QuestionType: "select",
                Options: JSON.stringify([
                    "Có",
                    "Không"
                ])
            },
            {
                QuestionID: 5,
                QuestionText: "Bạn có hay hút thuốc thường xuyên hơn vào những giờ đầu sau khi thức dậy so với phần còn lại của ngày không?",
                Category: "timing",
                QuestionType: "select",
                Options: JSON.stringify([
                    "Có",
                    "Không"
                ])
            },
            {
                QuestionID: 6,
                QuestionText: "Bạn có hút thuốc ngay cả khi bị ốm nặng và phải nằm liệt giường hầu hết thời gian không?",
                Category: "dependency",
                QuestionType: "select",
                Options: JSON.stringify([
                    "Có",
                    "Không"
                ])
            },
            {
                QuestionID: 7,
                QuestionText: "Bạn có bao giờ hút thuốc để giảm căng thẳng không?",
                Category: "motivation",
                QuestionType: "select",
                Options: JSON.stringify([
                    "Không bao giờ",
                    "Đôi khi",
                    "Thường xuyên",
                    "Luôn luôn"
                ])
            },
            {
                QuestionID: 8,
                QuestionText: "Bạn có cảm thấy khó chịu khi không thể hút thuốc không?",
                Category: "withdrawal",
                QuestionType: "select",
                Options: JSON.stringify([
                    "Không",
                    "Đôi khi",
                    "Thường xuyên"
                ])
            },
            {
                QuestionID: 9,
                QuestionText: "Bạn có bao giờ hút thuốc khi đang làm việc hoặc học tập không?",
                Category: "social",
                QuestionType: "select",
                Options: JSON.stringify([
                    "Không",
                    "Đôi khi",
                    "Thường xuyên"
                ])
            },
            {
                QuestionID: 10,
                QuestionText: "Bạn có muốn bỏ thuốc lá không?",
                Category: "motivation",
                QuestionType: "select",
                Options: JSON.stringify([
                    "Không",
                    "Có"
                ])
            }
        ];

        res.json(questions);
    } catch (error) {
        console.error('Error getting smoking addiction survey questions:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   GET /api/smoking-addiction-survey/my-answers
 * @desc    Get user's smoking addiction survey answers (compatible with MySurvey.jsx)
 * @access  Private
 */
router.get('/my-answers', protect, async (req, res) => {
    try {
        console.log('📊 Getting user answers for user:', req.user.UserID);

        // Get user's latest survey result from SmokingAddictionSurveyResults
        const resultQuery = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
                SELECT TOP 1 ResultID
                FROM SmokingAddictionSurveyResults
                WHERE UserID = @UserID
                ORDER BY SubmittedAt DESC
            `);

        if (resultQuery.recordset.length === 0) {
            return res.json([]);
        }

        const resultID = resultQuery.recordset[0].ResultID;

        // Get answers from SmokingAddictionSurveyAnswers and convert format
        const answersQuery = await pool.request()
            .input('ResultID', resultID)
            .query(`
                SELECT 
                    QuestionKey,
                    AnswerValue
                FROM SmokingAddictionSurveyAnswers
                WHERE ResultID = @ResultID
                ORDER BY QuestionKey
            `);

        // Convert SmokingAddictionSurveyAnswers format to expected format
        const formattedAnswers = answersQuery.recordset
            .filter(answer => answer.QuestionKey.match(/^\d+$/)) // Only numeric question keys (1-10)
            .map(answer => ({
                QuestionID: parseInt(answer.QuestionKey),
                AnswerText: answer.AnswerValue,
                Score: 1.0 // Default score for compatibility
            }));

        res.json(formattedAnswers);
    } catch (error) {
        console.error('Error getting user smoking addiction survey answers:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   GET /api/smoking-addiction-survey/my-survey-details
 * @desc    Get user's survey details (compatible with MySurveyResults.jsx)
 * @access  Private
 */
router.get('/my-survey-details', protect, async (req, res) => {
    try {
        console.log('📊 Getting detailed survey for user:', req.user.UserID);

        // Get user information
        const userResult = await pool.request()
            .input('userId', req.user.UserID)
            .query(`
                SELECT UserID, FirstName, LastName, Email, Role, CreatedAt
                FROM Users
                WHERE UserID = @userId
            `);

        if (userResult.recordset.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = userResult.recordset[0];

        // Get user's latest survey result from SmokingAddictionSurveyResults
        const resultQuery = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
                SELECT TOP 1 *
                FROM SmokingAddictionSurveyResults
                WHERE UserID = @UserID
                ORDER BY SubmittedAt DESC
            `);

        if (resultQuery.recordset.length === 0) {
            return res.json({
                user: user,
                surveyResult: null,
                answers: []
            });
        }

        const surveyResult = resultQuery.recordset[0];

        // Get answers from SmokingAddictionSurveyAnswers with question text
        const answersQuery = await pool.request()
            .input('ResultID', surveyResult.ResultID)
            .query(`
                SELECT 
                    sasa.QuestionKey,
                    sasa.AnswerValue,
                    sasa.CreatedAt as SubmittedAt
                FROM SmokingAddictionSurveyAnswers sasa
                WHERE sasa.ResultID = @ResultID
                ORDER BY sasa.QuestionKey
            `);

        // Convert format to match expected structure
        const formattedAnswers = answersQuery.recordset
            .filter(answer => answer.QuestionKey.match(/^\d+$/)) // Only numeric question keys (1-10)
            .map(answer => {
                const questionId = parseInt(answer.QuestionKey);
                const questionTexts = {
                    1: 'Sau khi thức dậy, bạn hút thuốc lá điếu đầu tiên trong bao lâu?',
                    2: 'Điếu thuốc nào trong ngày mà bạn cảm thấy khó từ bỏ nhất?',
                    3: 'Bạn hút bao nhiêu điếu thuốc mỗi ngày?',
                    4: 'Bạn có cảm thấy khó khăn khi phải kiềm chế không hút thuốc ở những nơi cấm hút không?',
                    5: 'Bạn có hay hút thuốc thường xuyên hơn vào những giờ đầu sau khi thức dậy so với phần còn lại của ngày không?',
                    6: 'Bạn có hút thuốc ngay cả khi bị ốm nặng và phải nằm liệt giường hầu hết thời gian không?',
                    7: 'Bạn có bao giờ hút thuốc để giảm căng thẳng không?',
                    8: 'Bạn có cảm thấy khó chịu khi không thể hút thuốc không?',
                    9: 'Bạn có bao giờ hút thuốc khi đang làm việc hoặc học tập không?',
                    10: 'Bạn có muốn bỏ thuốc lá không?'
                };

                return {
                    QuestionID: questionId,
                    AnswerText: answer.AnswerValue,
                    Score: 1.0, // Default score
                    SubmittedAt: answer.SubmittedAt,
                    QuestionText: questionTexts[questionId] || 'Câu hỏi không xác định'
                };
            });

        res.json({
            user: user,
            surveyResult: surveyResult,
            answers: formattedAnswers
        });
    } catch (error) {
        console.error('Error getting user survey details:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   POST /api/smoking-addiction-survey/answers
 * @desc    Update existing survey answers (for MySurvey.jsx component)
 * @access  Private
 */
router.post('/answers', protect, async (req, res) => {
    try {
        const { answers } = req.body;
        console.log('📝 Updating survey answers for user:', req.user.UserID);

        if (!answers || !Array.isArray(answers)) {
            return res.status(400).json({ message: 'Invalid answers format' });
        }

        // Get user's latest survey result from SmokingAddictionSurveyResults
        const resultQuery = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
                SELECT TOP 1 ResultID
                FROM SmokingAddictionSurveyResults
                WHERE UserID = @UserID
                ORDER BY SubmittedAt DESC
            `);

        if (resultQuery.recordset.length === 0) {
            return res.status(404).json({ 
                message: 'Không tìm thấy khảo sát. Vui lòng làm khảo sát đầy đủ trước.' 
            });
        }

        const resultID = resultQuery.recordset[0].ResultID;

        // Delete existing answers
        await pool.request()
            .input('ResultID', resultID)
            .query(`
                DELETE FROM SmokingAddictionSurveyAnswers 
                WHERE ResultID = @ResultID AND QuestionKey IN ('1','2','3','4','5','6','7','8','9','10')
            `);

        // Insert updated answers
        for (const answer of answers) {
            if (answer.answerText && answer.answerText.trim()) {
                await pool.request()
                    .input('ResultID', resultID)
                    .input('QuestionKey', answer.questionId.toString())
                    .input('AnswerValue', answer.answerText)
                    .query(`
                        INSERT INTO SmokingAddictionSurveyAnswers (ResultID, QuestionKey, AnswerValue)
                        VALUES (@ResultID, @QuestionKey, @AnswerValue)
                    `);
            }
        }

        // Update the survey result's UpdatedAt timestamp
        await pool.request()
            .input('ResultID', resultID)
            .query(`
                UPDATE SmokingAddictionSurveyResults 
                SET UpdatedAt = GETDATE()
                WHERE ResultID = @ResultID
            `);

        res.json({
            success: true,
            message: 'Survey answers updated successfully',
            resultID: resultID
        });

    } catch (error) {
        console.error('Error updating survey answers:', error);
        res.status(500).json({ 
            message: 'Error updating survey answers',
            error: error.message 
        });
    }
});

/**
 * @route   GET /api/smoking-addiction-survey/my-results
 * @desc    Get user's latest smoking addiction survey results
 * @access  Private
 */
router.get('/my-results', protect, async (req, res) => {
    try {
        console.log('📊 Getting smoking addiction survey results for user:', req.user.UserID);

        // Query from SmokingAddictionSurveyResults
        const resultQuery = await pool.request()
            .input('UserID', req.user.UserID)
            .query(`
                SELECT TOP 1
                    sasr.ResultID,
                    sasr.UserID,  
                    sasr.MembershipID,
                    sasr.FTNDScore,
                    sasr.CigarettesPerDay,
                    sasr.PackYear,
                    sasr.AddictionLevel,
                    sasr.AddictionSeverity,
                    sasr.SuccessProbability,
                    sasr.PriceRangeId,
                    sasr.PackageName,
                    sasr.PackagePrice,
                    sasr.PriceRange,
                    sasr.DailySavings,
                    sasr.MonthlySavings,
                    sasr.YearlySavings,
                    sasr.Age,
                    sasr.YearsSmoked,
                    sasr.Motivation,
                    sasr.SubmittedAt
                FROM SmokingAddictionSurveyResults sasr
                WHERE sasr.UserID = @UserID
                ORDER BY sasr.SubmittedAt DESC
            `);

        console.log('🔍 Query result count:', resultQuery.recordset.length);
        if (resultQuery.recordset.length > 0) {
            console.log('📊 Found survey data:', {
                ResultID: resultQuery.recordset[0].ResultID,
                PackYear: resultQuery.recordset[0].PackYear,
                MonthlySavings: resultQuery.recordset[0].MonthlySavings,
                SuccessProbability: resultQuery.recordset[0].SuccessProbability
            });
        }

        if (resultQuery.recordset.length === 0) {
            return res.status(404).json({
                message: 'Không tìm thấy kết quả khảo sát'
            });
        }

        const surveyResult = resultQuery.recordset[0];

        // Get answers from SmokingAddictionSurveyAnswers
        const answersQuery = await pool.request()
            .input('ResultID', surveyResult.ResultID)
            .query(`
                SELECT 
                    QuestionKey,
                    AnswerValue
                FROM SmokingAddictionSurveyAnswers
                WHERE ResultID = @ResultID
            `);

        const rawAnswers = {};
        answersQuery.recordset.forEach(answer => {
            rawAnswers[answer.QuestionKey] = answer.AnswerValue;
        });

        res.json({
            success: true,
            data: {
                ...surveyResult,
                rawAnswers
            }
        });

    } catch (error) {
        console.error('Error getting smoking addiction survey results:', error);
        res.status(500).json({
            message: 'Lỗi khi lấy kết quả khảo sát',
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/smoking-addiction-survey/reset-all-for-testing
 * @desc    Reset ALL survey data for testing purposes (development only)
 * @access  Public (for testing only)
 */
router.delete('/reset-all-for-testing', async (req, res) => {
    try {
        console.log('🧪 Resetting ALL survey data for testing - Public endpoint');
        
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            // Delete ALL survey data
            await transaction.request()
                .query(`
                    DELETE FROM SmokingAddictionSurveyAnswers;
                    DELETE FROM SmokingAddictionSurveyResults;
                    DELETE FROM UserSurveyAnswers;
                `);

            await transaction.commit();

            console.log('✅ ALL survey data reset successfully for testing');

            res.json({
                success: true,
                message: 'ALL survey data reset successfully for testing',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Error resetting ALL survey data:', error);
        res.status(500).json({
            message: 'Error resetting ALL survey data',
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/smoking-addiction-survey/reset-for-testing
 * @desc    Reset current user survey data for testing purposes (development only)
 * @access  Private
 */
router.delete('/reset-for-testing', protect, async (req, res) => {
    try {
        console.log('🧪 Resetting survey data for testing - User:', req.user.UserID);
        
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            // Delete user's survey data
            await transaction.request()
                .input('UserID', req.user.UserID)
                .query(`
                    DELETE FROM SmokingAddictionSurveyAnswers 
                    WHERE ResultID IN (
                        SELECT ResultID FROM SmokingAddictionSurveyResults 
                        WHERE UserID = @UserID
                    );
                    
                    DELETE FROM SmokingAddictionSurveyResults 
                    WHERE UserID = @UserID;
                    
                    DELETE FROM UserSurveyAnswers 
                    WHERE UserID = @UserID;
                `);

            await transaction.commit();

            console.log('✅ Survey data reset successfully for testing');

            res.json({
                success: true,
                message: 'Survey data reset successfully for testing',
                userId: req.user.UserID
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Error resetting survey data:', error);
        res.status(500).json({
            message: 'Error resetting survey data',
            error: error.message
        });
    }
});

module.exports = router;