import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    CircularProgress,
    Alert
} from '@mui/material';
import { createCommunityPost, clearSuccess, clearError } from '../../store/slices/communitySlice';

const CommunityPost = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { loading, error, success } = useSelector(state => state.community);
    const [formData, setFormData] = useState({
        title: '',
        content: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Clear previous states when component mounts
    useEffect(() => {
        dispatch(clearError());
        dispatch(clearSuccess());
    }, [dispatch]);

    // Handle success navigation
    useEffect(() => {
        if (success && !loading && !isSubmitting) {
            navigate('/community');
        }
    }, [success, loading, navigate, isSubmitting]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isSubmitting || loading) {
            return; // Prevent double submission
        }

        if (!formData.title.trim() || !formData.content.trim()) {
            return; // Don't submit if empty
        }

        setIsSubmitting(true);

        try {
            const resultAction = await dispatch(createCommunityPost(formData));

            if (createCommunityPost.fulfilled.match(resultAction)) {
                // Success - navigation will be handled by useEffect
                console.log('Post created successfully');
            } else {
                // Error case
                console.error('Failed to create post:', resultAction.payload);
            }
        } catch (error) {
            console.error('Error creating post:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={0} sx={{ p: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{
                    fontWeight: 'bold',
                    color: 'primary.main',
                    mb: 4
                }}>
                    Create New Post
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        sx={{ mb: 3 }}
                    />

                    <TextField
                        fullWidth
                        label="Content"
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        required
                        multiline
                        rows={8}
                        sx={{ mb: 3 }}
                    />

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={loading || isSubmitting || !formData.title.trim() || !formData.content.trim()}
                        >
                            {(loading || isSubmitting) ? <CircularProgress size={24} /> : 'Đăng bài'}
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            onClick={() => navigate('/community')}
                            disabled={loading || isSubmitting}
                        >
                            Hủy
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default CommunityPost; 