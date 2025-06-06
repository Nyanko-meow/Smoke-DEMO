import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunks
export const getBlogPosts = createAsyncThunk(
    'blog/getPosts',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get('/api/blog');
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Error getting blog posts');
        }
    }
);

export const getBlogPost = createAsyncThunk(
    'blog/getPost',
    async (postId, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/api/blog/${postId}`);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Error getting blog post');
        }
    }
);

export const createBlogPost = createAsyncThunk(
    'blog/createPost',
    async (postData, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('/api/blog', postData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Return both the post data and the status/message for notification
            return {
                post: response.data.data,
                status: response.data.status,
                message: response.data.message
            };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Error creating blog post');
        }
    }
);

export const updateBlogPost = createAsyncThunk(
    'blog/updatePost',
    async ({ postId, postData }, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(`/api/blog/${postId}`, postData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Error updating blog post');
        }
    }
);

export const deleteBlogPost = createAsyncThunk(
    'blog/deletePost',
    async (postId, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/blog/${postId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return postId;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Error deleting blog post');
        }
    }
);

export const getUserPosts = createAsyncThunk(
    'blog/getUserPosts',
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/blog/my/posts', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Error getting your posts');
        }
    }
);

export const addComment = createAsyncThunk(
    'blog/addComment',
    async ({ postId, content }, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`/api/blog/${postId}/comments`, { content }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Error adding comment');
        }
    }
);

export const getComments = createAsyncThunk(
    'blog/getComments',
    async (postId, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/api/blog/${postId}/comments`);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Error getting comments');
        }
    }
);

// Initial state
const initialState = {
    posts: [],
    userPosts: [],
    currentPost: null,
    comments: [],
    loading: false,
    error: null,
    success: false
};

// Slice
const blogSlice = createSlice({
    name: 'blog',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearSuccess: (state) => {
            state.success = false;
        },
        clearCurrentPost: (state) => {
            state.currentPost = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Get posts
            .addCase(getBlogPosts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getBlogPosts.fulfilled, (state, action) => {
                state.loading = false;
                state.posts = action.payload;
            })
            .addCase(getBlogPosts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Get single post
            .addCase(getBlogPost.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getBlogPost.fulfilled, (state, action) => {
                state.loading = false;
                state.currentPost = action.payload;
            })
            .addCase(getBlogPost.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Create post
            .addCase(createBlogPost.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createBlogPost.fulfilled, (state, action) => {
                state.loading = false;
                state.posts.unshift(action.payload.post);
                state.userPosts.unshift(action.payload.post);
                state.success = true;
            })
            .addCase(createBlogPost.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Update post
            .addCase(updateBlogPost.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateBlogPost.fulfilled, (state, action) => {
                state.loading = false;
                state.posts = state.posts.map(post =>
                    post.PostID === action.payload.PostID ? action.payload : post
                );
                state.userPosts = state.userPosts.map(post =>
                    post.PostID === action.payload.PostID ? action.payload : post
                );
                state.currentPost = action.payload;
                state.success = true;
            })
            .addCase(updateBlogPost.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Delete post
            .addCase(deleteBlogPost.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteBlogPost.fulfilled, (state, action) => {
                state.loading = false;
                state.posts = state.posts.filter(post => post.PostID !== action.payload);
                state.userPosts = state.userPosts.filter(post => post.PostID !== action.payload);
                state.success = true;
            })
            .addCase(deleteBlogPost.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Get user posts
            .addCase(getUserPosts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getUserPosts.fulfilled, (state, action) => {
                state.loading = false;
                state.userPosts = action.payload;
            })
            .addCase(getUserPosts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Add comment
            .addCase(addComment.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addComment.fulfilled, (state, action) => {
                state.loading = false;
                state.comments.unshift(action.payload);
                state.success = true;
            })
            .addCase(addComment.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Get comments
            .addCase(getComments.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getComments.fulfilled, (state, action) => {
                state.loading = false;
                state.comments = action.payload;
            })
            .addCase(getComments.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { clearError, clearSuccess, clearCurrentPost } = blogSlice.actions;
export default blogSlice.reducer; 