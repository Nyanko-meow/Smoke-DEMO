import React, { useState } from 'react';
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
import { createCommunityPost } from '../../store/slices/communitySlice';

const CommunityPost = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { loading, error, success } = useSelector(state => state.community);
    const [formData, setFormData] = useState({
        title: '',
        content: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await dispatch(createCommunityPost(formData));
        if (success) {
            navigate('/community');
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
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Post'}
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            onClick={() => navigate('/community')}
                        >
                            Cancel
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default CommunityPost; 