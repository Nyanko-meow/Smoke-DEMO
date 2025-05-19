/**
 * Subscription Scheduler
 * 
 * This utility periodically checks for expired subscriptions and updates user roles
 * In a production environment, this would be better implemented using a cron job
 * or a dedicated service like node-cron or node-schedule.
 */

const { pool, sql } = require('../config/database');

// Check for expired subscriptions and update user roles
const checkExpiredSubscriptions = async () => {
    try {
        console.log('Checking for expired subscriptions...');

        // Ensure we have an active connection by creating a new request
        // This is important as the connection might be closed between checks
        await pool.connect();

        const result = await pool.request()
            .query(`
                -- Find expired memberships
                DECLARE @ExpiredMemberships TABLE (
                    UserID INT,
                    MembershipID INT
                );
                
                -- Insert expired memberships into temp table
                INSERT INTO @ExpiredMemberships (UserID, MembershipID)
                SELECT 
                    um.UserID,
                    um.MembershipID
                FROM UserMemberships um
                WHERE um.Status = 'active'
                AND um.EndDate < GETDATE();
                
                -- Update expired memberships
                UPDATE um
                SET Status = 'expired'
                FROM UserMemberships um
                JOIN @ExpiredMemberships e ON um.MembershipID = e.MembershipID;
                
                -- Get users affected
                SELECT 
                    e.UserID,
                    e.MembershipID,
                    u.Email
                FROM @ExpiredMemberships e
                JOIN Users u ON e.UserID = u.UserID;
                
                -- Update user roles for users with no active memberships
                UPDATE u
                SET Role = 'guest'
                FROM Users u
                WHERE u.Role = 'member'
                AND NOT EXISTS (
                    SELECT 1 FROM UserMemberships um
                    WHERE um.UserID = u.UserID
                    AND um.Status = 'active'
                    AND um.EndDate > GETDATE()
                );
            `);

        const expiredUsers = result.recordset || [];

        // Send notifications to users with expired subscriptions
        for (const user of expiredUsers) {
            try {
                await pool.request()
                    .input('UserID', user.UserID)
                    .input('Title', 'Subscription Expired')
                    .input('Message', 'Your subscription has expired. Please renew to continue enjoying member benefits.')
                    .input('Type', 'subscription')
                    .query(`
                        INSERT INTO Notifications (UserID, Title, Message, Type)
                        VALUES (@UserID, @Title, @Message, @Type)
                    `);
            } catch (notifError) {
                console.error(`Error sending notification to user ${user.UserID}:`, notifError);
            }
        }

        console.log(`Processed ${expiredUsers.length} expired subscriptions`);
        return expiredUsers.length;
    } catch (error) {
        console.error('Error checking expired subscriptions:', error);
        return 0;
    }
};

// Schedule the check to run daily at midnight
const startScheduler = () => {
    const CHECK_INTERVAL = process.env.SUBSCRIPTION_CHECK_INTERVAL || 24 * 60 * 60 * 1000; // Default: once per day

    console.log(`Starting subscription expiration checker (interval: ${CHECK_INTERVAL / 1000 / 60 / 60} hours)`);

    // Wait for database connection to be established before checking
    setTimeout(() => {
        // Run once after a short delay to let the server fully start
        checkExpiredSubscriptions();

        // Set up recurring check
        setInterval(checkExpiredSubscriptions, CHECK_INTERVAL);
    }, 5000); // Wait 5 seconds before first check
};

module.exports = {
    startScheduler,
    checkExpiredSubscriptions
}; 