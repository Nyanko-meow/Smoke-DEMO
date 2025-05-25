const { pool } = require('./src/config/database');
const bcrypt = require('bcryptjs');

const fixCoachDashboard = async () => {
    console.log('🚀 FIXING COACH DASHBOARD - COMPLETE SOLUTION');
    console.log('=====================================');

    try {
        // Step 1: Test database connection
        console.log('\n1. 📊 Testing database connection...');

        // Test basic connection
        const testResult = await pool.request().query('SELECT 1 as test');
        console.log('✅ Database connection successful');

        // Step 2: Check if Users table exists
        console.log('\n2. 🗃️ Checking Users table...');
        const tablesResult = await pool.request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'Users'
        `);

        if (tablesResult.recordset.length === 0) {
            console.log('❌ Users table does not exist!');
            console.log('💡 You need to create the database schema first');
            return;
        }
        console.log('✅ Users table exists');

        // Step 3: Check for existing coach
        console.log('\n3. 👨‍⚕️ Checking for existing coach account...');
        const coachCheck = await pool.request()
            .input('Email', 'coach@test.com')
            .input('Role', 'coach')
            .query('SELECT UserID, FirstName, LastName, Role FROM Users WHERE Email = @Email AND Role = @Role');

        let coachId;
        if (coachCheck.recordset.length > 0) {
            coachId = coachCheck.recordset[0].UserID;
            console.log('✅ Coach account exists');
            console.log(`   ID: ${coachId}`);
            console.log(`   Name: ${coachCheck.recordset[0].FirstName} ${coachCheck.recordset[0].LastName}`);
        } else {
            console.log('❌ Coach account does not exist, creating...');

            // Create coach account
            const hashedPassword = await bcrypt.hash('coach123', 10);
            const createResult = await pool.request()
                .input('Email', 'coach@test.com')
                .input('Password', hashedPassword)
                .input('FirstName', 'Dr. Coach')
                .input('LastName', 'Test')
                .input('Role', 'coach')
                .input('IsActive', 1)
                .input('EmailVerified', 1)
                .query(`
                    INSERT INTO Users (
                        Email, Password, FirstName, LastName, Role, 
                        IsActive, EmailVerified, CreatedAt, UpdatedAt
                    )
                    OUTPUT INSERTED.UserID
                    VALUES (
                        @Email, @Password, @FirstName, @LastName, @Role,
                        @IsActive, @EmailVerified, GETDATE(), GETDATE()
                    )
                `);

            coachId = createResult.recordset[0].UserID;
            console.log('✅ Coach account created successfully');
            console.log(`   ID: ${coachId}`);
        }

        // Step 4: Check Consultations table
        console.log('\n4. 📅 Checking Consultations table...');
        const consultationsCheck = await pool.request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'Consultations'
        `);

        if (consultationsCheck.recordset.length === 0) {
            console.log('❌ Consultations table missing, creating...');
            await pool.request().query(`
                CREATE TABLE Consultations (
                    ConsultationID INT IDENTITY(1,1) PRIMARY KEY,
                    UserID INT NOT NULL,
                    CoachID INT NOT NULL,
                    Date DATETIME NOT NULL,
                    Status NVARCHAR(50) DEFAULT 'scheduled',
                    Notes NVARCHAR(MAX),
                    CreatedAt DATETIME DEFAULT GETDATE(),
                    UpdatedAt DATETIME DEFAULT GETDATE(),
                    FOREIGN KEY (UserID) REFERENCES Users(UserID),
                    FOREIGN KEY (CoachID) REFERENCES Users(UserID)
                )
            `);
            console.log('✅ Consultations table created');
        } else {
            console.log('✅ Consultations table exists');
        }

        // Step 5: Create test members if needed
        console.log('\n5. 👥 Checking test members...');
        const membersCheck = await pool.request()
            .input('Role', 'member')
            .query('SELECT COUNT(*) as count FROM Users WHERE Role = @Role');

        if (membersCheck.recordset[0].count === 0) {
            console.log('❌ No members found, creating test members...');
            const hashedPassword = await bcrypt.hash('member123', 10);

            for (let i = 1; i <= 3; i++) {
                const memberResult = await pool.request()
                    .input('Email', `member${i}@test.com`)
                    .input('Password', hashedPassword)
                    .input('FirstName', `Member${i}`)
                    .input('LastName', 'Test')
                    .input('Role', 'member')
                    .input('IsActive', 1)
                    .input('EmailVerified', 1)
                    .query(`
                        INSERT INTO Users (
                            Email, Password, FirstName, LastName, Role, 
                            IsActive, EmailVerified, CreatedAt, UpdatedAt
                        )
                        OUTPUT INSERTED.UserID
                        VALUES (
                            @Email, @Password, @FirstName, @LastName, @Role,
                            @IsActive, @EmailVerified, GETDATE(), GETDATE()
                        )
                    `);

                // Create consultation to link coach with member
                await pool.request()
                    .input('UserID', memberResult.recordset[0].UserID)
                    .input('CoachID', coachId)
                    .input('Date', new Date())
                    .input('Status', 'completed')
                    .input('Notes', `Initial consultation with Member${i}`)
                    .query(`
                        INSERT INTO Consultations (UserID, CoachID, Date, Status, Notes, CreatedAt)
                        VALUES (@UserID, @CoachID, @Date, @Status, @Notes, GETDATE())
                    `);

                console.log(`✅ Created member${i}@test.com and linked to coach`);
            }
        } else {
            console.log(`✅ Found ${membersCheck.recordset[0].count} members`);

            // Check if consultations exist between coach and members
            const consultationsCount = await pool.request()
                .input('CoachID', coachId)
                .query('SELECT COUNT(*) as count FROM Consultations WHERE CoachID = @CoachID');

            if (consultationsCount.recordset[0].count === 0) {
                console.log('❌ No consultations found, creating test consultations...');

                // Get some members
                const members = await pool.request()
                    .input('Role', 'member')
                    .query('SELECT TOP 3 UserID FROM Users WHERE Role = @Role');

                for (const member of members.recordset) {
                    await pool.request()
                        .input('UserID', member.UserID)
                        .input('CoachID', coachId)
                        .input('Date', new Date())
                        .input('Status', 'completed')
                        .input('Notes', 'Test consultation session')
                        .query(`
                            INSERT INTO Consultations (UserID, CoachID, Date, Status, Notes, CreatedAt)
                            VALUES (@UserID, @CoachID, @Date, @Status, @Notes, GETDATE())
                        `);
                }
                console.log('✅ Created test consultations');
            } else {
                console.log(`✅ Found ${consultationsCount.recordset[0].count} consultations`);
            }
        }

        // Step 6: Verify coach endpoints will work
        console.log('\n6. 🔧 Verifying coach data...');

        // Test coach profile query
        const profileTest = await pool.request()
            .input('UserID', coachId)
            .query(`
                SELECT u.*, 
                       (SELECT COUNT(*) FROM Consultations c WHERE c.CoachID = u.UserID) as TotalConsultations,
                       (SELECT COUNT(*) FROM Consultations c WHERE c.CoachID = u.UserID AND c.Status = 'completed') as CompletedConsultations
                FROM Users u
                WHERE u.UserID = @UserID
            `);

        console.log('✅ Coach profile query working');
        console.log(`   Total consultations: ${profileTest.recordset[0].TotalConsultations}`);

        // Test coach members query  
        const membersTest = await pool.request()
            .input('CoachID', coachId)
            .query(`
                SELECT COUNT(*) as count
                FROM Users u
                WHERE u.Role = 'member'
                AND EXISTS (
                    SELECT 1 FROM Consultations c 
                    WHERE c.UserID = u.UserID AND c.CoachID = @CoachID
                )
            `);

        console.log('✅ Coach members query working');
        console.log(`   Members assigned: ${membersTest.recordset[0].count}`);

        // Success summary
        console.log('\n🎉 COACH DASHBOARD FIX COMPLETED!');
        console.log('=====================================');
        console.log('📧 Coach Login: coach@test.com');
        console.log('🔐 Password: coach123');
        console.log('🌐 Server should run on: http://localhost:4000');
        console.log('🎯 Frontend: http://localhost:3000/coach-login');
        console.log('\n📋 Next steps:');
        console.log('1. Start server: npm start');
        console.log('2. Start frontend: cd ../client && npm start');
        console.log('3. Login at: http://localhost:3000/coach-login');
        console.log('4. Access dashboard: http://localhost:3000/coach/dashboard');

    } catch (error) {
        console.error('❌ Fix failed:', error);
        console.log('\n💡 Troubleshooting:');
        console.log('- Make sure SQL Server is running');
        console.log('- Check database connection in src/config/database.js');
        console.log('- Verify database name and credentials');
    } finally {
        process.exit(0);
    }
};

// Run the fix
fixCoachDashboard(); 