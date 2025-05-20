import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    Alert,
    CircularProgress,
    FormControlLabel,
    Checkbox
} from '@mui/material';
import { login } from '../../store/slices/authSlice';

const Login = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { loading, error } = useSelector((state) => state.auth);

    // Check for URL parameters
    const queryParams = new URLSearchParams(location.search);
    const sessionExpired = queryParams.get('session') === 'expired';
    const activationRequired = queryParams.get('activation') === 'required';

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    });

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({
            ...formData,
            [e.target.name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Submitting login form:', { ...formData, password: '***' });

        try {
            const resultAction = await dispatch(login(formData));
            console.log('Login result action:', resultAction);

            if (login.fulfilled.match(resultAction)) {
                // Login successful - navigate to requested page or home
                const { from } = location.state || { from: { pathname: '/' } };
                navigate(from.pathname);
            } else if (login.rejected.match(resultAction)) {
                // Login failed, error is already set in the redux state
                console.error('Login failed:', resultAction.payload);
            }
        } catch (err) {
            console.error('Login error:', err);
        }
    };

    // Clear URL parameters after component mounts
    useEffect(() => {
        if (sessionExpired || activationRequired) {
            window.history.replaceState({}, document.title, '/login');
        }
    }, [sessionExpired, activationRequired]);

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Typography component="h1" variant="h5">
                    Login
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
                        {error}
                    </Alert>
                )}

                {sessionExpired && (
                    <Alert severity="warning" sx={{ width: '100%', mt: 2 }}>
                        Your session expired. Please login again.
                    </Alert>
                )}

                {activationRequired && (
                    <Alert severity="warning" sx={{ width: '100%', mt: 2 }}>
                        Your account needs to be activated. Please check your email for activation instructions.
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                    <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="Password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        margin="normal"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                name="rememberMe"
                                checked={formData.rememberMe}
                                onChange={handleChange}
                                color="primary"
                            />
                        }
                        label="Remember me"
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={loading}
                        sx={{ mt: 3, mb: 2 }}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Login'}
                    </Button>
                </Box>
            </Box>
        </Container>
    );
};

export default Login; 