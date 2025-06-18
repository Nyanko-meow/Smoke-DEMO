const { pool } = require('./config/database');

async function updateBlogSchema() {
    try {
        console.log('🔄 Updating blog schema...');

        // Add Status column to Comments table if it doesn't exist
        try {
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Comments') AND name = 'Status')
                BEGIN
                    ALTER TABLE Comments 
                    ADD Status NVARCHAR(20) DEFAULT 'pending' CHECK (Status IN ('pending', 'approved', 'rejected'))
                END
            `);
            console.log('✅ Comments table updated with Status column');
        } catch (error) {
            console.log('ℹ️ Comments Status column already exists or error:', error.message);
        }

        // Update existing comments to have approved status
        try {
            await pool.request().query(`
                UPDATE Comments 
                SET Status = 'approved' 
                WHERE Status IS NULL
            `);
            console.log('✅ Existing comments updated to approved status');
        } catch (error) {
            console.log('ℹ️ Error updating existing comments:', error.message);
        }

        // Insert sample blog posts if they don't exist
        try {
            const existingPosts = await pool.request().query('SELECT COUNT(*) as count FROM BlogPosts');

            if (existingPosts.recordset[0].count === 0) {
                await pool.request().query(`
                    INSERT INTO BlogPosts (Title, MetaDescription, Content, ThumbnailURL, AuthorID, Status, PublishedAt, Views)
                    VALUES 
                    (N'Hành trình cai thuốc của tôi - 30 ngày đầu tiên', 
                     N'Chia sẻ những khó khăn và thành công trong 30 ngày đầu cai thuốc lá', 
                     N'Xin chào mọi người! Tôi muốn chia sẻ với các bạn hành trình cai thuốc lá của mình trong 30 ngày đầu tiên.

Ngày đầu tiên thực sự rất khó khăn. Tôi đã hút thuốc được 10 năm, mỗi ngày khoảng 1 bao. Khi quyết định cai thuốc, tôi cảm thấy lo lắng và không biết liệu mình có thể thành công hay không.

Những ngày đầu, cơn thèm thuốc xuất hiện liên tục. Tôi đã áp dụng một số phương pháp:
- Uống nhiều nước
- Tập thể dục nhẹ
- Ăn kẹo cao su
- Tìm hoạt động thay thế

Sau 1 tuần, tôi bắt đầu cảm thấy khỏe hơn. Hơi thở không còn mùi thuốc, răng trắng hơn.

Tuần thứ 2 và 3 là thời gian khó khăn nhất. Có những lúc tôi suýt bỏ cuộc, nhưng nghĩ đến sức khỏe của bản thân và gia đình, tôi đã kiên trì.

Bây giờ, sau 30 ngày, tôi cảm thấy tự hào về bản thân. Tôi đã tiết kiệm được một khoản tiền không nhỏ và quan trọng hơn là sức khỏe được cải thiện rõ rệt.

Lời khuyên của tôi cho những ai đang muốn cai thuốc:
1. Hãy có động lực mạnh mẽ
2. Tìm sự hỗ trợ từ gia đình và bạn bè
3. Thay thế thói quen hút thuốc bằng hoạt động tích cực
4. Kiên nhẫn với bản thân

Chúc các bạn thành công!', 
                     'https://images.unsplash.com/photo-1544027993-37dbfe43562a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
                     2, 'published', GETDATE(), 45),

                    (N'5 mẹo giúp vượt qua cơn thèm thuốc', 
                     N'Những phương pháp hiệu quả để đối phó với cơn thèm thuốc lá', 
                     N'Cơn thèm thuốc là một trong những thách thức lớn nhất khi cai thuốc lá. Dưới đây là 5 mẹo đã giúp tôi và nhiều người khác vượt qua:

**1. Kỹ thuật hít thở sâu**
Khi cảm thấy thèm thuốc, hãy thực hiện:
- Hít vào sâu trong 4 giây
- Giữ hơi thở 4 giây  
- Thở ra chậm trong 6 giây
- Lặp lại 5-10 lần

**2. Uống nước lạnh**
Nước lạnh giúp:
- Làm dịu cơn thèm
- Giữ miệng luôn bận rộn
- Thanh lọc cơ thể

**3. Tập thể dục nhẹ**
- Đi bộ 10-15 phút
- Làm một vài động tác yoga
- Chạy bộ tại chỗ

**4. Ăn trái cây hoặc rau củ**
- Cà rót, cần tây giúp làm sạch miệng
- Táo, cam cung cấp vitamin C
- Hạt hướng dương thay thế thói quen cầm nắm

**5. Tìm hoạt động thay thế**
- Chơi game trên điện thoại
- Nghe nhạc
- Gọi điện cho bạn bè
- Đọc sách

Hãy nhớ rằng cơn thèm thuốc thường chỉ kéo dài 3-5 phút. Nếu bạn có thể vượt qua được khoảng thời gian này, bạn đã thành công!

Chúc các bạn cai thuốc thành công!', 
                     'https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
                     3, 'published', DATEADD(DAY, -2, GETDATE()), 32),

                    (N'Lợi ích sức khỏe khi cai thuốc lá', 
                     N'Những thay đổi tích cực trong cơ thể sau khi ngừng hút thuốc', 
                     N'Cai thuốc lá mang lại rất nhiều lợi ích cho sức khỏe. Dưới đây là timeline những thay đổi tích cực:

**Sau 20 phút:**
- Nhịp tim và huyết áp giảm
- Lưu thông máu cải thiện

**Sau 12 giờ:**
- Nồng độ carbon monoxide trong máu giảm xuống mức bình thường
- Nồng độ oxy tăng

**Sau 24 giờ:**
- Nguy cơ đau tim giảm

**Sau 48 giờ:**
- Khứu giác và vị giác bắt đầu cải thiện
- Các đầu dây thần kinh bắt đầu tái tạo

**Sau 2 tuần - 3 tháng:**
- Lưu thông máu cải thiện
- Chức năng phổi tăng lên đến 30%

**Sau 1-9 tháng:**
- Ho và khó thở giảm
- Lông mao trong phổi hoạt động trở lại bình thường

**Sau 1 năm:**
- Nguy cơ bệnh tim giảm 50%

**Sau 5 năm:**
- Nguy cơ đột quỵ giảm như người không hút thuốc

**Sau 10 năm:**
- Nguy cơ ung thư phổi giảm 50%

**Sau 15 năm:**
- Nguy cơ bệnh tim như người không bao giờ hút thuốc

Ngoài ra, cai thuốc còn mang lại:
- Tiết kiệm tiền bạc
- Hơi thở thơm tho
- Răng trắng hơn
- Da khỏe mạnh hơn
- Tự tin hơn trong giao tiếp

Hãy bắt đầu hành trình cai thuốc ngay hôm nay để tận hưởng những lợi ích tuyệt vời này!', 
                     'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
                     3, 'published', DATEADD(DAY, -5, GETDATE()), 67)
                `);
                console.log('✅ Sample blog posts inserted');
            } else {
                console.log('ℹ️ Blog posts already exist, skipping sample data insertion');
            }
        } catch (error) {
            console.log('ℹ️ Error inserting sample blog posts:', error.message);
        }

        console.log('🎉 Blog schema update completed successfully!');
    } catch (error) {
        console.error('❌ Error updating blog schema:', error);
    }
}

// Run the update if this file is executed directly
if (require.main === module) {
    updateBlogSchema().then(() => {
        process.exit(0);
    }).catch((error) => {
        console.error('Failed to update schema:', error);
        process.exit(1);
    });
}

module.exports = { updateBlogSchema }; 