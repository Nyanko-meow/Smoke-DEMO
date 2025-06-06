const { pool, connectDB } = require('./src/config/database');

async function deleteProPlan() {
    try {
        console.log('��️ DELETING PRO PLAN SAFELY');
        console.log('============================\n');

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

            // 2. Check active memberships
            console.log('\n2️⃣ Checking active memberships...');
            const activeMemberships = await transaction.request().query(`
                SELECT COUNT(*) as count FROM UserMemberships 
                WHERE PlanID = ${proPlanID} AND Status = 'active'
            `);

            if (activeMemberships.recordset[0].count > 0) {
                console.log(`⚠️ Found ${activeMemberships.recordset[0].count} active Pro Plan memberships`);
                console.log('🔄 Cancelling active memberships...');

                // Cancel active memberships
                await transaction.request().query(`
                    UPDATE UserMemberships 
                    SET Status = 'cancelled' 
                    WHERE PlanID = ${proPlanID} AND Status = 'active'
                `);
                console.log('✅ Active memberships cancelled');
            } else {
                console.log('✅ No active memberships found');
            }

            // 3. Check pending payments
            console.log('\n3️⃣ Checking pending payments...');
            const pendingPayments = await transaction.request().query(`
                SELECT COUNT(*) as count FROM Payments 
                WHERE PlanID = ${proPlanID} AND Status = 'pending'
            `);

            if (pendingPayments.recordset[0].count > 0) {
                console.log(`⚠️ Found ${pendingPayments.recordset[0].count} pending Pro Plan payments`);
                console.log('🔄 Rejecting pending payments...');

                // Reject pending payments
                await transaction.request().query(`
                    UPDATE Payments 
                    SET Status = 'rejected', Note = 'Plan discontinued - Pro Plan deleted' 
                    WHERE PlanID = ${proPlanID} AND Status = 'pending'
                `);
                console.log('✅ Pending payments rejected');
            } else {
                console.log('✅ No pending payments found');
            }

            // 4. Check cancellation requests
            console.log('\n4️⃣ Checking cancellation requests...');
            const cancellationRequests = await transaction.request().query(`
                SELECT COUNT(*) as count FROM CancellationRequests cr
                INNER JOIN UserMemberships um ON cr.MembershipID = um.MembershipID
                WHERE um.PlanID = ${proPlanID} AND cr.Status = 'pending'
            `);

            if (cancellationRequests.recordset[0].count > 0) {
                console.log(`⚠️ Found ${cancellationRequests.recordset[0].count} pending cancellation requests`);
                console.log('🔄 Approving cancellation requests...');

                // Approve pending cancellation requests
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

            // 5. Update users' roles if they have no other active memberships
            console.log('\n5️⃣ Updating user roles...');
            await transaction.request().query(`
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
            console.log('✅ User roles updated');

            // 6. Finally delete the Pro Plan
            console.log('\n6️⃣ Deleting Pro Plan...');
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

            // 7. Verify deletion
            console.log('\n7️⃣ Verifying deletion...');
            const verifyResult = await pool.request().query(`
                SELECT PlanID, Name FROM MembershipPlans ORDER BY PlanID
            `);

            console.log('\n📋 Remaining plans:');
            if (verifyResult.recordset.length > 0) {
                verifyResult.recordset.forEach((plan, index) => {
                    console.log(`${index + 1}. ID: ${plan.PlanID} - ${plan.Name}`);
                });
            } else {
                console.log('   (No plans found)');
            }

            console.log(`\n📊 Total remaining plans: ${verifyResult.recordset.length}`);

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

deleteProPlan(); 