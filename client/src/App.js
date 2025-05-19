import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from 'antd';
import { useDispatch } from 'react-redux';
import Navbar from './components/layout/Navbar';
import Home from './components/Home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Profile from './components/auth/Profile';
import BlogList from './components/blog/BlogList';
import BlogDetail from './components/blog/BlogDetail';
import BlogEditor from './components/blog/BlogEditor';
import CommunityList from './components/community/CommunityList';
import CommunityDetail from './components/community/CommunityDetail';
import CommunityPost from './components/community/CommunityPost';
import PrivateRoute from './components/routing/PrivateRoute';
import { checkSessionExpiration, refreshSession } from './store/slices/authSlice';

const { Content } = Layout;

function App() {
    const dispatch = useDispatch();

    // Check session on component mount
    useEffect(() => {
        dispatch(checkSessionExpiration());

        // Set up interval to check and refresh session
        const sessionInterval = setInterval(() => {
            dispatch(checkSessionExpiration());
            // Refresh session to extend token validity if user is active
            dispatch(refreshSession());
        }, 60000); // Check every minute

        // Track user activity
        const handleUserActivity = () => {
            dispatch(refreshSession());
        };

        // Add event listeners for user activity
        window.addEventListener('click', handleUserActivity);
        window.addEventListener('keypress', handleUserActivity);
        window.addEventListener('scroll', handleUserActivity);

        // Cleanup interval and event listeners on unmount
        return () => {
            clearInterval(sessionInterval);
            window.removeEventListener('click', handleUserActivity);
            window.removeEventListener('keypress', handleUserActivity);
            window.removeEventListener('scroll', handleUserActivity);
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
                                <Profile />
                            </PrivateRoute>
                        }
                    />
                    <Route path="/blog" element={<BlogList />} />
                    <Route path="/blog/:postId" element={<BlogDetail />} />
                    <Route
                        path="/blog/edit/:postId"
                        element={
                            <PrivateRoute>
                                <BlogEditor />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/blog/new"
                        element={
                            <PrivateRoute>
                                <BlogEditor />
                            </PrivateRoute>
                        }
                    />
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
                </Routes>
            </Content>
        </Layout>
    );
}

export default App; 