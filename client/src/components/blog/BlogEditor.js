import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    CircularProgress,
    Alert,
    IconButton,
    Stack,
    Divider,
    Snackbar
} from '@mui/material';
import {
    PhotoCamera,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Preview as PreviewIcon,
    CheckCircle as CheckCircleIcon,
    HourglassEmpty as HourglassEmptyIcon
} from '@mui/icons-material';
import { createBlogPost, updateBlogPost, getBlogPost, clearError, clearSuccess } from '../../store/slices/blogSlice';

const BlogEditor = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { currentPost, loading, error, success } = useSelector(state => state.blog);
    const { user } = useSelector(state => state.auth);

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        metaDescription: '',
        thumbnailURL: ''
    });
    const [showSuccess, setShowSuccess] = useState(false);
    const [postStatus, setPostStatus] = useState(null); // Track if post is pending or published
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (postId) {
            dispatch(getBlogPost(postId));
        }
        return () => {
            dispatch(clearError());
            dispatch(clearSuccess());
        };
    }, [dispatch, postId]);

    useEffect(() => {
        if (currentPost && postId) {
            setFormData({
                title: currentPost.Title || '',
                content: currentPost.Content || '',
                metaDescription: currentPost.MetaDescription || '',
                thumbnailURL: currentPost.ThumbnailURL || ''
            });
        }
    }, [currentPost, postId]);

    useEffect(() => {
        if (success) {
            setShowSuccess(true);
            setTimeout(() => {
                navigate('/blog');
            }, 3000); // Increased timeout to allow user to read the message
        }
    }, [success, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim() || !formData.content.trim()) {
            return;
        }

        try {
            let result;
            if (postId) {
                result = await dispatch(updateBlogPost({
                    postId,
                    postData: { ...formData, status: 'published' }
                }));
                setSuccessMessage('Bài viết đã được cập nhật thành công!');
                setPostStatus('published');
            } else {
                result = await dispatch(createBlogPost(formData));

                // Check if the action was fulfilled and extract status/message
                if (createBlogPost.fulfilled.match(result)) {
                    const { status, message } = result.payload;
                    setPostStatus(status);
                    setSuccessMessage(message);
                } else {
                    setSuccessMessage('Bài viết đã được tạo thành công!');
                    setPostStatus('published');
                }
            }
        } catch (error) {
            console.error('Error submitting blog post:', error);
        }
    };

    const handlePreview = () => {
        // You could implement a preview modal here
        console.log('Preview functionality to be implemented');
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress size={60} />
            </Box>
        );
    }

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                {/* Header */}
                <Box sx={{ mb: 4 }}>
                    <Typography
                        variant="h4"
                        component="h1"
                        sx={{
                            fontWeight: 'bold',
                            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 1
                        }}
                    >
                        {postId ? 'Chỉnh sửa bài viết' : 'Viết bài mới'}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Chia sẻ kinh nghiệm và truyền cảm hứng cho cộng đồng
                    </Typography>
                    <Divider sx={{ mt: 2 }} />
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                    {/* Title */}
                    <TextField
                        fullWidth
                        label="Tiêu đề bài viết"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        placeholder="Nhập tiêu đề hấp dẫn cho bài viết..."
                        sx={{ mb: 3 }}
                        helperText="Tiêu đề nên ngắn gọn và thu hút người đọc"
                    />

                    {/* Meta Description */}
                    <TextField
                        fullWidth
                        label="Mô tả ngắn"
                        name="metaDescription"
                        value={formData.metaDescription}
                        onChange={handleChange}
                        placeholder="Mô tả ngắn gọn về nội dung bài viết..."
                        multiline
                        rows={2}
                        sx={{ mb: 3 }}
                        helperText="Mô tả này sẽ hiển thị trong danh sách bài viết (tối đa 300 ký tự)"
                        inputProps={{ maxLength: 300 }}
                    />

                    {/* Thumbnail URL */}
                    <TextField
                        fullWidth
                        label="URL hình ảnh đại diện"
                        name="thumbnailURL"
                        value={formData.thumbnailURL}
                        onChange={handleChange}
                        placeholder="https://example.com/image.jpg"
                        sx={{ mb: 3 }}
                        helperText="Link hình ảnh sẽ hiển thị làm ảnh đại diện cho bài viết"
                    />

                    {/* Image Preview */}
                    {formData.thumbnailURL && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Xem trước hình ảnh:
                            </Typography>
                            <Box
                                component="img"
                                src={formData.thumbnailURL}
                                alt="Preview"
                                sx={{
                                    width: '100%',
                                    maxHeight: '300px',
                                    objectFit: 'cover',
                                    borderRadius: 1,
                                    border: '1px solid #ddd'
                                }}
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                }}
                            />
                        </Box>
                    )}

                    {/* Content */}
                    <TextField
                        fullWidth
                        label="Nội dung bài viết"
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        required
                        multiline
                        rows={12}
                        placeholder="Viết nội dung bài viết của bạn ở đây..."
                        sx={{ mb: 4 }}
                        helperText="Hãy chia sẻ câu chuyện, kinh nghiệm hoặc lời khuyên của bạn"
                    />

                    {/* Action Buttons */}
                    <Stack direction="row" spacing={2} justifyContent="center">
                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                            disabled={loading || !formData.title.trim() || !formData.content.trim()}
                            sx={{
                                background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                                borderRadius: '25px',
                                px: 4
                            }}
                        >
                            {loading ? 'Đang lưu...' : (postId ? 'Cập nhật' : 'Xuất bản')}
                        </Button>

                        <Button
                            variant="outlined"
                            size="large"
                            startIcon={<PreviewIcon />}
                            onClick={handlePreview}
                            disabled={!formData.title.trim() || !formData.content.trim()}
                            sx={{ borderRadius: '25px', px: 4 }}
                        >
                            Xem trước
                        </Button>

                        <Button
                            variant="text"
                            size="large"
                            startIcon={<CancelIcon />}
                            onClick={() => navigate('/blog')}
                            sx={{ borderRadius: '25px', px: 4 }}
                        >
                            Hủy
                        </Button>
                    </Stack>
                </Box>

                {/* Tips */}
                <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="h6" gutterBottom>
                        💡 Mẹo viết bài:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        • Chia sẻ những trải nghiệm thật của bạn<br />
                        • Sử dụng ngôn ngữ dễ hiểu và gần gũi<br />
                        • Thêm hình ảnh để bài viết sinh động hơn<br />
                        • Kết thúc bằng lời khuyên hoặc động viên
                    </Typography>
                </Box>
            </Paper>

            {/* Success Snackbar */}
            <Snackbar
                open={showSuccess}
                autoHideDuration={6000}
                onClose={() => setShowSuccess(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setShowSuccess(false)}
                    severity={postStatus === 'Pending' ? 'info' : 'success'}
                    sx={{ width: '100%' }}
                    icon={postStatus === 'Pending' ? <HourglassEmptyIcon /> : <CheckCircleIcon />}
                >
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {postStatus === 'Pending' ? '📝 Bài viết đang chờ duyệt' : '✅ Thành công!'}
                        </Typography>
                        <Typography variant="body2">
                            {successMessage || (postId ? 'Bài viết đã được cập nhật thành công!' :
                                (postStatus === 'Pending' ?
                                    'Bài viết của bạn đã được gửi và đang chờ admin phê duyệt. Bạn sẽ nhận được thông báo khi bài viết được duyệt.' :
                                    'Bài viết đã được xuất bản thành công!'))}
                        </Typography>
                        {postStatus === 'Pending' && (
                            <Box sx={{ mt: 1, p: 1, bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 1 }}>
                                <Typography variant="caption" sx={{ display: 'block' }}>
                                    💡 <strong>Lưu ý:</strong> Bài viết sẽ hiển thị công khai sau khi được admin phê duyệt.
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                    🔔 Bạn có thể xem trạng thái bài viết trong mục "Bài viết của tôi".
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default BlogEditor; 