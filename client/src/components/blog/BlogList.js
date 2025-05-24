import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
    Container,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Typography,
    Box,
    Chip,
    CircularProgress,
    Button,
    Stack,
    Divider,
    Paper,
    Avatar
} from '@mui/material';
import {
    Add as AddIcon,
    Visibility as ViewIcon,
    Comment as CommentIcon,
    Person as PersonIcon
} from '@mui/icons-material';
import { getBlogPosts } from '../../store/slices/blogSlice';
import { formatDate } from '../../utils/dateUtils';

const BlogList = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { posts, loading, error } = useSelector(state => state.blog);
    const { user } = useSelector(state => state.auth);

    useEffect(() => {
        dispatch(getBlogPosts());
    }, [dispatch]);

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
                        onClick={() => dispatch(getBlogPosts())}
                    >
                        Thử lại
                    </Button>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Header Section */}
            <Box sx={{ mb: 4 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography
                        variant="h3"
                        component="h1"
                        sx={{
                            fontWeight: 'bold',
                            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        Blog SmokieKing
                    </Typography>
                    {user && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => navigate('/blog/new')}
                            sx={{
                                background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                                borderRadius: '20px',
                                px: 3
                            }}
                        >
                            Viết bài mới
                        </Button>
                    )}
                </Stack>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                    Chia sẻ hành trình cai thuốc và truyền cảm hứng cho cộng đồng
                </Typography>
                <Divider />
            </Box>

            {/* Blog Posts Grid */}
            {posts.length === 0 ? (
                <Paper elevation={2} sx={{ p: 6, textAlign: 'center' }}>
                    <Typography variant="h5" color="text.secondary" gutterBottom>
                        Chưa có bài viết nào
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        Hãy là người đầu tiên chia sẻ câu chuyện của bạn!
                    </Typography>
                    {user && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => navigate('/blog/new')}
                            size="large"
                        >
                            Viết bài đầu tiên
                        </Button>
                    )}
                </Paper>
            ) : (
                <Grid container spacing={4}>
                    {posts.map((post) => (
                        <Grid item key={post.PostID} xs={12} md={6} lg={4}>
                            <Card
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'all 0.3s ease-in-out',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        transform: 'translateY(-8px)',
                                        boxShadow: '0 12px 20px rgba(0,0,0,0.15)'
                                    }
                                }}
                                onClick={() => navigate(`/blog/${post.PostID}`)}
                            >
                                <CardMedia
                                    component="img"
                                    height="220"
                                    image={post.ThumbnailURL || '/images/default-blog.jpg'}
                                    alt={post.Title}
                                    sx={{
                                        borderRadius: '8px 8px 0 0',
                                        objectFit: 'cover'
                                    }}
                                />
                                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                                    <Typography
                                        gutterBottom
                                        variant="h6"
                                        component="h2"
                                        sx={{
                                            fontWeight: 'bold',
                                            mb: 2,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            minHeight: '3.2em'
                                        }}
                                    >
                                        {post.Title}
                                    </Typography>

                                    {post.MetaDescription && (
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{
                                                mb: 2,
                                                display: '-webkit-box',
                                                WebkitLineClamp: 3,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                minHeight: '4.5em'
                                            }}
                                        >
                                            {post.MetaDescription}
                                        </Typography>
                                    )}

                                    {/* Author Info */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
                                            <PersonIcon />
                                        </Avatar>
                                        <Typography variant="body2" color="text.secondary">
                                            {post.AuthorFirstName} {post.AuthorLastName}
                                        </Typography>
                                    </Box>

                                    {/* Post Stats */}
                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        mt: 'auto'
                                    }}>
                                        <Stack direction="row" spacing={1}>
                                            <Chip
                                                icon={<ViewIcon sx={{ fontSize: '16px !important' }} />}
                                                label={post.Views || 0}
                                                size="small"
                                                variant="outlined"
                                                color="primary"
                                            />
                                            <Chip
                                                icon={<CommentIcon sx={{ fontSize: '16px !important' }} />}
                                                label={post.CommentCount || 0}
                                                size="small"
                                                variant="outlined"
                                                color="secondary"
                                            />
                                        </Stack>
                                        <Typography variant="caption" color="text.secondary">
                                            {formatDate(post.CreatedAt)}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Call to Action */}
            {posts.length > 0 && user && (
                <Box sx={{ textAlign: 'center', mt: 6 }}>
                    <Typography variant="h5" gutterBottom>
                        Bạn có câu chuyện để chia sẻ?
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        Hãy viết về hành trình cai thuốc của bạn để truyền cảm hứng cho những người khác
                    </Typography>
                    <Button
                        variant="outlined"
                        size="large"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/blog/new')}
                        sx={{ borderRadius: '20px', px: 4 }}
                    >
                        Chia sẻ câu chuyện
                    </Button>
                </Box>
            )}
        </Container>
    );
};

export default BlogList; 