import React from 'react';
import { Routes, Route } from 'react-router-dom';
import BlogList from '../components/blog/BlogList';
import BlogDetail from '../components/blog/BlogDetail';
import BlogEditor from '../components/blog/BlogEditor';
import PrivateRoute from '../components/routing/PrivateRoute';

const BlogPage = () => {
    return (
        <Routes>
            <Route index element={<BlogList />} />
            <Route path=":postId" element={<BlogDetail />} />
            <Route
                path="new"
                element={
                    <PrivateRoute>
                        <BlogEditor />
                    </PrivateRoute>
                }
            />
            <Route
                path="edit/:postId"
                element={
                    <PrivateRoute>
                        <BlogEditor />
                    </PrivateRoute>
                }
            />
        </Routes>
    );
};

export default BlogPage; 