import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from 'antd';
import { useDispatch } from 'react-redux';
import Navbar from './components/layout/Navbar';
import Home from './components/Home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import UserProfile from './components/user/UserProfile';
import UserCommentHistory from './components/user/UserCommentHistory';
import BlogPage from './pages/BlogPage';
import CommunityList from './components/community/CommunityList';
import CommunityDetail from './components/community/CommunityDetail';
import CommunityPost from './components/community/CommunityPost';
import PrivateRoute from './components/routing/PrivateRoute';
import MembershipPage from './pages/MembershipPage';
import SmokingSurveyPage from './pages/SmokingSurveyPage';
import QuitPlanPage from './pages/QuitPlanPage';
import CoachQuitPlanDashboard from './pages/CoachQuitPlanDashboard';
import AchievementPage from './pages/AchievementPage';
import TestPage from './pages/TestPage';
import { checkSessionExpiration, refreshSession } from './store/slices/authSlice';

const { Content } = Layout;

function App() {
    const dispatch = useDispatch();

    // Check session on component mount
    useEffect(() => {
        // Check session immediately on mount
        dispatch(checkSessionExpiration());

        // Set up interval to check and refresh session - but not too frequently
        const sessionInterval = setInterval(() => {
            dispatch(checkSessionExpiration());
            // Refresh session to extend token validity if user is active
            dispatch(refreshSession());
        }, 60000); // Check every minute - increased to reduce server load

        // User activity tracking with debounce to avoid too many dispatches
        let activityTimeout;
        const handleUserActivity = () => {
            clearTimeout(activityTimeout);
            activityTimeout = setTimeout(() => {
                dispatch(refreshSession());
            }, 3000); // Debounce for 3 seconds to reduce API calls
        };

        // Add event listeners for user activity - fewer listeners
        window.addEventListener('click', handleUserActivity);
        // No need for every possible event - just key movements and clicks
        window.addEventListener('keydown', handleUserActivity);
        // Don't track scroll or mousemove - they're too frequent

        // Cleanup interval and event listeners on unmount
        return () => {
            clearInterval(sessionInterval);
            clearTimeout(activityTimeout);
            window.removeEventListener('click', handleUserActivity);
            window.removeEventListener('keydown', handleUserActivity);
        };
    }, [dispatch]);

    return (
        <Layout className="app-layout min-h-screen">
            <Navbar />
            <Content className="app-content flex-grow">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                        path="/profile"
                        element={
                            <PrivateRoute>
                                <UserProfile />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/user/comments"
                        element={
                            <PrivateRoute>
                                <UserCommentHistory />
                            </PrivateRoute>
                        }
                    />
                    <Route path="/blog/*" element={<BlogPage />} />
                    <Route path="/community" element={<CommunityList />} />
                    <Route path="/community/:postId" element={<CommunityDetail />} />
                    <Route
                        path="/community/new"
                        element={
                            <PrivateRoute>
                                <CommunityPost />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/membership"
                        element={
                            <PrivateRoute>
                                <MembershipPage />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/smoking-survey"
                        element={
                            <PrivateRoute>
                                <SmokingSurveyPage />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/quit-plan"
                        element={
                            <PrivateRoute>
                                <QuitPlanPage />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/coach/quit-plans"
                        element={
                            <PrivateRoute>
                                <CoachQuitPlanDashboard />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/achievement"
                        element={
                            <PrivateRoute>
                                <AchievementPage />
                            </PrivateRoute>
                        }
                    />
                    <Route path="/test" element={<TestPage />} />
                </Routes>
            </Content>
        </Layout>
    );
}

export default App; 