import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    Container,
    Paper,
    Typography,
    Box,
    Avatar,
    Button,
    TextField,
    Divider,
    CircularProgress,
    Alert,
    IconButton
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import {
    getCommunityPost,
    getCommunityComments,
    addCommunityComment,
    updateCommunityComment,
    deleteCommunityComment,
    deleteCommunityPost
} from '../../store/slices/communitySlice';
import { formatDistanceToNow } from 'date-fns';

const CommunityDetail = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { currentPost, comments, loading, error } = useSelector(state => state.community);
    const { user } = useSelector(state => state.auth);
    const [commentText, setCommentText] = useState('');
    const [editingComment, setEditingComment] = useState(null);

    useEffect(() => {
        dispatch(getCommunityPost(postId));
        dispatch(getCommunityComments(postId));
    }, [dispatch, postId]);

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (editingComment) {
            await dispatch(updateCommunityComment({
                commentId: editingComment.id,
                content: commentText
            }));
            setEditingComment(null);
        } else {
            await dispatch(addCommunityComment({
                postId,
                content: commentText
            }));
        }
        setCommentText('');
    };

    const handleEditComment = (comment) => {
        setEditingComment(comment);
        setCommentText(comment.content);
    };

    const handleDeleteComment = async (commentId) => {
        await dispatch(deleteCommunityComment(commentId));
    };

    const handleDeletePost = async () => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            await dispatch(deleteCommunityPost(postId));
            navigate('/community');
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
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    if (!currentPost) {
        return (
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Alert severity="info">Post not found</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={0} sx={{ p: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                            src={currentPost.author.avatar}
                            alt={currentPost.author.name}
                            sx={{ mr: 2 }}
                        />
                        <Box>
                            <Typography variant="subtitle1" component="div">
                                {currentPost.author.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {formatDistanceToNow(new Date(currentPost.createdAt), { addSuffix: true })}
                            </Typography>
                        </Box>
                    </Box>
                    {user && (user.id === currentPost.author.id || user.role === 'admin') && (
                        <Box>
                            <IconButton
                                color="primary"
                                onClick={() => navigate(`/community/edit/${postId}`)}
                            >
                                <EditIcon />
                            </IconButton>
                            <IconButton
                                color="error"
                                onClick={handleDeletePost}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Box>
                    )}
                </Box>

                <Typography variant="h4" component="h1" gutterBottom sx={{
                    fontWeight: 'bold',
                    color: 'primary.main'
                }}>
                    {currentPost.title}
                </Typography>

                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 4 }}>
                    {currentPost.content}
                </Typography>

                <Divider sx={{ my: 4 }} />

                <Typography variant="h6" gutterBottom>
                    Comments ({comments.length})
                </Typography>

                {user && (
                    <Box component="form" onSubmit={handleCommentSubmit} sx={{ mb: 4 }}>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="Write a comment..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            sx={{ mb: 2 }}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={!commentText.trim()}
                        >
                            {editingComment ? 'Update Comment' : 'Post Comment'}
                        </Button>
                    </Box>
                )}

                {comments.map((comment) => (
                    <Box key={comment.id} sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Avatar
                                    src={comment.author.avatar}
                                    alt={comment.author.name}
                                    sx={{ mr: 2 }}
                                />
                                <Box>
                                    <Typography variant="subtitle2" component="div">
                                        {comment.author.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                    </Typography>
                                </Box>
                            </Box>
                            {user && (user.id === comment.author.id || user.role === 'admin') && (
                                <Box>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleEditComment(comment)}
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDeleteComment(comment.id)}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            )}
                        </Box>
                        <Typography variant="body2" sx={{ ml: 7 }}>
                            {comment.content}
                        </Typography>
                    </Box>
                ))}
            </Paper>
        </Container>
    );
};

export default CommunityDetail; 