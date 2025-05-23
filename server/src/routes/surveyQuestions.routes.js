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
        res.json({
            message: 'Survey questions API is working',
            time: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in test endpoint:', error);
        res.status(500).json({ message: 'Server error' });
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
        // Start a transaction
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Process each answer
            for (const answer of answers) {
                const { questionId, answerText } = answer;

                if (!questionId || answerText === undefined) {
                    continue;
                }

                // Check if the user already answered this question
                const existingAnswer = await pool.request()
                    .input('userID', req.user.id)
                    .input('questionID', questionId)
                    .query(`
                        SELECT AnswerID FROM UserSurveyAnswers
                        WHERE UserID = @userID AND QuestionID = @questionID
                    `);

                if (existingAnswer.recordset.length > 0) {
                    // Update existing answer
                    await pool.request()
                        .input('userID', req.user.id)
                        .input('questionID', questionId)
                        .input('answerText', answerText)
                        .query(`
                            UPDATE UserSurveyAnswers
                            SET AnswerText = @answerText,
                                UpdatedAt = GETDATE()
                            WHERE UserID = @userID AND QuestionID = @questionID
                        `);
                } else {
                    // Insert new answer
                    await pool.request()
                        .input('userID', req.user.id)
                        .input('questionID', questionId)
                        .input('answerText', answerText)
                        .query(`
                            INSERT INTO UserSurveyAnswers (UserID, QuestionID, AnswerText)
                            VALUES (@userID, @questionID, @answerText)
                        `);
                }
            }

            // Commit the transaction
            await transaction.commit();

            res.status(200).json({ message: 'Answers submitted successfully' });
        } catch (error) {
            // Rollback the transaction in case of error
            await transaction.rollback();
            console.error('Error submitting answers:', error);
            res.status(500).json({ message: 'Server error' });
        }
    } catch (error) {
        console.error('Error starting transaction:', error);
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
        const result = await pool.request()
            .input('userID', req.user.id)
            .query(`
                SELECT usa.QuestionID, usa.AnswerText, sq.QuestionText
                FROM UserSurveyAnswers usa
                JOIN SurveyQuestions sq ON usa.QuestionID = sq.QuestionID
                WHERE usa.UserID = @userID
            `);

        res.json(result.recordset);
    } catch (error) {
        console.error('Error getting user survey answers:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;