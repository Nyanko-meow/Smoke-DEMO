const { pool } = require('../config/database');

class AchievementService {

    /**
     * Check and award achievements for a user
     * @param {number} userId - User ID to check achievements for
     */
    static async checkAndAwardAchievements(userId) {
        try {
            console.log(`🔍 Checking achievements for user ${userId}...`);

            // Get user's current membership plan
            const userPlan = await this.getUserMembershipPlan(userId);
            console.log(`📋 User plan: ${userPlan || 'none'}`);

            // Get user's progress data
            const progressData = await this.getUserProgressData(userId);
            console.log(`📊 Progress data:`, progressData);

            // Get achievements user doesn't have yet
            const availableAchievements = await this.getAvailableAchievements(userId);
            console.log(`🎯 Available achievements: ${availableAchievements.length}`);

            let newAchievements = [];

            // Check each achievement
            for (const achievement of availableAchievements) {
                const isEligible = await this.checkAchievementEligibility(
                    achievement,
                    progressData,
                    userPlan,
                    userId
                );

                if (isEligible) {
                    await this.awardAchievement(userId, achievement.AchievementID);
                    newAchievements.push(achievement);
                    console.log(`🏆 Awarded: ${achievement.Name}`);
                }
            }

            return {
                success: true,
                newAchievements,
                message: newAchievements.length > 0
                    ? `Chúc mừng! Bạn đã nhận được ${newAchievements.length} huy hiệu mới!`
                    : 'Không có huy hiệu mới.'
            };

        } catch (error) {
            console.error('❌ Error checking achievements:', error);
            throw error;
        }
    }

    /**
     * Get user's current membership plan
     */
    static async getUserMembershipPlan(userId) {
        try {
            const result = await pool.request()
                .input('UserID', userId)
                .query(`
                    SELECT TOP 1 mp.Name
                    FROM UserMemberships um
                    JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
                    WHERE um.UserID = @UserID 
                    AND um.Status = 'active'
                    AND um.EndDate > GETDATE()
                    ORDER BY um.EndDate DESC
                `);

            return result.recordset.length > 0
                ? result.recordset[0].Name.toLowerCase().replace(' plan', '')
                : null;
        } catch (error) {
            console.error('Error getting user plan:', error);
            return null;
        }
    }

    /**
     * Get user's progress data (days smoke-free, money saved, etc.)
     */
    static async getUserProgressData(userId) {
        try {
            const result = await pool.request()
                .input('UserID', userId)
                .query(`
                    SELECT 
                        COALESCE(MAX(DaysSmokeFree), 0) as DaysSmokeFree,
                        COALESCE(SUM(MoneySaved), 0) as TotalMoneySaved,
                        COUNT(*) as ProgressEntries,
                        MIN(Date) as FirstEntry,
                        MAX(Date) as LastEntry
                    FROM ProgressTracking 
                    WHERE UserID = @UserID
                `);

            const progressData = result.recordset[0] || {
                DaysSmokeFree: 0,
                TotalMoneySaved: 0,
                ProgressEntries: 0,
                FirstEntry: null,
                LastEntry: null
            };

            // Calculate days since quit plan started
            const quitPlanResult = await pool.request()
                .input('UserID', userId)
                .query(`
                    SELECT TOP 1 StartDate
                    FROM QuitPlans 
                    WHERE UserID = @UserID 
                    AND Status = 'active'
                    ORDER BY StartDate DESC
                `);

            if (quitPlanResult.recordset.length > 0) {
                const startDate = new Date(quitPlanResult.recordset[0].StartDate);
                const now = new Date();
                const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
                progressData.DaysSinceQuitStart = Math.max(0, daysSinceStart);
            } else {
                progressData.DaysSinceQuitStart = 0;
            }

            return progressData;
        } catch (error) {
            console.error('Error getting progress data:', error);
            return {
                DaysSmokeFree: 0,
                TotalMoneySaved: 0,
                ProgressEntries: 0,
                DaysSinceQuitStart: 0
            };
        }
    }

    /**
     * Get achievements user doesn't have yet
     */
    static async getAvailableAchievements(userId) {
        try {
            const result = await pool.request()
                .input('UserID', userId)
                .query(`
                    SELECT a.*
                    FROM Achievements a
                    WHERE a.IsActive = 1
                    AND a.AchievementID NOT IN (
                        SELECT AchievementID 
                        FROM UserAchievements 
                        WHERE UserID = @UserID
                    )
                    ORDER BY a.Category, a.Difficulty
                `);

            return result.recordset;
        } catch (error) {
            console.error('Error getting available achievements:', error);
            return [];
        }
    }

    /**
     * Check if user is eligible for a specific achievement
     */
    static async checkAchievementEligibility(achievement, progressData, userPlan, userId) {
        try {
            // Check plan requirement
            if (achievement.RequiredPlan && achievement.RequiredPlan !== userPlan) {
                return false;
            }

            // Check milestone days
            if (achievement.MilestoneDays !== null) {
                if (progressData.DaysSinceQuitStart < achievement.MilestoneDays) {
                    return false;
                }
            }

            // Check saved money
            if (achievement.SavedMoney !== null) {
                if (progressData.TotalMoneySaved < achievement.SavedMoney) {
                    return false;
                }
            }

            // Check special achievements
            if (achievement.Category === 'special') {
                return await this.checkSpecialAchievement(achievement, userId);
            }

            if (achievement.Category === 'social') {
                return await this.checkSocialAchievement(achievement, userId);
            }

            return true;
        } catch (error) {
            console.error('Error checking eligibility:', error);
            return false;
        }
    }

    /**
     * Check special achievement eligibility
     */
    static async checkSpecialAchievement(achievement, userId) {
        try {
            if (achievement.Name.includes('Người tiên phong')) {
                // Check if user is among first 100 registered users
                const result = await pool.request()
                    .input('UserID', userId)
                    .query(`
                        SELECT COUNT(*) as rank
                        FROM Users
                        WHERE UserID <= @UserID
                        AND CreatedAt <= (SELECT CreatedAt FROM Users WHERE UserID = @UserID)
                    `);

                return result.recordset[0].rank <= 100;
            }

            return false;
        } catch (error) {
            console.error('Error checking special achievement:', error);
            return false;
        }
    }

    /**
     * Check social achievement eligibility
     */
    static async checkSocialAchievement(achievement, userId) {
        try {
            if (achievement.Name.includes('Người chia sẻ')) {
                // Check if user has 10+ posts
                const result = await pool.request()
                    .input('UserID', userId)
                    .query(`
                        SELECT COUNT(*) as postCount
                        FROM CommunityPosts
                        WHERE UserID = @UserID
                    `);

                return result.recordset[0].postCount >= 10;
            }

            if (achievement.Name.includes('Người truyền cảm hứng')) {
                // Check if user has 50+ likes on their posts
                const result = await pool.request()
                    .input('UserID', userId)
                    .query(`
                        SELECT SUM(cp.Likes) as totalLikes
                        FROM CommunityPosts cp
                        WHERE cp.UserID = @UserID
                    `);

                return (result.recordset[0].totalLikes || 0) >= 50;
            }

            return false;
        } catch (error) {
            console.error('Error checking social achievement:', error);
            return false;
        }
    }

    /**
     * Award achievement to user
     */
    static async awardAchievement(userId, achievementId) {
        try {
            await pool.request()
                .input('UserID', userId)
                .input('AchievementID', achievementId)
                .query(`
                    INSERT INTO UserAchievements (UserID, AchievementID, EarnedAt)
                    VALUES (@UserID, @AchievementID, GETDATE())
                `);

            return true;
        } catch (error) {
            console.error('Error awarding achievement:', error);
            throw error;
        }
    }

    /**
     * Get user's earned achievements with details
     */
    static async getUserAchievements(userId) {
        try {
            const result = await pool.request()
                .input('UserID', userId)
                .query(`
                    SELECT 
                        a.*,
                        ua.EarnedAt,
                        ua.UserAchievementID
                    FROM UserAchievements ua
                    JOIN Achievements a ON ua.AchievementID = a.AchievementID
                    WHERE ua.UserID = @UserID
                    ORDER BY ua.EarnedAt DESC, a.Difficulty ASC
                `);

            return result.recordset;
        } catch (error) {
            console.error('Error getting user achievements:', error);
            return [];
        }
    }

    /**
     * Get user's highest achievement badge for display
     */
    static async getUserTopBadge(userId) {
        try {
            const result = await pool.request()
                .input('UserID', userId)
                .query(`
                    SELECT TOP 1
                        a.Name,
                        a.IconURL,
                        a.Category,
                        a.Difficulty,
                        a.Points
                    FROM UserAchievements ua
                    JOIN Achievements a ON ua.AchievementID = a.AchievementID
                    WHERE ua.UserID = @UserID
                    ORDER BY a.Points DESC, a.Difficulty DESC, ua.EarnedAt DESC
                `);

            return result.recordset.length > 0 ? result.recordset[0] : null;
        } catch (error) {
            console.error('Error getting top badge:', error);
            return null;
        }
    }

    /**
     * Trigger achievement check when user updates progress
     */
    static async onProgressUpdate(userId) {
        try {
            return await this.checkAndAwardAchievements(userId);
        } catch (error) {
            console.error('Error on progress update:', error);
            return { success: false, message: 'Error checking achievements' };
        }
    }
}

module.exports = AchievementService; 