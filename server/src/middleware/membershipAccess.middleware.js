const { pool } = require('../config/database');

/**
 * Middleware kiểm tra user có membership active hay không
 * Reset/ẩn dữ liệu cũ nếu hết gói dịch vụ
 */
const checkMembershipAccess = async (req, res, next) => {
    try {
        const userId = req.user.UserID;
        const userRole = req.user.Role;

        console.log('🔍 Checking membership access for user:', userId);

        // Coach và Admin luôn có quyền truy cập
        if (['coach', 'admin'].includes(userRole)) {
            return next();
        }

        // Kiểm tra user có active membership không (bao gồm pending_cancellation)
        const membershipResult = await pool.request()
            .input('UserID', userId)
            .query(`
                SELECT 
                    um.MembershipID,
                    um.UserID,
                    um.PlanID,
                    um.StartDate,
                    um.EndDate,
                    um.Status,
                    mp.Name as PlanName,
                    DATEDIFF(day, GETDATE(), um.EndDate) as DaysRemaining
                FROM UserMemberships um
                INNER JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
                WHERE um.UserID = @UserID 
                AND um.Status IN ('active', 'pending_cancellation')
                AND um.EndDate > GETDATE()
                ORDER BY um.EndDate DESC
            `);

        if (membershipResult.recordset.length === 0) {
            console.log('❌ User does not have active membership');

            // Kiểm tra có expired membership không để archive data
            await archiveExpiredMembershipData(userId);

            return res.status(403).json({
                success: false,
                message: 'Bạn cần có gói dịch vụ active để truy cập tính năng này. Vui lòng gia hạn hoặc mua gói mới.',
                requireMembership: true,
                userRole: userRole
            });
        }

        const currentMembership = membershipResult.recordset[0];
        console.log('✅ User has active membership:', currentMembership.PlanName, 'Status:', currentMembership.Status);

        // Gắn thông tin membership vào request để sử dụng ở các route
        req.currentMembership = currentMembership;

        next();
    } catch (error) {
        console.error('❌ Error checking membership access:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi kiểm tra quyền truy cập membership'
        });
    }
};

/**
 * Archive dữ liệu của expired membership
 * Đặt MembershipID = NULL để ẩn khỏi queries hiện tại
 */
const archiveExpiredMembershipData = async (userId) => {
    try {
        console.log('🗄️ Archiving expired membership data for user:', userId);

        const transaction = await pool.transaction();
        await transaction.begin();

        try {
            // Get all expired memberships for this user
            const expiredMemberships = await transaction.request()
                .input('UserID', userId)
                .query(`
                    SELECT MembershipID, PlanID, EndDate, Status
                    FROM UserMemberships
                    WHERE UserID = @UserID 
                    AND (
                        (Status = 'active' AND EndDate <= GETDATE()) OR
                        Status IN ('expired', 'cancelled')
                    )
                `);

            for (const membership of expiredMemberships.recordset) {
                // Update membership status to expired if still active
                if (membership.Status === 'active') {
                    await transaction.request()
                        .input('MembershipID', membership.MembershipID)
                        .query(`
                            UPDATE UserMemberships 
                            SET Status = 'expired', UpdatedAt = GETDATE()
                            WHERE MembershipID = @MembershipID
                        `);
                }

                // Archive progress tracking data
                await transaction.request()
                    .input('MembershipID', membership.MembershipID)
                    .query(`
                        UPDATE ProgressTracking 
                        SET MembershipID = NULL,
                            EmotionNotes = ISNULL(EmotionNotes, '') + ' [Archived - Membership expired]'
                        WHERE MembershipID = @MembershipID
                    `);

                // Archive quit plans
                await transaction.request()
                    .input('MembershipID', membership.MembershipID)
                    .query(`
                        UPDATE QuitPlans 
                        SET MembershipID = NULL,
                            Status = 'archived'
                        WHERE MembershipID = @MembershipID
                    `);

                console.log(`📦 Archived data for membership ${membership.MembershipID}`);
            }

            await transaction.commit();
            console.log('✅ Successfully archived expired membership data');

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error('❌ Error archiving expired membership data:', error);
    }
};

/**
 * Middleware đặc biệt cho việc lấy dữ liệu - chỉ return dữ liệu của membership hiện tại
 */
const filterByCurrentMembership = async (req, res, next) => {
    // Chỉ áp dụng cho GET requests
    if (req.method !== 'GET') {
        return next();
    }

    try {
        const userId = req.user.UserID;
        const userRole = req.user.Role;

        // Coach và Admin có thể xem tất cả data
        if (['coach', 'admin'].includes(userRole)) {
            return next();
        }

        // Lấy current active membership (bao gồm pending_cancellation)
        const membershipResult = await pool.request()
            .input('UserID', userId)
            .query(`
                SELECT MembershipID
                FROM UserMemberships
                WHERE UserID = @UserID 
                AND Status IN ('active', 'pending_cancellation')
                AND EndDate > GETDATE()
                ORDER BY EndDate DESC
            `);

        if (membershipResult.recordset.length === 0) {
            // Không có active membership - return empty result
            req.noActiveMembership = true;
        } else {
            // Có active membership - filter theo membership này
            req.currentMembershipID = membershipResult.recordset[0].MembershipID;
        }

        next();
    } catch (error) {
        console.error('❌ Error filtering by current membership:', error);
        next();
    }
};

module.exports = {
    checkMembershipAccess,
    filterByCurrentMembership,
    archiveExpiredMembershipData
}; 