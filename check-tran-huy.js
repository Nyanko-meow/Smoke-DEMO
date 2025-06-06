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

async function checkTranHuy() {
    try {
        await sql.connect(config);
        console.log('🔍 Checking for Tran Huy user...');

        // Check if user exists
        const userQuery = `
            SELECT UserID, FirstName, LastName, Email, Role, IsActive 
            FROM Users 
            WHERE Email = 'leghenkiz@gmail.com' OR FirstName = 'Tran' OR LastName = 'Huy'
        `;
        const userResult = await sql.query(userQuery);
        console.log('👤 Users found:', userResult.recordset);

        if (userResult.recordset.length > 0) {
            const userId = userResult.recordset[0].UserID;

            // Check survey data
            const surveyQuery = `
                SELECT * FROM UserSurveys WHERE UserID = ${userId}
            `;
            const surveyResult = await sql.query(surveyQuery);
            console.log('📋 Survey data:', surveyResult.recordset);

            // Check admin survey view
            const adminQuery = `
                SELECT 
                    u.UserID,
                    u.FirstName + ' ' + u.LastName as FullName,
                    u.Email,
                    u.Role,
                    us.SurveyID,
                    us.QuestionsAnswered,
                    us.LastUpdated,
                    us.CreatedAt
                FROM Users u
                LEFT JOIN UserSurveys us ON u.UserID = us.UserID
                WHERE u.UserID = ${userId}
            `;
            const adminResult = await sql.query(adminQuery);
            console.log('🎯 Admin view data:', adminResult.recordset);

            // If no survey data, create it
            if (surveyResult.recordset.length === 0) {
                console.log('📝 Creating survey data for Tran Huy...');

                const createSurveyQuery = `
                    INSERT INTO UserSurveys (UserID, QuestionsAnswered, LastUpdated, CreatedAt)
                    VALUES (${userId}, 10, GETDATE(), GETDATE())
                `;
                await sql.query(createSurveyQuery);
                console.log('✅ Survey data created successfully');
            }
        } else {
            console.log('❌ User Tran Huy not found. Creating user...');

            // Create the user
            const createUserQuery = `
                INSERT INTO Users (Email, PasswordHash, FirstName, LastName, Role, IsActive, EmailVerified, CreatedAt, UpdatedAt)
                VALUES ('leghenkiz@gmail.com', 'H12345678@', 'Tran', 'Huy', 'member', 1, 1, GETDATE(), GETDATE());
                SELECT SCOPE_IDENTITY() as NewUserID;
            `;
            const createResult = await sql.query(createUserQuery);
            const newUserId = createResult.recordset[0].NewUserID;
            console.log('✅ User created with ID:', newUserId);

            // Create survey data
            const createSurveyQuery = `
                INSERT INTO UserSurveys (UserID, QuestionsAnswered, LastUpdated, CreatedAt)
                VALUES (${newUserId}, 10, GETDATE(), GETDATE())
            `;
            await sql.query(createSurveyQuery);
            console.log('✅ Survey data created for new user');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sql.close();
    }
}

checkTranHuy(); 