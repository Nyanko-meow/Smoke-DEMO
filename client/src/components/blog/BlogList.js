import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
    Container,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Typography,
    Box,
    Chip,
    CircularProgress
} from '@mui/material';
import { getBlogPosts } from '../../store/slices/blogSlice';
import { formatDate } from '../../utils/dateUtils';

const BlogList = () => {
    const dispatch = useDispatch();
    const { posts, loading, error } = useSelector(state => state.blog);

    useEffect(() => {
        dispatch(getBlogPosts());
    }, [dispatch]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{
                fontWeight: 'bold',
                color: 'primary.main',
                mb: 4
            }}>
                Latest Articles
            </Typography>
            <Grid container spacing={4}>
                {posts.map((post) => (
                    <Grid item key={post.PostID} xs={12} md={6} lg={4}>
                        <Card
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'transform 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: 3
                                }
                            }}
                        >
                            <CardMedia
                                component="img"
                                height="200"
                                image={post.ImageUrl || '/images/blog-placeholder.jpg'}
                                alt={post.Title}
                            />
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Typography
                                    gutterBottom
                                    variant="h6"
                                    component="h2"
                                    sx={{
                                        fontWeight: 'bold',
                                        mb: 2
                                    }}
                                >
                                    {post.Title}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: 'vertical',
                                        mb: 2
                                    }}
                                >
                                    {post.Content}
                                </Typography>
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    mt: 'auto'
                                }}>
                                    <Typography variant="caption" color="text.secondary">
                                        {formatDate(post.CreatedAt)}
                                    </Typography>
                                    <Chip
                                        label={`${post.CommentCount} comments`}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                    />
                                </Box>
                            </CardContent>
                            <Link
                                to={`/blog/${post.PostID}`}
                                style={{
                                    textDecoration: 'none',
                                    color: 'inherit'
                                }}
                            >
                                <Box
                                    sx={{
                                        p: 2,
                                        bgcolor: 'primary.main',
                                        color: 'white',
                                        textAlign: 'center',
                                        fontWeight: 'bold',
                                        '&:hover': {
                                            bgcolor: 'primary.dark'
                                        }
                                    }}
                                >
                                    Read More
                                </Box>
                            </Link>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
};

export default BlogList; 