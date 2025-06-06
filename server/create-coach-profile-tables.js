const sql = require('mssql');

const config = {
    server: 'localhost',
    database: 'SMOKEKING',
    options: {
        encrypt: false,
        trustServerCertificate: true
    },
    authentication: {
        type: 'default',
        options: {
            userName: 'sa',
            password: '12345'
        }
    }
};

async function createCoachProfileTables() {
    try {
        await sql.connect(config);
        console.log('🔌 Connected to database');

        // Create CoachProfiles table
        console.log('📋 Creating CoachProfiles table...');
        await sql.query`
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'CoachProfiles')
            BEGIN
                CREATE TABLE CoachProfiles (
                    ProfileID INT IDENTITY(1,1) PRIMARY KEY,
                    UserID INT NOT NULL,
                    Specialization NVARCHAR(255),
                    YearsOfExperience INT DEFAULT 0,
                    Education NVARCHAR(MAX),
                    Certifications NVARCHAR(MAX),
                    License NVARCHAR(255),
                    Bio NVARCHAR(MAX),
                    Methodology NVARCHAR(MAX),
                    SuccessStory NVARCHAR(MAX),
                    Languages NVARCHAR(255),
                    CommunicationStyle NVARCHAR(255),
                    WorkingHours NVARCHAR(255),
                    Website NVARCHAR(500),
                    LinkedIn NVARCHAR(500),
                    HourlyRate DECIMAL(10,2),
                    ConsultationFee DECIMAL(10,2),
                    ServicesOffered NVARCHAR(MAX),
                    TotalClientsServed INT DEFAULT 0,
                    SuccessRate DECIMAL(5,2) DEFAULT 0.0,
                    AverageRating DECIMAL(3,2) DEFAULT 0.0,
                    IsVerified BIT DEFAULT 0,
                    CreatedAt DATETIME DEFAULT GETDATE(),
                    UpdatedAt DATETIME DEFAULT GETDATE(),

                    FOREIGN KEY (UserID) REFERENCES Users(UserID)
                )
            END
        `;
        console.log('✅ CoachProfiles table created successfully');

        // Create CoachReviews table
        console.log('📋 Creating CoachReviews table...');
        await sql.query`
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'CoachReviews')
            BEGIN
                CREATE TABLE CoachReviews (
                    ReviewID INT IDENTITY(1,1) PRIMARY KEY,
                    CoachUserID INT NOT NULL,
                    ClientUserID INT NULL,
                    ClientName NVARCHAR(255),
                    ReviewTitle NVARCHAR(255),
                    ReviewContent NVARCHAR(MAX),
                    Rating INT CHECK (Rating BETWEEN 1 AND 5),
                    IsAnonymous BIT DEFAULT 0,
                    IsPublic BIT DEFAULT 1,
                    CreatedAt DATETIME DEFAULT GETDATE(),

                    FOREIGN KEY (CoachUserID) REFERENCES Users(UserID),
                    FOREIGN KEY (ClientUserID) REFERENCES Users(UserID)
                )
            END
        `;
        console.log('✅ CoachReviews table created successfully');

        // Get the coach user ID
        const coachResult = await sql.query`
            SELECT UserID FROM Users WHERE Email = 'coach@example.com' AND Role = 'coach'
        `;

        if (coachResult.recordset.length === 0) {
            console.log('❌ No coach found with email coach@example.com');
            return;
        }

        const coachId = coachResult.recordset[0].UserID;
        console.log(`👤 Found coach with ID: ${coachId}`);

        // Check if coach already has a profile
        const existingProfile = await sql.query`
            SELECT ProfileID FROM CoachProfiles WHERE UserID = ${coachId}
        `;

        if (existingProfile.recordset.length > 0) {
            console.log('ℹ️  Coach already has a profile, updating...');
            await sql.query`
                UPDATE CoachProfiles SET 
                    Specialization = N'Chuyên gia cai thuốc lá',
                    YearsOfExperience = 8,
                    Education = N'Thạc sĩ Tâm lý học, Đại học Quốc gia Hà Nội\nCử nhân Y khoa, Đại học Y Hà Nội',
                    Certifications = N'Chứng chỉ Tư vấn cai thuốc quốc tế (CTTS)\nChứng chỉ Tâm lý trị liệu hành vi nhận thức (CBT)\nChứng chỉ Huấn luyện viên sức khỏe cộng đồng',
                    License = 'PSY-2024-HN-12345',
                    Bio = N'Tôi là Huấn luyện viên chuyên nghiệp với hơn 8 năm kinh nghiệm giúp mọi người cai thuốc lá thành công. Đã hỗ trợ hơn 500 khách hàng đạt được mục tiêu sống khỏe mạnh không thuốc lá.\n\nPhương pháp của tôi kết hợp tâm lý học hành vi, kỹ thuật thư giãn và xây dựng thói quen tích cực. Tôi tin rằng mỗi người đều có thể cai thuốc thành công với sự hỗ trợ phù hợp.',
                    Methodology = N'Phương pháp 4 bước STOP của tôi:\n1. S - Set (Đặt mục tiêu rõ ràng)\n2. T - Track (Theo dõi tiến trình hàng ngày)\n3. O - Overcome (Vượt qua khó khăn với kỹ thuật CBT)\n4. P - Persist (Duy trì thành quả lâu dài)\n\nKết hợp với:\n- Tư vấn tâm lý cá nhân\n- Nhóm hỗ trợ cộng đồng\n- Ứng dụng công nghệ theo dõi',
                    SuccessStory = N'Một trong những thành công đáng nhớ nhất là anh Minh - một kỹ sư IT đã hút thuốc 15 năm, 2 bao/ngày. Sau 3 tháng áp dụng phương pháp của tôi, anh đã cai thuốc hoàn toàn và duy trì được 2 năm. Anh chia sẻ: "Tôi không chỉ cai được thuốc mà còn tìm lại được sức khỏe và tự tin trong cuộc sống."',
                    Languages = N'Tiếng Việt (Bản ngữ), Tiếng Anh (Lưu loát)',
                    CommunicationStyle = N'Thân thiện, kiên nhẫn, tích cực và luôn lắng nghe',
                    WorkingHours = N'Thứ 2 - Thứ 6: 8:00 - 17:00\nThứ 7: 9:00 - 12:00\nChủ nhật: Nghỉ (trừ trường hợp khẩn cấp)',
                    Website = 'https://caithocla-coach.vn',
                    LinkedIn = 'https://linkedin.com/in/coach-smith-quit-smoking',
                    HourlyRate = 200000,
                    ConsultationFee = 150000,
                    ServicesOffered = N'• Tư vấn cai thuốc cá nhân 1-1\n• Nhóm hỗ trợ cai thuốc\n• Chương trình cai thuốc 30/60/90 ngày\n• Theo dõi và đánh giá tiến trình\n• Tư vấn dinh dưỡng và thể dục\n• Hỗ trợ tâm lý vượt qua khó khăn',
                    TotalClientsServed = 567,
                    SuccessRate = 89.5,
                    AverageRating = 4.8,
                    IsVerified = 1,
                    UpdatedAt = GETDATE()
                WHERE UserID = ${coachId}
            `;
            console.log('✅ Updated existing coach profile');
        } else {
            console.log('📝 Creating new coach profile...');
            await sql.query`
                INSERT INTO CoachProfiles (
                    UserID, Specialization, YearsOfExperience, Education, Certifications, License,
                    Bio, Methodology, SuccessStory, Languages, CommunicationStyle, WorkingHours,
                    Website, LinkedIn, HourlyRate, ConsultationFee, ServicesOffered,
                    TotalClientsServed, SuccessRate, AverageRating, IsVerified
                ) VALUES (
                    ${coachId},
                    N'Chuyên gia cai thuốc lá',
                    8,
                    N'Thạc sĩ Tâm lý học, Đại học Quốc gia Hà Nội\nCử nhân Y khoa, Đại học Y Hà Nội',
                    N'Chứng chỉ Tư vấn cai thuốc quốc tế (CTTS)\nChứng chỉ Tâm lý trị liệu hành vi nhận thức (CBT)\nChứng chỉ Huấn luyện viên sức khỏe cộng đồng',
                    'PSY-2024-HN-12345',
                    N'Tôi là Huấn luyện viên chuyên nghiệp với hơn 8 năm kinh nghiệm giúp mọi người cai thuốc lá thành công. Đã hỗ trợ hơn 500 khách hàng đạt được mục tiêu sống khỏe mạnh không thuốc lá.\n\nPhương pháp của tôi kết hợp tâm lý học hành vi, kỹ thuật thư giãn và xây dựng thói quen tích cực. Tôi tin rằng mỗi người đều có thể cai thuốc thành công với sự hỗ trợ phù hợp.',
                    N'Phương pháp 4 bước STOP của tôi:\n1. S - Set (Đặt mục tiêu rõ ràng)\n2. T - Track (Theo dõi tiến trình hàng ngày)\n3. O - Overcome (Vượt qua khó khăn với kỹ thuật CBT)\n4. P - Persist (Duy trì thành quả lâu dài)\n\nKết hợp với:\n- Tư vấn tâm lý cá nhân\n- Nhóm hỗ trợ cộng đồng\n- Ứng dụng công nghệ theo dõi',
                    N'Một trong những thành công đáng nhớ nhất là anh Minh - một kỹ sư IT đã hút thuốc 15 năm, 2 bao/ngày. Sau 3 tháng áp dụng phương pháp của tôi, anh đã cai thuốc hoàn toàn và duy trì được 2 năm. Anh chia sẻ: "Tôi không chỉ cai được thuốc mà còn tìm lại được sức khỏe và tự tin trong cuộc sống."',
                    N'Tiếng Việt (Bản ngữ), Tiếng Anh (Lưu loát)',
                    N'Thân thiện, kiên nhẫn, tích cực và luôn lắng nghe',
                    N'Thứ 2 - Thứ 6: 8:00 - 17:00\nThứ 7: 9:00 - 12:00\nChủ nhật: Nghỉ (trừ trường hợp khẩn cấp)',
                    'https://caithocla-coach.vn',
                    'https://linkedin.com/in/coach-smith-quit-smoking',
                    200000,
                    150000,
                    N'• Tư vấn cai thuốc cá nhân 1-1\n• Nhóm hỗ trợ cai thuốc\n• Chương trình cai thuốc 30/60/90 ngày\n• Theo dõi và đánh giá tiến trình\n• Tư vấn dinh dưỡng và thể dục\n• Hỗ trợ tâm lý vượt qua khó khăn',
                    567,
                    89.5,
                    4.8,
                    1
                )
            `;
            console.log('✅ Created new coach profile');
        }

        // Add some sample reviews
        console.log('📝 Adding sample reviews...');
        const existingReviews = await sql.query`
            SELECT COUNT(*) as ReviewCount FROM CoachReviews WHERE CoachUserID = ${coachId}
        `;

        if (existingReviews.recordset[0].ReviewCount === 0) {
            await sql.query`
                INSERT INTO CoachReviews (CoachUserID, ClientName, ReviewTitle, ReviewContent, Rating, IsAnonymous, IsPublic) VALUES 
                (${coachId}, N'Anh Minh T.', N'Cai thuốc thành công sau 15 năm hút!', N'Tôi đã hút thuốc 15 năm và thử nhiều cách nhưng không thành công. Nhờ sự hỗ trợ tận tình của coach, tôi đã cai được thuốc hoàn toàn sau 3 tháng. Coach rất kiên nhẫn và phương pháp rất hiệu quả!', 5, 0, 1),
                (${coachId}, N'Chị Lan H.', N'Phương pháp khoa học và hiệu quả', N'Phương pháp của coach kết hợp tâm lý học và thực hành, rất dễ áp dụng. Tôi đã giảm từ 20 điếu/ngày xuống 0 trong 2 tháng. Cảm ơn coach rất nhiều!', 5, 0, 1),
                (${coachId}, N'Anh Nam K.', N'Chuyên nghiệp và tận tâm', N'Coach luôn theo dõi sát sao và động viên khi tôi gặp khó khăn. Nhờ có coach mà tôi đã vượt qua được giai đoạn khó khăn nhất và giờ đã cai thuốc được 6 tháng.', 5, 0, 1),
                (${coachId}, N'Chị Thu P.', N'Thay đổi cuộc sống của tôi', N'Không chỉ giúp tôi cai thuốc, coach còn giúp tôi xây dựng lối sống lành mạnh. Sức khỏe và tinh thần tôi đã tốt hơn rất nhiều. Rất biết ơn coach!', 4, 0, 1),
                (${coachId}, N'Anh Dũng L.', N'Kết quả vượt mong đợi', N'Ban đầu tôi rất hoài nghi, nhưng sau khi làm việc với coach, tôi thực sự tin tưởng. Phương pháp rất khoa học và phù hợp với từng người.', 4, 0, 1)
            `;
            console.log('✅ Added sample reviews');
        } else {
            console.log('ℹ️  Reviews already exist, skipping...');
        }

        // Update average rating in profile
        const avgRating = await sql.query`
            SELECT AVG(CAST(Rating AS FLOAT)) as AvgRating, COUNT(*) as ReviewCount
            FROM CoachReviews 
            WHERE CoachUserID = ${coachId} AND IsPublic = 1
        `;

        if (avgRating.recordset.length > 0) {
            const rating = avgRating.recordset[0].AvgRating || 0;
            await sql.query`
                UPDATE CoachProfiles 
                SET AverageRating = ${rating}
                WHERE UserID = ${coachId}
            `;
            console.log(`✅ Updated average rating to: ${rating.toFixed(1)}`);
        }

        console.log('\n🎉 Coach profile tables and data setup complete!');
        console.log('📋 What was created/updated:');
        console.log('   ✅ CoachProfiles table');
        console.log('   ✅ CoachReviews table');
        console.log('   ✅ Coach profile data for coach@example.com');
        console.log('   ✅ Sample reviews and ratings');
        console.log('\n🌐 Now you can login as coach and see full profile information!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sql.close();
    }
}

createCoachProfileTables(); 