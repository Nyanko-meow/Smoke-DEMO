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
            const response = await api.post('/auth/login', userData);

            // Store authentication data in localStorage
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                setTokenExpiration();
            }

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response && error.response.data.message
                    ? error.response.data.message
                    : error.message
            );
        }
    }
);

export const register = createAsyncThunk(
    'auth/register',
    async (userData, { rejectWithValue }) => {
        try {
            const response = await api.post('/auth/register', userData);

            // Store authentication data in localStorage
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                setTokenExpiration();
            }

            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response && error.response.data.message
                    ? error.response.data.message
                    : error.message
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
    async (_, { dispatch, rejectWithValue }) => {
        try {
            // Check if token is expired
            if (!isTokenValid()) {
                // Automatically logout if token is expired
                dispatch(logout());
                return rejectWithValue('Session expired');
            }

            const response = await api.get('/auth/me');

            // Update user in localStorage
            localStorage.setItem('user', JSON.stringify(response.data));

            // Refresh token expiration on successful API call
            setTokenExpiration();

            return response.data;
        } catch (error) {
            // The API interceptor will handle 401 errors and logout automatically
            return rejectWithValue(
                error.response && error.response.data.message
                    ? error.response.data.message
                    : error.message
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
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.tokenExpiration = parseInt(localStorage.getItem('tokenExpiration'));
                state.isAuthenticated = true;
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Register
            .addCase(register.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.tokenExpiration = parseInt(localStorage.getItem('tokenExpiration'));
                state.isAuthenticated = true;
            })
            .addCase(register.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
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