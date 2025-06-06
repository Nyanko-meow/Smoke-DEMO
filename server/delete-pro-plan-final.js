const { pool, connectDB } = require('./src/config/database');

async function deleteProPlanFinal() {
    try {
        console.log('🗑️ DELETING PRO PLAN - FINAL VERSION');
        console.log('====================================\n');

        await connectDB();
        console.log('✅ Database connected\n');

        // Start transaction
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            // 1. Check if Pro Plan exists
            console.log('1️⃣ Checking if Pro Plan exists...');
            const checkResult = await transaction.request().query(`
                SELECT PlanID, Name FROM MembershipPlans WHERE Name = 'Pro Plan'
            `);

            if (checkResult.recordset.length === 0) {
                console.log('✅ Pro Plan not found - already deleted!');
                await transaction.rollback();
                return;
            }

            const proPlanID = checkResult.recordset[0].PlanID;
            console.log(`📋 Found Pro Plan with ID: ${proPlanID}`);

            // 2. Delete PlanTemplates referencing Pro Plan
            console.log('\n2️⃣ Deleting Pro Plan templates...');
            const deleteTemplatesResult = await transaction.request().query(`
                DELETE FROM PlanTemplates WHERE PlanID = ${proPlanID}
            `);
            console.log(`✅ Deleted ${deleteTemplatesResult.rowsAffected[0]} templates for Pro Plan`);

            // 3. Cancel active memberships
            console.log('\n3️⃣ Checking active memberships...');
            const activeMemberships = await transaction.request().query(`
                SELECT COUNT(*) as count FROM UserMemberships 
                WHERE PlanID = ${proPlanID} AND Status = 'active'
            `);

            if (activeMemberships.recordset[0].count > 0) {
                console.log(`⚠️ Found ${activeMemberships.recordset[0].count} active Pro Plan memberships`);
                console.log('🔄 Cancelling active memberships...');

                await transaction.request().query(`
                    UPDATE UserMemberships 
                    SET Status = 'cancelled' 
                    WHERE PlanID = ${proPlanID} AND Status = 'active'
                `);
                console.log('✅ Active memberships cancelled');
            } else {
                console.log('✅ No active memberships found');
            }

            // 4. Reject pending payments
            console.log('\n4️⃣ Checking pending payments...');
            const pendingPayments = await transaction.request().query(`
                SELECT COUNT(*) as count FROM Payments 
                WHERE PlanID = ${proPlanID} AND Status = 'pending'
            `);

            if (pendingPayments.recordset[0].count > 0) {
                console.log(`⚠️ Found ${pendingPayments.recordset[0].count} pending Pro Plan payments`);
                console.log('🔄 Rejecting pending payments...');

                await transaction.request().query(`
                    UPDATE Payments 
                    SET Status = 'rejected', Note = 'Plan discontinued - Pro Plan deleted' 
                    WHERE PlanID = ${proPlanID} AND Status = 'pending'
                `);
                console.log('✅ Pending payments rejected');
            } else {
                console.log('✅ No pending payments found');
            }

            // 5. Handle cancellation requests
            console.log('\n5️⃣ Checking cancellation requests...');
            const cancellationRequests = await transaction.request().query(`
                SELECT COUNT(*) as count FROM CancellationRequests cr
                INNER JOIN UserMemberships um ON cr.MembershipID = um.MembershipID
                WHERE um.PlanID = ${proPlanID} AND cr.Status = 'pending'
            `);

            if (cancellationRequests.recordset[0].count > 0) {
                console.log(`⚠️ Found ${cancellationRequests.recordset[0].count} pending cancellation requests`);
                console.log('🔄 Approving cancellation requests...');

                await transaction.request().query(`
                    UPDATE CancellationRequests 
                    SET Status = 'approved', 
                        ProcessedAt = GETDATE(), 
                        AdminNotes = 'Auto-approved due to plan discontinuation'
                    WHERE CancellationRequestID IN (
                        SELECT cr.CancellationRequestID 
                        FROM CancellationRequests cr
                        INNER JOIN UserMemberships um ON cr.MembershipID = um.MembershipID
                        WHERE um.PlanID = ${proPlanID} AND cr.Status = 'pending'
                    )
                `);
                console.log('✅ Cancellation requests approved');
            } else {
                console.log('✅ No pending cancellation requests found');
            }

            // 6. Update user roles for affected users
            console.log('\n6️⃣ Updating user roles...');
            const roleUpdateResult = await transaction.request().query(`
                UPDATE Users 
                SET Role = 'guest' 
                WHERE UserID IN (
                    SELECT DISTINCT um.UserID 
                    FROM UserMemberships um
                    WHERE um.PlanID = ${proPlanID}
                    AND NOT EXISTS (
                        SELECT 1 FROM UserMemberships um2 
                        WHERE um2.UserID = um.UserID 
                        AND um2.Status = 'active' 
                        AND um2.PlanID != ${proPlanID}
                    )
                    AND Users.Role = 'member'
                )
            `);
            console.log(`✅ Updated ${roleUpdateResult.rowsAffected[0]} user roles`);

            // 7. Check for any other references (just to be safe)
            console.log('\n7️⃣ Checking for other references...');

            // Check QuitPlans if it has a PlanID column (might not exist)
            try {
                const quitPlansCheck = await transaction.request().query(`
                    SELECT COUNT(*) as count FROM QuitPlans WHERE PlanID = ${proPlanID}
                `);
                if (quitPlansCheck.recordset[0].count > 0) {
                    console.log(`⚠️ Found ${quitPlansCheck.recordset[0].count} quit plans referencing Pro Plan, updating...`);
                    await transaction.request().query(`
                        UPDATE QuitPlans SET PlanID = NULL WHERE PlanID = ${proPlanID}
                    `);
                }
            } catch (error) {
                // QuitPlans might not have PlanID column, ignore this error
                console.log('ℹ️ QuitPlans table does not have PlanID column, skipping...');
            }

            // 8. Finally delete the Pro Plan
            console.log('\n8️⃣ Deleting Pro Plan...');
            const deleteResult = await transaction.request().query(`
                DELETE FROM MembershipPlans WHERE PlanID = ${proPlanID}
            `);

            if (deleteResult.rowsAffected[0] > 0) {
                console.log('✅ Pro Plan deleted successfully!');
            } else {
                console.log('⚠️ No rows affected - Plan may have been already deleted');
            }

            // Commit transaction
            await transaction.commit();
            console.log('\n🎉 Transaction committed successfully!');

            // 9. Verify deletion
            console.log('\n9️⃣ Verifying deletion...');
            const verifyResult = await pool.request().query(`
                SELECT PlanID, Name, Price, Duration FROM MembershipPlans ORDER BY PlanID
            `);

            console.log('\n📋 Remaining plans:');
            if (verifyResult.recordset.length > 0) {
                verifyResult.recordset.forEach((plan, index) => {
                    console.log(`${index + 1}. ID: ${plan.PlanID} - ${plan.Name} (${plan.Price.toLocaleString('vi-VN')} VNĐ, ${plan.Duration} days)`);
                });
            } else {
                console.log('   (No plans found)');
            }

            console.log(`\n📊 Total remaining plans: ${verifyResult.recordset.length}`);

            // Also check templates
            console.log('\n🔍 Checking remaining templates...');
            const templatesResult = await pool.request().query(`
                SELECT 
                    mp.Name as PlanName,
                    COUNT(pt.TemplateID) as TemplateCount
                FROM MembershipPlans mp
                LEFT JOIN PlanTemplates pt ON mp.PlanID = pt.PlanID
                GROUP BY mp.PlanID, mp.Name
                ORDER BY mp.PlanID
            `);

            console.log('\n📋 Templates by plan:');
            templatesResult.recordset.forEach(item => {
                console.log(`   ${item.PlanName}: ${item.TemplateCount} templates`);
            });

            console.log('\n🎉 PRO PLAN DELETION COMPLETED SUCCESSFULLY!');
            console.log('✅ Pro Plan and all related data have been safely removed');
            console.log('💡 Please refresh your browser to see the changes!');

        } catch (transactionError) {
            await transaction.rollback();
            console.error('❌ Transaction failed:', transactionError);
            throw transactionError;
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (pool) {
            await pool.close();
        }
    }
}

deleteProPlanFinal(); 