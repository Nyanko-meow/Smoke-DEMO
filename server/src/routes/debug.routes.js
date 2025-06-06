const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');

// Debug endpoint to test authorization
router.get('/test-member-auth', protect, authorize('member', 'guest'), (req, res) => {
    console.log('🧪 Debug test-member-auth endpoint hit');
    console.log('   req.user:', req.user);
    console.log('   req.user.Role:', req.user?.Role);

    res.json({
        success: true,
        message: 'Member authorization works!',
        user: {
            id: req.user.UserID,
            email: req.user.Email,
            role: req.user.Role
        },
        timestamp: new Date().toISOString()
    });
});

// Debug endpoint to test coach authorization
router.get('/test-coach-auth', protect, authorize('coach'), (req, res) => {
    console.log('🧪 Debug test-coach-auth endpoint hit');
    console.log('   req.user:', req.user);
    console.log('   req.user.Role:', req.user?.Role);

    res.json({
        success: true,
        message: 'Coach authorization works!',
        user: {
            id: req.user.UserID,
            email: req.user.Email,
            role: req.user.Role
        },
        timestamp: new Date().toISOString()
    });
});

// Debug endpoint to check user info without authorization
router.get('/test-auth-only', protect, (req, res) => {
    console.log('🧪 Debug test-auth-only endpoint hit');
    console.log('   req.user:', req.user);
    console.log('   req.user.Role:', req.user?.Role);

    res.json({
        success: true,
        message: 'Authentication works!',
        user: {
            id: req.user.UserID,
            email: req.user.Email,
            role: req.user.Role
        },
        timestamp: new Date().toISOString()
    });
});

module.exports = router; 