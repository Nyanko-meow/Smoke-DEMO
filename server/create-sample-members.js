const bcrypt = require('bcryptjs');
const { pool, connectDB } = require('./src/config/database');

async function createSampleMembers() {
    try {
        console.log('🚀 Creating sample members...');

        // Connect to database
        await connectDB();

        // Sample members data
        const sampleMembers = [
            {
                email: 'member1@example.com',
                password: 'H12345678@',
                firstName: 'Nguyễn',
                lastName: 'Văn A',
                role: 'member',
                phoneNumber: '0901234567',
                address: '123 Đường ABC, Quận 1, TP.HCM'
            },
            {
                email: 'member2@example.com',
                password: 'H12345678@',
                firstName: 'Trần',
                lastName: 'Thị B',
                role: 'member',
                phoneNumber: '0902345678',
                address: '456 Đường DEF, Quận 2, TP.HCM'
            },
            {
                email: 'guest1@example.com',
                password: 'H12345678@',
                firstName: 'Lê',
                lastName: 'Văn C',
                role: 'guest',
                phoneNumber: '0903456789',
                address: '789 Đường GHI, Quận 3, TP.HCM'
            },
            {
                email: 'guest2@example.com',
                password: 'H12345678@',
                firstName: 'Phạm',
                lastName: 'Thị D',
                role: 'guest',
                phoneNumber: '0904567890',
                address: '321 Đường JKL, Quận 4, TP.HCM'
            },
            {
                email: 'member3@example.com',
                password: 'H12345678@',
                firstName: 'Hoàng',
                lastName: 'Văn E',
                role: 'member',
                phoneNumber: '0905678901',
                address: '654 Đường MNO, Quận 5, TP.HCM'
            }
        ];

        for (const member of sampleMembers) {
            // Check if user already exists
            const existingUser = await pool.request()
                .input('email', member.email)
                .query('SELECT UserID FROM Users WHERE Email = @email');

            if (existingUser.recordset.length > 0) {
                console.log(`✅ User ${member.email} already exists`);
                continue;
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(member.password, 10);

            // Create user
            const userResult = await pool.request()
                .input('email', member.email)
                .input('password', hashedPassword)
                .input('firstName', member.firstName)
                .input('lastName', member.lastName)
                .input('role', member.role)
                .input('phoneNumber', member.phoneNumber)
                .input('address', member.address)
                .query(`
                    INSERT INTO Users (Email, Password, FirstName, LastName, Role, PhoneNumber, Address, IsActive, EmailVerified, CreatedAt, UpdatedAt)
                    OUTPUT INSERTED.UserID
                    VALUES (@email, @password, @firstName, @lastName, @role, @phoneNumber, @address, 1, 1, GETDATE(), GETDATE())
                `);

            const userId = userResult.recordset[0].UserID;
            console.log(`✅ Created user: ${member.email} (ID: ${userId})`);

            // Add some sample progress data
            if (Math.random() > 0.5) {
                await pool.request()
                    .input('userId', userId)
                    .input('date', new Date())
                    .input('cigarettesSmoked', Math.floor(Math.random() * 5))
                    .input('cravingLevel', Math.floor(Math.random() * 10) + 1)
                    .input('daysSmokeFree', Math.floor(Math.random() * 30))
                    .input('moneySaved', Math.floor(Math.random() * 500000))
                    .query(`
                        INSERT INTO ProgressTracking (UserID, Date, CigarettesSmoked, CravingLevel, DaysSmokeFree, MoneySaved, CreatedAt)
                        VALUES (@userId, @date, @cigarettesSmoked, @cravingLevel, @daysSmokeFree, @moneySaved, GETDATE())
                    `);
                console.log(`  ➕ Added progress data for ${member.email}`);
            }

            // Add membership for some users
            if (member.role === 'member' && Math.random() > 0.3) {
                const planId = Math.floor(Math.random() * 3) + 1; // Random plan 1-3
                const startDate = new Date();
                const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

                await pool.request()
                    .input('userId', userId)
                    .input('planId', planId)
                    .input('startDate', startDate)
                    .input('endDate', endDate)
                    .query(`
                        INSERT INTO UserMemberships (UserID, PlanID, StartDate, EndDate, Status, CreatedAt)
                        VALUES (@userId, @planId, @startDate, @endDate, 'active', GETDATE())
                    `);
                console.log(`  ➕ Added membership (Plan ${planId}) for ${member.email}`);
            }

            // Add quit plan for some users
            if (Math.random() > 0.4) {
                const startDate = new Date();
                const targetDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days from now

                await pool.request()
                    .input('userId', userId)
                    .input('startDate', startDate)
                    .input('targetDate', targetDate)
                    .input('reason', 'Muốn có sức khỏe tốt hơn')
                    .input('motivationLevel', Math.floor(Math.random() * 5) + 6) // 6-10
                    .query(`
                        INSERT INTO QuitPlans (UserID, StartDate, TargetDate, Reason, MotivationLevel, Status, CreatedAt)
                        VALUES (@userId, @startDate, @targetDate, @reason, @motivationLevel, 'active', GETDATE())
                    `);
                console.log(`  ➕ Added quit plan for ${member.email}`);
            }

            // Add some achievements
            if (Math.random() > 0.6) {
                const achievementIds = [1, 2]; // First day and first week achievements
                for (const achievementId of achievementIds) {
                    await pool.request()
                        .input('userId', userId)
                        .input('achievementId', achievementId)
                        .query(`
                            INSERT INTO UserAchievements (UserID, AchievementID, EarnedAt)
                            VALUES (@userId, @achievementId, GETDATE())
                        `);
                }
                console.log(`  ➕ Added achievements for ${member.email}`);
            }
        }

        console.log('\n🎉 Sample members created successfully!');
        console.log('💡 You can now test the coach dashboard with member data');

    } catch (error) {
        console.error('❌ Error creating sample members:', error);
    } finally {
        process.exit(0);
    }
}

// Run the script
createSampleMembers(); 