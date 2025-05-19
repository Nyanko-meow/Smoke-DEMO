const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');
const { connectDB } = require('./config/database');
const { startScheduler } = require('./utils/subscription-scheduler');

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
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

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
            userSurvey: '/api/user-survey'
            // Add other endpoints as needed
        }
    });
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