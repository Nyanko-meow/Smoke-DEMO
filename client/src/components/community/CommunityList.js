import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import {
    Container,
    Grid,
    Card,
    CardContent,
    CardActions,
    Typography,
    Button,
    Box,
    Avatar,
    Chip,
    CircularProgress,
    Alert,
    IconButton
} from '@mui/material';
import { Add as AddIcon, Comment as CommentIcon } from '@mui/icons-material';
import { getCommunityPosts } from '../../store/slices/communitySlice';
import { formatDistanceToNow } from 'date-fns';

const CommunityList = () => {
    const dispatch = useDispatch();
    const { posts, loading, error } = useSelector(state => state.community);
    const { user } = useSelector(state => state.auth);

    useEffect(() => {
        dispatch(getCommunityPosts());
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
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" component="h1" sx={{
                    fontWeight: 'bold',
                    color: 'primary.main'
                }}>
                    Community Discussions
                </Typography>
                {user && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        component={RouterLink}
                        to="/community/new"
                    >
                        New Post
                    </Button>
                )}
            </Box>

            <Grid container spacing={3}>
                {posts.map((post) => (
                    <Grid item xs={12} key={post.id}>
                        <Card
                            elevation={0}
                            sx={{
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: 2
                                }
                            }}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Avatar
                                        src={post.author.avatar}
                                        alt={post.author.name}
                                        sx={{ mr: 2 }}
                                    />
                                    <Box>
                                        <Typography variant="subtitle1" component="div">
                                            {post.author.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Typography variant="h6" component="h2" gutterBottom>
                                    {post.title}
                                </Typography>

                                <Typography
                                    variant="body1"
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
                                    {post.content}
                                </Typography>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip
                                        icon={<CommentIcon />}
                                        label={`${post.commentCount} comments`}
                                        size="small"
                                        variant="outlined"
                                    />
                                </Box>
                            </CardContent>

                            <CardActions>
                                <Button
                                    size="small"
                                    component={RouterLink}
                                    to={`/community/${post.id}`}
                                >
                                    Read More
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
};

export default CommunityList; 