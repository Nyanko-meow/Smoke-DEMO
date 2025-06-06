const { pool } = require('./src/config/database');

async function checkAndFixComments() {
    try {
        console.log('🔍 Checking CommunityComments table...');

        // Check if CommunityComments table exists
        const tableCheck = await pool.request().query(`
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'CommunityComments'
        `);

        if (tableCheck.recordset[0].count === 0) {
            console.log('❌ CommunityComments table does not exist. Creating...');

            // Create CommunityComments table
            await pool.request().query(`
                CREATE TABLE CommunityComments (
                    CommentID INT PRIMARY KEY IDENTITY(1,1),
                    PostID INT NOT NULL,
                    UserID INT NOT NULL,
                    Content NVARCHAR(MAX),
                    CreatedAt DATETIME DEFAULT GETDATE(),

                    FOREIGN KEY (PostID) REFERENCES CommunityPosts(PostID),
                    FOREIGN KEY (UserID) REFERENCES Users(UserID)
                );
            `);
            console.log('✅ CommunityComments table created');
        } else {
            console.log('✅ CommunityComments table exists');
        }

        // Check if CommunityPosts table exists
        const postsTableCheck = await pool.request().query(`
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'CommunityPosts'
        `);

        if (postsTableCheck.recordset[0].count === 0) {
            console.log('❌ CommunityPosts table does not exist. Creating...');

            // Create CommunityPosts table
            await pool.request().query(`
                CREATE TABLE CommunityPosts (
                    PostID INT PRIMARY KEY IDENTITY(1,1),
                    UserID INT NOT NULL,
                    Title NVARCHAR(255),
                    Content NVARCHAR(MAX),
                    AchievementID INT NULL,
                    CreatedAt DATETIME DEFAULT GETDATE(),
                    Likes INT DEFAULT 0,
                    IsPublic BIT DEFAULT 1,

                    FOREIGN KEY (UserID) REFERENCES Users(UserID)
                );
            `);
            console.log('✅ CommunityPosts table created');
        } else {
            console.log('✅ CommunityPosts table exists');
        }

        // Check current data
        const commentsCount = await pool.request().query('SELECT COUNT(*) as count FROM CommunityComments');
        const postsCount = await pool.request().query('SELECT COUNT(*) as count FROM CommunityPosts');

        console.log(`📊 Current data: ${postsCount.recordset[0].count} posts, ${commentsCount.recordset[0].count} comments`);

        // If no test data exists, create some
        if (postsCount.recordset[0].count === 0) {
            console.log('🔧 Creating test posts...');

            // Insert test posts
            await pool.request().query(`
                INSERT INTO CommunityPosts (UserID, Title, Content, CreatedAt)
                VALUES 
                (2, N'Hành trình cai thuốc của tôi', N'Tôi đã bắt đầu hành trình cai thuốc được 1 tuần. Cảm thấy khó khăn nhưng quyết tâm sẽ thành công!', DATEADD(DAY, -3, GETDATE())),
                (2, N'Chia sẻ kinh nghiệm', N'Một vài mẹo nhỏ giúp tôi vượt qua cơn thèm thuốc trong những ngày đầu.', DATEADD(DAY, -1, GETDATE()))
            `);
            console.log('✅ Test posts created');
        }

        if (commentsCount.recordset[0].count === 0) {
            console.log('🔧 Creating test comments...');

            // Get post IDs for comments
            const posts = await pool.request().query('SELECT TOP 2 PostID FROM CommunityPosts ORDER BY CreatedAt DESC');

            if (posts.recordset.length > 0) {
                const postId1 = posts.recordset[0].PostID;
                const postId2 = posts.recordset.length > 1 ? posts.recordset[1].PostID : postId1;

                // Insert test comments
                await pool.request()
                    .input('PostID1', postId1)
                    .input('PostID2', postId2)
                    .query(`
                        INSERT INTO CommunityComments (PostID, UserID, Content, CreatedAt)
                        VALUES 
                        (@PostID1, 2, N'Chúc mừng bạn! Tôi cũng đang trong hành trình cai thuốc.', DATEADD(HOUR, -5, GETDATE())),
                        (@PostID1, 3, N'Bạn rất dũng cảm! Hãy kiên trì nhé.', DATEADD(HOUR, -2, GETDATE())),
                        (@PostID2, 2, N'Cảm ơn bạn đã chia sẻ những mẹo hữu ích!', DATEADD(HOUR, -1, GETDATE()))
                    `);
                console.log('✅ Test comments created');
            }
        }

        // Final check
        const finalCommentsCount = await pool.request().query('SELECT COUNT(*) as count FROM CommunityComments');
        const finalPostsCount = await pool.request().query('SELECT COUNT(*) as count FROM CommunityPosts');

        console.log(`🎉 Final data: ${finalPostsCount.recordset[0].count} posts, ${finalCommentsCount.recordset[0].count} comments`);

        // Test the API query
        console.log('🧪 Testing user comments query...');
        const testQuery = await pool.request()
            .input('UserID', 2)
            .query(`
                SELECT 
                    c.*,
                    p.Title as PostTitle
                FROM CommunityComments c
                LEFT JOIN CommunityPosts p ON c.PostID = p.PostID
                WHERE c.UserID = @UserID
                ORDER BY c.CreatedAt DESC
            `);

        console.log(`✅ Query test: Found ${testQuery.recordset.length} comments for user ID 2`);
        if (testQuery.recordset.length > 0) {
            console.log('📝 Sample comment:', testQuery.recordset[0].Content.substring(0, 50) + '...');
        }

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}

if (require.main === module) {
    checkAndFixComments()
        .then(() => {
            console.log('✅ Check and fix completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script failed:', error);
            process.exit(1);
        });
}

module.exports = { checkAndFixComments }; 