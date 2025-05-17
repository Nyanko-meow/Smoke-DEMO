import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Async thunks
export const updateProfile = createAsyncThunk(
    'user/updateProfile',
    async (userData, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `${API_URL}/users/profile`,
                userData,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const updatePassword = createAsyncThunk(
    'user/updatePassword',
    async (passwordData, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `${API_URL}/users/password`,
                passwordData,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const uploadAvatar = createAsyncThunk(
    'user/uploadAvatar',
    async (formData, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/users/avatar`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

const initialState = {
    profile: null,
    loading: false,
    error: null,
    success: false,
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearSuccess: (state) => {
            state.success = false;
        },
    },
    extraReducers: (builder) => {
        builder
            // Update Profile
            .addCase(updateProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(updateProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.profile = action.payload;
                state.success = true;
            })
            .addCase(updateProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to update profile';
                state.success = false;
            })
            // Update Password
            .addCase(updatePassword.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(updatePassword.fulfilled, (state) => {
                state.loading = false;
                state.success = true;
            })
            .addCase(updatePassword.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to update password';
                state.success = false;
            })
            // Upload Avatar
            .addCase(uploadAvatar.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(uploadAvatar.fulfilled, (state, action) => {
                state.loading = false;
                state.profile = { ...state.profile, avatar: action.payload.avatar };
                state.success = true;
            })
            .addCase(uploadAvatar.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to upload avatar';
                state.success = false;
            });
    },
});

export const { clearError, clearSuccess } = userSlice.actions;
export default userSlice.reducer; 