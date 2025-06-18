import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Card,
    CardContent,
    CardActions,
    Button,
    Box,
    Chip,
    Grid,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Tooltip,
    Fab,
    CircularProgress
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as VisibilityIcon,
    Add as AddIcon,
    HourglassEmpty as PendingIcon,
    CheckCircle as PublishedIcon,
    Cancel as RejectedIcon,
    Article as DraftIcon
} from '@mui/icons-material';
import { getUserPosts, deleteBlogPost } from '../../store/slices/blogSlice';

const MyPosts = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { userPosts, loading, error } = useSelector(state => state.blog);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);

    useEffect(() => {
        dispatch(getUserPosts());
    }, [dispatch]);

    const getStatusConfig = (status) => {
        switch (status) {
            case 'published':
                return {
                    label: 'Đã xuất bản',
                    color: 'success',
                    icon: <PublishedIcon fontSize="small" />
                };
            case 'Pending':
                return {
                    label: 'Chờ duyệt',
                    color: 'warning',
                    icon: <PendingIcon fontSize="small" />
                };
            case 'rejected':
                return {
                    label: 'Bị từ chối',
                    color: 'error',
                    icon: <RejectedIcon fontSize="small" />
                };
            case 'draft':
                return {
                    label: 'Bản nháp',
                    color: 'default',
                    icon: <DraftIcon fontSize="small" />
                };
            default:
                return {
                    label: status,
                    color: 'default',
                    icon: null
                };
        }
    };

    const handleDeleteClick = (post) => {
        setPostToDelete(post);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (postToDelete) {
            await dispatch(deleteBlogPost(postToDelete.PostID));
            setDeleteDialogOpen(false);
            setPostToDelete(null);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress size={60} />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
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
                    Bài viết của tôi
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    Quản lý tất cả bài viết bạn đã viết
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Status Legend */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                    Trạng thái bài viết:
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {[
                        { status: 'published', description: 'Bài viết đã được xuất bản và hiển thị công khai' },
                        { status: 'Pending', description: 'Bài viết đang chờ admin phê duyệt' },
                        { status: 'rejected', description: 'Bài viết bị từ chối, có thể chỉnh sửa và gửi lại' },
                        { status: 'draft', description: 'Bản nháp chưa hoàn thành' }
                    ].map(({ status, description }) => {
                        const config = getStatusConfig(status);
                        return (
                            <Tooltip key={status} title={description}>
                                <Chip
                                    size="small"
                                    icon={config.icon}
                                    label={config.label}
                                    color={config.color}
                                    variant="outlined"
                                />
                            </Tooltip>
                        );
                    })}
                </Box>
            </Box>

            {/* Posts Grid */}
            {userPosts && userPosts.length > 0 ? (
                <Grid container spacing={3}>
                    {userPosts.map((post) => {
                        const statusConfig = getStatusConfig(post.Status);
                        return (
                            <Grid item xs={12} sm={6} md={4} key={post.PostID}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        position: 'relative',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: 3
                                        },
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    {/* Status Badge */}
                                    <Chip
                                        size="small"
                                        icon={statusConfig.icon}
                                        label={statusConfig.label}
                                        color={statusConfig.color}
                                        sx={{
                                            position: 'absolute',
                                            top: 8,
                                            right: 8,
                                            zIndex: 1
                                        }}
                                    />

                                    {/* Thumbnail */}
                                    {post.ThumbnailURL && (
                                        <Box
                                            component="img"
                                            src={post.ThumbnailURL}
                                            alt={post.Title}
                                            sx={{
                                                width: '100%',
                                                height: 200,
                                                objectFit: 'cover'
                                            }}
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    )}

                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Typography variant="h6" component="h2" gutterBottom>
                                            {post.Title}
                                        </Typography>

                                        {post.MetaDescription && (
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    mb: 2
                                                }}
                                            >
                                                {post.MetaDescription}
                                            </Typography>
                                        )}

                                        <Typography variant="caption" color="text.secondary">
                                            Tạo: {formatDate(post.CreatedAt)}
                                        </Typography>

                                        {post.Views && post.Views !== 0 && (
                                            <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                                                Lượt xem: {post.Views}
                                            </Typography>
                                        )}
                                    </CardContent>

                                    <CardActions sx={{ justifyContent: 'space-between' }}>
                                        <Box>
                                            {post.Status === 'published' && (
                                                <Tooltip title="Xem bài viết">
                                                    <IconButton
                                                        component={Link}
                                                        to={`/blog/${post.PostID}`}
                                                        size="small"
                                                        color="primary"
                                                    >
                                                        <VisibilityIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            )}

                                            <Tooltip title="Chỉnh sửa">
                                                <IconButton
                                                    component={Link}
                                                    to={`/blog/edit/${post.PostID}`}
                                                    size="small"
                                                    color="primary"
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>

                                        <Tooltip title="Xóa bài viết">
                                            <IconButton
                                                onClick={() => handleDeleteClick(post)}
                                                size="small"
                                                color="error"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </CardActions>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        Bạn chưa có bài viết nào
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Hãy chia sẻ câu chuyện và kinh nghiệm của bạn với cộng đồng
                    </Typography>
                    <Button
                        component={Link}
                        to="/blog/new"
                        variant="contained"
                        startIcon={<AddIcon />}
                        size="large"
                        sx={{
                            background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                            borderRadius: '25px'
                        }}
                    >
                        Viết bài đầu tiên
                    </Button>
                </Box>
            )}

            {/* Floating Action Button */}
            <Fab
                color="primary"
                aria-label="add"
                sx={{
                    position: 'fixed',
                    bottom: 16,
                    right: 16,
                    background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)'
                }}
                component={Link}
                to="/blog/new"
            >
                <AddIcon />
            </Fab>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>Xác nhận xóa bài viết</DialogTitle>
                <DialogContent>
                    <Typography>
                        Bạn có chắc chắn muốn xóa bài viết &apos;{postToDelete?.Title}&apos;&#63;
                        Hành động này không thể hoàn tác.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>
                        Hủy
                    </Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        Xóa
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default MyPosts; 