const sql = require('mssql');

// Database configuration
const config = {
    user: 'sa',
    password: '12345',
    server: 'localhost',
    database: 'SMOKEKING',
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
};

async function fixDuplicateQuitPlans() {
    let pool = null;
    try {
        console.log('🚀 Starting duplicate QuitPlans cleanup...');

        // Connect to database
        console.log('🔗 Connecting to database...');
        pool = await sql.connect(config);
        console.log('✅ Database connected');

        // 1. Find duplicate QuitPlans (same UserID + CoachID + Status = 'active')
        console.log('\n🔍 Finding duplicate QuitPlans...');
        const duplicatesCheck = await pool.request().query(`
            SELECT 
                UserID, 
                CoachID, 
                COUNT(*) as Count,
                MIN(PlanID) as KeepPlanID,
                STRING_AGG(PlanID, ', ') as AllPlanIDs
            FROM QuitPlans 
            WHERE Status = 'active' AND CoachID IS NOT NULL
            GROUP BY UserID, CoachID
            HAVING COUNT(*) > 1
            ORDER BY UserID, CoachID
        `);

        if (duplicatesCheck.recordset.length === 0) {
            console.log('✅ No duplicate QuitPlans found');
        } else {
            console.log(`❌ Found ${duplicatesCheck.recordset.length} sets of duplicate QuitPlans:`);
            duplicatesCheck.recordset.forEach(dup => {
                console.log(`   User ${dup.UserID} + Coach ${dup.CoachID}: ${dup.Count} plans (${dup.AllPlanIDs})`);
            });

            // 2. Keep only the oldest plan for each UserID + CoachID combination
            console.log('\n🧹 Removing duplicate QuitPlans (keeping oldest)...');
            for (const duplicate of duplicatesCheck.recordset) {
                await pool.request()
                    .input('UserID', duplicate.UserID)
                    .input('CoachID', duplicate.CoachID)
                    .input('KeepPlanID', duplicate.KeepPlanID)
                    .query(`
                        DELETE FROM QuitPlans 
                        WHERE UserID = @UserID 
                            AND CoachID = @CoachID 
                            AND Status = 'active'
                            AND PlanID != @KeepPlanID
                    `);
                console.log(`   ✅ Cleaned User ${duplicate.UserID} + Coach ${duplicate.CoachID}`);
            }
        }

        // 3. Check for multiple active plans per user (regardless of coach)
        console.log('\n🔍 Finding users with multiple active QuitPlans...');
        const multipleActiveCheck = await pool.request().query(`
            SELECT 
                UserID, 
                COUNT(*) as Count,
                STRING_AGG(CAST(PlanID AS VARCHAR) + ' (Coach: ' + CAST(ISNULL(CoachID, 0) AS VARCHAR) + ')', ', ') as AllPlans
            FROM QuitPlans 
            WHERE Status = 'active'
            GROUP BY UserID
            HAVING COUNT(*) > 1
            ORDER BY UserID
        `);

        if (multipleActiveCheck.recordset.length === 0) {
            console.log('✅ No users with multiple active QuitPlans');
        } else {
            console.log(`❌ Found ${multipleActiveCheck.recordset.length} users with multiple active plans:`);
            multipleActiveCheck.recordset.forEach(user => {
                console.log(`   User ${user.UserID}: ${user.Count} plans (${user.AllPlans})`);
            });

            // Let admin decide how to handle this
            console.log('\n⚠️  WARNING: Users with multiple active plans found.');
            console.log('   These need manual review to determine which plan to keep.');
            console.log('   Consider setting older plans to "completed" or "cancelled".');
        }

        // 4. Verify final results
        console.log('\n🔍 Final verification...');
        const finalCheck = await pool.request().query(`
            SELECT 
                u.UserID,
                u.FirstName + ' ' + u.LastName as UserName,
                u.Email,
                COUNT(qp.PlanID) as ActivePlansCount,
                STRING_AGG(CAST(qp.PlanID AS VARCHAR) + ' (Coach: ' + CAST(ISNULL(qp.CoachID, 0) AS VARCHAR) + ')', ', ') as Plans
            FROM Users u
            LEFT JOIN QuitPlans qp ON u.UserID = qp.UserID AND qp.Status = 'active'
            WHERE u.Role IN ('member', 'guest')
            GROUP BY u.UserID, u.FirstName, u.LastName, u.Email
            HAVING COUNT(qp.PlanID) > 0
            ORDER BY u.UserID
        `);

        console.log(`📋 Final state - ${finalCheck.recordset.length} users with active QuitPlans:`);
        finalCheck.recordset.forEach(user => {
            console.log(`   ${user.UserName} (${user.Email}): ${user.ActivePlansCount} plans - ${user.Plans}`);
        });

        // 5. Show coach assignments
        console.log('\n👥 Current coach assignments:');
        const coachAssignments = await pool.request().query(`
            SELECT 
                c.FirstName + ' ' + c.LastName as CoachName,
                c.Email as CoachEmail,
                COUNT(qp.UserID) as AssignedMembers,
                STRING_AGG(u.FirstName + ' ' + u.LastName, ', ') as MemberNames
            FROM Users c
            LEFT JOIN QuitPlans qp ON c.UserID = qp.CoachID AND qp.Status = 'active'
            LEFT JOIN Users u ON qp.UserID = u.UserID
            WHERE c.Role = 'coach' AND c.IsActive = 1
            GROUP BY c.UserID, c.FirstName, c.LastName, c.Email
            ORDER BY COUNT(qp.UserID) DESC
        `);

        coachAssignments.recordset.forEach(coach => {
            if (coach.AssignedMembers > 0) {
                console.log(`   ${coach.CoachName} (${coach.CoachEmail}): ${coach.AssignedMembers} members - ${coach.MemberNames}`);
            } else {
                console.log(`   ${coach.CoachName} (${coach.CoachEmail}): No assigned members`);
            }
        });

        console.log('\n✅ Duplicate QuitPlans cleanup completed!');

    } catch (error) {
        console.error('❌ Error fixing duplicate QuitPlans:', error);
        throw error;
    } finally {
        if (pool) {
            await pool.close();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run script
fixDuplicateQuitPlans()
    .then(() => {
        console.log('✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    }); 