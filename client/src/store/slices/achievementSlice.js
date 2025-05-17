import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const getAchievements = createAsyncThunk(
    'achievements/getAchievements',
    async (_, { getState }) => {
        const { auth: { token } } = getState();
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };
        const response = await axios.get(`${API_URL}/achievements`, config);
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