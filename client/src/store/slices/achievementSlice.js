import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const getAchievements = createAsyncThunk(
    'achievements/getAchievements',
    async (_, { getState }) => {
        // No need to manually set headers, the api utility handles this
        const response = await api.get('/achievements');
        return response.data;
    }
);

const initialState = {
    achievements: [],
    loading: false,
    error: null
};

const achievementSlice = createSlice({
    name: 'achievements',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(getAchievements.pending, (state) => {
                state.loading = true;
            })
            .addCase(getAchievements.fulfilled, (state, action) => {
                state.loading = false;
                state.achievements = action.payload;
            })
            .addCase(getAchievements.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            });
    }
});

export const { clearError } = achievementSlice.actions;
export default achievementSlice.reducer; 