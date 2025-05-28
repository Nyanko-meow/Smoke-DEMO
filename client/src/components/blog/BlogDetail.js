import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    Container,
    Typography,
    Box,
    Paper,
    TextField,
    Button,
    Avatar,
    Divider,
    CircularProgress,
    Alert,
    Chip,
    Stack,
    IconButton,
    Menu,
    MenuItem
} from '@mui/material';
import {
    Visibility as ViewIcon,
    Comment as CommentIcon,
    Share as ShareIcon,
    MoreVert as MoreVertIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { getBlogPost, getComments, addComment, deleteBlogPost, clearCurrentPost } from '../../store/slices/blogSlice';
import { formatDate } from '../../utils/dateUtils';

const BlogDetail = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { currentPost, comments, loading, error, success } = useSelector(state => state.blog);
    const { user } = useSelector(state => state.auth);
    const [comment, setComment] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);

    useEffect(() => {
        dispatch(getBlogPost(postId));
        dispatch(getComments(postId));

        return () => {
            dispatch(clearCurrentPost());
        };
    }, [dispatch, postId]);

    useEffect(() => {
        if (success) {
            navigate('/blog');
        }
    }, [success, navigate]);

    const handleSubmitComment = (e) => {
        e.preventDefault();
        if (comment.trim()) {
            dispatch(addComment({ postId, content: comment }));
            setComment('');
        }
    };

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleEdit = () => {
        navigate(`/blog/edit/${postId}`);
        handleMenuClose();
    };

    const handleDelete = () => {
        if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
            dispatch(deleteBlogPost(postId));
        }
        handleMenuClose();
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: currentPost.Title,
                text: currentPost.MetaDescription || currentPost.Title,
                url: window.location.href,
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link đã được sao chép vào clipboard!');
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress size={60} />
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Paper elevation={3} sx={{ p: 4, textAlign: 'center', bgcolor: 'error.light' }}>
                    <Typography variant="h6" color="white">
                        {error}
                    </Typography>
                    <Button
                        variant="contained"
                        sx={{ mt: 2 }}
                        onClick={() => navigate('/blog')}
                    >
                        Quay lại danh sách
                    </Button>
                </Paper>
            </Container>
        );
    }

    if (!currentPost) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary">
                        Không tìm thấy bài viết
                    </Typography>
                    <Button
                        variant="contained"
                        sx={{ mt: 2 }}
                        onClick={() => navigate('/blog')}
                    >
                        Quay lại danh sách
                    </Button>
                </Paper>
            </Container>
        );
    }

    const isAuthor = user && user.UserID === currentPost.AuthorID;

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Back Button */}
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/blog')}
                sx={{ mb: 3 }}
            >
                Quay lại danh sách
            </Button>

            {/* Blog Post */}
            <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography
                            variant="h3"
                            component="h1"
                            gutterBottom
                            sx={{
                                fontWeight: 'bold',
                                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                mb: 2
                            }}
                        >
                            {currentPost.Title}
                        </Typography>

                        {/* Meta Description */}
                        {currentPost.MetaDescription && (
                            <Typography
                                variant="h6"
                                color="text.secondary"
                                sx={{ mb: 3, fontStyle: 'italic' }}
                            >
                                {currentPost.MetaDescription}
                            </Typography>
                        )}
                    </Box>

                    {/* Action Buttons */}
                    <Stack direction="row" spacing={1}>
                        <IconButton onClick={handleShare} color="primary">
                            <ShareIcon />
                        </IconButton>
                        {isAuthor && (
                            <>
                                <IconButton onClick={handleMenuOpen}>
                                    <MoreVertIcon />
                                </IconButton>
                                <Menu
                                    anchorEl={anchorEl}
                                    open={Boolean(anchorEl)}
                                    onClose={handleMenuClose}
                                >
                                    <MenuItem onClick={handleEdit}>
                                        <EditIcon sx={{ mr: 1 }} />
                                        Chỉnh sửa
                                    </MenuItem>
                                    <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                                        <DeleteIcon sx={{ mr: 1 }} />
                                        Xóa bài viết
                                    </MenuItem>
                                </Menu>
                            </>
                        )}
                    </Stack>
                </Box>

                {/* Author Info & Stats */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                            sx={{ mr: 2, bgcolor: 'primary.main', width: 48, height: 48 }}
                        >
                            {currentPost.AuthorFirstName?.charAt(0)}
                        </Avatar>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                {`${currentPost.AuthorFirstName} ${currentPost.AuthorLastName}`}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {formatDate(currentPost.CreatedAt)}
                            </Typography>
                        </Box>
                    </Box>

                    <Stack direction="row" spacing={1}>
                        <Chip
                            icon={<ViewIcon />}
                            label={`${currentPost.Views || 0} lượt xem`}
                            variant="outlined"
                            color="primary"
                        />
                        <Chip
                            icon={<CommentIcon />}
                            label={`${comments.length} bình luận`}
                            variant="outlined"
                            color="secondary"
                        />
                    </Stack>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Featured Image */}
                {currentPost.ThumbnailURL && (
                    <Box
                        component="img"
                        src={currentPost.ThumbnailURL}
                        alt={currentPost.Title}
                        sx={{
                            width: '100%',
                            maxHeight: '500px',
                            objectFit: 'cover',
                            borderRadius: 2,
                            mb: 4,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }}
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/api/images/default-blog.jpg';
                        }}
                    />
                )}

                {/* Content */}
                <Typography
                    variant="body1"
                    sx={{
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.8,
                        fontSize: '1.1rem',
                        color: 'text.primary'
                    }}
                >
                    {currentPost.Content}
                </Typography>
            </Paper>

            {/* Comments Section */}
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                <Typography variant="h5" gutterBottom sx={{
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}>
                    <CommentIcon />
                    Bình luận ({comments.length})
                </Typography>
                <Divider sx={{ mb: 3 }} />

                {/* Comment Form */}
                {user ? (
                    <Box component="form" onSubmit={handleSubmitComment} sx={{ mb: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                                {user.FirstName?.charAt(0)}
                            </Avatar>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                placeholder="Viết bình luận của bạn..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                variant="outlined"
                            />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={!comment.trim()}
                                sx={{ borderRadius: '20px', px: 3 }}
                            >
                                Đăng bình luận
                            </Button>
                        </Box>
                    </Box>
                ) : (
                    <Box sx={{ textAlign: 'center', py: 3, mb: 4, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="body1" color="text.secondary">
                            Vui lòng đăng nhập để bình luận
                        </Typography>
                        <Button
                            variant="contained"
                            sx={{ mt: 2 }}
                            onClick={() => navigate('/login')}
                        >
                            Đăng nhập
                        </Button>
                    </Box>
                )}

                {/* Comments List */}
                {comments.length > 0 ? (
                    comments.map((comment, index) => (
                        <Box key={comment.CommentID}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, py: 2 }}>
                                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                                    {comment.FirstName?.charAt(0)}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                            {`${comment.FirstName} ${comment.LastName}`}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {formatDate(comment.CreatedAt)}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                                        {comment.CommentText}
                                    </Typography>
                                </Box>
                            </Box>
                            {index < comments.length - 1 && <Divider />}
                        </Box>
                    ))
                ) : (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                        <CommentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            Chưa có bình luận nào
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Hãy là người đầu tiên bình luận về bài viết này!
                        </Typography>
                    </Box>
                )}
            </Paper>
        </Container>
    );
};

export default BlogDetail; 