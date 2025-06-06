-- Fix user test cho quit plan feature (Payment Confirmation based)
USE SMOKEKING;
GO

-- Kiểm tra và tạo user test
IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'leghenkiz@gmail.com')
BEGIN
    INSERT INTO Users (Email, Password, FirstName, LastName, Role, IsActive, EmailVerified, CreatedAt, UpdatedAt)
    VALUES ('leghenkiz@gmail.com', 'H12345678@', 'Test', 'User', 'guest', 1, 1, GETDATE(), GETDATE());
    PRINT 'Created new user: leghenkiz@gmail.com';
END
ELSE
BEGIN
    -- Cập nhật user hiện có (không cần role member nữa)
    UPDATE Users 
    SET IsActive = 1, EmailVerified = 1, UpdatedAt = GETDATE()
    WHERE Email = 'leghenkiz@gmail.com';
    PRINT 'Updated existing user: leghenkiz@gmail.com';
END

-- Lấy UserID 
DECLARE @testUserID INT = (SELECT UserID FROM Users WHERE Email = 'leghenkiz@gmail.com');
PRINT 'User ID: ' + CAST(@testUserID AS VARCHAR);

-- Tạo payment và confirmation cho user test
DECLARE @planID INT = 1; -- Basic Plan
DECLARE @amount DECIMAL(10,2) = (SELECT Price FROM MembershipPlans WHERE PlanID = @planID);
DECLARE @duration INT = (SELECT Duration FROM MembershipPlans WHERE PlanID = @planID);
DECLARE @startDate DATETIME = GETDATE();
DECLARE @endDate DATETIME = DATEADD(DAY, @duration, @startDate);

-- Xóa dữ liệu cũ nếu có
DELETE FROM PaymentConfirmations 
WHERE PaymentID IN (SELECT PaymentID FROM Payments WHERE UserID = @testUserID);

DELETE FROM UserMemberships WHERE UserID = @testUserID;
DELETE FROM Payments WHERE UserID = @testUserID;

-- Tạo payment record
DECLARE @paymentID INT;
INSERT INTO Payments (UserID, PlanID, Amount, PaymentMethod, Status, TransactionID, StartDate, EndDate, Note)
VALUES (@testUserID, @planID, @amount, 'BankTransfer', 'confirmed', 'TEST_TX_' + CAST(@testUserID AS VARCHAR), @startDate, @endDate, N'Test payment for quit plan feature');

SET @paymentID = SCOPE_IDENTITY();
PRINT 'Created Payment ID: ' + CAST(@paymentID AS VARCHAR);

-- Tạo payment confirmation (QUAN TRỌNG - đây là điều kiện để truy cập quit plan)
INSERT INTO PaymentConfirmations (PaymentID, ConfirmationDate, ConfirmedByUserID, ConfirmationCode, Notes)
VALUES (@paymentID, GETDATE(), 3, 'CONF_' + CAST(@paymentID AS VARCHAR), N'Auto confirmation for testing quit plan feature');

PRINT 'Created Payment Confirmation for Payment ID: ' + CAST(@paymentID AS VARCHAR);

-- Tạo membership record (tùy chọn)
INSERT INTO UserMemberships (UserID, PlanID, StartDate, EndDate, Status)
VALUES (@testUserID, @planID, @startDate, @endDate, 'active');

-- Tạo bảng lưu kế hoạch mẫu cho từng gói (nếu chưa có)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PlanTemplates' AND xtype='U')
BEGIN
    CREATE TABLE PlanTemplates (
        TemplateID INT IDENTITY(1,1) PRIMARY KEY,
        PlanID INT FOREIGN KEY REFERENCES MembershipPlans(PlanID),
        PhaseName NVARCHAR(255) NOT NULL,
        PhaseDescription NVARCHAR(MAX) NOT NULL,
        DurationDays INT NOT NULL,
        SortOrder INT NOT NULL,
        CreatedAt DATETIME DEFAULT GETDATE()
    );
    PRINT 'Created PlanTemplates table';
END

-- Xóa template cũ và tạo mới
DELETE FROM PlanTemplates;

-- Kế hoạch mẫu cho Basic Plan (PlanID = 1)
INSERT INTO PlanTemplates (PlanID, PhaseName, PhaseDescription, DurationDays, SortOrder) VALUES
(1, N'Tuần 1: Chuẩn bị tinh thần', N'• Xác định lý do cai thuốc rõ ràng\n• Loại bỏ tất cả thuốc lá và dụng cụ hút thuốc\n• Thông báo cho gia đình, bạn bè về quyết định\n• Bắt đầu ghi nhật ký cảm xúc hàng ngày\n• Tập thở sâu khi cảm thấy thèm thuốc', 7, 1),
(1, N'Tuần 2: Thay đổi thói quen', N'• Thay đổi lịch trình hàng ngày để tránh trigger\n• Uống nhiều nước, ăn kẹo không đường khi thèm\n• Tập thể dục nhẹ 15-20 phút/ngày\n• Tìm hoạt động thay thế: đọc sách, nghe nhạc\n• Tính toán số tiền tiết kiệm được', 7, 2),
(1, N'Tuần 3-4: Củng cố ý chí', N'• Tiếp tục duy trì thói quen tốt\n• Tham gia cộng đồng hỗ trợ cai thuốc\n• Thưởng cho bản thân khi đạt milestone\n• Xử lý stress bằng cách tích cực\n• Chuẩn bị cho những thử thách dài hạn', 14, 3);

-- Kế hoạch mẫu cho Premium Plan (PlanID = 2) 
INSERT INTO PlanTemplates (PlanID, PhaseName, PhaseDescription, DurationDays, SortOrder) VALUES
(2, N'Tuần 1-2: Detox và chuẩn bị', N'• Thực hiện detox cơ thể với chế độ ăn uống lành mạnh\n• Bắt đầu chương trình tập luyện thể chất\n• Thiết lập hệ thống hỗ trợ từ gia đình và bạn bè\n• Học các kỹ thuật thư giãn: thiền, yoga\n• Ghi chép chi tiết về triggers và cách đối phó', 14, 1),
(2, N'Tuần 3-4: Xây dựng thói quen mới', N'• Phát triển hobby mới để thay thế thời gian hút thuốc\n• Tham gia các nhóm hỗ trợ trực tuyến/offline\n• Áp dụng kỹ thuật CBT (Cognitive Behavioral Therapy)\n• Theo dõi cải thiện sức khỏe: huyết áp, nhịp tim\n• Lập kế hoạch tài chính từ tiền tiết kiệm', 14, 2),
(2, N'Tuần 5-6: Đối phó với khó khăn', N'• Nhận diện và xử lý các tình huống nguy hiểm\n• Phát triển kỹ năng quản lý stress nâng cao\n• Tạo động lực dài hạn với mục tiêu cụ thể\n• Đánh giá tiến bộ và điều chỉnh kế hoạch\n• Chuẩn bị tâm lý cho giai đoạn duy trì', 14, 3),
(2, N'Tuần 7-8: Duy trì và phát triển', N'• Ổn định lối sống không thuốc lá\n• Mở rộng mạng lưới hỗ trợ xã hội\n• Theo dõi và cải thiện sức khỏe tinh thần\n• Lập kế hoạch phòng ngừa tái phát\n• Chia sẻ kinh nghiệm để giúp người khác', 14, 4);

-- Kế hoạch mẫu cho Pro Plan (PlanID = 3)
INSERT INTO PlanTemplates (PlanID, PhaseName, PhaseDescription, DurationDays, SortOrder) VALUES
(3, N'Tuần 1-2: Đánh giá và chuẩn bị chuyên sâu', N'• Đánh giá mức độ nghiện nicotine và sức khỏe tổng thể\n• Thiết kế chương trình cai thuốc cá nhân hóa\n• Bắt đầu liệu pháp thay thế nicotine (nếu cần)\n• Xây dựng kế hoạch dinh dưỡng và tập luyện chuyên nghiệp\n• Thiết lập hệ thống theo dõi sức khỏe 24/7', 14, 1),
(3, N'Tuần 3-4: Can thiệp chuyên nghiệp', N'• Tham vấn tâm lý với chuyên gia hàng tuần\n• Áp dụng liệu pháp hành vi nhận thức CBT\n• Sử dụng ứng dụng AI theo dõi mood và trigger\n• Tham gia nhóm trị liệu với coach chuyên nghiệp\n• Đo lường và theo dõi biomarkers sức khỏe', 14, 2),
(3, N'Tuần 5-6: Tối ưu hóa lối sống', N'• Personalized coaching 1-on-1 với chuyên gia\n• Liệu pháp thể chất: massage, acupuncture\n• Chương trình dinh dưỡng được tùy chỉnh\n• Kỹ thuật mindfulness và thiền định nâng cao\n• Theo dõi tiến bộ với công nghệ wearable', 14, 3),
(3, N'Tuần 7-9: Củng cố và phát triển bền vững', N'• Phát triển kỹ năng leadership và self-advocacy\n• Xây dựng kế hoạch career và personal growth\n• Tham gia các hoạt động cộng đồng ý nghĩa\n• Thiết lập hệ thống accountability dài hạn\n• Chuẩn bị trở thành mentor cho người khác', 21, 4),
(3, N'Tuần 10-12: Trở thành champion', N'• Chia sẻ câu chuyện thành công với cộng đồng\n• Phát triển kỹ năng coaching để giúp người khác\n• Thiết lập lifestyle và career goals dài hạn\n• Duy trì sức khỏe tối ưu với check-up định kỳ\n• Xây dựng legacy và impact tích cực', 21, 5);

-- Kiểm tra kết quả
SELECT 
    u.UserID, 
    u.Email, 
    u.FirstName + ' ' + u.LastName as FullName,
    u.Role, 
    u.IsActive,
    u.EmailVerified,
    p.PaymentID,
    p.Amount,
    p.Status as PaymentStatus,
    pc.ConfirmationID,
    pc.ConfirmationDate,
    pc.ConfirmationCode,
    mp.Name as PlanName,
    mp.Description as PlanDescription,
    um.Status as MembershipStatus,
    um.EndDate as MembershipEndDate,
    CASE 
        WHEN pc.ConfirmationID IS NOT NULL THEN 'Access by Payment Confirmation'
        WHEN u.Role IN ('coach', 'admin') THEN 'Access by Role'
        ELSE 'No Access'
    END as AccessType
FROM Users u
LEFT JOIN Payments p ON u.UserID = p.UserID AND p.Status = 'confirmed'
LEFT JOIN PaymentConfirmations pc ON p.PaymentID = pc.PaymentID
LEFT JOIN MembershipPlans mp ON p.PlanID = mp.PlanID
LEFT JOIN UserMemberships um ON u.UserID = um.UserID AND um.Status = 'active'
WHERE u.Email = 'leghenkiz@gmail.com';

-- Hiển thị kế hoạch mẫu cho gói user đã đăng ký
SELECT 
    pt.PhaseName,
    pt.PhaseDescription,
    pt.DurationDays,
    pt.SortOrder,
    mp.Name as PlanName
FROM PlanTemplates pt
JOIN MembershipPlans mp ON pt.PlanID = mp.PlanID
WHERE pt.PlanID = @planID
ORDER BY pt.SortOrder;

PRINT 'Setup completed for user: leghenkiz@gmail.com with plan templates'; 