const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { protect, authorize } = require('../middleware/auth.middleware');

/**
 * @route   DELETE /api/survey-reset/user/:userId
 * @desc    Delete all survey data for a specific user (admin only)
 * @access  Private/Admin
 */
router.delete('/user/:userId', protect, authorize('admin'), async (req, res) => {
    const transaction = new pool.Transaction();
    
    try {
        await transaction.begin();
        
        const { userId } = req.params;
        console.log(`🗑️ Admin ${req.user.UserID} deleting all survey data for user ${userId}`);
        
        // Delete UserSurveyAnswers
        await transaction.request()
            .input('UserID', userId)
            .query(`
                DELETE FROM UserSurveyAnswers 
                WHERE UserID = @UserID
            `);
        console.log('✅ Deleted UserSurveyAnswers');
        
        // Delete NicotineAddictionScores
        await transaction.request()
            .input('UserID', userId)
            .query(`
                DELETE FROM NicotineAddictionScores 
                WHERE UserID = @UserID
            `);
        console.log('✅ Deleted NicotineAddictionScores');
        
        // Delete NicotineSurveyResults and related answers
        await transaction.request()
            .input('UserID', userId)
            .query(`
                DELETE FROM NicotineSurveyAnswers 
                WHERE ResultID IN (
                    SELECT ResultID FROM NicotineSurveyResults 
                    WHERE UserID = @UserID
                );
                
                DELETE FROM NicotineSurveyResults 
                WHERE UserID = @UserID;
            `);
        console.log('✅ Deleted NicotineSurveyResults and answers');
        
        await transaction.commit();
        
        res.json({
            message: `Survey data deleted successfully for user ${userId}`,
            deletedBy: req.user.UserID,
            deletedAt: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error deleting survey data:', error);
        await transaction.rollback();
        res.status(500).json({
            message: 'Error deleting survey data',
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/survey-reset/my-data
 * @desc    Delete current user's survey data when membership expires/cancelled
 * @access  Private
 */
router.delete('/my-data', protect, async (req, res) => {
    const transaction = new pool.Transaction();
    
    try {
        await transaction.begin();
        
        const userId = req.user.UserID;
        console.log(`🗑️ User ${userId} resetting their own survey data`);
        
        // Check if user has active membership - if yes, don't allow deletion
        const membershipCheck = await pool.request()
            .input('UserID', userId)
            .query(`
                SELECT COUNT(*) as ActiveCount
                FROM UserMemberships 
                WHERE UserID = @UserID 
                AND Status = 'active' 
                AND EndDate > GETDATE()
            `);
            
        if (membershipCheck.recordset[0].ActiveCount > 0) {
            await transaction.rollback();
            return res.status(400).json({
                message: 'Không thể xóa dữ liệu khảo sát khi còn gói membership đang hoạt động'
            });
        }
        
        // Delete UserSurveyAnswers
        await transaction.request()
            .input('UserID', userId)
            .query(`
                DELETE FROM UserSurveyAnswers 
                WHERE UserID = @UserID
            `);
        console.log('✅ Deleted UserSurveyAnswers');
        
        // Delete NicotineAddictionScores
        await transaction.request()
            .input('UserID', userId)
            .query(`
                DELETE FROM NicotineAddictionScores 
                WHERE UserID = @UserID
            `);
        console.log('✅ Deleted NicotineAddictionScores');
        
        // Delete NicotineSurveyResults and related answers
        await transaction.request()
            .input('UserID', userId)
            .query(`
                DELETE FROM NicotineSurveyAnswers 
                WHERE ResultID IN (
                    SELECT ResultID FROM NicotineSurveyResults 
                    WHERE UserID = @UserID
                );
                
                DELETE FROM NicotineSurveyResults 
                WHERE UserID = @UserID;
            `);
        console.log('✅ Deleted NicotineSurveyResults and answers');
        
        await transaction.commit();
        
        res.json({
            message: 'Dữ liệu khảo sát đã được xóa thành công',
            userId: userId,
            deletedAt: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error deleting survey data:', error);
        await transaction.rollback();
        res.status(500).json({
            message: 'Lỗi khi xóa dữ liệu khảo sát',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/survey-reset/cleanup-expired
 * @desc    Cleanup survey data for expired memberships (cron job endpoint)
 * @access  Private/Admin
 */
router.post('/cleanup-expired', protect, authorize('admin'), async (req, res) => {
    const transaction = new pool.Transaction();
    
    try {
        await transaction.begin();
        
        console.log('🧹 Starting cleanup of expired membership survey data...');
        
        // Find users with expired memberships
        const expiredUsers = await transaction.request()
            .query(`
                SELECT DISTINCT u.UserID, u.FirstName, u.LastName, um.EndDate
                FROM Users u
                INNER JOIN UserMemberships um ON u.UserID = um.UserID
                WHERE um.Status IN ('expired', 'cancelled')
                AND um.EndDate < GETDATE()
                AND NOT EXISTS (
                    SELECT 1 FROM UserMemberships um2 
                    WHERE um2.UserID = u.UserID 
                    AND um2.Status = 'active' 
                    AND um2.EndDate > GETDATE()
                )
            `);
            
        console.log(`Found ${expiredUsers.recordset.length} users with expired memberships`);
        
        let deletedCount = 0;
        
        for (const user of expiredUsers.recordset) {
            console.log(`🗑️ Cleaning survey data for user ${user.UserID} (${user.FirstName} ${user.LastName})`);
            
            // Delete survey data for this user
            await transaction.request()
                .input('UserID', user.UserID)
                .query(`
                    DELETE FROM UserSurveyAnswers WHERE UserID = @UserID;
                    DELETE FROM NicotineAddictionScores WHERE UserID = @UserID;
                    DELETE FROM NicotineSurveyAnswers 
                    WHERE ResultID IN (
                        SELECT ResultID FROM NicotineSurveyResults 
                        WHERE UserID = @UserID
                    );
                    DELETE FROM NicotineSurveyResults WHERE UserID = @UserID;
                `);
                
            deletedCount++;
        }
        
        await transaction.commit();
        
        res.json({
            message: `Cleanup completed successfully`,
            usersProcessed: expiredUsers.recordset.length,
            surveyDataDeleted: deletedCount,
            cleanupBy: req.user.UserID,
            cleanupAt: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error during cleanup:', error);
        await transaction.rollback();
        res.status(500).json({
            message: 'Error during cleanup',
            error: error.message
        });
    }
});

module.exports = router;