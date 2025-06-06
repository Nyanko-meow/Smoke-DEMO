const sql = require('mssql');

const config = {
    user: 'sa',
    password: '12345',
    server: 'localhost',
    database: 'SMOKEKING',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function createTestPaymentData() {
    let pool;
    try {
        pool = await sql.connect(config);
        console.log('Connected to database');

        // Check if we have any users
        const usersResult = await pool.request().query(`
            SELECT TOP 3 UserID, FirstName, LastName, Email, Role 
            FROM Users 
            WHERE Role IN ('member', 'guest')
        `);

        if (usersResult.recordset.length === 0) {
            console.log('No users found. Creating test users...');

            // Create test users
            await pool.request().query(`
                INSERT INTO Users (Email, Password, FirstName, LastName, Role, IsActive, EmailVerified)
                VALUES 
                ('member1@test.com', '123456', N'Nguyễn', N'Văn A', 'member', 1, 1),
                ('member2@test.com', '123456', N'Trần', N'Thị B', 'member', 1, 1),
                ('guest1@test.com', '123456', N'Lê', N'Văn C', 'guest', 1, 1)
            `);
            console.log('Test users created');
        }

        // Check if we have membership plans
        const plansResult = await pool.request().query(`
            SELECT TOP 3 PlanID, Name, Price, Duration
            FROM MembershipPlans
        `);

        if (plansResult.recordset.length === 0) {
            console.log('No membership plans found. Creating test plans...');

            // Create test membership plans
            await pool.request().query(`
                INSERT INTO MembershipPlans (Name, Description, Price, Duration, Features)
                VALUES 
                (N'Gói Cơ Bản', N'Gói cơ bản cho người mới bắt đầu', 299000, 30, N'Tư vấn cơ bản, Theo dõi tiến độ'),
                (N'Gói Nâng Cao', N'Gói nâng cao với nhiều tính năng', 599000, 60, N'Tư vấn chuyên sâu, Theo dõi tiến độ, Chat với coach'),
                (N'Gói Premium', N'Gói cao cấp với đầy đủ tính năng', 999000, 90, N'Tư vấn VIP, Theo dõi tiến độ, Chat 24/7, Hỗ trợ cá nhân')
            `);
            console.log('Test membership plans created');
        }

        // Get users and plans for creating test payments
        const testUsersResult = await pool.request().query(`
            SELECT TOP 3 UserID, FirstName, LastName 
            FROM Users 
            WHERE Role IN ('member', 'guest')
        `);

        const testPlansResult = await pool.request().query(`
            SELECT TOP 3 PlanID, Name, Price 
            FROM MembershipPlans
        `);

        const users = testUsersResult.recordset;
        const plans = testPlansResult.recordset;

        if (users.length > 0 && plans.length > 0) {
            console.log('Creating test pending payments...');

            // Create test pending payments
            for (let i = 0; i < Math.min(users.length, 3); i++) {
                const user = users[i];
                const plan = plans[i % plans.length];

                await pool.request()
                    .input('UserID', user.UserID)
                    .input('PlanID', plan.PlanID)
                    .input('Amount', plan.Price)
                    .input('PaymentMethod', i % 2 === 0 ? 'BankTransfer' : 'Cash')
                    .input('TransactionID', `TEST-${Date.now()}-${i}`)
                    .input('Status', 'pending')
                    .query(`
                        INSERT INTO Payments (UserID, PlanID, Amount, PaymentMethod, TransactionID, Status, PaymentDate)
                        VALUES (@UserID, @PlanID, @Amount, @PaymentMethod, @TransactionID, @Status, GETDATE())
                    `);

                console.log(`Created pending payment for ${user.FirstName} ${user.LastName} - ${plan.Name}`);
            }

            // Create some confirmed payments for history
            await pool.request()
                .input('UserID', users[0].UserID)
                .input('PlanID', plans[0].PlanID)
                .input('Amount', plans[0].Price)
                .input('PaymentMethod', 'BankTransfer')
                .input('TransactionID', `CONFIRMED-${Date.now()}`)
                .input('Status', 'confirmed')
                .query(`
                    INSERT INTO Payments (UserID, PlanID, Amount, PaymentMethod, TransactionID, Status, PaymentDate)
                    VALUES (@UserID, @PlanID, @Amount, @PaymentMethod, @TransactionID, @Status, DATEADD(day, -7, GETDATE()))
                `);

            console.log('Created confirmed payment for payment history');
        }

        console.log('Test payment data created successfully!');

    } catch (error) {
        console.error('Error creating test data:', error);
    } finally {
        if (pool) {
            await pool.close();
        }
    }
}

// Run the setup
createTestPaymentData(); 