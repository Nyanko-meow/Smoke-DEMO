import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import planReducer from './slices/planSlice';
import progressReducer from './slices/progressSlice';
import achievementReducer from './slices/achievementSlice';
import notificationReducer from './slices/notificationSlice';
import surveyReducer from './slices/surveySlice';
import blogReducer from './slices/blogSlice';
import communityReducer from './slices/communitySlice';
import membershipReducer from './slices/membershipSlice';
import smokingStatusReducer from './slices/smokingStatusSlice';

const store = configureStore({
    reducer: {
        auth: authReducer,
        user: userReducer,
        plan: planReducer,
        progress: progressReducer,
        achievement: achievementReducer,
        notification: notificationReducer,
        survey: surveyReducer,
        blog: blogReducer,
        community: communityReducer,
        membership: membershipReducer,
        smokingStatus: smokingStatusReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});

export default store; 