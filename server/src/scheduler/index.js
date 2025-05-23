const cron = require('node-cron');
const membershipService = require('../services/membershipService');
const logger = require('../utils/logger');

/**
 * Initialize all scheduled jobs
 */
function initScheduledJobs() {
    // Schedule job to run at midnight every day (00:00)
    cron.schedule('0 0 * * *', async () => {
        logger.info('Running scheduled job: Update expired memberships');
        try {
            const updatedUsers = await membershipService.updateExpiredMemberships();
            logger.info(`Membership check completed. Updated ${updatedUsers.length} users.`);
        } catch (error) {
            logger.error('Error in scheduled membership job:', error);
        }
    });

    logger.info('Scheduled jobs initialized successfully');
}

module.exports = {
    initScheduledJobs
}; 