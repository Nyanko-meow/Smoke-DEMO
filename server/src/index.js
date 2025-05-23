const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');
const { connectDB, pool } = require('./config/database');
const { startScheduler } = require('./utils/subscription-scheduler');
const { testDatabaseConnection, testSurveyQuestionsTable } = require('./runSchemaUpdate');

// Load environment variables
dotenv.config();

// Set default environment variables if not provided
process.env.JWT_SECRET = process.env.JWT_SECRET || 'smokeking_secret_key_ultra_secure_2024';
process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || '24h';
process.env.JWT_COOKIE_EXPIRE = process.env.JWT_COOKIE_EXPIRE || '30';

// Connect to database
connectDB();

// Create Express app
const app = express();

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: false
}));

// Configure CORS to allow all origins
app.use(cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Handle missing placeholder image
app.get('/images/default-placeholder.jpg', (req, res) => {
    // Return 204 No Content instead of 404 to prevent console errors
    res.status(204).send();
});

// Root route for API health check
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Smoking Cessation API Server is running',
        version: '1.0.0'
    });
});

app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to the Smoking Cessation API',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            subscriptions: '/api/subscriptions',
            payments: '/api/payments',
            smokingStatus: '/api/smoking-status',
            userSurvey: '/api/user-survey',
            surveyQuestions: '/api/survey-questions',
            surveyQuestionsPublic: '/api/survey-questions/public',
            surveyTest: '/api/survey-test',
            questions: '/api/questions' // Direct endpoint for debugging
        }
    });
});

// Direct endpoint for questions (no nested routes)
app.get('/api/questions', async (req, res) => {
    try {
        console.log('Direct questions endpoint called');

        const result = await pool.request()
            .query(`
                SELECT * FROM SurveyQuestions 
                ORDER BY QuestionID ASC
            `);

        console.log(`Found ${result.recordset.length} survey questions`);

        // Allow cross-origin for this response
        res.header('Access-Control-Allow-Origin', '*');
        res.json(result.recordset);
    } catch (error) {
        console.error('Error getting questions:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

// Direct endpoint for submitting answers (no nested routes, no auth)
app.post('/api/submit-answers', async (req, res) => {
    try {
        console.log('Direct submit answers endpoint called');
        const { answers } = req.body;

        if (!answers || !Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({ message: 'Please provide survey answers' });
        }

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
                            SET Answer = @answerText,
                                SubmittedAt = GETDATE()
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
                            INSERT INTO UserSurveyAnswers (UserID, QuestionID, Answer, SubmittedAt)
                            VALUES (@userID, @questionID, @answerText, GETDATE())
                        `);
                    console.log(`Inserted new answer for question ID: ${questionId}`);
                }
            } catch (answerError) {
                console.error(`Error processing answer for question ID ${questionId}:`, answerError);
                // Continue processing other answers even if one fails
            }
        }

        // Allow cross-origin for this response
        res.header('Access-Control-Allow-Origin', '*');
        res.status(200).json({ message: 'Answers submitted successfully' });
    } catch (error) {
        console.error('Error in direct submit answers endpoint:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
});

// Debug endpoint to test database and survey questions
app.get('/api/survey-test', async (req, res) => {
    try {
        console.log('Testing survey API and database connection');

        // Test database connection
        const dbConnection = await testDatabaseConnection();

        // Test survey questions table
        const questions = await testSurveyQuestionsTable();

        res.json({
            success: true,
            dbConnection,
            questionsCount: questions ? questions.length : 0,
            questions: questions || [],
            message: 'Survey test endpoint'
        });
    } catch (error) {
        console.error('Error in survey test endpoint:', error);
        res.status(500).json({
            success: false,
            message: 'Error testing survey API',
            error: error.message
        });
    }
});

// Direct endpoint for membership plans (no auth required)
app.get('/api/membership/plans', async (req, res) => {
    try {
        console.log('Direct membership plans endpoint called');

        const result = await pool.request().query(`
            SELECT * FROM MembershipPlans
            ORDER BY Price ASC
        `);

        console.log(`Found ${result.recordset.length} membership plans`);

        // Allow cross-origin for this response
        res.header('Access-Control-Allow-Origin', '*');
        res.json({
            success: true,
            data: result.recordset,
            message: 'Đã lấy được dữ liệu từ SQL thành công'
        });
    } catch (error) {
        console.error('Error getting membership plans:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving membership plans',
            error: error.message
        });
    }
});

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/plans', require('./routes/plan.routes'));
app.use('/api/progress', require('./routes/progress.routes'));
app.use('/api/achievements', require('./routes/achievement.routes'));
app.use('/api/coaches', require('./routes/coach.routes'));
app.use('/api/payments', require('./routes/payment.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/survey', require('./routes/survey.routes'));
app.use('/api/blog', require('./routes/blog.routes'));
app.use('/api/community', require('./routes/community.routes'));
app.use('/api/subscriptions', require('./routes/subscription.routes'));
app.use('/api/smoking-status', require('./routes/smokingStatus.routes'));
app.use('/api/user-survey', require('./routes/userSurvey.routes'));
app.use('/api/membership', require('./routes/membershipRoutes'));
app.use('/api/memberships', require('./routes/membershipRoutes')); // Add alias for client compatibility
app.use('/api/survey-questions', require('./routes/surveyQuestions.routes'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const PORT = process.env.PORT || 4000;
try {
    const server = app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`JWT Secret is ${process.env.JWT_SECRET ? 'set' : 'not set'}`);

        // Start subscription scheduler with a delay to ensure database is fully connected
        if (process.env.ENABLE_SUBSCRIPTION_CHECKER !== 'false') {
            try {
                // Start the subscription scheduler in a try-catch to prevent it from stopping the server
                setTimeout(() => {
                    try {
                        startScheduler();
                    } catch (error) {
                        console.error('Error starting subscription scheduler:', error);
                    }
                }, 10000); // Wait 10 seconds before starting the scheduler
            } catch (error) {
                console.error('Error setting up subscription scheduler:', error);
            }
        }
    });

    // Handle server errors
    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.error(`Port ${PORT} is already in use. Please try using a different port.`);
            console.log(`You can specify a different port by setting the PORT environment variable:`);
            console.log(`PORT=4001 npm start`);
            process.exit(1);
        } else {
            console.error('Server error:', error);
        }
    });
} catch (error) {
    console.error('Error starting server:', error);
} 