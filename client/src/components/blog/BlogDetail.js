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
    DialogActions,
    Tooltip
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
import { getBlogPost, getComments, addComment, deleteComment, deleteBlogPost, clearCurrentPost, incrementViewCount } from '../../store/slices/blogSlice';
import { getCurrentUser } from '../../store/slices/authSlice';
import { formatDate } from '../../utils/dateUtils';
import { message, Popconfirm } from 'antd';
import './BlogDetail.css';

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
    const [hasIncrementedView, setHasIncrementedView] = useState(false);

    useEffect(() => {
        dispatch(getBlogPost(postId));
        dispatch(getComments(postId));
        setHasIncrementedView(false); // Reset flag when switching posts

        return () => {
            dispatch(clearCurrentPost());
        };
    }, [dispatch, postId]);

    // Increment view count only once when blog post is loaded successfully
    useEffect(() => {
        if (currentPost && !hasIncrementedView && !loading) {
            dispatch(incrementViewCount(postId));
            setHasIncrementedView(true);
        }
    }, [currentPost, hasIncrementedView, loading, dispatch, postId]);

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
            // Only redirect to blog list when deleting a post, not when adding comment
            const isDeleteSuccess = !currentPost; // If currentPost is null, it means we deleted it
            if (isDeleteSuccess) {
                navigate('/blog');
            }
        }
    }, [success, navigate, currentPost]);

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (comment.trim()) {
            try {
                await dispatch(addComment({ postId, content: comment })).unwrap();
                setComment('');
                // Reload comments to show the new one immediately
                dispatch(getComments(postId));
                message.success('Bình luận đã được đăng thành công!');
            } catch (error) {
                message.error('Lỗi khi đăng bình luận: ' + error);
            }
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            const result = await dispatch(deleteComment(commentId)).unwrap();
            message.success(result.message || 'Xóa bình luận thành công!');
        } catch (error) {
            message.error('Lỗi khi xóa bình luận: ' + error);
        }
    };

    // Check if user can delete comment (owner or admin)
    const canDeleteComment = (comment) => {
        if (!currentUser) return false;
        const userId = currentUser.UserID || currentUser.id;
        const isCommentOwner = parseInt(userId) === parseInt(comment.UserID);
        const isAdmin = currentUser.role === 'admin' || currentUser.Role === 'admin';
        return isCommentOwner || isAdmin;
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
        <Container maxWidth="lg" className="blog-detail-container fade-in" sx={{
            py: 4,
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            margin: 0,
            maxWidth: 'none !important',
            width: '100%'
        }}>
            <div className="blog-content-wrapper" style={{
                maxWidth: '1200px',
                margin: '0 auto',
                padding: '0 24px'
            }}>
                {/* Back Button */}
                <Button
                    className="back-button hover-lift"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/blog')}
                    sx={{
                        mb: 3,
                        background: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#667eea',
                        fontWeight: 600,
                        px: 3,
                        py: 1.5,
                        '&:hover': {
                            background: 'rgba(255, 255, 255, 1)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)'
                        },
                        transition: 'all 0.3s ease'
                    }}
                >
                    Quay lại danh sách
                </Button>

                {/* Blog Post */}
                <Paper className="blog-post-paper slide-up" elevation={0} sx={{
                    p: 4,
                    mb: 4,
                    borderRadius: '24px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
                }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                        <Box sx={{ flex: 1 }}>
                            <Typography
                                variant="h3"
                                component="h1"
                                gutterBottom
                                sx={{
                                    fontWeight: 'bold',
                                    background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    mb: 3,
                                    lineHeight: 1.2,
                                    fontSize: { xs: '2rem', md: '3rem' }
                                }}
                            >
                                {currentPost.Title}
                            </Typography>

                            {/* Meta Description */}
                            {currentPost.MetaDescription && (
                                <Typography
                                    variant="h6"
                                    sx={{
                                        mb: 3,
                                        fontStyle: 'italic',
                                        color: '#6b7280',
                                        fontSize: '1.1rem',
                                        lineHeight: 1.6,
                                        background: 'rgba(103, 126, 234, 0.05)',
                                        padding: '16px 20px',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(103, 126, 234, 0.1)'
                                    }}
                                >
                                    {currentPost.MetaDescription}
                                </Typography>
                            )}
                        </Box>

                        {/* Action Buttons */}
                        <Stack direction="row" spacing={1}>
                            <IconButton
                                onClick={handleShare}
                                sx={{
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                    color: 'white',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                                        transform: 'scale(1.1)'
                                    },
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <ShareIcon />
                            </IconButton>

                            {showMenu && (
                                <>
                                    <IconButton
                                        onClick={handleMenuOpen}
                                        sx={{
                                            background: 'rgba(107, 114, 128, 0.1)',
                                            '&:hover': {
                                                background: 'rgba(107, 114, 128, 0.2)',
                                                transform: 'scale(1.1)'
                                            },
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        <MoreVertIcon />
                                    </IconButton>
                                    <Menu
                                        anchorEl={anchorEl}
                                        open={Boolean(anchorEl)}
                                        onClose={handleMenuClose}
                                        PaperProps={{
                                            sx: {
                                                borderRadius: '12px',
                                                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)'
                                            }
                                        }}
                                    >
                                        {isAdmin && (
                                            <MenuItem onClick={handleEdit} sx={{ borderRadius: '8px', mx: 1 }}>
                                                <EditIcon sx={{ mr: 1, color: '#3b82f6' }} />
                                                Chỉnh sửa
                                            </MenuItem>
                                        )}
                                        {(isAuthor || isAdmin) && (
                                            <MenuItem onClick={handleDelete} sx={{ color: 'error.main', borderRadius: '8px', mx: 1 }}>
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
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 4,
                        flexWrap: 'wrap',
                        gap: 2
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar
                                sx={{
                                    mr: 2,
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    width: 56,
                                    height: 56,
                                    fontSize: '1.5rem',
                                    fontWeight: 'bold'
                                }}
                            >
                                {currentPost.AuthorFirstName?.charAt(0)}
                            </Avatar>
                            <Box>
                                <Typography variant="h6" sx={{
                                    fontWeight: 'bold',
                                    color: '#1f2937',
                                    mb: 0.5
                                }}>
                                    {`${currentPost.AuthorFirstName} ${currentPost.AuthorLastName}`}
                                </Typography>
                                <Typography variant="body2" sx={{
                                    color: '#6b7280',
                                    fontSize: '0.9rem'
                                }}>
                                    {formatDate(currentPost.CreatedAt)}
                                </Typography>
                            </Box>
                        </Box>

                        <Stack direction="row" spacing={2}>
                            <Chip
                                icon={<ViewIcon />}
                                label={`${currentPost.Views || 0} lượt xem`}
                                variant="outlined"
                                sx={{
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    borderColor: 'rgba(59, 130, 246, 0.3)',
                                    color: '#3b82f6',
                                    fontWeight: 600,
                                    '& .MuiChip-icon': { color: '#3b82f6' }
                                }}
                            />
                            <Chip
                                icon={<CommentIcon />}
                                label={`${comments.length} bình luận`}
                                variant="outlined"
                                sx={{
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    borderColor: 'rgba(16, 185, 129, 0.3)',
                                    color: '#10b981',
                                    fontWeight: 600,
                                    '& .MuiChip-icon': { color: '#10b981' }
                                }}
                            />
                        </Stack>
                    </Box>

                    <Divider sx={{
                        mb: 4,
                        background: 'linear-gradient(90deg, transparent 0%, rgba(103, 126, 234, 0.3) 50%, transparent 100%)'
                    }} />

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
                                borderRadius: '16px',
                                mb: 4,
                                boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                                border: '1px solid rgba(255, 255, 255, 0.2)'
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
                            color: '#374151',
                            background: 'rgba(249, 250, 251, 0.8)',
                            padding: '24px',
                            borderRadius: '16px',
                            border: '1px solid rgba(229, 231, 235, 0.5)'
                        }}
                    >
                        {currentPost.Content}
                    </Typography>
                </Paper>

                {/* Comments Section */}
                <Paper elevation={0} sx={{
                    p: 4,
                    borderRadius: '24px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
                }}>
                    <Typography variant="h5" gutterBottom sx={{
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        color: '#1f2937',
                        mb: 3
                    }}>
                        <CommentIcon sx={{ color: '#667eea' }} />
                        Bình luận ({comments.length})
                    </Typography>
                    <Divider sx={{
                        mb: 4,
                        background: 'linear-gradient(90deg, transparent 0%, rgba(103, 126, 234, 0.3) 50%, transparent 100%)'
                    }} />

                    {/* Comment Form */}
                    {currentUser ? (
                        <Box component="form" onSubmit={handleSubmitComment} sx={{ mb: 4 }}>
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 2,
                                mb: 2,
                                background: 'rgba(249, 250, 251, 0.8)',
                                padding: '20px',
                                borderRadius: '16px',
                                border: '1px solid rgba(229, 231, 235, 0.5)'
                            }}>
                                <Avatar sx={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    width: 48,
                                    height: 48,
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold'
                                }}>
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
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '12px',
                                            background: 'white',
                                            '&:hover fieldset': {
                                                borderColor: '#667eea',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#667eea',
                                            },
                                        }
                                    }}
                                />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={!comment.trim()}
                                    sx={{
                                        borderRadius: '12px',
                                        px: 4,
                                        py: 1.5,
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        fontWeight: 600,
                                        fontSize: '1rem',
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 8px 25px rgba(103, 126, 234, 0.4)'
                                        },
                                        '&:disabled': {
                                            background: 'rgba(156, 163, 175, 0.5)',
                                            transform: 'none',
                                            boxShadow: 'none'
                                        },
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    Đăng bình luận
                                </Button>
                            </Box>
                        </Box>
                    ) : (
                        <Box sx={{
                            textAlign: 'center',
                            py: 4,
                            mb: 4,
                            background: 'linear-gradient(135deg, rgba(249, 250, 251, 0.8) 0%, rgba(243, 244, 246, 0.8) 100%)',
                            borderRadius: '16px',
                            border: '1px solid rgba(229, 231, 235, 0.5)'
                        }}>
                            <Typography variant="body1" sx={{ color: '#6b7280', mb: 2, fontSize: '1.1rem' }}>
                                Vui lòng đăng nhập để bình luận
                            </Typography>
                            <Button
                                variant="contained"
                                sx={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    borderRadius: '12px',
                                    px: 4,
                                    py: 1.5,
                                    fontWeight: 600,
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 8px 25px rgba(103, 126, 234, 0.4)'
                                    },
                                    transition: 'all 0.3s ease'
                                }}
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
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 2,
                                    py: 3,
                                    background: index % 2 === 0 ? 'rgba(249, 250, 251, 0.5)' : 'transparent',
                                    borderRadius: '12px',
                                    px: 2,
                                    mx: -2
                                }}>
                                    <Avatar sx={{
                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        width: 44,
                                        height: 44,
                                        fontSize: '1.1rem',
                                        fontWeight: 'bold'
                                    }}>
                                        {comment.FirstName?.charAt(0)}
                                    </Avatar>
                                    <Box sx={{ flex: 1 }}>
                                        <Box className="comment-header" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Typography variant="subtitle1" sx={{
                                                    fontWeight: 'bold',
                                                    color: '#1f2937'
                                                }}>
                                                    {`${comment.FirstName} ${comment.LastName}`}
                                                </Typography>
                                                <Typography variant="caption" sx={{
                                                    color: '#9ca3af',
                                                    background: 'rgba(156, 163, 175, 0.1)',
                                                    px: 2,
                                                    py: 0.5,
                                                    borderRadius: '8px',
                                                    fontSize: '0.75rem'
                                                }}>
                                                    {formatDate(comment.CreatedAt)}
                                                </Typography>
                                            </Box>

                                            {/* Delete Comment Button */}
                                            {canDeleteComment(comment) && (
                                                <Popconfirm
                                                    title="Xóa bình luận"
                                                    description="Bạn có chắc chắn muốn xóa bình luận này?"
                                                    onConfirm={() => handleDeleteComment(comment.CommentID)}
                                                    okText="Xóa"
                                                    cancelText="Hủy"
                                                    okButtonProps={{ danger: true }}
                                                    placement="topRight"
                                                >
                                                    <Tooltip title="Xóa bình luận">
                                                        <IconButton
                                                            className="comment-delete-btn"
                                                            size="small"
                                                            sx={{
                                                                color: '#ef4444',
                                                                '&:hover': {
                                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                                    transform: 'scale(1.1)'
                                                                },
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Popconfirm>
                                            )}
                                        </Box>
                                        <Typography variant="body1" sx={{
                                            lineHeight: 1.6,
                                            color: '#374151',
                                            background: 'rgba(255, 255, 255, 0.8)',
                                            padding: '12px 16px',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(229, 231, 235, 0.5)'
                                        }}>
                                            {comment.CommentText}
                                        </Typography>
                                    </Box>
                                </Box>
                                {index < comments.length - 1 && (
                                    <Divider sx={{
                                        my: 2,
                                        background: 'rgba(229, 231, 235, 0.5)'
                                    }} />
                                )}
                            </Box>
                        ))
                    ) : (
                        <Box sx={{
                            textAlign: 'center',
                            py: 8,
                            background: 'linear-gradient(135deg, rgba(249, 250, 251, 0.8) 0%, rgba(243, 244, 246, 0.8) 100%)',
                            borderRadius: '16px',
                            border: '1px solid rgba(229, 231, 235, 0.5)'
                        }}>
                            <CommentIcon sx={{
                                fontSize: 64,
                                color: '#d1d5db',
                                mb: 2
                            }} />
                            <Typography variant="h6" sx={{
                                color: '#6b7280',
                                gutterBottom: true,
                                fontWeight: 600,
                                mb: 1
                            }}>
                                Chưa có bình luận nào
                            </Typography>
                            <Typography variant="body2" sx={{
                                color: '#9ca3af',
                                fontSize: '1rem'
                            }}>
                                Hãy là người đầu tiên bình luận về bài viết này!
                            </Typography>
                        </Box>
                    )}
                </Paper>
            </div>

            {/* Delete Dialog */}
            <Dialog
                open={openDeleteDialog}
                onClose={() => setOpenDeleteDialog(false)}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '16px',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                    }
                }}
            >
                <DialogTitle id="alert-dialog-title" sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: '#dc2626',
                    fontWeight: 'bold'
                }}>
                    <WarningIcon color="error" />
                    Xác nhận xóa bài viết
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description" sx={{
                        fontSize: '1rem',
                        mb: 2,
                        color: '#374151'
                    }}>
                        Bạn có chắc chắn muốn xóa bài viết <strong>&quot;{currentPost?.Title}&quot;</strong> không?
                    </DialogContentText>
                    <Alert severity="warning" sx={{
                        mt: 2,
                        borderRadius: '12px',
                        background: 'rgba(251, 191, 36, 0.1)',
                        border: '1px solid rgba(251, 191, 36, 0.3)'
                    }}>
                        Hành động này không thể hoàn tác. Bài viết sẽ bị xóa vĩnh viễn.
                    </Alert>
                </DialogContent>
                <DialogActions sx={{ p: 3, gap: 1 }}>
                    <Button
                        onClick={() => setOpenDeleteDialog(false)}
                        variant="outlined"
                        size="large"
                        sx={{
                            borderRadius: '12px',
                            px: 3,
                            borderColor: '#d1d5db',
                            color: '#6b7280',
                            '&:hover': {
                                borderColor: '#9ca3af',
                                background: 'rgba(156, 163, 175, 0.1)'
                            }
                        }}
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
                        sx={{
                            borderRadius: '12px',
                            px: 3,
                            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 25px rgba(220, 38, 38, 0.4)'
                            },
                            transition: 'all 0.3s ease'
                        }}
                    >
                        Xóa bài viết
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default BlogDetail; 