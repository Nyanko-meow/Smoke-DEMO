const { pool } = require('./src/config/database');

async function createSampleBlogPosts() {
    try {
        console.log('🚀 Creating sample blog posts with relevant images...');

        // Sample blog posts with smoking cessation content
        const blogPosts = [
            {
                title: 'Lợi Ích Tuyệt Vời Của Việc Cai Thuốc Lá',
                content: `Cai thuốc lá là một trong những quyết định tốt nhất mà bạn có thể đưa ra cho sức khỏe của mình. Dưới đây là những lợi ích tuyệt vời mà bạn sẽ nhận được:

**Lợi ích ngay lập tức:**
- Sau 20 phút: Nhịp tim và huyết áp trở về bình thường
- Sau 12 giờ: Nồng độ carbon monoxide trong máu giảm xuống mức bình thường
- Sau 2 tuần: Tuần hoàn máu cải thiện và chức năng phổi tăng lên

**Lợi ích lâu dài:**
- Giảm nguy cơ mắc bệnh tim mạch, đột quỵ và ung thư
- Cải thiện khả năng thở và giảm ho
- Tiết kiệm một khoản tiền đáng kể
- Cải thiện mùi vị và khứu giác

Hãy bắt đầu hành trình cai thuốc của bạn ngay hôm nay!`,
                metaDescription: 'Khám phá những lợi ích tuyệt vời của việc cai thuốc lá cho sức khỏe và cuộc sống của bạn.',
                thumbnailURL: '/api/images/smoking-cessation-1.svg',
                authorID: 3 // Admin user
            },
            {
                title: '5 Mẹo Hiệu Quả Để Vượt Qua Cơn Thèm Thuốc',
                content: `Cơn thèm thuốc là thử thách lớn nhất trong quá trình cai thuốc. Dưới đây là 5 mẹo hiệu quả để giúp bạn vượt qua:

**1. Uống nhiều nước**
Nước giúp thanh lọc cơ thể và giảm cảm giác thèm thuốc. Hãy uống ít nhất 8 ly nước mỗi ngày.

**2. Tập thể dục thường xuyên**
Vận động giúp giải tỏa căng thẳng và sản sinh endorphin - hormone hạnh phúc tự nhiên.

**3. Ăn trái cây thay thế**
Khi có cơn thèm, hãy ăn trái cây hoặc nhai kẹo cao su không đường.

**4. Tìm kiếm sự hỗ trợ**
Chia sẻ với gia đình, bạn bè hoặc tham gia nhóm hỗ trợ cai thuốc.

**5. Thực hành thiền định**
Thiền định giúp bạn kiểm soát tâm trí và giảm stress.

Hãy nhớ rằng mỗi cơn thèm chỉ kéo dài vài phút. Bạn có thể vượt qua!`,
                metaDescription: 'Học cách vượt qua cơn thèm thuốc với 5 mẹo đơn giản nhưng hiệu quả.',
                thumbnailURL: '/api/images/smoking-tips.svg',
                authorID: 3
            },
            {
                title: 'Timeline Phục Hồi Sức Khỏe Sau Khi Cai Thuốc',
                content: `Cơ thể con người có khả năng tự phục hồi tuyệt vời. Dưới đây là timeline chi tiết về quá trình phục hồi sức khỏe sau khi bạn ngừng hút thuốc:

**20 phút đầu tiên:**
- Nhịp tim và huyết áp giảm xuống
- Nhiệt độ tay chân tăng lên

**12 giờ:**
- Nồng độ carbon monoxide trong máu trở về bình thường
- Nồng độ oxy trong máu tăng lên

**2-12 tuần:**
- Tuần hoàn máu cải thiện
- Chức năng phổi tăng lên đến 30%

**1-9 tháng:**
- Ho và khó thở giảm
- Lông mao trong phổi phục hồi chức năng

**1 năm:**
- Nguy cơ bệnh tim giảm 50%

**5 năm:**
- Nguy cơ đột quỵ giảm xuống như người không hút thuốc

**10 năm:**
- Nguy cơ ung thư phổi giảm 50%

Mỗi ngày không hút thuốc là một bước tiến trong hành trình phục hồi sức khỏe!`,
                metaDescription: 'Tìm hiểu timeline chi tiết về quá trình phục hồi sức khỏe sau khi cai thuốc lá.',
                thumbnailURL: '/api/images/health-timeline.svg',
                authorID: 3
            },
            {
                title: 'Câu Chuyện Thành Công: Từ 2 Bao Thuốc/Ngày Đến Cuộc Sống Khỏe Mạnh',
                content: `Tôi là Nguyễn Văn A, 35 tuổi, và đây là câu chuyện cai thuốc của tôi.

**Quá khứ đen tối:**
Tôi đã hút thuốc 15 năm, trung bình 2 bao mỗi ngày. Sức khỏe ngày càng xuống dốc, ho liên tục, thở khó khăn, và mùi thuốc bám khắp người.

**Điểm chuyển mình:**
Khi con trai tôi 5 tuổi hỏi "Tại sao bố luôn có mùi khó chịu?", tôi nhận ra mình cần thay đổi.

**Hành trình cai thuốc:**
- Tuần 1-2: Rất khó khăn, cơn thèm liên tục
- Tháng 1: Bắt đầu cảm thấy hơi thở dễ dàng hơn
- Tháng 3: Không còn ho, giọng nói trong hơn
- Tháng 6: Tăng cân khỏe mạnh, da sáng hơn
- Năm 1: Hoàn toàn khỏe mạnh, tiết kiệm được 50 triệu đồng

**Bí quyết thành công:**
1. Quyết tâm mạnh mẽ vì gia đình
2. Thay thế thói quen xấu bằng tập thể dục
3. Tìm kiếm sự hỗ trợ từ SmokeKing
4. Tự thưởng cho bản thân mỗi milestone

Nếu tôi làm được, bạn cũng có thể!`,
                metaDescription: 'Câu chuyện truyền cảm hứng về hành trình cai thuốc thành công từ 2 bao/ngày.',
                thumbnailURL: '/api/images/default-blog.jpg',
                authorID: 3
            }
        ];

        // Insert blog posts
        for (const post of blogPosts) {
            const result = await pool.request()
                .input('title', post.title)
                .input('content', post.content)
                .input('metaDescription', post.metaDescription)
                .input('thumbnailURL', post.thumbnailURL)
                .input('authorID', post.authorID)
                .query(`
                    INSERT INTO BlogPosts (Title, Content, MetaDescription, ThumbnailURL, AuthorID, Status, CreatedAt, UpdatedAt)
                    OUTPUT INSERTED.PostID
                    VALUES (@title, @content, @metaDescription, @thumbnailURL, @authorID, 'published', GETDATE(), GETDATE())
                `);

            const postId = result.recordset[0].PostID;
            console.log(`✅ Created blog post: "${post.title}" (ID: ${postId})`);

            // Add some sample comments
            const comments = [
                {
                    content: 'Bài viết rất hữu ích! Cảm ơn bạn đã chia sẻ.',
                    userID: 7 // Test user
                },
                {
                    content: 'Tôi đang trong quá trình cai thuốc và bài viết này giúp tôi rất nhiều động lực.',
                    userID: 7
                }
            ];

            for (const comment of comments) {
                await pool.request()
                    .input('postId', postId)
                    .input('userId', comment.userID)
                    .input('content', comment.content)
                    .query(`
                        INSERT INTO BlogComments (PostID, UserID, CommentText, CreatedAt)
                        VALUES (@postId, @userId, @content, GETDATE())
                    `);
            }

            // Update view count
            await pool.request()
                .input('postId', postId)
                .query(`
                    UPDATE BlogPosts 
                    SET Views = FLOOR(RAND() * 100) + 50
                    WHERE PostID = @postId
                `);
        }

        console.log('✅ Sample blog posts created successfully!');
        console.log('📝 Created posts with relevant smoking cessation images:');
        console.log('   - /api/images/smoking-cessation-1.svg');
        console.log('   - /api/images/smoking-tips.svg');
        console.log('   - /api/images/health-timeline.svg');
        console.log('   - /api/images/default-blog.jpg');

    } catch (error) {
        console.error('❌ Error creating sample blog posts:', error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    createSampleBlogPosts()
        .then(() => {
            console.log('🎉 Blog posts creation completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Failed to create blog posts:', error);
            process.exit(1);
        });
}

module.exports = { createSampleBlogPosts }; 