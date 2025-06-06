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
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions
} from '@mui/material';
import {
    Visibility as ViewIcon,
    Comment as CommentIcon,
    Share as ShareIcon,
    MoreVert as MoreVertIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    ArrowBack as ArrowBackIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import { getBlogPost, getComments, addComment, deleteBlogPost, clearCurrentPost } from '../../store/slices/blogSlice';
import { getCurrentUser } from '../../store/slices/authSlice';
import { formatDate } from '../../utils/dateUtils';

const BlogDetail = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { currentPost, comments, loading, error, success } = useSelector(state => state.blog);
    const { user } = useSelector(state => state.auth);
    const authState = useSelector(state => state.auth);
    const [comment, setComment] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

    useEffect(() => {
        dispatch(getBlogPost(postId));
        dispatch(getComments(postId));

        return () => {
            dispatch(clearCurrentPost());
        };
    }, [dispatch, postId]);

    // Enhanced user authentication effect
    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && !user) {
            console.log('Token exists but no user in Redux, calling getCurrentUser...');
            dispatch(getCurrentUser());
        }
    }, [dispatch, user]);

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
        setOpenDeleteDialog(true);
        handleMenuClose();
    };

    const handleDeleteConfirm = () => {
        dispatch(deleteBlogPost(postId));
        setOpenDeleteDialog(false);
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

    // Enhanced getStoredUser function
    const getStoredUser = () => {
        try {
            const storedUser = localStorage.getItem('user');

            if (!storedUser) {
                return null;
            }

            const parsedUser = JSON.parse(storedUser);
            return parsedUser;
        } catch (error) {
            console.error('Error parsing stored user:', error);
            return null;
        }
    };

    const storedUser = getStoredUser();
    const currentUser = user || storedUser;

    // Enhanced author check with multiple comparison methods and correct field names
    const isAuthor = currentUser && currentPost && (() => {
        // Get user ID from either 'id' or 'UserID' field (authSlice uses 'id')
        const userId = currentUser.UserID || currentUser.id;

        if (!userId) {
            return false;
        }

        const result = (
            parseInt(userId) === parseInt(currentPost.AuthorID) ||
            String(userId) === String(currentPost.AuthorID) ||
            userId === currentPost.AuthorID
        );

        return result;
    })();

    // Check if current user is admin
    const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.Role === 'admin');

    // Show menu if user is author (for delete) or admin (for both edit and delete)
    const showMenu = isAuthor || isAdmin;

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

                        {showMenu && (
                            <>
                                <IconButton onClick={handleMenuOpen}>
                                    <MoreVertIcon />
                                </IconButton>
                                <Menu
                                    anchorEl={anchorEl}
                                    open={Boolean(anchorEl)}
                                    onClose={handleMenuClose}
                                >
                                    {isAdmin && (
                                        <MenuItem onClick={handleEdit}>
                                            <EditIcon sx={{ mr: 1 }} />
                                            Chỉnh sửa
                                        </MenuItem>
                                    )}
                                    {(isAuthor || isAdmin) && (
                                        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                                            <DeleteIcon sx={{ mr: 1 }} />
                                            Xóa bài viết
                                        </MenuItem>
                                    )}
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
                            e.target.src = '/api/images/default-blog.svg';
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
                {currentUser ? (
                    <Box component="form" onSubmit={handleSubmitComment} sx={{ mb: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                                {currentUser.FirstName?.charAt(0)}
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

            {/* Delete Dialog */}
            <Dialog
                open={openDeleteDialog}
                onClose={() => setOpenDeleteDialog(false)}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle id="alert-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon color="error" />
                    Xác nhận xóa bài viết
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description" sx={{ fontSize: '1rem', mb: 2 }}>
                        Bạn có chắc chắn muốn xóa bài viết <strong>&quot;{currentPost?.Title}&quot;</strong> không?
                    </DialogContentText>
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        Hành động này không thể hoàn tác. Bài viết sẽ bị xóa vĩnh viễn.
                    </Alert>
                </DialogContent>
                <DialogActions sx={{ p: 3, gap: 1 }}>
                    <Button
                        onClick={() => setOpenDeleteDialog(false)}
                        variant="outlined"
                        size="large"
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        variant="contained"
                        color="error"
                        size="large"
                        autoFocus
                        startIcon={<DeleteIcon />}
                    >
                        Xóa bài viết
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default BlogDetail; 