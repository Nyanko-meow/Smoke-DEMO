const { pool } = require('./src/config/database');

async function createTestPosts() {
    try {
        console.log('🔧 Creating test posts for delete functionality...');

        // Check if CommunityPosts table exists
        const tableCheck = await pool.request().query(`
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'CommunityPosts'
        `);

        if (tableCheck.recordset[0].count === 0) {
            console.log('❌ CommunityPosts table does not exist. Please run setup first.');
            return;
        }

        // Create test posts for different users
        const testPosts = [
            {
                userID: 2, // member user
                title: 'Hành trình cai thuốc ngày thứ 5',
                content: 'Hôm nay là ngày thứ 5 tôi cai thuốc. Cảm thấy khó khăn nhưng quyết tâm tiếp tục. Mọi người có lời khuyên gì không?'
            },
            {
                userID: 2,
                title: 'Chia sẻ mẹo vượt qua cơn thèm',
                content: 'Tôi đã tìm ra một số cách hiệu quả để vượt qua cơn thèm thuốc. Hãy ăn kẹo cao su và uống nhiều nước!'
            },
            {
                userID: 3, // coach user  
                title: 'Lời khuyên từ huấn luyện viên',
                content: 'Việc cai thuốc là một hành trình dài. Hãy kiên nhẫn với bản thân và tìm kiếm sự hỗ trợ từ cộng đồng.'
            }
        ];

        for (const post of testPosts) {
            const result = await pool.request()
                .input('UserID', post.userID)
                .input('Title', post.title)
                .input('Content', post.content)
                .query(`
                    INSERT INTO CommunityPosts (UserID, Title, Content, CreatedAt)
                    OUTPUT INSERTED.PostID, INSERTED.Title
                    VALUES (@UserID, @Title, @Content, DATEADD(HOUR, -${Math.floor(Math.random() * 24)}, GETDATE()))
                `);

            console.log(`✅ Created post: "${result.recordset[0].Title}" (ID: ${result.recordset[0].PostID})`);
        }

        // Show current posts count
        const postsCount = await pool.request().query('SELECT COUNT(*) as count FROM CommunityPosts');
        console.log(`📊 Total posts in database: ${postsCount.recordset[0].count}`);

        // Show posts by user 2 (member) for testing delete functionality
        const userPosts = await pool.request()
            .input('UserID', 2)
            .query(`
                SELECT PostID, Title, CreatedAt
                FROM CommunityPosts 
                WHERE UserID = @UserID
                ORDER BY CreatedAt DESC
            `);

        console.log('\n📝 Posts by User ID 2 (member) that can be deleted:');
        userPosts.recordset.forEach(post => {
            console.log(`- Post ${post.PostID}: "${post.Title}"`);
        });

        console.log('\n✅ Test posts created successfully!');
        console.log('💡 Now you can test the delete functionality in the frontend.');

    } catch (error) {
        console.error('❌ Error creating test posts:', error);
        throw error;
    }
}

if (require.main === module) {
    createTestPosts()
        .then(() => {
            console.log('✅ Script completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script failed:', error);
            process.exit(1);
        });
}

module.exports = { createTestPosts }; 