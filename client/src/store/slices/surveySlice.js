import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Async thunks
export const submitSurvey = createAsyncThunk(
    'survey/submit',
    async (surveyData, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/survey`,
                surveyData,
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

export const getMySurvey = createAsyncThunk(
    'survey/getMySurvey',
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/survey/my-survey`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const getSurveyStats = createAsyncThunk(
    'survey/getStats',
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/survey/statistics`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

const initialState = {
    mySurvey: null,
    statistics: null,
    loading: false,
    error: null,
    success: false,
};

const surveySlice = createSlice({
    name: 'survey',
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
            // Submit Survey
            .addCase(submitSurvey.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(submitSurvey.fulfilled, (state, action) => {
                state.loading = false;
                state.mySurvey = action.payload.data;
                state.success = true;
            })
            .addCase(submitSurvey.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to submit survey';
                state.success = false;
            })
            // Get My Survey
            .addCase(getMySurvey.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getMySurvey.fulfilled, (state, action) => {
                state.loading = false;
                state.mySurvey = action.payload.data;
            })
            .addCase(getMySurvey.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to get survey';
            })
            // Get Survey Stats
            .addCase(getSurveyStats.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getSurveyStats.fulfilled, (state, action) => {
                state.loading = false;
                state.statistics = action.payload.data;
            })
            .addCase(getSurveyStats.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to get survey statistics';
            });
    },
});

export const { clearError, clearSuccess } = surveySlice.actions;
export default surveySlice.reducer; 