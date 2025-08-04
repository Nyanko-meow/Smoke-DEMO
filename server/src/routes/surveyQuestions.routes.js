const express = require('express');
const router = express.Router();
const { sql, pool } = require('../config/database');
const { protect } = require('../middleware/auth.middleware');

/**
 * @route   GET /api/survey-questions/test
 * @desc    Test endpoint to verify API connectivity
 * @access  Public
 */
router.get('/test', async (req, res) => {
    try {
        // Test database connection
        await pool.connect();
        
        res.json({
            message: 'Survey questions API is working',
            database: 'Connected',
            time: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in test endpoint:', error);
        res.status(500).json({ 
            message: 'Server error',
            error: error.message,
            database: 'Disconnected'
        });
    }
});

/**
 * @route   GET /api/survey-questions/public
 * @desc    Get all survey questions (public route)
 * @access  Public
 */
router.get('/public', async (req, res) => {
    try {
        console.log('Public survey questions endpoint called');

        // Check database connection first
        try {
            await pool.connect();
        } catch (connErr) {
            console.error('Database connection error:', connErr);
            return res.status(500).json({
                message: 'Database connection error',
                error: connErr.message
            });
        }

        // Execute the query with error handling
        try {
            const result = await pool.request()
                .query(`
                    SELECT * FROM SurveyQuestions 
                    ORDER BY QuestionID ASC
                `);

            console.log(`Found ${result.recordset.length} survey questions`);

            // Send the results back
            return res.json(result.recordset);
        } catch (queryErr) {
            console.error('Query execution error:', queryErr);
            return res.status(500).json({
                message: 'Error querying survey questions',
                error: queryErr.message,
                sqlState: queryErr.sqlState,
                code: queryErr.code
            });
        }
    } catch (error) {
        console.error('Unhandled error in public survey questions endpoint:', error);
        return res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/survey-questions
 * @desc    Get all active survey questions
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
    try {
        const result = await pool.request()
            .query(`
                SELECT * FROM SurveyQuestions 
                ORDER BY QuestionID ASC
            `);

        res.json(result.recordset);
    } catch (error) {
        console.error('Error getting survey questions:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   POST /api/survey-questions/submit-answers
 * @desc    Submit answers to survey questions (public route)
 * @access  Public
 */
router.post('/submit-answers', async (req, res) => {
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({ message: 'Please provide survey answers' });
    }

    try {
        console.log('Public submit answers endpoint called');
        console.log('Received answers:', answers);

        // Use a fixed default user ID for public submissions
        const defaultUserId = 2; // Using a known user ID from your database

        // Process each answer directly without transaction for simplicity
        for (const answer of answers) {
            const { questionId, answerText } = answer;

            if (!questionId || answerText === undefined) {
                continue;
            }

            console.log(`Processing answer for question ID: ${questionId}, answer: ${answerText}`);

            try {
                // Check if the user already answered this question
                const existingAnswer = await pool.request()
                    .input('userID', defaultUserId)
                    .input('questionID', questionId)
                    .query(`
                        SELECT AnswerID FROM UserSurveyAnswers
                        WHERE UserID = @userID AND QuestionID = @questionID
                    `);

                if (existingAnswer.recordset.length > 0) {
                    // Update existing answer
                    await pool.request()
                        .input('userID', defaultUserId)
                        .input('questionID', questionId)
                        .input('answerText', answerText)
                        .query(`
                            UPDATE UserSurveyAnswers
                            SET AnswerText = @answerText,
                                UpdatedAt = GETDATE()
                            WHERE UserID = @userID AND QuestionID = @questionID
                        `);
                    console.log(`Updated answer for question ID: ${questionId}`);
                } else {
                    // Insert new answer
                    await pool.request()
                        .input('userID', defaultUserId)
                        .input('questionID', questionId)
                        .input('answerText', answerText)
                        .query(`
                            INSERT INTO UserSurveyAnswers (UserID, QuestionID, AnswerText)
                            VALUES (@userID, @questionID, @answerText)
                        `);
                    console.log(`Inserted new answer for question ID: ${questionId}`);
                }
            } catch (answerError) {
                console.error(`Error processing answer for question ID ${questionId}:`, answerError);
                // Continue processing other answers even if one fails
            }
        }

        res.status(200).json({ message: 'Answers submitted successfully' });
    } catch (error) {
        console.error('Error submitting answers:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

/**
 * @route   POST /api/survey-questions/answers
 * @desc    Submit answers to survey questions
 * @access  Private
 */
router.post('/answers', protect, async (req, res) => {
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({ message: 'Please provide survey answers' });
    }

    try {
        console.log('Authenticated submit answers endpoint called for user:', req.user.id);
        console.log('Received answers:', answers);

        // Get user's active membership
        const membershipCheck = await pool.request()
            .input('userID', req.user.id)
            .query(`
                SELECT TOP 1 um.MembershipID, um.StartDate, um.EndDate
                FROM UserMemberships um
                WHERE um.UserID = @userID 
                AND um.Status = 'active'
                AND um.EndDate > GETDATE()
                ORDER BY um.StartDate DESC
            `);

        if (membershipCheck.recordset.length === 0) {
            return res.status(400).json({ 
                message: 'Bạn cần có gói membership active để thực hiện khảo sát.' 
            });
        }

        const activeMembership = membershipCheck.recordset[0];
        
        // Check if user has already completed survey for this membership
        const eligibilityCheck = await pool.request()
            .input('userID', req.user.id)
            .input('membershipID', activeMembership.MembershipID)
            .execute('sp_CheckSurveyEligibility');

        if (eligibilityCheck.recordset[0].CanTakeSurvey === 0) {
            return res.status(403).json({ 
                message: eligibilityCheck.recordset[0].Message
            });
        }

        // Calculate total score and addiction level
        let totalScore = 0;
        const answersWithScores = [];

        // Hardcoded nicotine addiction survey questions with scores
        const NICOTINE_SURVEY_QUESTIONS = [
            { QuestionID: 1, options: [
                { text: 'Trong 5 phút', score: 3 },
                { text: '6–30 phút', score: 2 },
                { text: '31–60 phút', score: 1 },
                { text: 'Sau 60 phút', score: 0 }
            ]},
            { QuestionID: 2, options: [
                { text: 'Điếu đầu tiên trong ngày', score: 1 },
                { text: 'Điếu khác', score: 0 }
            ]},
            { QuestionID: 3, options: [
                { text: '≤10', score: 0 },
                { text: '11–20', score: 1 },
                { text: '21–30', score: 2 },
                { text: '≥31', score: 3 }
            ]},
            { QuestionID: 4, options: [
                { text: 'Có', score: 1 },
                { text: 'Không', score: 0 }
            ]},
            { QuestionID: 5, options: [
                { text: 'Có', score: 1 },
                { text: 'Không', score: 0 }
            ]},
            { QuestionID: 6, options: [
                { text: 'Có', score: 1 },
                { text: 'Không', score: 0 }
            ]},
            { QuestionID: 7, options: [
                { text: 'Có', score: 1 },
                { text: 'Không', score: 0 }
            ]},
            { QuestionID: 8, options: [
                { text: 'Thường xuyên', score: 1 },
                { text: 'Thỉnh thoảng', score: 0.5 },
                { text: 'Không bao giờ', score: 0 }
            ]},
            { QuestionID: 9, options: [
                { text: 'Luôn luôn', score: 1 },
                { text: 'Đôi khi', score: 0.5 },
                { text: 'Không bao giờ', score: 0 }
            ]},
            { QuestionID: 10, options: [
                { text: 'Có', score: 1 },
                { text: 'Không', score: 0 }
            ]}
        ];

        // Calculate scores
        for (const answer of answers) {
            const { questionId, answerText } = answer;
            const question = NICOTINE_SURVEY_QUESTIONS.find(q => q.QuestionID === questionId);
            
            if (question) {
                const option = question.options.find(opt => opt.text === answerText);
                if (option) {
                    totalScore += option.score;
                    answersWithScores.push({
                        questionId,
                        answerText,
                        score: option.score
                    });
                }
            }
        }

        // Calculate addiction level
        let addictionLevel, addictionLevelDescription;
        if (totalScore >= 0 && totalScore <= 3) {
            addictionLevel = 'Lệ thuộc nhẹ (thấp)';
            addictionLevelDescription = 'Mức độ nghiện nicotine của bạn ở mức thấp. Bạn có thể dễ dàng bỏ thuốc với sự hỗ trợ phù hợp.';
        } else if (totalScore >= 3.5 && totalScore <= 6.5) {
            addictionLevel = 'Lệ thuộc trung bình';
            addictionLevelDescription = 'Mức độ nghiện nicotine của bạn ở mức trung bình. Bạn cần có kế hoạch bỏ thuốc chi tiết và kiên trì.';
        } else if (totalScore >= 7 && totalScore <= 9.5) {
            addictionLevel = 'Lệ thuộc cao';
            addictionLevelDescription = 'Mức độ nghiện nicotine của bạn khá cao. Bạn cần sự hỗ trợ chuyên môn và các phương pháp điều trị phù hợp.';
        } else {
            addictionLevel = 'Lệ thuộc rất cao (nghiện nặng)';
            addictionLevelDescription = 'Mức độ nghiện nicotine của bạn rất cao. Bạn cần được tư vấn và điều trị chuyên sâu để bỏ thuốc thành công.';
        }

        // Calculate additional information from survey answers
        const cigarettesPerDayAnswer = answersWithScores.find(a => a.questionId === 3)?.answerText;
        const firstCigaretteTime = answersWithScores.find(a => a.questionId === 1)?.answerText;
        
        console.log('🔍 Survey answers found:', {
            cigarettesPerDayAnswer,
            firstCigaretteTime,
            totalAnswers: answersWithScores.length
        });
        
        // Calculate cigarettes per day
        let cigarettesPerDay = 0;
        if (cigarettesPerDayAnswer === '≤10') cigarettesPerDay = 8;
        else if (cigarettesPerDayAnswer === '11–20') cigarettesPerDay = 15;
        else if (cigarettesPerDayAnswer === '21–30') cigarettesPerDay = 25;
        else if (cigarettesPerDayAnswer === '≥31') cigarettesPerDay = 35;
        
        // Estimate years smoked (could be enhanced with additional questions)
        const yearsSmoked = 5; // Default estimate
        
        // Calculate pack-year (20 cigarettes = 1 pack)
        const packYear = parseFloat(((cigarettesPerDay * yearsSmoked) / 20).toFixed(1));
        
        // Calculate success probability based on FTND score
        let successProbability = 50;
        if (totalScore <= 3) successProbability = 75;
        else if (totalScore <= 6) successProbability = 60;
        else if (totalScore <= 8) successProbability = 40;
        else successProbability = 25;
        
        // Calculate savings (assume 25,000 VND per pack)
        const packPrice = 25000;
        const packsPerDay = cigarettesPerDay / 20;
        const dailySavings = Math.round(packsPerDay * packPrice);
        const monthlySavings = dailySavings * 30;
        const yearlySavings = dailySavings * 365;
        
        // Package information
        const packageName = 'Thuốc lá bình dân';
        const priceRange = '20.000 - 30.000đ/gói';
        const age = 30; // Default age (could be enhanced)
        const motivation = 'Cải thiện sức khỏe'; // Default motivation

        console.log('💰 Calculated survey data:', {
            packYear,
            cigarettesPerDay,
            successProbability,
            dailySavings,
            monthlySavings,
            yearlySavings,
            packageName,
            packPrice,
            priceRange,
            age,
            yearsSmoked,
            motivation
        });
        
                        // ✅ CHỈ lưu vào NicotineSurveyResults + NicotineSurveyAnswers
        // ❌ KHÔNG lưu vào SmokingAddictionSurveyResults nữa
        
        // Save survey results using stored procedure với đầy đủ data
        const answersJson = JSON.stringify(answersWithScores);
        const saveResult = await pool.request()
            .input('UserID', req.user.id)
            .input('MembershipID', activeMembership.MembershipID)
            .input('TotalScore', totalScore)
            .input('AddictionLevel', addictionLevel)
            .input('AddictionLevelDescription', addictionLevelDescription)
            .input('Answers', answersJson)
            .input('PackYear', packYear)
            .input('CigarettesPerDay', cigarettesPerDay)
            .input('SuccessProbability', successProbability)
            .input('DailySavings', dailySavings)
            .input('MonthlySavings', monthlySavings)
            .input('YearlySavings', yearlySavings)
            .input('PackageName', packageName)
            .input('PackagePrice', packPrice)
            .input('PriceRange', priceRange)
            .input('Age', age)
            .input('YearsSmoked', yearsSmoked)
            .input('Motivation', motivation)
            .execute('sp_SaveNicotineSurvey');

        console.log('Survey saved successfully:', saveResult.recordset[0]);

        res.status(200).json({ 
            message: 'Khảo sát đã được hoàn thành thành công!',
            resultID: saveResult.recordset[0].ResultID,
            totalScore,
            addictionLevel,
            addictionLevelDescription
        });
    } catch (error) {
        console.error('Error submitting answers:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   GET /api/survey-questions/my-answers
 * @desc    Get current user's survey answers
 * @access  Private
 */
router.get('/my-answers', protect, async (req, res) => {
    try {
        // Get user's latest survey result
        const surveyResult = await pool.request()
            .input('userID', req.user.id)
            .execute('sp_GetUserLatestSurvey');

        if (surveyResult.recordset.length === 0) {
            return res.json([]);
        }

        const latestSurvey = surveyResult.recordset[0];
        
        // Get answers for this survey
        const answers = await pool.request()
            .input('resultID', latestSurvey.ResultID)
            .execute('sp_GetSurveyAnswers');

        // Format response to match frontend expectations
        const formattedAnswers = answers.recordset.map(answer => ({
            QuestionID: answer.QuestionID,
            AnswerText: answer.AnswerText,
            Score: answer.Score
        }));

        res.json(formattedAnswers);
    } catch (error) {
        console.error('Error getting user survey answers:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   GET /api/survey-questions/my-survey-details
 * @desc    Get current user's survey answers with questions (detailed view)
 * @access  Private
 */
router.get('/my-survey-details', protect, async (req, res) => {
    try {
        console.log('Getting detailed survey for user:', req.user.id);

        // Get user information
        const userResult = await pool.request()
            .input('userId', req.user.id)
            .query(`
                SELECT UserID, FirstName, LastName, Email, Role, CreatedAt
                FROM Users
                WHERE UserID = @userId
            `);

        if (userResult.recordset.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = userResult.recordset[0];

        // Get user's latest survey result
        const surveyResult = await pool.request()
            .input('userID', req.user.id)
            .execute('sp_GetUserLatestSurvey');

        if (surveyResult.recordset.length === 0) {
            return res.json({
                user: user,
                surveyResult: null,
                answers: []
            });
        }

        const latestSurvey = surveyResult.recordset[0];
        
        // Get answers for this survey
        const answers = await pool.request()
            .input('resultID', latestSurvey.ResultID)
            .execute('sp_GetSurveyAnswers');

        res.json({
            user: user,
            surveyResult: latestSurvey,
            answers: answers.recordset
        });
    } catch (error) {
        console.error('Error getting user survey details:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   GET /api/survey-questions/check-eligibility
 * @desc    Check if user can take survey (public version)
 * @access  Public
 */
router.get('/check-eligibility-public', async (req, res) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                canTakeSurvey: false,
                message: 'Token không hợp lệ hoặc thiếu. Vui lòng đăng nhập lại.' 
            });
        }

        const token = authHeader.split(' ')[1];
        
        // Verify token
        const jwt = require('jsonwebtoken');
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtError) {
            return res.status(401).json({ 
                canTakeSurvey: false,
                message: 'Token đã hết hạn. Vui lòng đăng nhập lại.' 
            });
        }

        const userID = decoded.id;

        // Get user's active membership
        const membershipCheck = await pool.request()
            .input('userID', userID)
            .query(`
                SELECT TOP 1 um.MembershipID, um.StartDate, um.EndDate, um.Status
                FROM UserMemberships um
                WHERE um.UserID = @userID 
                AND um.Status = 'active'
                AND um.EndDate > GETDATE()
                ORDER BY um.StartDate DESC
            `);

        if (membershipCheck.recordset.length === 0) {
            return res.status(400).json({ 
                canTakeSurvey: false,
                message: 'Bạn cần có gói membership active để thực hiện khảo sát.' 
            });
        }

        const activeMembership = membershipCheck.recordset[0];
        
        // Check if user has already completed survey for this membership
        const eligibilityCheck = await pool.request()
            .input('userID', userID)
            .input('membershipID', activeMembership.MembershipID)
            .execute('sp_CheckSurveyEligibility');

        const result = eligibilityCheck.recordset[0];
        
        res.json({
            canTakeSurvey: result.CanTakeSurvey === 1,
            message: result.Message,
            membership: activeMembership
        });
    } catch (error) {
        console.error('Error checking survey eligibility:', error);
        res.status(500).json({ 
            canTakeSurvey: false,
            message: 'Lỗi server khi kiểm tra eligibility.' 
        });
    }
});

/**
 * @route   GET /api/survey-questions/check-eligibility
 * @desc    Check if user can take survey
 * @access  Private
 */
router.get('/check-eligibility', protect, async (req, res) => {
    try {
        // Get user's active membership
        const membershipCheck = await pool.request()
            .input('userID', req.user.id)
            .query(`
                SELECT TOP 1 um.MembershipID, um.StartDate, um.EndDate, um.Status
                FROM UserMemberships um
                WHERE um.UserID = @userID 
                AND um.Status = 'active'
                AND um.EndDate > GETDATE()
                ORDER BY um.StartDate DESC
            `);

        if (membershipCheck.recordset.length === 0) {
            return res.status(400).json({ 
                canTakeSurvey: false,
                message: 'Bạn cần có gói membership active để thực hiện khảo sát.' 
            });
        }

        const activeMembership = membershipCheck.recordset[0];
        
        // Check if user has already completed survey for this membership
        const eligibilityCheck = await pool.request()
            .input('userID', req.user.id)
            .input('membershipID', activeMembership.MembershipID)
            .execute('sp_CheckSurveyEligibility');

        const result = eligibilityCheck.recordset[0];
        
        res.json({
            canTakeSurvey: result.CanTakeSurvey === 1,
            message: result.Message,
            membership: activeMembership
        });
    } catch (error) {
        console.error('Error checking survey eligibility:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   GET /api/survey-questions/latest-result
 * @desc    Get current user's latest survey result
 * @access  Private
 */
router.get('/latest-result', protect, async (req, res) => {
    try {
        const surveyResult = await pool.request()
            .input('userID', req.user.id)
            .execute('sp_GetUserLatestSurvey');

        if (surveyResult.recordset.length === 0) {
            return res.status(404).json({ message: 'No survey result found' });
        }

        const latestSurvey = surveyResult.recordset[0];
        
        // Get answers for this survey
        const answers = await pool.request()
            .input('resultID', latestSurvey.ResultID)
            .execute('sp_GetSurveyAnswers');

        res.json({
            surveyResult: latestSurvey,
            answers: answers.recordset
        });
    } catch (error) {
        console.error('Error getting latest survey result:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;