import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Alert,
    IconButton
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import { createBlogPost, updateBlogPost, getBlogPost } from '../../store/slices/blogSlice';

const BlogEditor = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { loading, error, success } = useSelector(state => state.blog);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        status: 'draft',
        imageUrl: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');

    useEffect(() => {
        if (postId) {
            dispatch(getBlogPost(postId));
        }
    }, [dispatch, postId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Here you would typically upload the image first and get the URL
        // For now, we'll just use the formData
        const postData = {
            ...formData,
            imageUrl: previewUrl // In production, this would be the URL from your image upload service
        };

        if (postId) {
            await dispatch(updateBlogPost({ postId, postData }));
        } else {
            await dispatch(createBlogPost(postData));
        }

        if (success) {
            navigate('/blog');
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={0} sx={{ p: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{
                    fontWeight: 'bold',
                    color: 'primary.main',
                    mb: 4
                }}>
                    {postId ? 'Edit Post' : 'Create New Post'}
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
                        rows={10}
                        sx={{ mb: 3 }}
                    />

                    <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            label="Status"
                        >
                            <MenuItem value="draft">Draft</MenuItem>
                            <MenuItem value="published">Published</MenuItem>
                            <MenuItem value="archived">Archived</MenuItem>
                        </Select>
                    </FormControl>

                    <Box sx={{ mb: 3 }}>
                        <input
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="image-upload"
                            type="file"
                            onChange={handleImageChange}
                        />
                        <label htmlFor="image-upload">
                            <IconButton
                                color="primary"
                                component="span"
                                sx={{ mb: 2 }}
                            >
                                <PhotoCamera />
                            </IconButton>
                        </label>
                        {previewUrl && (
                            <Box
                                component="img"
                                src={previewUrl}
                                alt="Preview"
                                sx={{
                                    width: '100%',
                                    maxHeight: '300px',
                                    objectFit: 'cover',
                                    borderRadius: 1
                                }}
                            />
                        )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Save Post'}
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            onClick={() => navigate('/blog')}
                        >
                            Cancel
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default BlogEditor; 