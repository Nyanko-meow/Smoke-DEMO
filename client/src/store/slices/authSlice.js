import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Get stored authentication data from localStorage
const storedToken = localStorage.getItem('token');
const storedUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
const storedExpiration = localStorage.getItem('tokenExpiration');

// Check if the token is still valid
const isTokenValid = () => {
    if (!storedExpiration) return false;
    return new Date().getTime() < parseInt(storedExpiration);
};

// Set token expiration (30 minutes from now)
const setTokenExpiration = () => {
    const expirationTime = new Date().getTime() + 30 * 60 * 1000; // 30 minutes in milliseconds
    localStorage.setItem('tokenExpiration', expirationTime.toString());
    return expirationTime;
};

// Create async thunks
export const login = createAsyncThunk(
    'auth/login',
    async (userData, { rejectWithValue }) => {
        try {
            // Add logging to debug request
            console.log('Attempting login with:', { email: userData.email });

            const response = await api.post('/auth/login', userData);
            console.log('Login response:', response.data);

            // Check if the response contains expected data
            if (!response.data || !response.data.success) {
                return rejectWithValue(
                    response.data.message || 'Login failed. Please try again.'
                );
            }

            // Store authentication data in localStorage
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('refreshToken', response.data.refreshToken || '');
                localStorage.setItem('user', JSON.stringify(response.data.user));
                setTokenExpiration();
            }

            return response.data;
        } catch (error) {
            console.error('Login error:', error);
            return rejectWithValue(
                error.response && error.response.data.message
                    ? error.response.data.message
                    : 'Cannot connect to server. Please try again later.'
            );
        }
    }
);

export const register = createAsyncThunk(
    'auth/register',
    async (userData, { rejectWithValue }) => {
        try {
            // Add logging to debug request
            console.log('Attempting registration with:', { email: userData.email });

            const response = await api.post('/auth/register', userData);
            console.log('Register response:', response.data);

            // Check if the response contains expected data
            if (!response.data || !response.data.success) {
                return rejectWithValue(
                    response.data.message || 'Registration failed. Please try again.'
                );
            }

            // Store authentication data in localStorage
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('refreshToken', response.data.refreshToken || '');
                localStorage.setItem('user', JSON.stringify(response.data.user));
                setTokenExpiration();
            }

            return response.data;
        } catch (error) {
            console.error('Registration error:', error);
            return rejectWithValue(
                error.response && error.response.data.message
                    ? error.response.data.message
                    : 'Cannot connect to server. Please try again later.'
            );
        }
    }
);

export const logout = createAsyncThunk(
    'auth/logout',
    async () => {
        // Clear all auth data from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('tokenExpiration');
        return null;
    }
);

export const getCurrentUser = createAsyncThunk(
    'auth/getCurrentUser',
    async (_, { dispatch, rejectWithValue, getState }) => {
        try {
            // Check if we're already loading - prevent multiple simultaneous calls
            const { loading } = getState().auth;
            if (loading) {
                return rejectWithValue('Already fetching user data');
            }

            // First check if token exists at all
            const token = localStorage.getItem('token');
            if (!token) {
                dispatch(logout());
                return rejectWithValue('Session expired');
            }

            // Check if token is expired
            if (!isTokenValid()) {
                // Try to refresh token first before logging out
                try {
                    const refreshToken = localStorage.getItem('refreshToken');
                    if (refreshToken) {
                        const response = await api.post('/auth/refresh-token', { refreshToken });
                        if (response.data && response.data.token) {
                            localStorage.setItem('token', response.data.token);
                            if (response.data.refreshToken) {
                                localStorage.setItem('refreshToken', response.data.refreshToken);
                            }
                            setTokenExpiration();
                        } else {
                            throw new Error('Invalid refresh response');
                        }
                    } else {
                        throw new Error('No refresh token available');
                    }
                } catch (refreshError) {
                    console.error('Token refresh failed:', refreshError);
                    dispatch(logout());
                    return rejectWithValue('Session expired');
                }
            }

            let userProfile;
            try {
                // First try the enhanced profile endpoint
                console.log('Attempting to get user profile from /users/profile');
                const profileResponse = await api.get('/users/profile');

                if (profileResponse.data && profileResponse.data.success) {
                    console.log('Successfully retrieved user profile from /users/profile');
                    const userData = profileResponse.data.data;

                    // Early check for inactive account
                    if (userData.userInfo.isActive === false) {
                        console.error('Account not activated - handling in profile endpoint');
                        dispatch(logout());
                        return rejectWithValue('Tài khoản chưa được kích hoạt');
                    }

                    // Store user info in localStorage with complete profile
                    userProfile = {
                        id: userData.userInfo.id,
                        email: userData.userInfo.email,
                        firstName: userData.userInfo.firstName,
                        lastName: userData.userInfo.lastName,
                        role: userData.userInfo.role,
                        avatar: userData.userInfo.avatar,
                        phoneNumber: userData.userInfo.phoneNumber,
                        address: userData.userInfo.address,
                        isActive: userData.userInfo.isActive,
                        // Add additional fields that may be needed in UI
                        membershipStatus: userData.membership?.status || null,
                        planName: userData.membership?.planName || null,
                        smokingStatus: userData.smokingStatus || null,
                        activePlan: userData.activePlan || null,
                        healthMetrics: userData.healthMetrics || null
                    };
                }
            } catch (profileError) {
                // Check if it's a 403 unauthorized error (account not activated)
                if (profileError.response && profileError.response.status === 403) {
                    console.error('Account not activated, redirecting to login');
                    dispatch(logout());
                    return rejectWithValue('Tài khoản chưa được kích hoạt');
                }

                console.log('Failed to get profile from /users/profile, trying /auth/me as fallback');
                // If the profile endpoint fails, fall back to the basic /auth/me endpoint
                try {
                    const basicResponse = await api.get('/auth/me');

                    if (basicResponse.data && basicResponse.data.user) {
                        console.log('Successfully retrieved user from /auth/me');
                        const basicUser = basicResponse.data.user;

                        // Create simplified user object
                        userProfile = {
                            id: basicUser.UserID,
                            email: basicUser.Email,
                            firstName: basicUser.FirstName,
                            lastName: basicUser.LastName,
                            role: basicUser.Role,
                            avatar: basicUser.Avatar,
                            phoneNumber: basicUser.PhoneNumber,
                            address: basicUser.Address,
                            isActive: basicUser.IsActive
                        };

                        // If account is not active, handle that explicitly
                        if (!basicUser.IsActive) {
                            console.error('Account not activated - handling in /auth/me endpoint');
                            dispatch(logout());
                            return rejectWithValue('Tài khoản chưa được kích hoạt');
                        }
                    } else {
                        console.error('Failed to get user data from /auth/me');
                        return rejectWithValue('Failed to fetch user data');
                    }
                } catch (basicError) {
                    // Check if it's a 403 unauthorized error (account not activated)
                    if (basicError.response && basicError.response.status === 403) {
                        console.error('Account not activated, redirecting to login');
                        dispatch(logout());
                        return rejectWithValue('Tài khoản chưa được kích hoạt');
                    }

                    console.error('Both profile endpoints failed', profileError, basicError);
                    dispatch(logout());
                    return rejectWithValue('Failed to fetch user data');
                }
            }

            if (!userProfile) {
                console.error('No user profile found after API calls');
                dispatch(logout());
                return rejectWithValue('Failed to fetch user profile');
            }

            // Double-check if account is active before storing
            if (userProfile.isActive === false) {
                console.error('Account not activated after profile check');
                dispatch(logout());
                return rejectWithValue('Tài khoản chưa được kích hoạt');
            }

            // Store the retrieved profile
            localStorage.setItem('user', JSON.stringify(userProfile));

            // Refresh token expiration on successful API call
            setTokenExpiration();

            return userProfile;
        } catch (error) {
            console.error('Unhandled error in getCurrentUser:', error);

            // Handle 403 errors specifically for unactivated accounts
            if (error.response && error.response.status === 403) {
                dispatch(logout());
                return rejectWithValue(error.response.data.message || 'Tài khoản chưa được kích hoạt');
            }

            // Handle general errors
            dispatch(logout());
            return rejectWithValue(
                error.response && error.response.data.message
                    ? error.response.data.message
                    : error.message || 'Failed to fetch user data'
            );
        }
    }
);

// Refresh session to extend expiration
export const refreshSession = createAsyncThunk(
    'auth/refreshSession',
    async (_, { getState }) => {
        const { auth: { token, isAuthenticated } } = getState();

        if (token && isAuthenticated) {
            // Extend session by 30 minutes
            setTokenExpiration();

            // Optional: refresh the token with the server if needed
            // await api.post('/auth/refresh-token');

            return { refreshed: true };
        }
        return { refreshed: false };
    }
);

// Initial state
const initialState = {
    user: isTokenValid() ? storedUser : null,
    token: isTokenValid() ? storedToken : null,
    tokenExpiration: isTokenValid() ? parseInt(storedExpiration) : null,
    isAuthenticated: isTokenValid(),
    loading: false,
    error: null
};

// Create slice
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        checkSessionExpiration: (state) => {
            if (state.tokenExpiration && state.isAuthenticated) {
                const isExpired = new Date().getTime() > state.tokenExpiration;
                if (isExpired) {
                    // Token has expired, update state
                    state.user = null;
                    state.token = null;
                    state.tokenExpiration = null;
                    state.isAuthenticated = false;

                    // Clear localStorage
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    localStorage.removeItem('tokenExpiration');
                }
            }
        }
    },
    extraReducers: (builder) => {
        builder
            // Login
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                console.log('Login fulfilled with payload:', action.payload);

                // Check for successful login with token
                if (action.payload && action.payload.success && action.payload.token) {
                    state.loading = false;
                    state.user = action.payload.user;
                    state.token = action.payload.token;
                    state.tokenExpiration = parseInt(localStorage.getItem('tokenExpiration'));
                    state.isAuthenticated = true;
                    state.error = null;
                } else {
                    // Handle successful response but with error message
                    state.loading = false;
                    state.error = action.payload.message || 'Login failed. Please try again.';
                }
            })
            .addCase(login.rejected, (state, action) => {
                console.log('Login rejected with payload:', action.payload);
                state.loading = false;
                state.error = action.payload || 'Login failed. Please try again.';
            })

            // Register
            .addCase(register.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state, action) => {
                console.log('Register fulfilled with payload:', action.payload);

                // Check for successful registration with token
                if (action.payload && action.payload.success && action.payload.token) {
                    state.loading = false;
                    state.user = action.payload.user;
                    state.token = action.payload.token;
                    state.tokenExpiration = parseInt(localStorage.getItem('tokenExpiration'));
                    state.isAuthenticated = true;
                    state.error = null;
                } else {
                    // Handle successful response but with error message
                    state.loading = false;
                    state.error = action.payload.message || 'Registration failed. Please try again.';
                }
            })
            .addCase(register.rejected, (state, action) => {
                console.log('Register rejected with payload:', action.payload);
                state.loading = false;
                state.error = action.payload || 'Registration failed. Please try again.';
            })

            // Logout
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.token = null;
                state.tokenExpiration = null;
                state.isAuthenticated = false;
            })

            // Get current user
            .addCase(getCurrentUser.pending, (state) => {
                state.loading = true;
            })
            .addCase(getCurrentUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.isAuthenticated = true;
                state.tokenExpiration = parseInt(localStorage.getItem('tokenExpiration'));
            })
            .addCase(getCurrentUser.rejected, (state, action) => {
                state.loading = false;
                if (action.payload === 'Session expired') {
                    state.user = null;
                    state.token = null;
                    state.tokenExpiration = null;
                    state.isAuthenticated = false;
                }
                state.error = action.payload;
            })

            // Refresh session
            .addCase(refreshSession.fulfilled, (state) => {
                state.tokenExpiration = parseInt(localStorage.getItem('tokenExpiration'));
            });
    }
});

export const { clearError, checkSessionExpiration } = authSlice.actions;
export default authSlice.reducer; 