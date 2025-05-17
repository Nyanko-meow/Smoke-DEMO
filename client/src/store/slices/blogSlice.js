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
            return rejectWithValue(error.response.data.message);
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
            return rejectWithValue(error.response.data.message);
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
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
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
            return rejectWithValue(error.response.data.message);
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
            return rejectWithValue(error.response.data.message);
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
            return rejectWithValue(error.response.data.message);
        }
    }
);

// Initial state
const initialState = {
    posts: [],
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
        }
    },
    extraReducers: (builder) => {
        builder
            // Get posts
            .addCase(getBlogPosts.pending, (state) => {
                state.loading = true;
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
            })
            .addCase(createBlogPost.fulfilled, (state, action) => {
                state.loading = false;
                state.posts.unshift(action.payload);
                state.success = true;
            })
            .addCase(createBlogPost.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Update post
            .addCase(updateBlogPost.pending, (state) => {
                state.loading = true;
            })
            .addCase(updateBlogPost.fulfilled, (state, action) => {
                state.loading = false;
                state.posts = state.posts.map(post =>
                    post.PostID === action.payload.PostID ? action.payload : post
                );
                state.currentPost = action.payload;
                state.success = true;
            })
            .addCase(updateBlogPost.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Add comment
            .addCase(addComment.pending, (state) => {
                state.loading = true;
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

export const { clearError, clearSuccess } = blogSlice.actions;
export default blogSlice.reducer; 