import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance, { API_URL } from '../../utils/axiosConfig';

// Async thunks
export const fetchMembershipPlans = createAsyncThunk(
    'membership/fetchPlans',
    async (_, { rejectWithValue }) => {
        try {
            console.log('Fetching plans from:', `${API_URL}/membership/plans`);
            const response = await axiosInstance.get(`/membership/plans`);
            return {
                plans: response.data.data,
                message: response.data.message
            };
        } catch (error) {
            console.error('Error fetching plans:', error);
            return rejectWithValue(error.response?.data || { message: 'Failed to fetch plans' });
        }
    }
);

export const getCurrentMembership = createAsyncThunk(
    'membership/getCurrent',
    async (_, { rejectWithValue }) => {
        try {
            // Check for token first
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('No token available for getCurrentMembership');
                return null;
            }

            console.log('Fetching current membership with token');
            const response = await axiosInstance.get(`/membership/current`);
            console.log('Current membership response:', response.data);

            if (response.data && response.data.data) {
                return response.data.data;
            } else {
                console.log('No current membership found or membership data is null');
                return null;
            }
        } catch (error) {
            console.error('Error in getCurrentMembership:', error);

            if (error.response && error.response.status === 401) {
                console.log('Authentication error in getCurrentMembership - user not logged in or token invalid');
                // Don't consider this a real error, just return null
                return null;
            }

            return rejectWithValue(
                error.response?.data?.message ||
                error.message ||
                'Failed to fetch current membership'
            );
        }
    }
);

export const purchaseMembership = createAsyncThunk(
    'membership/purchase',
    async ({ planId, paymentMethod }, { rejectWithValue }) => {
        try {
            console.log('Sending purchase request with:', { planId, paymentMethod });
            const response = await axiosInstance.post(
                `/membership/purchase`,
                { planId, paymentMethod }
            );
            console.log('Purchase response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Purchase error:', error);
            // Handle different error scenarios
            if (error.response) {
                // Server responded with error status
                return rejectWithValue({
                    message: error.response.data?.message || 'Failed to purchase membership',
                    status: error.response.status
                });
            } else if (error.request) {
                // Request was made but no response received
                return rejectWithValue({
                    message: 'No response from server. Please check your connection.',
                    status: 'network_error'
                });
            } else {
                // Something else went wrong
                return rejectWithValue({
                    message: error.message || 'Failed to purchase membership',
                    status: 'unknown_error'
                });
            }
        }
    }
);

export const getMembershipHistory = createAsyncThunk(
    'membership/getHistory',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`/membership/history`);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to fetch membership history' });
        }
    }
);

export const cancelMembership = createAsyncThunk(
    'membership/cancel',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.put(`/membership/cancel`, {});
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to cancel membership' });
        }
    }
);

const initialState = {
    plans: [],
    currentMembership: null,
    membershipHistory: [],
    loading: false,
    error: null,
    success: false,
    message: null,
};

const membershipSlice = createSlice({
    name: 'membership',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearSuccess: (state) => {
            state.success = false;
        },
        setCurrentMembership: (state, action) => {
            state.currentMembership = action.payload;
            state.success = true;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Plans
            .addCase(fetchMembershipPlans.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMembershipPlans.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload && action.payload.plans) {
                    state.plans = action.payload.plans;
                    state.message = action.payload.message;
                } else {
                    state.plans = [];
                    console.error('Invalid payload structure in fetchMembershipPlans');
                }
            })
            .addCase(fetchMembershipPlans.rejected, (state, action) => {
                state.loading = false;
                // Safely extract the error message
                if (action.payload && typeof action.payload === 'object' && action.payload.message) {
                    state.error = action.payload.message;
                } else if (typeof action.payload === 'string') {
                    state.error = action.payload;
                } else if (action.error && action.error.message) {
                    state.error = action.error.message;
                } else {
                    state.error = 'Failed to fetch plans';
                }
            })

            // Get Current Membership
            .addCase(getCurrentMembership.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getCurrentMembership.fulfilled, (state, action) => {
                state.loading = false;
                state.currentMembership = action.payload;
                // Don't set success to true here as it would trigger notifications
            })
            .addCase(getCurrentMembership.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to get current membership';
            })

            // Purchase Membership
            .addCase(purchaseMembership.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(purchaseMembership.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                // Handle the membership data if it exists
                if (action.payload && action.payload.data) {
                    if (action.payload.data.membership) {
                        state.currentMembership = action.payload.data.membership;
                    } else if (action.payload.data.membershipDetails) {
                        state.currentMembership = action.payload.data.membershipDetails;
                    }
                }

                // Update user role to 'member' in local storage
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    try {
                        const user = JSON.parse(storedUser);
                        // Only update if the user was a guest
                        if (user.role === 'guest') {
                            user.role = 'member';
                            localStorage.setItem('user', JSON.stringify(user));
                            console.log('Updated user role to "member" in local storage');
                        }
                    } catch (e) {
                        console.error('Error updating user role in localStorage:', e);
                    }
                }

                console.log("Purchase successful, payload:", action.payload);
            })
            .addCase(purchaseMembership.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to purchase membership';
                state.success = false;
            })

            // Get Membership History
            .addCase(getMembershipHistory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getMembershipHistory.fulfilled, (state, action) => {
                state.loading = false;
                state.membershipHistory = action.payload;
            })
            .addCase(getMembershipHistory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to get membership history';
            })

            // Cancel Membership
            .addCase(cancelMembership.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(cancelMembership.fulfilled, (state, action) => {
                state.loading = false;
                state.currentMembership = null;
                state.success = true;
            })
            .addCase(cancelMembership.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to cancel membership';
                state.success = false;
            });
    },
});

export const { clearError, clearSuccess, setCurrentMembership } = membershipSlice.actions;
export default membershipSlice.reducer; 