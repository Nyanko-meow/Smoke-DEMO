const { pool, connectDB } = require('./server/src/config/database');

async function createCoachAccount() {
    try {
        console.log('🔧 Creating coach account...');

        // Connect to database
        await connectDB();

        const coachEmail = 'coach@smokeking.com';
        const coachPassword = 'coach123';

        // Check if coach already exists
        const existingCoach = await pool.request()
            .input('Email', coachEmail)
            .query('SELECT UserID FROM Users WHERE Email = @Email');

        if (existingCoach.recordset.length > 0) {
            console.log('✅ Coach account already exists:', coachEmail);
            return;
        }

        // Create coach account
        const result = await pool.request()
            .input('Email', coachEmail)
            .input('Password', coachPassword)
            .input('FirstName', 'Coach')
            .input('LastName', 'Smith')
            .input('Role', 'coach')
            .query(`
                INSERT INTO Users (Email, Password, FirstName, LastName, Role, IsActive, EmailVerified, CreatedAt, UpdatedAt)
                OUTPUT INSERTED.UserID
                VALUES (@Email, @Password, @FirstName, @LastName, @Role, 1, 1, GETDATE(), GETDATE())
            `);

        const userId = result.recordset[0].UserID;
        console.log('✅ Coach account created successfully!');
        console.log('   Email:', coachEmail);
        console.log('   Password:', coachPassword);
        console.log('   UserID:', userId);

        // Create basic coach profile
        await pool.request()
            .input('UserID', userId)
            .input('Specialization', 'Addiction Recovery Specialist')
            .input('YearsOfExperience', 5)
            .input('Bio', 'Experienced coach specializing in smoking cessation')
            .query(`
                INSERT INTO CoachProfiles (UserID, Specialization, YearsOfExperience, Bio, CreatedAt, UpdatedAt)
                VALUES (@UserID, @Specialization, @YearsOfExperience, @Bio, GETDATE(), GETDATE())
            `);

        console.log('✅ Coach profile created!');

    } catch (error) {
        console.error('❌ Error creating coach account:', error);
    }
}

createCoachAccount(); 