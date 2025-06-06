const { pool, connectDB } = require('./src/config/database');

async function checkPlans() {
    try {
        console.log('🔍 CHECKING CURRENT MEMBERSHIP PLANS');
        console.log('====================================\n');

        await connectDB();
        console.log('✅ Database connected\n');

        const result = await pool.request().query(`
            SELECT PlanID, Name, Price, Duration, Features
            FROM MembershipPlans
            ORDER BY PlanID
        `);

        console.log('📋 Current membership plans:');
        if (result.recordset.length > 0) {
            result.recordset.forEach((plan, index) => {
                console.log(`${index + 1}. ID: ${plan.PlanID}`);
                console.log(`   Name: ${plan.Name}`);
                console.log(`   Price: ${plan.Price.toLocaleString('vi-VN')} VNĐ`);
                console.log(`   Duration: ${plan.Duration} days`);
                console.log(`   Features: ${plan.Features}`);
                console.log('');
            });
        } else {
            console.log('   (No plans found)');
        }

        console.log(`📊 Total plans: ${result.recordset.length}`);

        // Check if Pro Plan still exists
        const proPlan = result.recordset.find(plan => plan.Name === 'Pro Plan');
        if (proPlan) {
            console.log('\n⚠️ PRO PLAN STILL EXISTS!');
            console.log('🗑️ Need to delete it...');
        } else {
            console.log('\n✅ Pro Plan not found - already deleted!');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (pool) {
            await pool.close();
        }
    }
}

checkPlans(); 