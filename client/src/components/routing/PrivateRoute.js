import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getCurrentUser, logout } from '../../store/slices/authSlice';
import { CircularProgress, Box, Typography } from '@mui/material';

const PrivateRoute = ({ children }) => {
    const dispatch = useDispatch();
    const location = useLocation();
    const { user, isAuthenticated, loading, error } = useSelector(state => state.auth);
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        // Only check auth status once
        const checkAuth = async () => {
            if (!authChecked && !loading) {
                // If we have no user but appear to be authenticated, verify the token
                if (!user && isAuthenticated) {
                    try {
                        await dispatch(getCurrentUser()).unwrap();
                    } catch (err) {
                        console.error('Auth check failed:', err);
                        // Force logout on any error
                        dispatch(logout());
                    }
                }
                setAuthChecked(true);
            }
        };

        checkAuth();
    }, [authChecked, user, isAuthenticated, loading, dispatch]);

    // Handle specific errors for inactive accounts
    useEffect(() => {
        if (error && error.includes('Tài khoản chưa được kích hoạt')) {
            dispatch(logout());
        }
    }, [error, dispatch]);

    // Don't attempt authentication checks too many times
    if (loading && !authChecked) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
                <Typography variant="body1" sx={{ ml: 2 }}>
                    Verifying your access...
                </Typography>
            </Box>
        );
    }

    // Check for unactivated account error (403)
    if (error && error.includes('Tài khoản chưa được kích hoạt')) {
        return <Navigate to="/login?activation=required" replace />;
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated || !user) {
        // Pass the current location to redirect back after login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default PrivateRoute; 