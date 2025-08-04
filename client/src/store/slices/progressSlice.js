import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const getProgress = createAsyncThunk(
    'progress/getProgress',
    async (_, { getState }) => {
        const { auth: { token } } = getState();
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };
        const response = await axios.get(`${API_URL}/progress`, config);
        return response.data;
    }
);

export const updateProgress = createAsyncThunk(
    'progress/updateProgress',
    async (data, { getState }) => {
        const { auth: { token } } = getState();
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };
        const response = await axios.put(`${API_URL}/progress`, data, config);
        return response.data;
    }
);

const initialState = {
    progress: null,
    loading: false,
    error: null
};

const progressSlice = createSlice({
    name: 'progress',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(getProgress.pending, (state) => {
                state.loading = true;
            })
            .addCase(getProgress.fulfilled, (state, action) => {
                state.loading = false;
                state.progress = action.payload;
            })
            .addCase(getProgress.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            .addCase(updateProgress.pending, (state) => {
                state.loading = true;
            })
            .addCase(updateProgress.fulfilled, (state, action) => {
                state.loading = false;
                state.progress = action.payload;
            })
            .addCase(updateProgress.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            });
    }
});

export const { clearError } = progressSlice.actions;
export default progressSlice.reducer; 