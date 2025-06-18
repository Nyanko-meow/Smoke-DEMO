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

// Auto setup function
async function autoSetup() {
    try {
        console.log('🚀 Starting auto setup...');

        // Import setup functions
        const { setupPlanTemplates } = require('../setup-templates');

        // 1. Setup PlanTemplates
        await setupPlanTemplates();

        // 2. Setup test user with PaymentConfirmation
        await setupTestUser();

        console.log('✅ Auto setup completed successfully!');
    } catch (error) {
        console.error('❌ Auto setup failed:', error);
    }
}

// Setup test user function
async function setupTestUser() {
    try {
        console.log('👤 Setting up test user...');

        const testEmail = 'leghenkiz@gmail.com';
        const testPassword = 'H12345678@';

        // Check if user exists
        const userCheck = await pool.request()
            .input('email', testEmail)
            .query('SELECT UserID FROM Users WHERE Email = @email');

        let userId;
        if (userCheck.recordset.length === 0) {
            // Create user
            const userResult = await pool.request()
                .input('email', testEmail)
                .input('password', testPassword)
                .input('firstName', 'Test')
                .input('lastName', 'User')
                .query(`
                    INSERT INTO Users (Email, Password, FirstName, LastName, Role, IsActive, EmailVerified, CreatedAt, UpdatedAt)
                    OUTPUT INSERTED.UserID
                    VALUES (@email, @password, @firstName, @lastName, 'guest', 1, 1, GETDATE(), GETDATE())
                `);
            userId = userResult.recordset[0].UserID;
            console.log('✅ Created test user:', testEmail);
        } else {
            userId = userCheck.recordset[0].UserID;
            console.log('✅ Test user already exists:', testEmail);
        }

        // Check if payment confirmation exists
        const paymentCheck = await pool.request()
            .input('userId', userId)
            .query(`
                SELECT pc.ConfirmationID 
                FROM PaymentConfirmations pc
                JOIN Payments p ON pc.PaymentID = p.PaymentID
                WHERE p.UserID = @userId AND p.Status = 'confirmed'
            `);

        if (paymentCheck.recordset.length === 0) {
            // Create payment and confirmation
            const planId = 1; // Basic Plan
            const amount = 99.00;
            const startDate = new Date();
            const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

            // Insert payment
            const paymentResult = await pool.request()
                .input('userId', userId)
                .input('planId', planId)
                .input('amount', amount)
                .input('startDate', startDate)
                .input('endDate', endDate)
                .query(`
                    INSERT INTO Payments (UserID, PlanID, Amount, PaymentMethod, Status, TransactionID, StartDate, EndDate, Note)
                    OUTPUT INSERTED.PaymentID
                    VALUES (@userId, @planId, @amount, 'BankTransfer', 'confirmed', 'TEST_TX_' + CAST(@userId AS VARCHAR), @startDate, @endDate, N'Auto setup payment')
                `);

            const paymentId = paymentResult.recordset[0].PaymentID;

            // Insert payment confirmation
            await pool.request()
                .input('paymentId', paymentId)
                .input('confirmedBy', 3) // Admin user
                .query(`
                    INSERT INTO PaymentConfirmations (PaymentID, ConfirmationDate, ConfirmedByUserID, ConfirmationCode, Notes)
                    VALUES (@paymentId, GETDATE(), @confirmedBy, 'AUTO_CONF_' + CAST(@paymentId AS VARCHAR), N'Auto confirmation for test user')
                `);

            console.log('✅ Created payment confirmation for test user');
        } else {
            console.log('✅ Payment confirmation already exists for test user');
        }

        return userId;
    } catch (error) {
        console.error('❌ Error setting up test user:', error);
        throw error;
    }
}

// Create Express app
const app = express();

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: false
}));

// Configure CORS to allow frontend origins
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', '*'], // Allow frontend and all origins
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // Add PATCH method
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    preflightContinue: false,
    optionsSuccessStatus: 200
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Disable caching for all API routes to ensure fresh responses
app.use('/api', (req, res, next) => {
    res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Last-Modified': new Date().toUTCString()
    });
    next();
});

// Handle preflight requests for all routes
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.sendStatus(200);
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Add image serving route
app.use('/api/images', express.static(path.join(__dirname, '../public/images')));
app.use('/api/static', express.static(path.join(__dirname, '../public')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Root route for API health check
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Smoking Cessation API Server is running',
        version: '1.0.0'
    });
});

// Test endpoint for frontend connection testing
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running and accessible',
        timestamp: new Date().toISOString(),
        port: process.env.PORT || 4000
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

// Direct endpoint for testing login (get token)
app.post('/api/test-login', async (req, res) => {
    try {
        console.log('Test login endpoint called');
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find user
        const userResult = await pool.request()
            .input('email', email)
            .query('SELECT UserID, Email, FirstName, LastName, Role, Password FROM Users WHERE Email = @email');

        if (userResult.recordset.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = userResult.recordset[0];

        // Simple password check (in real app, use bcrypt)
        if (user.Password !== password) {
            return res.status(401).json({
                success: false,
                message: 'Invalid password'
            });
        }

        // Generate token
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            {
                id: user.UserID,
                email: user.Email,
                role: user.Role
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Allow cross-origin for this response
        res.header('Access-Control-Allow-Origin', '*');
        res.json({
            success: true,
            token: token,
            user: {
                id: user.UserID,
                email: user.Email,
                firstName: user.FirstName,
                lastName: user.LastName,
                role: user.Role
            },
            message: 'Login successful - Use this token for Authorization header'
        });
    } catch (error) {
        console.error('Error in test login endpoint:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Debug endpoint for testing PlanTemplates
app.get('/api/test-templates', async (req, res) => {
    try {
        console.log('Testing PlanTemplates table...');

        // Check if table exists
        const tableCheck = await pool.request().query(`
            SELECT COUNT(*) as tableExists 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'PlanTemplates'
        `);

        console.log('Table exists check:', tableCheck.recordset[0]);

        if (tableCheck.recordset[0].tableExists === 0) {
            return res.status(404).json({
                success: false,
                message: 'PlanTemplates table does not exist',
                solution: 'Run setup-plan-templates.sql script first'
            });
        }

        // Get all templates
        const templates = await pool.request().query(`
            SELECT 
                pt.TemplateID,
                pt.PlanID,
                pt.PhaseName,
                pt.PhaseDescription,
                pt.DurationDays,
                pt.SortOrder,
                mp.Name as PlanName
            FROM PlanTemplates pt
            JOIN MembershipPlans mp ON pt.PlanID = mp.PlanID
            ORDER BY pt.PlanID, pt.SortOrder
        `);

        res.header('Access-Control-Allow-Origin', '*');
        res.json({
            success: true,
            tableExists: true,
            templatesCount: templates.recordset.length,
            templates: templates.recordset,
            message: 'PlanTemplates test completed successfully'
        });
    } catch (error) {
        console.error('Error testing PlanTemplates:', error);
        res.status(500).json({
            success: false,
            message: 'Error testing PlanTemplates',
            error: error.message
        });
    }
});

// NEW: Debug endpoint to check both PlanTemplates and QuitPlans with DetailedPlan
app.get('/api/debug-plans', async (req, res) => {
    try {
        console.log('🔍 Debug: Checking both PlanTemplates and QuitPlans data...');

        // 1. Check PlanTemplates table
        const templatesCheck = await pool.request().query(`
            SELECT COUNT(*) as count FROM PlanTemplates
        `);

        const templatesData = await pool.request().query(`
            SELECT 
                pt.TemplateID,
                pt.PlanID,
                pt.PhaseName,
                pt.PhaseDescription,
                pt.DurationDays,
                pt.SortOrder,
                mp.Name as PlanName
            FROM PlanTemplates pt
            JOIN MembershipPlans mp ON pt.PlanID = mp.PlanID
            ORDER BY pt.PlanID, pt.SortOrder
        `);

        // 2. Check QuitPlans with DetailedPlan
        const quitPlansCheck = await pool.request().query(`
            SELECT COUNT(*) as count FROM QuitPlans WHERE DetailedPlan IS NOT NULL AND DetailedPlan != ''
        `);

        const quitPlansData = await pool.request().query(`
            SELECT 
                qp.PlanID,
                qp.UserID,
                qp.Reason,
                qp.MotivationLevel,
                CASE 
                    WHEN qp.DetailedPlan IS NULL THEN 'NULL'
                    WHEN qp.DetailedPlan = '' THEN 'EMPTY STRING'
                    WHEN LEN(qp.DetailedPlan) > 100 THEN LEFT(qp.DetailedPlan, 100) + '...'
                    ELSE qp.DetailedPlan
                END as DetailedPlanPreview,
                LEN(qp.DetailedPlan) as DetailedPlanLength,
                qp.Status,
                qp.CreatedAt,
                u.FirstName + ' ' + u.LastName as UserName
            FROM QuitPlans qp
            JOIN Users u ON qp.UserID = u.UserID
            ORDER BY qp.CreatedAt DESC
        `);

        // 3. Check MembershipPlans
        const membershipPlans = await pool.request().query(`
            SELECT PlanID, Name, Description, Price FROM MembershipPlans ORDER BY PlanID
        `);

        res.header('Access-Control-Allow-Origin', '*');
        res.json({
            success: true,
            data: {
                planTemplates: {
                    count: templatesCheck.recordset[0].count,
                    data: templatesData.recordset,
                    groupedByPlan: templatesData.recordset.reduce((acc, item) => {
                        if (!acc[item.PlanName]) acc[item.PlanName] = [];
                        acc[item.PlanName].push(item.PhaseName);
                        return acc;
                    }, {})
                },
                quitPlans: {
                    totalCount: quitPlansData.recordset.length,
                    withDetailedPlanCount: quitPlansCheck.recordset[0].count,
                    data: quitPlansData.recordset
                },
                membershipPlans: {
                    count: membershipPlans.recordset.length,
                    data: membershipPlans.recordset
                }
            },
            message: 'Debug information retrieved successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error in debug endpoint:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving debug information',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Debug endpoint để lấy users có PaymentConfirmations và QuitPlans
app.get('/api/test-user-data', async (req, res) => {
    try {
        console.log('📊 Getting users with PaymentConfirmations and QuitPlans...');

        // 1. Lấy users có PaymentConfirmations
        const usersWithPayments = await pool.request().query(`
            SELECT DISTINCT
                u.UserID,
                u.Email,
                u.FirstName + ' ' + u.LastName as FullName,
                u.Role,
                p.PaymentID,
                p.Amount,
                p.Status as PaymentStatus,
                pc.ConfirmationID,
                pc.ConfirmationDate,
                pc.ConfirmationCode,
                mp.Name as PlanName,
                mp.Price,
                mp.Duration
            FROM Users u
            JOIN Payments p ON u.UserID = p.UserID
            JOIN PaymentConfirmations pc ON p.PaymentID = pc.PaymentID
            JOIN MembershipPlans mp ON p.PlanID = mp.PlanID
            WHERE p.Status = 'confirmed'
            ORDER BY pc.ConfirmationDate DESC
        `);

        // 2. Lấy QuitPlans cho các users này
        const quitPlans = await pool.request().query(`
            SELECT 
                qp.PlanID as QuitPlanID,
                qp.UserID,
                qp.StartDate,
                qp.TargetDate,
                qp.Reason,
                qp.MotivationLevel,
                qp.DetailedPlan,
                qp.Status,
                qp.CreatedAt,
                u.Email,
                u.FirstName + ' ' + u.LastName as UserName
            FROM QuitPlans qp
            JOIN Users u ON qp.UserID = u.UserID
            ORDER BY qp.CreatedAt DESC
        `);

        // 3. Lấy PlanTemplates
        const templates = await pool.request().query(`
            SELECT 
                pt.TemplateID,
                pt.PlanID,
                pt.PhaseName,
                pt.PhaseDescription,
                pt.DurationDays,
                pt.SortOrder,
                mp.Name as PlanName
            FROM PlanTemplates pt
            JOIN MembershipPlans mp ON pt.PlanID = mp.PlanID
            ORDER BY pt.PlanID, pt.SortOrder
        `);

        res.header('Access-Control-Allow-Origin', '*');
        res.json({
            success: true,
            data: {
                usersWithPaymentConfirmations: usersWithPayments.recordset,
                quitPlans: quitPlans.recordset,
                planTemplates: templates.recordset
            },
            summary: {
                usersWithPayments: usersWithPayments.recordset.length,
                totalQuitPlans: quitPlans.recordset.length,
                totalTemplates: templates.recordset.length
            },
            message: 'Lấy dữ liệu user, payment confirmations và quit plans thành công'
        });
    } catch (error) {
        console.error('❌ Error getting user data:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy dữ liệu user',
            error: error.message
        });
    }
});

// Debug endpoint to test assigned coach logic without auth
app.get('/api/debug/assigned-coach/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        console.log('🔍 Debug assigned coach for userId:', userId);

        // 1. Check if user exists and role
        const userCheck = await pool.request()
            .input('UserID', userId)
            .query(`
                SELECT UserID, Email, FirstName, LastName, Role, IsActive 
                FROM Users 
                WHERE UserID = @UserID
            `);

        console.log('👤 User info:', userCheck.recordset[0]);

        // 2. Check all QuitPlans for this user
        const allPlans = await pool.request()
            .input('UserID', userId)
            .query(`
                SELECT 
                    qp.PlanID,
                    qp.UserID,
                    qp.CoachID,
                    qp.Status,
                    qp.StartDate,
                    qp.CreatedAt,
                    c.Email as CoachEmail,
                    c.FirstName as CoachFirstName,
                    c.LastName as CoachLastName,
                    c.IsActive as CoachIsActive,
                    c.Role as CoachRole
                FROM QuitPlans qp
                LEFT JOIN Users c ON qp.CoachID = c.UserID
                WHERE qp.UserID = @UserID
                ORDER BY qp.CreatedAt DESC
            `);

        console.log('📋 All QuitPlans:', allPlans.recordset);

        // 3. Test the exact query used in assigned-coach API
        const result = await pool.request()
            .input('UserID', userId)
            .query(`
                SELECT 
                    c.UserID as CoachID,
                    c.Email as CoachEmail,
                    c.FirstName as CoachFirstName,
                    c.LastName as CoachLastName,
                    c.Avatar as CoachAvatar,
                    c.PhoneNumber as CoachPhoneNumber,
                    cp.Bio,
                    cp.Specialization,
                    cp.Experience,
                    cp.HourlyRate,
                    cp.IsAvailable,
                    cp.YearsOfExperience,
                    cp.Education,
                    cp.Certifications,
                    cp.Languages,
                    cp.WorkingHours,
                    cp.ConsultationTypes,
                    qp.PlanID as QuitPlanID,
                    qp.StartDate as AssignmentDate,
                    qp.Status as QuitPlanStatus,
                    (SELECT AVG(CAST(Rating AS FLOAT)) FROM CoachFeedback WHERE CoachID = c.UserID AND Status = 'active') as AverageRating,
                    (SELECT COUNT(*) FROM CoachFeedback WHERE CoachID = c.UserID AND Status = 'active') as ReviewCount
                FROM QuitPlans qp
                INNER JOIN Users c ON qp.CoachID = c.UserID
                LEFT JOIN CoachProfiles cp ON c.UserID = cp.UserID
                WHERE qp.UserID = @UserID 
                    AND qp.Status = 'active'
                    AND qp.CoachID IS NOT NULL
                    AND c.Role = 'coach'
                    AND c.IsActive = 1
            `);

        console.log('📊 Assigned coach query result:', result.recordset);

        res.json({
            success: true,
            userId: userId,
            userInfo: userCheck.recordset[0] || null,
            allQuitPlans: allPlans.recordset,
            assignedCoachQuery: result.recordset,
            resultCount: result.recordset.length,
            message: result.recordset.length > 0 ? 'Found assigned coach' : 'No assigned coach found'
        });

    } catch (error) {
        console.error('❌ Debug error:', error);
        res.status(500).json({
            success: false,
            message: 'Debug error',
            error: error.message
        });
    }
});

// Test endpoint to check all QuitPlans for a user
app.get('/api/debug/quitplans/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        console.log('🔍 Debug all quit plans for userId:', userId);

        const result = await pool.request()
            .input('UserID', userId)
            .query(`
                SELECT 
                    qp.PlanID,
                    qp.UserID,
                    qp.CoachID,
                    qp.Status,
                    qp.StartDate,
                    qp.CreatedAt,
                    u.Email as UserEmail,
                    c.Email as CoachEmail,
                    c.FirstName as CoachFirstName,
                    c.LastName as CoachLastName,
                    c.IsActive as CoachIsActive
                FROM QuitPlans qp
                LEFT JOIN Users u ON qp.UserID = u.UserID
                LEFT JOIN Users c ON qp.CoachID = c.UserID
                WHERE qp.UserID = @UserID
                ORDER BY qp.CreatedAt DESC
            `);

        res.json({
            success: true,
            userId: userId,
            resultCount: result.recordset.length,
            data: result.recordset,
            message: `Found ${result.recordset.length} quit plans`
        });

    } catch (error) {
        console.error('❌ Debug error:', error);
        res.status(500).json({
            success: false,
            message: 'Debug error',
            error: error.message
        });
    }
});

// Debug endpoint to find Tran Huy user
app.get('/api/debug/find-user/:searchTerm', async (req, res) => {
    try {
        const { searchTerm } = req.params;
        console.log('🔍 Searching for user:', searchTerm);

        const result = await pool.request()
            .input('SearchTerm', `%${searchTerm}%`)
            .query(`
                SELECT 
                    UserID,
                    Email,
                    FirstName,
                    LastName,
                    Role,
                    IsActive,
                    CreatedAt
                FROM Users 
                WHERE FirstName LIKE @SearchTerm 
                   OR LastName LIKE @SearchTerm 
                   OR Email LIKE @SearchTerm
                ORDER BY CreatedAt DESC
            `);

        res.json({
            success: true,
            searchTerm: searchTerm,
            resultCount: result.recordset.length,
            users: result.recordset,
            message: `Found ${result.recordset.length} users matching "${searchTerm}"`
        });

    } catch (error) {
        console.error('❌ Search error:', error);
        res.status(500).json({
            success: false,
            message: 'Search error',
            error: error.message
        });
    }
});

// Debug endpoint to check all assignments
app.get('/api/debug/all-assignments', async (req, res) => {
    try {
        console.log('🔍 Getting all coach assignments...');

        const result = await pool.request().query(`
            SELECT 
                qp.PlanID,
                qp.UserID,
                qp.CoachID,
                qp.Status,
                qp.StartDate,
                qp.CreatedAt,
                u.Email as MemberEmail,
                u.FirstName as MemberFirstName,
                u.LastName as MemberLastName,
                c.Email as CoachEmail,
                c.FirstName as CoachFirstName,
                c.LastName as CoachLastName,
                c.IsActive as CoachIsActive
            FROM QuitPlans qp
            INNER JOIN Users u ON qp.UserID = u.UserID
            LEFT JOIN Users c ON qp.CoachID = c.UserID
            WHERE qp.Status = 'active' AND qp.CoachID IS NOT NULL
            ORDER BY qp.CreatedAt DESC
        `);

        res.json({
            success: true,
            resultCount: result.recordset.length,
            assignments: result.recordset,
            message: `Found ${result.recordset.length} active coach assignments`
        });

    } catch (error) {
        console.error('❌ Debug error:', error);
        res.status(500).json({
            success: false,
            message: 'Debug error',
            error: error.message
        });
    }
});

// Debug endpoint to decode token
app.post('/api/debug/decode-token', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token is required'
            });
        }

        const jwt = require('jsonwebtoken');

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('🔍 Decoded token:', decoded);

            // Get user from database
            const userResult = await pool.request()
                .input('UserID', decoded.id)
                .query(`
                    SELECT UserID, Email, FirstName, LastName, Role, IsActive
                    FROM Users 
                    WHERE UserID = @UserID
                `);

            res.json({
                success: true,
                tokenValid: true,
                decoded: decoded,
                userFromDB: userResult.recordset[0] || null,
                message: 'Token decoded successfully'
            });

        } catch (jwtError) {
            console.log('❌ JWT Error:', jwtError.message);
            res.json({
                success: false,
                tokenValid: false,
                error: jwtError.message,
                message: 'Invalid token'
            });
        }

    } catch (error) {
        console.error('❌ Debug token error:', error);
        res.status(500).json({
            success: false,
            message: 'Debug error',
            error: error.message
        });
    }
});

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/user', require('./routes/user.routes'));
app.use('/api/plans', require('./routes/plan.routes'));
app.use('/api/progress', require('./routes/progress.routes'));
app.use('/api/achievements', require('./routes/achievement.routes'));
app.use('/api/coaches', require('./routes/coach.routes'));
app.use('/api/coach', require('./routes/coach.routes')); // Alias for frontend compatibility
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/payments', require('./routes/payment.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/survey', require('./routes/survey.routes'));
app.use('/api/blog', require('./routes/blog.routes'));
app.use('/api/community', require('./routes/community.routes'));
app.use('/api/subscriptions', require('./routes/subscription.routes'));
app.use('/api/smoking-status', require('./routes/smokingStatus.routes'));
app.use('/api/user-survey', require('./routes/userSurvey.routes'));
app.use('/api/membership', require('./routes/membership.routes'));
app.use('/api/memberships', require('./routes/membership.routes')); // Add alias for client compatibility
app.use('/api/survey-questions', require('./routes/surveyQuestions.routes'));
app.use('/api/quit-plan', require('./routes/quitPlan.routes'));
app.use('/api/chat', require('./routes/chat.routes')); // Chat routes with file attachment
app.use('/api/upload', require('./routes/upload.routes')); // File upload routes
app.use('/api/images', require('./routes/imageRoutes')); // Image serving routes

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

        // Auto setup after server starts (with delay for database connection)
        setTimeout(async () => {
            try {
                await autoSetup();
            } catch (error) {
                console.error('Auto setup error:', error);
            }
        }, 3000); // Wait 3 seconds for database to be ready

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