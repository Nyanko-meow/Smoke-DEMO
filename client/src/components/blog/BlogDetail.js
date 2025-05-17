import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
    Alert
} from '@mui/material';
import { getBlogPost, getComments, addComment } from '../../store/slices/blogSlice';
import { formatDate } from '../../utils/dateUtils';

const BlogDetail = () => {
    const { postId } = useParams();
    const dispatch = useDispatch();
    const { currentPost, comments, loading, error, success } = useSelector(state => state.blog);
    const { user } = useSelector(state => state.auth);
    const [comment, setComment] = useState('');

    useEffect(() => {
        dispatch(getBlogPost(postId));
        dispatch(getComments(postId));
    }, [dispatch, postId]);

    const handleSubmitComment = (e) => {
        e.preventDefault();
        if (comment.trim()) {
            dispatch(addComment({ postId, content: comment }));
            setComment('');
        }
    };

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
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    if (!currentPost) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <Alert severity="info">Post not found</Alert>
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Blog Post */}
            <Paper elevation={0} sx={{ p: 4, mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{
                    fontWeight: 'bold',
                    color: 'primary.main'
                }}>
                    {currentPost.Title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar
                        src={currentPost.AuthorAvatar}
                        alt={`${currentPost.AuthorFirstName} ${currentPost.AuthorLastName}`}
                        sx={{ mr: 2 }}
                    />
                    <Box>
                        <Typography variant="subtitle1">
                            {`${currentPost.AuthorFirstName} ${currentPost.AuthorLastName}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {formatDate(currentPost.CreatedAt)}
                        </Typography>
                    </Box>
                </Box>
                {currentPost.ImageUrl && (
                    <Box
                        component="img"
                        src={currentPost.ImageUrl}
                        alt={currentPost.Title}
                        sx={{
                            width: '100%',
                            maxHeight: '400px',
                            objectFit: 'cover',
                            borderRadius: 1,
                            mb: 3
                        }}
                    />
                )}
                <Typography
                    variant="body1"
                    sx={{
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.8
                    }}
                >
                    {currentPost.Content}
                </Typography>
            </Paper>

            {/* Comments Section */}
            <Paper elevation={0} sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Comments ({comments.length})
                </Typography>
                <Divider sx={{ mb: 3 }} />

                {/* Comment Form */}
                {user && (
                    <Box component="form" onSubmit={handleSubmitComment} sx={{ mb: 4 }}>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="Write a comment..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            sx={{ mb: 2 }}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={!comment.trim()}
                        >
                            Post Comment
                        </Button>
                    </Box>
                )}

                {/* Comments List */}
                {comments.map((comment) => (
                    <Box key={comment.CommentID} sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                            <Avatar
                                src={comment.UserAvatar}
                                alt={`${comment.FirstName} ${comment.LastName}`}
                                sx={{ mr: 2 }}
                            />
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2">
                                    {`${comment.FirstName} ${comment.LastName}`}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {formatDate(comment.CreatedAt)}
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    {comment.Content}
                                </Typography>
                            </Box>
                        </Box>
                        <Divider />
                    </Box>
                ))}

                {comments.length === 0 && (
                    <Typography variant="body2" color="text.secondary" align="center">
                        No comments yet. Be the first to comment!
                    </Typography>
                )}
            </Paper>
        </Container>
    );
};

export default BlogDetail; 