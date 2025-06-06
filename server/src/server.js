const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import routes
const membershipRoutes = require('./routes/membershipRoutes');
const smokingStatusRoutes = require('./routes/smokingStatus.routes');
const userSurveyRoutes = require('./routes/userSurvey.routes');
const imageRoutes = require('./routes/imageRoutes');

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Serve static files for images
app.use('/api/images', express.static(path.join(__dirname, 'public/images')));

// API Routes
app.use('/api/membership', membershipRoutes);
app.use('/api/smoking-status', smokingStatusRoutes);
app.use('/api/user-survey', userSurveyRoutes);
app.use('/api/images', imageRoutes);

// Serve static assets if in production
if (process.env.NODE_ENV === 'production') {
    // Set static folder
    app.use(express.static(path.join(__dirname, '../../client/build')));

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../../client/build', 'index.html'));
    });
}

// Export the configured app
module.exports = app; 