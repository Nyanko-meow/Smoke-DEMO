const { pool, connectDB } = require('./src/config/database');

async function enhanceCoachProfile() {
    try {
        console.log('🚀 Enhancing coach profile with professional information...');

        // Connect to database
        await connectDB();

        // 1. Create CoachProfiles table
        console.log('📋 Creating CoachProfiles table...');

        await pool.request().query(`
            -- Check if table exists and drop if it does
            IF OBJECT_ID('CoachProfiles', 'U') IS NOT NULL
                DROP TABLE CoachProfiles;
        `);

        await pool.request().query(`
            CREATE TABLE CoachProfiles (
                ProfileID INT IDENTITY(1,1) PRIMARY KEY,
                UserID INT NOT NULL,
                
                -- Professional Information
                Specialization NVARCHAR(255), -- Chuyên môn (e.g., "Addiction Recovery", "Behavioral Therapy")
                YearsOfExperience INT DEFAULT 0, -- Số năm kinh nghiệm
                Education NVARCHAR(500), -- Học vấn/bằng cấp
                Certifications NVARCHAR(MAX), -- Chứng chỉ chuyên môn
                License NVARCHAR(200), -- Giấy phép hành nghề
                
                -- Professional Description
                Bio NVARCHAR(MAX), -- Giới thiệu bản thân
                Methodology NVARCHAR(MAX), -- Phương pháp làm việc
                SuccessStory NVARCHAR(MAX), -- Câu chuyện thành công
                
                -- Statistics & Performance
                TotalClientsServed INT DEFAULT 0, -- Tổng số clients đã hỗ trợ
                SuccessRate DECIMAL(5,2) DEFAULT 0.00, -- Tỷ lệ thành công (%)
                AverageRating DECIMAL(3,2) DEFAULT 0.00, -- Đánh giá trung bình (1-5)
                TotalReviews INT DEFAULT 0, -- Tổng số đánh giá
                
                -- Languages & Communication
                Languages NVARCHAR(255), -- Ngôn ngữ hỗ trợ (e.g., "Vietnamese, English")
                CommunicationStyle NVARCHAR(MAX), -- Phong cách giao tiếp
                
                -- Availability & Working Hours
                WorkingHours NVARCHAR(500), -- Giờ làm việc
                TimeZone NVARCHAR(50), -- Múi giờ
                MaxClientsPerMonth INT DEFAULT 10, -- Số clients tối đa/tháng
                
                -- Contact & Social Media
                Website NVARCHAR(255), -- Website cá nhân
                LinkedIn NVARCHAR(255), -- LinkedIn profile
                Facebook NVARCHAR(255), -- Facebook page
                Instagram NVARCHAR(255), -- Instagram
                
                -- Pricing & Services
                HourlyRate DECIMAL(10,2), -- Giá theo giờ
                ConsultationFee DECIMAL(10,2), -- Phí tư vấn
                ServicesOffered NVARCHAR(MAX), -- Dịch vụ cung cấp
                
                -- Metadata
                IsVerified BIT DEFAULT 0, -- Đã xác minh chuyên môn
                IsActive BIT DEFAULT 1, -- Đang hoạt động
                ProfileCompleteness INT DEFAULT 0, -- % hoàn thiện profile (0-100)
                CreatedAt DATETIME DEFAULT GETDATE(),
                UpdatedAt DATETIME DEFAULT GETDATE(),
                
                FOREIGN KEY (UserID) REFERENCES Users(UserID),
                UNIQUE(UserID) -- Mỗi coach chỉ có 1 profile
            );
        `);

        console.log('✅ CoachProfiles table created successfully');

        // 2. Add sample professional data for existing coach
        console.log('👨‍⚕️ Adding professional data for coach@example.com...');

        // Get coach UserID
        const coachResult = await pool.request()
            .input('email', 'coach@example.com')
            .query('SELECT UserID FROM Users WHERE Email = @email AND Role = \'coach\'');

        if (coachResult.recordset.length === 0) {
            console.log('❌ Coach not found! Please run fix-coach-password.js first');
            return;
        }

        const coachUserId = coachResult.recordset[0].UserID;

        // Insert comprehensive coach profile
        await pool.request()
            .input('userId', coachUserId)
            .query(`
                INSERT INTO CoachProfiles (
                    UserID, Specialization, YearsOfExperience, Education, Certifications, License,
                    Bio, Methodology, SuccessStory, TotalClientsServed, SuccessRate, AverageRating, TotalReviews,
                    Languages, CommunicationStyle, WorkingHours, TimeZone, MaxClientsPerMonth,
                    Website, LinkedIn, HourlyRate, ConsultationFee, ServicesOffered, IsVerified, ProfileCompleteness
                ) VALUES (
                    @userId,
                    N'Addiction Recovery & Behavioral Therapy',
                    8,
                    N'Thạc sĩ Tâm lý học - Đại học Y Hà Nội (2016), Cử nhân Tâm lý học - ĐH Khoa học Xã hội và Nhân văn (2014)',
                    N'Chứng chỉ Tư vấn Cai nghiện thuốc lá (WHO 2018), Chứng chỉ Liệu pháp Hành vi Nhận thức (CBT 2019), Chứng chỉ Mindfulness Coach (2020), Chứng chỉ Động lực Phỏng vấn (MI 2021)',
                    N'GP-2024-VN-001234 - Giấy phép hành nghề Tâm lý lâm sàng',
                    N'Tôi là Coach Smith với hơn 8 năm kinh nghiệm chuyên sâu trong lĩnh vực hỗ trợ cai thuốc lá và liệu pháp hành vi. Với sự kết hợp giữa kiến thức chuyên môn vững chắc và trái tim nhân ái, tôi đã đồng hành cùng hơn 500 người trên hành trình thoát khỏi tệ nạn thuốc lá. Triết lý của tôi là "Mỗi người đều có khả năng thay đổi, chỉ cần có phương pháp phù hợp và sự hỗ trợ đúng cách".',
                    N'Tôi áp dụng phương pháp tích hợp đa dạng: Liệu pháp Hành vi Nhận thức (CBT) để thay đổi tư duy và hành vi, Động lực Phỏng vấn (MI) để khơi dậy động lực nội tại, Mindfulness để quản lý stress và cơn thèm, kết hợp với kỹ thuật thay thế thói quen và xây dựng lối sống lành mạnh. Mỗi kế hoạch đều được cá nhân hóa dựa trên đặc điểm, hoàn cảnh và mục tiêu của từng người.',
                    N'Trường hợp ấn tượng nhất là anh Minh (35 tuổi) - một người hút 2 bao/ngày trong 15 năm. Sau 6 tháng đồng hành, anh đã hoàn toàn cai được thuốc và duy trì được 3 năm đến nay. Không chỉ vậy, anh còn trở thành volunteer hỗ trợ những người khác trong cộng đồng. Điều này cho tôi thấy sức mạnh lan tỏa của việc chữa lành.',
                    520,
                    87.50,
                    4.8,
                    156,
                    N'Tiếng Việt (bản ngữ), English (thành thạo), 中文 (cơ bản)',
                    N'Tôi tin vào sức mạnh của lắng nghe và thấu hiểu. Phong cách của tôi là thân thiện, không phán xét, luôn khuyến khích và tạo không gian an toàn để thân chủ chia sẻ. Tôi sử dụng ngôn ngữ tích cực, câu hỏi mở để khơi dậy sự tự nhận thức và cam kết thay đổi từ chính bản thân họ.',
                    N'Thứ 2-6: 8:00-17:00, Thứ 7: 9:00-15:00, Chủ nhật: Nghỉ (trừ trường hợp khẩn cấp)',
                    N'UTC+7 (Giờ Việt Nam)',
                    25,
                    N'https://coachsmith-quitlive.com',
                    N'https://linkedin.com/in/coach-smith-vietnam',
                    750000,
                    200000,
                    N'Tư vấn cai thuốc lá 1-1, Liệu pháp nhóm, Workshop về quản lý stress, Chương trình cai thuốc 30/60/90 ngày, Hỗ trợ sau cai thuốc, Tư vấn gia đình, Đào tạo kỹ năng sống lành mạnh',
                    1,
                    95
                )
            `);

        console.log('✅ Professional profile added for Coach Smith');

        // 3. Create some coach reviews/testimonials table
        console.log('📝 Creating CoachReviews table...');

        await pool.request().query(`
            -- Check if table exists and drop if it does
            IF OBJECT_ID('CoachReviews', 'U') IS NOT NULL
                DROP TABLE CoachReviews;
        `);

        await pool.request().query(`
            CREATE TABLE CoachReviews (
                ReviewID INT IDENTITY(1,1) PRIMARY KEY,
                CoachUserID INT NOT NULL,
                ClientUserID INT,
                ClientName NVARCHAR(100), -- Tên client (có thể ẩn danh)
                Rating INT CHECK (Rating BETWEEN 1 AND 5),
                ReviewTitle NVARCHAR(255),
                ReviewContent NVARCHAR(MAX),
                IsAnonymous BIT DEFAULT 0,
                IsVerified BIT DEFAULT 0,
                IsPublic BIT DEFAULT 1,
                CreatedAt DATETIME DEFAULT GETDATE(),
                UpdatedAt DATETIME DEFAULT GETDATE(),
                
                FOREIGN KEY (CoachUserID) REFERENCES Users(UserID),
                FOREIGN KEY (ClientUserID) REFERENCES Users(UserID)
            );
        `);

        // Add sample reviews
        console.log('⭐ Adding sample reviews...');

        const sampleReviews = [
            {
                rating: 5,
                title: 'Thay đổi cuộc đời tôi!',
                content: 'Coach Smith đã giúp tôi cai thuốc thành công sau 10 năm hút thuốc. Phương pháp của coach rất khoa học và thực tế. Đặc biệt coach luôn lắng nghe và động viên tôi trong những lúc khó khăn nhất.',
                clientName: 'Anh Minh N.',
                isAnonymous: 1
            },
            {
                rating: 5,
                title: 'Chuyên nghiệp và tận tâm',
                content: 'Sau 3 tháng làm việc với coach, tôi không chỉ cai được thuốc mà còn xây dựng được lối sống lành mạnh. Coach rất kiên nhẫn và có phương pháp phù hợp cho từng người.',
                clientName: 'Chị Lan H.',
                isAnonymous: 1
            },
            {
                rating: 4,
                title: 'Hiệu quả và đáng tin cậy',
                content: 'Kỹ thuật mindfulness mà coach dạy rất hữu ích để kiểm soát cơn thèm thuốc. Coach có kiến thức sâu rộng và cách truyền đạt dễ hiểu.',
                clientName: 'Anh Đức T.',
                isAnonymous: 1
            },
            {
                rating: 5,
                title: 'Tuyệt vời!',
                content: 'Coach đã giúp cả gia đình tôi hiểu về tác hại của thuốc lá và cách hỗ trợ người thân cai thuốc. Rất cảm ơn coach!',
                clientName: 'Cô Hương L.',
                isAnonymous: 1
            }
        ];

        for (const review of sampleReviews) {
            await pool.request()
                .input('coachUserId', coachUserId)
                .input('rating', review.rating)
                .input('title', review.title)
                .input('content', review.content)
                .input('clientName', review.clientName)
                .input('isAnonymous', review.isAnonymous)
                .query(`
                    INSERT INTO CoachReviews (CoachUserID, Rating, ReviewTitle, ReviewContent, ClientName, IsAnonymous, IsVerified, IsPublic)
                    VALUES (@coachUserId, @rating, @title, @content, @clientName, @isAnonymous, 1, 1)
                `);
        }

        console.log('✅ Sample reviews added');

        // 4. Update coach user information
        console.log('👤 Updating coach user information...');

        await pool.request()
            .input('userId', coachUserId)
            .query(`
                UPDATE Users SET 
                    PhoneNumber = '0111-222-333',
                    Address = N'123 Nguyễn Thị Minh Khai, Quận 1, TP. Hồ Chí Minh',
                    Avatar = 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face',
                    UpdatedAt = GETDATE()
                WHERE UserID = @userId
            `);

        console.log('✅ Coach user information updated');

        console.log('\n🎉 Coach profile enhancement completed successfully!');
        console.log('📊 Professional information has been added:');
        console.log('   - Education & Certifications');
        console.log('   - Professional experience & statistics');
        console.log('   - Services & pricing information');
        console.log('   - Client reviews & testimonials');
        console.log('   - Contact & social media');
        console.log('\n💡 Now update the frontend to display this information!');

    } catch (error) {
        console.error('❌ Error enhancing coach profile:', error);
    } finally {
        process.exit(0);
    }
}

// Run the script
enhanceCoachProfile(); 