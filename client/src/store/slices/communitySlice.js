import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunks
export const getCommunityPosts = createAsyncThunk(
    'community/getPosts',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get('/api/community/posts');
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

export const getCommunityPost = createAsyncThunk(
    'community/getPost',
    async (postId, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/api/community/posts/${postId}`);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

export const createCommunityPost = createAsyncThunk(
    'community/createPost',
    async (postData, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('/api/community/posts', postData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

export const updateCommunityPost = createAsyncThunk(
    'community/updatePost',
    async ({ postId, postData }, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(`/api/community/posts/${postId}`, postData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

export const deleteCommunityPost = createAsyncThunk(
    'community/deletePost',
    async (postId, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(`/api/community/posts/${postId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

export const addCommunityComment = createAsyncThunk(
    'community/addComment',
    async ({ postId, content }, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`/api/community/posts/${postId}/comments`, { content }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

export const getCommunityComments = createAsyncThunk(
    'community/getComments',
    async (postId, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/api/community/posts/${postId}/comments`);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

export const updateCommunityComment = createAsyncThunk(
    'community/updateComment',
    async ({ commentId, content }, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(`/api/community/comments/${commentId}`, { content }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response.data.message);
        }
    }
);

export const deleteCommunityComment = createAsyncThunk(
    'community/deleteComment',
    async (commentId, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(`/api/community/comments/${commentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
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
const communitySlice = createSlice({
    name: 'community',
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
            .addCase(getCommunityPosts.pending, (state) => {
                state.loading = true;
            })
            .addCase(getCommunityPosts.fulfilled, (state, action) => {
                state.loading = false;
                state.posts = action.payload;
            })
            .addCase(getCommunityPosts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Get single post
            .addCase(getCommunityPost.pending, (state) => {
                state.loading = true;
            })
            .addCase(getCommunityPost.fulfilled, (state, action) => {
                state.loading = false;
                state.currentPost = action.payload;
            })
            .addCase(getCommunityPost.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Create post
            .addCase(createCommunityPost.pending, (state) => {
                state.loading = true;
            })
            .addCase(createCommunityPost.fulfilled, (state, action) => {
                state.loading = false;
                state.posts.unshift(action.payload);
                state.success = true;
            })
            .addCase(createCommunityPost.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Update post
            .addCase(updateCommunityPost.pending, (state) => {
                state.loading = true;
            })
            .addCase(updateCommunityPost.fulfilled, (state, action) => {
                state.loading = false;
                state.posts = state.posts.map(post =>
                    post.PostID === action.payload.PostID ? action.payload : post
                );
                state.currentPost = action.payload;
                state.success = true;
            })
            .addCase(updateCommunityPost.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Delete post
            .addCase(deleteCommunityPost.pending, (state) => {
                state.loading = true;
            })
            .addCase(deleteCommunityPost.fulfilled, (state, action) => {
                state.loading = false;
                state.posts = state.posts.filter(post => post.PostID !== action.payload.PostID);
                state.currentPost = null;
                state.success = true;
            })
            .addCase(deleteCommunityPost.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Add comment
            .addCase(addCommunityComment.pending, (state) => {
                state.loading = true;
            })
            .addCase(addCommunityComment.fulfilled, (state, action) => {
                state.loading = false;
                state.comments.unshift(action.payload);
                state.success = true;
            })
            .addCase(addCommunityComment.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Get comments
            .addCase(getCommunityComments.pending, (state) => {
                state.loading = true;
            })
            .addCase(getCommunityComments.fulfilled, (state, action) => {
                state.loading = false;
                state.comments = action.payload;
            })
            .addCase(getCommunityComments.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Update comment
            .addCase(updateCommunityComment.pending, (state) => {
                state.loading = true;
            })
            .addCase(updateCommunityComment.fulfilled, (state, action) => {
                state.loading = false;
                state.comments = state.comments.map(comment =>
                    comment.CommentID === action.payload.CommentID ? action.payload : comment
                );
                state.success = true;
            })
            .addCase(updateCommunityComment.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Delete comment
            .addCase(deleteCommunityComment.pending, (state) => {
                state.loading = true;
            })
            .addCase(deleteCommunityComment.fulfilled, (state, action) => {
                state.loading = false;
                state.comments = state.comments.filter(comment => comment.CommentID !== action.payload.CommentID);
                state.success = true;
            })
            .addCase(deleteCommunityComment.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { clearError, clearSuccess } = communitySlice.actions;
export default communitySlice.reducer; 