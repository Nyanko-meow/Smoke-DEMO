import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import axiosInstance from '../../utils/axiosConfig';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Async thunks
export const updateProfile = createAsyncThunk(
    'user/updateProfile',
    async (userData, { rejectWithValue }) => {
        try {
            console.log('Updating profile with data:', userData);

            // Ensure address is properly formatted before sending
            const dataToSend = {
                ...userData,
                address: userData.address || null // Ensure null is sent instead of empty string
            };

            console.log('Sending profile data with address:', {
                originalAddress: userData.address,
                formattedAddress: dataToSend.address,
                addressType: typeof dataToSend.address
            });

            const response = await axiosInstance.put('/users/profile', dataToSend);

            console.log('Profile update response:', response.data);

            // Also update the user info in localStorage
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                try {
                    const user = JSON.parse(storedUser);
                    const updatedUser = {
                        ...user,
                        firstName: userData.firstName,
                        lastName: userData.lastName,
                        phoneNumber: userData.phoneNumber,
                        address: userData.address || null // Ensure consistent address handling
                    };

                    console.log('Updating localStorage user with new address:', {
                        oldAddress: user.address,
                        newAddress: updatedUser.address
                    });

                    localStorage.setItem('user', JSON.stringify(updatedUser));
                } catch (e) {
                    console.error('Error updating user in localStorage:', e);
                }
            }

            return response.data;
        } catch (error) {
            console.error('Error updating profile:', error);
            return rejectWithValue(error.response?.data || { message: 'Failed to update profile' });
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