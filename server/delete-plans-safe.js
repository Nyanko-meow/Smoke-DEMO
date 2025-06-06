const { pool, connectDB } = require('./src/config/database');

async function deletePlansSafe() {
    try {
        console.log('🗑️ SAFELY DELETING MEMBERSHIP PLANS');
        console.log('====================================\n');

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

        // Get the PlanIDs for BASIC and PRO plans
        const plansToDelete = await pool.request().query(`
            SELECT PlanID, Name
            FROM MembershipPlans
            WHERE Name IN ('Basic Plan', 'Pro Plan')
        `);

        if (plansToDelete.recordset.length === 0) {
            console.log('⚠️ No BASIC or PRO plans found to delete');
            return;
        }

        console.log('\n🎯 Plans to delete:');
        plansToDelete.recordset.forEach(plan => {
            console.log(`  - ID: ${plan.PlanID}, Name: ${plan.Name}`);
        });

        // Check for PlanTemplates references
        console.log('\n🔍 Checking PlanTemplates references...');
        const planTemplates = await pool.request().query(`
            SELECT pt.*, mp.Name as PlanName
            FROM PlanTemplates pt
            JOIN MembershipPlans mp ON pt.PlanID = mp.PlanID
            WHERE mp.Name IN ('Basic Plan', 'Pro Plan')
        `);

        if (planTemplates.recordset.length > 0) {
            console.log('📋 Found PlanTemplates references:');
            planTemplates.recordset.forEach(template => {
                console.log(`  - Template ID: ${template.TemplateID}, Plan: ${template.PlanName}`);
            });

            console.log('\n🗑️ Deleting PlanTemplates...');
            await pool.request().query(`
                DELETE FROM PlanTemplates 
                WHERE PlanID IN (
                    SELECT PlanID FROM MembershipPlans 
                    WHERE Name IN ('Basic Plan', 'Pro Plan')
                )
            `);
            console.log('✅ PlanTemplates deleted');
        } else {
            console.log('✅ No PlanTemplates references found');
        }

        // Check for active memberships
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
            console.log('⚠️ Found active memberships:');
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

        // Check for payments
        console.log('\n💰 Checking for payments...');
        const payments = await pool.request().query(`
            SELECT p.PaymentID, mp.Name as PlanName, u.Email, p.Amount, p.Status
            FROM Payments p
            JOIN MembershipPlans mp ON p.PlanID = mp.PlanID
            JOIN Users u ON p.UserID = u.UserID
            WHERE mp.Name IN ('Basic Plan', 'Pro Plan')
        `);

        if (payments.recordset.length > 0) {
            console.log('💳 Found payments:');
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

        // Check for any other foreign key references
        console.log('\n🔍 Checking for other references...');

        // Check if there are any other tables referencing these plans
        try {
            const otherRefs = await pool.request().query(`
                SELECT 
                    OBJECT_NAME(parent_object_id) AS referencing_table,
                    COL_NAME(parent_object_id, parent_column_id) AS referencing_column,
                    OBJECT_NAME(referenced_object_id) AS referenced_table,
                    COL_NAME(referenced_object_id, referenced_column_id) AS referenced_column
                FROM sys.foreign_key_columns
                WHERE OBJECT_NAME(referenced_object_id) = 'MembershipPlans'
                AND COL_NAME(referenced_object_id, referenced_column_id) = 'PlanID'
            `);

            if (otherRefs.recordset.length > 0) {
                console.log('📋 Found other foreign key references:');
                otherRefs.recordset.forEach(ref => {
                    console.log(`  - Table: ${ref.referencing_table}, Column: ${ref.referencing_column}`);
                });
            }
        } catch (error) {
            console.log('⚠️ Could not check foreign key references');
        }

        // Finally, delete the plans themselves
        console.log('\n🗑️ Deleting membership plans...');

        try {
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

        } catch (error) {
            console.error('❌ Error deleting plans:', error.message);

            // If still failing, let's try to identify the remaining references
            console.log('\n🔍 Trying to identify remaining references...');

            // Check all tables that might reference PlanID
            const possibleTables = ['UserMemberships', 'Payments', 'PaymentConfirmations', 'PlanTemplates'];

            for (const tableName of possibleTables) {
                try {
                    const refs = await pool.request().query(`
                        SELECT COUNT(*) as count
                        FROM ${tableName}
                        WHERE PlanID IN (
                            SELECT PlanID FROM MembershipPlans 
                            WHERE Name IN ('Basic Plan', 'Pro Plan')
                        )
                    `);

                    if (refs.recordset[0].count > 0) {
                        console.log(`⚠️ Found ${refs.recordset[0].count} references in ${tableName}`);
                    }
                } catch (tableError) {
                    // Table might not have PlanID column, skip
                }
            }
        }

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

        console.log('\n🎉 DELETION PROCESS COMPLETED!');
        console.log('💡 Refresh your browser to see the changes!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (pool) {
            await pool.close();
        }
    }
}

deletePlansSafe(); 