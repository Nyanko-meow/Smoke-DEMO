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

            // Find expired memberships where users are still members
            const result = await pool.request()
                .query(`
          UPDATE Users 
          SET Role = 'guest', UpdatedAt = GETDATE()
          OUTPUT INSERTED.UserID, INSERTED.Email
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

            const updatedUsers = result.recordset;

            if (updatedUsers.length > 0) {
                logger.info(`Updated ${updatedUsers.length} users from member to guest due to expired memberships`);
                return updatedUsers;
            }

            return [];
        } catch (error) {
            logger.error('Error updating expired memberships:', error);
            throw error;
        }
    }
}

module.exports = new MembershipService(); 