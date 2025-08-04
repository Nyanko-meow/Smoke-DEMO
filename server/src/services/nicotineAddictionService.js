const { pool } = require('../config/database');

/**
 * Calculate nicotine addiction score based on survey answers
 * @param {Array} answers - Array of answer objects with questionId and answerText
 * @returns {Object} - Total score and addiction level
 */
const calculateAddictionScore = (answers) => {
    const scoreMap = {
        // Question 1: Time to first cigarette
        1: {
            'Trong 5 phút': 3,
            '6–30 phút': 2,
            '31–60 phút': 1,
            'Sau 60 phút': 0
        },
        // Question 2: Hardest cigarette to give up
        2: {
            'Điếu đầu tiên trong ngày': 1,
            'Điếu khác': 0
        },
        // Question 3: Cigarettes per day
        3: {
            '≤10': 0,
            '11–20': 1,
            '21–30': 2,
            '≥31': 3
        },
        // Question 4: More smoking in morning
        4: {
            'Có': 1,
            'Không': 0
        },
        // Question 5: Smoking when sick
        5: {
            'Có': 1,
            'Không': 0
        },
        // Question 6: Difficulty without smoking
        6: {
            'Có': 1,
            'Không': 0
        },
        // Question 7: Failed quit attempts
        7: {
            'Có': 1,
            'Không': 0
        },
        // Question 8: Smoking in forbidden situations
        8: {
            'Thường xuyên': 1,
            'Thỉnh thoảng': 0.5,
            'Không bao giờ': 0
        },
        // Question 9: Smoking when stressed
        9: {
            'Luôn luôn': 1,
            'Đôi khi': 0.5,
            'Không bao giờ': 0
        },
        // Question 10: Withdrawal symptoms
        10: {
            'Có': 1,
            'Không': 0
        }
    };

    let totalScore = 0;
    let answeredQuestions = 0;

    answers.forEach(answer => {
        const questionId = parseInt(answer.questionId);
        const answerText = answer.answerText;
        
        if (scoreMap[questionId] && scoreMap[questionId][answerText] !== undefined) {
            totalScore += scoreMap[questionId][answerText];
            answeredQuestions++;
        }
    });

    // Determine addiction level based on total score
    let addictionLevel = '';
    if (totalScore >= 0 && totalScore <= 3) {
        addictionLevel = 'Lệ thuộc nhẹ (thấp)';
    } else if (totalScore >= 3.5 && totalScore <= 6.5) {
        addictionLevel = 'Lệ thuộc trung bình';
    } else if (totalScore >= 7 && totalScore <= 9.5) {
        addictionLevel = 'Lệ thuộc cao';
    } else if (totalScore >= 10) {
        addictionLevel = 'Lệ thuộc rất cao (nghiện nặng)';
    }

    return {
        totalScore: parseFloat(totalScore.toFixed(1)),
        addictionLevel,
        answeredQuestions,
        maxPossibleScore: 10.5
    };
};

/**
 * Check if user can take the nicotine addiction survey
 * @param {number} userId - User ID
 * @returns {Object} - Can take survey and reason
 */
const checkSurveyEligibility = async (userId) => {
    try {
        // Check if user has active membership
        const membershipQuery = `
            SELECT TOP 1 
                um.MembershipID,
                um.Status,
                um.EndDate,
                mp.Name as PlanName
            FROM UserMemberships um
            JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
            WHERE um.UserID = @UserID 
            AND um.Status IN ('active', 'confirmed')
            AND um.EndDate > GETDATE()
            ORDER BY um.EndDate DESC
        `;

        const membershipResult = await pool.request()
            .input('UserID', userId)
            .query(membershipQuery);

        if (membershipResult.recordset.length === 0) {
            return {
                canTakeSurvey: false,
                reason: 'Bạn cần có gói membership đang hoạt động để làm khảo sát này',
                requireMembership: true
            };
        }

        const currentMembership = membershipResult.recordset[0];

        // Check if user has already taken the survey for this membership
        const existingScoreQuery = `
            SELECT TOP 1 ScoreID, SurveyDate
            FROM NicotineAddictionScores
            WHERE UserID = @UserID 
            AND MembershipID = @MembershipID
            ORDER BY SurveyDate DESC
        `;

        const existingScoreResult = await pool.request()
            .input('UserID', userId)
            .input('MembershipID', currentMembership.MembershipID)
            .query(existingScoreQuery);

        if (existingScoreResult.recordset.length > 0) {
            const lastSurvey = existingScoreResult.recordset[0];
            return {
                canTakeSurvey: false,
                reason: `Bạn đã làm khảo sát này trong gói ${currentMembership.PlanName}. Mỗi gói chỉ được làm khảo sát 1 lần.`,
                alreadyTaken: true,
                lastSurveyDate: lastSurvey.SurveyDate
            };
        }

        return {
            canTakeSurvey: true,
            membership: currentMembership
        };

    } catch (error) {
        console.error('Error checking survey eligibility:', error);
        return {
            canTakeSurvey: false,
            reason: 'Có lỗi xảy ra khi kiểm tra quyền làm khảo sát'
        };
    }
};

/**
 * Save nicotine addiction survey results
 * @param {number} userId - User ID
 * @param {number} membershipId - Membership ID
 * @param {number} totalScore - Total addiction score
 * @param {string} addictionLevel - Addiction level description
 * @returns {Object} - Save result
 */
const saveAddictionScore = async (userId, membershipId, totalScore, addictionLevel) => {
    try {
        const result = await pool.request()
            .input('UserID', userId)
            .input('MembershipID', membershipId)
            .input('TotalScore', totalScore)
            .input('AddictionLevel', addictionLevel)
            .query(`
                INSERT INTO NicotineAddictionScores (UserID, MembershipID, TotalScore, AddictionLevel)
                OUTPUT INSERTED.ScoreID, INSERTED.SurveyDate
                VALUES (@UserID, @MembershipID, @TotalScore, @AddictionLevel)
            `);

        return {
            success: true,
            scoreId: result.recordset[0].ScoreID,
            surveyDate: result.recordset[0].SurveyDate
        };

    } catch (error) {
        console.error('Error saving addiction score:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Get user's latest nicotine addiction score
 * @param {number} userId - User ID
 * @returns {Object} - Latest score data
 */
const getLatestAddictionScore = async (userId) => {
    try {
        const result = await pool.request()
            .input('UserID', userId)
            .query(`
                SELECT TOP 1 
                    nas.ScoreID,
                    nas.TotalScore,
                    nas.AddictionLevel,
                    nas.SurveyDate,
                    nas.MembershipID,
                    mp.Name as PlanName
                FROM NicotineAddictionScores nas
                LEFT JOIN UserMemberships um ON nas.MembershipID = um.MembershipID
                LEFT JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
                WHERE nas.UserID = @UserID
                ORDER BY nas.SurveyDate DESC
            `);

        if (result.recordset.length === 0) {
            return null;
        }

        return result.recordset[0];

    } catch (error) {
        console.error('Error getting latest addiction score:', error);
        return null;
    }
};

module.exports = {
    calculateAddictionScore,
    checkSurveyEligibility,
    saveAddictionScore,
    getLatestAddictionScore
}; 