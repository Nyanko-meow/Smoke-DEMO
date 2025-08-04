import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Async thunks
export const createPlan = createAsyncThunk(
    'plan/create',
    async (planData, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/plans`,
                planData,
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

export const getPlan = createAsyncThunk(
    'plan/get',
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/plans/current`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const updatePlan = createAsyncThunk(
    'plan/update',
    async (planData, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `${API_URL}/plans/${planData.id}`,
                planData,
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

export const deletePlan = createAsyncThunk(
    'plan/delete',
    async (planId, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/plans/${planId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return planId;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

const initialState = {
    currentPlan: null,
    loading: false,
    error: null,
    success: false,
};

const planSlice = createSlice({
    name: 'plan',
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
            // Create Plan
            .addCase(createPlan.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(createPlan.fulfilled, (state, action) => {
                state.loading = false;
                state.currentPlan = action.payload;
                state.success = true;
            })
            .addCase(createPlan.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to create plan';
                state.success = false;
            })
            // Get Plan
            .addCase(getPlan.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getPlan.fulfilled, (state, action) => {
                state.loading = false;
                state.currentPlan = action.payload;
            })
            .addCase(getPlan.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to get plan';
            })
            // Update Plan
            .addCase(updatePlan.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(updatePlan.fulfilled, (state, action) => {
                state.loading = false;
                state.currentPlan = action.payload;
                state.success = true;
            })
            .addCase(updatePlan.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to update plan';
                state.success = false;
            })
            // Delete Plan
            .addCase(deletePlan.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(deletePlan.fulfilled, (state) => {
                state.loading = false;
                state.currentPlan = null;
                state.success = true;
            })
            .addCase(deletePlan.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to delete plan';
                state.success = false;
            });
    },
});

export const { clearError, clearSuccess } = planSlice.actions;
export default planSlice.reducer; 