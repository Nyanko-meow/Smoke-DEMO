const sql = require('mssql');
const config = require('../config/db.config');
const logger = require('../utils/logger');

/**
 * Service to handle membership-related operations
 */
class MembershipService {
    /**
     * Check for expired memberships and update user roles
     * This should be scheduled to run daily
     */
    async updateExpiredMemberships() {
        try {
            const pool = await sql.connect(config);

            // First: Find expired memberships where users are still members
            const expiredResult = await pool.request()
                .query(`
          UPDATE Users 
          SET Role = 'guest', UpdatedAt = GETDATE()
          OUTPUT INSERTED.UserID, INSERTED.Email, 'expired' as Reason
          FROM Users u
          INNER JOIN (
            SELECT p.UserID
            FROM Payments p
            INNER JOIN Users u ON p.UserID = u.UserID
            WHERE p.EndDate < GETDATE()
            AND u.Role = 'member'
            AND NOT EXISTS (
              SELECT 1 FROM Payments 
              WHERE UserID = p.UserID 
              AND EndDate >= GETDATE()
              AND Status = 'confirmed'
            )
          ) as ExpiredUsers ON u.UserID = ExpiredUsers.UserID
        `);

            // Second: Find users who have no active memberships but are not guests
            const noMembershipResult = await pool.request()
                .query(`
          UPDATE Users 
          SET Role = 'guest', UpdatedAt = GETDATE()
          OUTPUT INSERTED.UserID, INSERTED.Email, 'no_active_membership' as Reason
          FROM Users u
          WHERE u.Role != 'guest'
          AND u.Role != 'admin' -- Don't demote admins
          AND NOT EXISTS (
            SELECT 1 FROM Payments p
            WHERE p.UserID = u.UserID 
            AND p.Status = 'confirmed'
            AND p.EndDate >= GETDATE()
          )
          AND NOT EXISTS (
            SELECT 1 FROM UserMemberships um
            WHERE um.UserID = u.UserID 
            AND um.Status = 'active'
          )
        `);

            const allUpdatedUsers = [
                ...expiredResult.recordset,
                ...noMembershipResult.recordset
            ];

            if (expiredResult.recordset.length > 0) {
                logger.info(`Updated ${expiredResult.recordset.length} users from member to guest due to expired memberships`);
            }

            if (noMembershipResult.recordset.length > 0) {
                logger.info(`Updated ${noMembershipResult.recordset.length} users from member to guest due to no active memberships`);
            }

            return allUpdatedUsers;
        } catch (error) {
            logger.error('Error updating expired memberships:', error);
            throw error;
        }
    }
}

module.exports = new MembershipService(); 