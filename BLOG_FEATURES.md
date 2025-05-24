# Blog Features - SmokeKing

## Tổng quan
Tính năng Blog cho phép người dùng chia sẻ hành trình cai thuốc, kinh nghiệm và lời khuyên với cộng đồng.

## Tính năng chính

### 1. Xem danh sách bài viết
- **URL**: `/blog`
- **Mô tả**: Hiển thị tất cả bài viết đã được xuất bản
- **Tính năng**:
  - Giao diện card đẹp mắt với hình ảnh đại diện
  - Hiển thị tác giả, ngày đăng, số lượt xem và bình luận
  - Responsive design
  - Tìm kiếm và lọc bài viết (sẽ phát triển)

### 2. Xem chi tiết bài viết
- **URL**: `/blog/:postId`
- **Mô tả**: Hiển thị nội dung đầy đủ của bài viết
- **Tính năng**:
  - Hiển thị tiêu đề, mô tả, nội dung và hình ảnh
  - Thông tin tác giả và thống kê
  - Hệ thống bình luận
  - Nút chia sẻ
  - Chỉnh sửa/xóa bài viết (chỉ tác giả)

### 3. Viết bài mới
- **URL**: `/blog/new`
- **Yêu cầu**: Đăng nhập
- **Tính năng**:
  - Editor WYSIWYG với preview
  - Upload hình ảnh đại diện
  - Meta description cho SEO
  - Auto-save (sẽ phát triển)

### 4. Chỉnh sửa bài viết
- **URL**: `/blog/edit/:postId`
- **Yêu cầu**: Đăng nhập và là tác giả
- **Tính năng**: Tương tự như viết bài mới

### 5. Hệ thống bình luận
- **Tính năng**:
  - Bình luận real-time
  - Hiển thị avatar và thông tin người dùng
  - Moderation system (admin)

## Cấu trúc Database

### BlogPosts Table
```sql
CREATE TABLE BlogPosts (
    PostID INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(255) NOT NULL,
    MetaDescription NVARCHAR(300), 
    Content NVARCHAR(MAX) NOT NULL,
    ThumbnailURL NVARCHAR(500), 
    AuthorID INT NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    PublishedAt DATETIME NULL, 
    Status NVARCHAR(20) DEFAULT 'Pending', 
    Views INT DEFAULT 0,
    IsFeatured BIT DEFAULT 0
);
```

### Comments Table
```sql
CREATE TABLE Comments (
    CommentID INT IDENTITY(1,1) PRIMARY KEY,
    PostID INT FOREIGN KEY REFERENCES BlogPosts(PostID),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    CommentText NVARCHAR(MAX) NOT NULL,
    Status NVARCHAR(20) DEFAULT 'pending',
    CreatedAt DATETIME DEFAULT GETDATE()
);
```

## API Endpoints

### GET /api/blog
- **Mô tả**: Lấy danh sách bài viết
- **Response**: Array of blog posts

### GET /api/blog/:postId
- **Mô tả**: Lấy chi tiết bài viết
- **Response**: Blog post object

### POST /api/blog
- **Mô tả**: Tạo bài viết mới
- **Auth**: Required
- **Body**: { title, content, metaDescription, thumbnailURL }

### PUT /api/blog/:postId
- **Mô tả**: Cập nhật bài viết
- **Auth**: Required (author only)
- **Body**: { title, content, metaDescription, thumbnailURL, status }

### DELETE /api/blog/:postId
- **Mô tả**: Xóa bài viết
- **Auth**: Required (author only)

### GET /api/blog/:postId/comments
- **Mô tả**: Lấy bình luận của bài viết
- **Response**: Array of comments

### POST /api/blog/:postId/comments
- **Mô tả**: Thêm bình luận
- **Auth**: Required
- **Body**: { content }

### GET /api/blog/my/posts
- **Mô tả**: Lấy bài viết của user hiện tại
- **Auth**: Required

## Cách sử dụng

### 1. Cài đặt và chạy
```bash
# Server
cd server
npm install
npm start

# Client
cd client
npm install
npm start
```

### 2. Cập nhật database schema
```bash
cd server/src
node updateBlogSchema.js
```

### 3. Truy cập tính năng
- Mở trình duyệt: `http://localhost:3000/blog`
- Đăng nhập để viết bài và bình luận

## Tính năng sẽ phát triển

### Phase 2
- [ ] Tìm kiếm và lọc bài viết
- [ ] Categories/Tags
- [ ] Like/Dislike system
- [ ] Rich text editor
- [ ] Image upload to server
- [ ] Auto-save drafts

### Phase 3
- [ ] SEO optimization
- [ ] Social media sharing
- [ ] Email notifications
- [ ] Advanced moderation
- [ ] Analytics dashboard

### Phase 4
- [ ] Multi-language support
- [ ] Advanced search with Elasticsearch
- [ ] Content recommendation
- [ ] Mobile app integration

## Troubleshooting

### Lỗi thường gặp

1. **"Error getting blog posts"**
   - Kiểm tra kết nối database
   - Chạy `updateBlogSchema.js`

2. **"Blog post not found"**
   - Kiểm tra PostID có tồn tại
   - Kiểm tra status của bài viết

3. **"You are not authorized"**
   - Đảm bảo đã đăng nhập
   - Kiểm tra quyền tác giả

### Debug
- Kiểm tra console log ở browser và server
- Kiểm tra network tab trong DevTools
- Xem database logs

## Liên hệ
Nếu có vấn đề hoặc đề xuất tính năng, vui lòng tạo issue hoặc liên hệ team phát triển. 