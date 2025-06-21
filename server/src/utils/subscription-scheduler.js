/**
 * Subscription Scheduler
 * 
 * This utility periodically checks for expired subscriptions and updates user roles
 * In a production environment, this would be better implemented using a cron job
 * or a dedicated service like node-cron or node-schedule.
 */

const cron = require('node-cron');
const sql = require('mssql');
const config = require('../config/db.config');
const logger = require('./logger');
const membershipService = require('../services/membershipService');

/**
 * Start the subscription scheduler
 */
const startScheduler = () => {
    logger.info('Starting subscription scheduler...');

    // Schedule to run every day at midnight (00:00)
    cron.schedule('0 0 * * *', async () => {
        logger.info('Running subscription check job...');

        try {
            // Check for expired memberships and update user roles
            const updatedUsers = await membershipService.updateExpiredMemberships();

            if (updatedUsers.length > 0) {
                logger.info(`Updated ${updatedUsers.length} users from member to guest due to expired memberships`);
                for (const user of updatedUsers) {
                    logger.info(`User ${user.Email} (ID: ${user.UserID}) was changed to guest role`);
                }
            } else {
                logger.info('No expired memberships found');
            }
        } catch (error) {
            logger.error('Error checking for expired memberships:', error);
        }
    });

    logger.info('Subscription scheduler started successfully');
};

module.exports = {
    startScheduler
}; 