const { pool, connectDB } = require('./src/config/database');

async function deletePlans() {
    try {
        console.log('🗑️ DELETING MEMBERSHIP PLANS');
        console.log('=============================\n');

        await connectDB();
        console.log('✅ Database connected\n');

        // First, check current plans
        console.log('📋 Current membership plans:');
        const currentPlans = await pool.request().query(`
            SELECT PlanID, Name, Description, Price, Duration
            FROM MembershipPlans
            ORDER BY PlanID
        `);

        currentPlans.recordset.forEach(plan => {
            console.log(`  - ID: ${plan.PlanID}, Name: ${plan.Name}, Price: $${plan.Price}, Duration: ${plan.Duration} days`);
        });

        // Check if there are any active memberships using these plans
        console.log('\n🔍 Checking for active memberships...');
        const activeMemberships = await pool.request().query(`
            SELECT um.MembershipID, mp.Name as PlanName, u.Email
            FROM UserMemberships um
            JOIN MembershipPlans mp ON um.PlanID = mp.PlanID
            JOIN Users u ON um.UserID = u.UserID
            WHERE mp.Name IN ('Basic Plan', 'Pro Plan')
            AND um.Status = 'active'
        `);

        if (activeMemberships.recordset.length > 0) {
            console.log('⚠️ Found active memberships using these plans:');
            activeMemberships.recordset.forEach(membership => {
                console.log(`  - User: ${membership.Email}, Plan: ${membership.PlanName}`);
            });

            console.log('\n🔄 Cancelling active memberships...');
            await pool.request().query(`
                UPDATE UserMemberships 
                SET Status = 'cancelled'
                WHERE PlanID IN (
                    SELECT PlanID FROM MembershipPlans 
                    WHERE Name IN ('Basic Plan', 'Pro Plan')
                )
                AND Status = 'active'
            `);
            console.log('✅ Active memberships cancelled');
        } else {
            console.log('✅ No active memberships found');
        }

        // Check for any payments related to these plans
        console.log('\n💰 Checking for payments...');
        const payments = await pool.request().query(`
            SELECT p.PaymentID, mp.Name as PlanName, u.Email, p.Amount, p.Status
            FROM Payments p
            JOIN MembershipPlans mp ON p.PlanID = mp.PlanID
            JOIN Users u ON p.UserID = u.UserID
            WHERE mp.Name IN ('Basic Plan', 'Pro Plan')
        `);

        if (payments.recordset.length > 0) {
            console.log('💳 Found payments for these plans:');
            payments.recordset.forEach(payment => {
                console.log(`  - User: ${payment.Email}, Plan: ${payment.PlanName}, Amount: $${payment.Amount}, Status: ${payment.Status}`);
            });

            console.log('\n🗑️ Deleting payment confirmations...');
            await pool.request().query(`
                DELETE FROM PaymentConfirmations 
                WHERE PaymentID IN (
                    SELECT p.PaymentID FROM Payments p
                    JOIN MembershipPlans mp ON p.PlanID = mp.PlanID
                    WHERE mp.Name IN ('Basic Plan', 'Pro Plan')
                )
            `);

            console.log('🗑️ Deleting payments...');
            await pool.request().query(`
                DELETE FROM Payments 
                WHERE PlanID IN (
                    SELECT PlanID FROM MembershipPlans 
                    WHERE Name IN ('Basic Plan', 'Pro Plan')
                )
            `);
            console.log('✅ Payments deleted');
        } else {
            console.log('✅ No payments found');
        }

        // Delete user memberships
        console.log('\n🗑️ Deleting user memberships...');
        const deletedMemberships = await pool.request().query(`
            DELETE FROM UserMemberships 
            WHERE PlanID IN (
                SELECT PlanID FROM MembershipPlans 
                WHERE Name IN ('Basic Plan', 'Pro Plan')
            )
        `);
        console.log(`✅ Deleted ${deletedMemberships.rowsAffected[0]} user memberships`);

        // Finally, delete the plans themselves
        console.log('\n🗑️ Deleting membership plans...');

        // Delete BASIC plan
        const deletedBasic = await pool.request().query(`
            DELETE FROM MembershipPlans 
            WHERE Name = 'Basic Plan'
        `);

        // Delete PRO plan
        const deletedPro = await pool.request().query(`
            DELETE FROM MembershipPlans 
            WHERE Name = 'Pro Plan'
        `);

        console.log(`✅ Deleted BASIC plan: ${deletedBasic.rowsAffected[0]} row(s)`);
        console.log(`✅ Deleted PRO plan: ${deletedPro.rowsAffected[0]} row(s)`);

        // Show remaining plans
        console.log('\n📋 Remaining membership plans:');
        const remainingPlans = await pool.request().query(`
            SELECT PlanID, Name, Description, Price, Duration
            FROM MembershipPlans
            ORDER BY PlanID
        `);

        if (remainingPlans.recordset.length > 0) {
            remainingPlans.recordset.forEach(plan => {
                console.log(`  - ID: ${plan.PlanID}, Name: ${plan.Name}, Price: $${plan.Price}, Duration: ${plan.Duration} days`);
            });
        } else {
            console.log('  (No plans remaining)');
        }

        console.log('\n🎉 DELETION COMPLETED!');
        console.log('✅ BASIC and PRO plans have been successfully deleted');
        console.log('💡 Refresh your browser to see the changes!');

    } catch (error) {
        console.error('❌ Error deleting plans:', error);
    } finally {
        if (pool) {
            await pool.close();
        }
    }
}

deletePlans(); 