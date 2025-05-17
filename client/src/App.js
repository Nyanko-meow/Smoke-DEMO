import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import Navbar from './components/layout/Navbar';
import Home from './components/Home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import BlogList from './components/blog/BlogList';
import BlogDetail from './components/blog/BlogDetail';
import BlogEditor from './components/blog/BlogEditor';
import CommunityList from './components/community/CommunityList';
import CommunityDetail from './components/community/CommunityDetail';
import CommunityPost from './components/community/CommunityPost';
import PrivateRoute from './components/routing/PrivateRoute';

function App() {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <Box component="main" sx={{ flexGrow: 1 }}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
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
            </Box>
        </Box>
    );
}

export default App; 