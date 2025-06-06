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

            // Validate required fields on frontend
            if (!userData.firstName || !userData.lastName) {
                throw new Error('Họ và tên không được để trống');
            }

            // Check if user is logged in
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Bạn cần đăng nhập để cập nhật thông tin');
            }

            // Ensure address is properly formatted before sending
            const dataToSend = {
                firstName: userData.firstName?.trim(),
                lastName: userData.lastName?.trim(),
                phoneNumber: userData.phoneNumber?.trim() || null,
                address: userData.address?.trim() || null
            };

            console.log('Sending profile data:', {
                originalData: userData,
                processedData: dataToSend,
                hasToken: !!token
            });

            const response = await axiosInstance.put('/user/profile', dataToSend);

            console.log('Profile update response:', response.data);

            if (!response.data.success) {
                throw new Error(response.data.message || 'Cập nhật thất bại');
            }

            // Also update the user info in localStorage
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                try {
                    const user = JSON.parse(storedUser);
                    const updatedUser = {
                        ...user,
                        firstName: dataToSend.firstName,
                        lastName: dataToSend.lastName,
                        phoneNumber: dataToSend.phoneNumber,
                        address: dataToSend.address
                    };

                    console.log('Updating localStorage user with new data:', updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                } catch (e) {
                    console.error('Error updating user in localStorage:', e);
                }
            }

            return response.data;
        } catch (error) {
            console.error('Error updating profile:', error);

            let errorMessage = 'Không thể cập nhật thông tin';

            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            } else if (error.response?.status === 401) {
                errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
            } else if (error.response?.status === 404) {
                errorMessage = 'Không tìm thấy endpoint. Vui lòng kiểm tra kết nối server.';
            } else if (error.response?.status >= 500) {
                errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.';
            }

            return rejectWithValue({ message: errorMessage });
        }
    }
);

export const updatePassword = createAsyncThunk(
    'user/updatePassword',
    async (passwordData, { rejectWithValue }) => {
        try {
            console.log('Updating password...');

            const response = await axiosInstance.put('/user/password', passwordData);

            console.log('Password update response:', response.data);

            if (!response.data.success) {
                throw new Error(response.data.message || 'Cập nhật mật khẩu thất bại');
            }

            return response.data;
        } catch (error) {
            console.error('Error updating password:', error);

            let errorMessage = 'Không thể cập nhật mật khẩu';

            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            } else if (error.response?.status === 401) {
                errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
            } else if (error.response?.status >= 500) {
                errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.';
            }

            return rejectWithValue({ message: errorMessage });
        }
    }
);

export const uploadAvatar = createAsyncThunk(
    'user/uploadAvatar',
    async (avatarData, { rejectWithValue }) => {
        try {
            console.log('Uploading avatar...');

            const response = await axiosInstance.put('/user/avatar', avatarData);

            console.log('Avatar upload response:', response.data);

            if (!response.data.success) {
                throw new Error(response.data.message || 'Tải lên ảnh đại diện thất bại');
            }

            // Update localStorage with new avatar
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                try {
                    const user = JSON.parse(storedUser);
                    const updatedUser = {
                        ...user,
                        avatar: response.data.data.avatar
                    };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                } catch (e) {
                    console.error('Error updating avatar in localStorage:', e);
                }
            }

            return response.data;
        } catch (error) {
            console.error('Error uploading avatar:', error);

            let errorMessage = 'Không thể tải lên ảnh đại diện';

            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            } else if (error.response?.status === 401) {
                errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
            } else if (error.response?.status >= 500) {
                errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.';
            }

            return rejectWithValue({ message: errorMessage });
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