import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunks
export const fetchSmokingStatus = createAsyncThunk(
    'smokingStatus/fetchSmokingStatus',
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                return rejectWithValue('No token found');
            }

            const config = {
                headers: {
                    'x-auth-token': token
                }
            };

            const response = await axios.get('/api/smoking-status', config);
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                return null; // No smoking status found is not an error
            }
            return rejectWithValue(error.response?.data?.message || 'Could not fetch smoking status');
        }
    }
);

export const fetchSurveyQuestions = createAsyncThunk(
    'smokingStatus/fetchSurveyQuestions',
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                return rejectWithValue('No token found');
            }

            const config = {
                headers: {
                    'x-auth-token': token
                }
            };

            const response = await axios.get('/api/survey-questions', config);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Could not fetch survey questions');
        }
    }
);

export const fetchUserSurveyAnswers = createAsyncThunk(
    'smokingStatus/fetchUserSurveyAnswers',
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                return rejectWithValue('No token found');
            }

            const config = {
                headers: {
                    'x-auth-token': token
                }
            };

            const response = await axios.get('/api/survey-questions/my-answers', config);
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                return []; // No answers found is not an error
            }
            return rejectWithValue(error.response?.data?.message || 'Could not fetch survey answers');
        }
    }
);

export const fetchUserSurvey = createAsyncThunk(
    'smokingStatus/fetchUserSurvey',
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                return rejectWithValue('No token found');
            }

            const config = {
                headers: {
                    'x-auth-token': token
                }
            };

            const response = await axios.get('/api/user-survey', config);
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                return null; // No survey found is not an error
            }
            return rejectWithValue(error.response?.data?.message || 'Could not fetch user survey');
        }
    }
);

export const submitSurveyAnswers = createAsyncThunk(
    'smokingStatus/submitSurveyAnswers',
    async (answers, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                return rejectWithValue('No token found');
            }

            const config = {
                headers: {
                    'x-auth-token': token
                }
            };

            const response = await axios.post('/api/survey-questions/answers', { answers }, config);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Error submitting survey answers');
        }
    }
);

export const submitSmokingStatusSurvey = createAsyncThunk(
    'smokingStatus/submitSmokingStatusSurvey',
    async (formData, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                return rejectWithValue('No token found');
            }

            const config = {
                headers: {
                    'x-auth-token': token
                }
            };

            // First update the comprehensive survey
            await axios.post('/api/user-survey', {
                smokingDuration: formData.smokingDuration,
                cigarettesPerDay: formData.cigarettesPerDay,
                smokingTime: formData.smokingTime,
                quitReason: formData.quitReason,
                previousAttempts: formData.previousAttempts,
                supportNeeds: formData.supportNeeds,
                monthlyBudget: formData.monthlyBudget,
                preferredPlatform: formData.preferredPlatform,
                importantMetrics: formData.importantMetrics,
                socialSharing: formData.socialSharing
            }, config);

            // Then update the specific smoking status
            const statusResponse = await axios.post('/api/smoking-status', {
                cigarettesPerDay: formData.cigarettesPerDay,
                cigarettePrice: formData.cigarettePrice,
                smokingFrequency: formData.smokingFrequency
            }, config);

            return {
                success: true,
                message: 'Survey submitted successfully',
                statusData: statusResponse.data
            };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Error submitting survey');
        }
    }
);

// Initial state
const initialState = {
    smokingStatus: null,
    userSurvey: null,
    surveyQuestions: [],
    userAnswers: [],
    loading: false,
    submitting: false,
    success: false,
    error: null
};

// Slice
const smokingStatusSlice = createSlice({
    name: 'smokingStatus',
    initialState,
    reducers: {
        resetSuccess: (state) => {
            state.success = false;
        },
        resetError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch smoking status
            .addCase(fetchSmokingStatus.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSmokingStatus.fulfilled, (state, action) => {
                state.loading = false;
                state.smokingStatus = action.payload;
            })
            .addCase(fetchSmokingStatus.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Fetch survey questions
            .addCase(fetchSurveyQuestions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSurveyQuestions.fulfilled, (state, action) => {
                state.loading = false;
                state.surveyQuestions = action.payload;
            })
            .addCase(fetchSurveyQuestions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Fetch user answers
            .addCase(fetchUserSurveyAnswers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserSurveyAnswers.fulfilled, (state, action) => {
                state.loading = false;
                state.userAnswers = action.payload;
            })
            .addCase(fetchUserSurveyAnswers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Fetch user survey
            .addCase(fetchUserSurvey.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserSurvey.fulfilled, (state, action) => {
                state.loading = false;
                state.userSurvey = action.payload;
            })
            .addCase(fetchUserSurvey.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Submit survey answers
            .addCase(submitSurveyAnswers.pending, (state) => {
                state.submitting = true;
                state.success = false;
                state.error = null;
            })
            .addCase(submitSurveyAnswers.fulfilled, (state) => {
                state.submitting = false;
                state.success = true;
            })
            .addCase(submitSurveyAnswers.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload;
            })

            // Submit survey
            .addCase(submitSmokingStatusSurvey.pending, (state) => {
                state.submitting = true;
                state.success = false;
                state.error = null;
            })
            .addCase(submitSmokingStatusSurvey.fulfilled, (state) => {
                state.submitting = false;
                state.success = true;
            })
            .addCase(submitSmokingStatusSurvey.rejected, (state, action) => {
                state.submitting = false;
                state.error = action.payload;
            });
    }
});

export const { resetSuccess, resetError } = smokingStatusSlice.actions;
export default smokingStatusSlice.reducer; 