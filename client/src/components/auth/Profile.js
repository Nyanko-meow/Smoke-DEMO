import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    Container,
    Paper,
    Typography,
    Grid,
    Box,
    Avatar,
    Divider,
    List,
    ListItem,
    ListItemText,
    Button,
    TextField,
    CircularProgress,
    Alert,
    Card,
    CardContent
} from '@mui/material';
import { AccountCircle, Email, Phone, LocationOn, Edit } from '@mui/icons-material';
import { getCurrentUser } from '../../store/slices/authSlice';

const Profile = () => {
    const dispatch = useDispatch();
    const { user, loading, error } = useSelector(state => state.auth);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        address: ''
    });

    useEffect(() => {
        // Fetch the latest user data
        dispatch(getCurrentUser());
    }, [dispatch]);

    // Update form data when user data changes
    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phoneNumber: user.phoneNumber || '',
                address: user.address || ''
            });
        }
    }, [user]);

    const handleEditToggle = () => {
        setEditMode(!editMode);
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Here you would dispatch an action to update the profile
        // This would be implemented in your userSlice or authSlice
        console.log('Update profile with:', formData);
        setEditMode(false);
    };

    if (loading) {
        return (
            <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    if (!user) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="warning">Please log in to view your profile</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                User Profile
            </Typography>

            <Grid container spacing={3}>
                {/* User Information Card */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Avatar
                                src={user.avatar}
                                sx={{
                                    width: 100,
                                    height: 100,
                                    margin: '0 auto 16px auto',
                                    bgcolor: 'primary.main'
                                }}
                            >
                                {!user.avatar && <AccountCircle fontSize="large" />}
                            </Avatar>

                            <Typography variant="h5" gutterBottom>
                                {user.firstName} {user.lastName}
                            </Typography>

                            <Typography variant="body2" color="textSecondary">
                                Role: {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
                            </Typography>

                            <Button
                                variant="contained"
                                sx={{ mt: 2 }}
                                startIcon={<Edit />}
                                onClick={handleEditToggle}
                            >
                                {editMode ? 'Cancel' : 'Edit Profile'}
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>

                {/* User Details Section */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3 }}>
                        {editMode ? (
                            // Edit Form
                            <Box component="form" onSubmit={handleSubmit}>
                                <Typography variant="h6" gutterBottom>
                                    Edit Profile
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="First Name"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            margin="normal"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Last Name"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            margin="normal"
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            margin="normal"
                                            disabled
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Phone Number"
                                            name="phoneNumber"
                                            value={formData.phoneNumber}
                                            onChange={handleChange}
                                            margin="normal"
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Address"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            margin="normal"
                                        />
                                    </Grid>
                                </Grid>

                                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        type="button"
                                        variant="outlined"
                                        onClick={handleEditToggle}
                                        sx={{ mr: 2 }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                    >
                                        Save Changes
                                    </Button>
                                </Box>
                            </Box>
                        ) : (
                            // Display Info
                            <>
                                <Typography variant="h6" gutterBottom>
                                    Personal Information
                                </Typography>

                                <List>
                                    <ListItem sx={{ py: 1 }}>
                                        <Email sx={{ mr: 2, color: 'primary.main' }} />
                                        <ListItemText
                                            primary="Email"
                                            secondary={user.email || 'Not provided'}
                                        />
                                    </ListItem>

                                    <Divider component="li" />

                                    <ListItem sx={{ py: 1 }}>
                                        <Phone sx={{ mr: 2, color: 'primary.main' }} />
                                        <ListItemText
                                            primary="Phone Number"
                                            secondary={user.phoneNumber || 'Not provided'}
                                        />
                                    </ListItem>

                                    <Divider component="li" />

                                    <ListItem sx={{ py: 1 }}>
                                        <LocationOn sx={{ mr: 2, color: 'primary.main' }} />
                                        <ListItemText
                                            primary="Address"
                                            secondary={user.address || 'Not provided'}
                                        />
                                    </ListItem>

                                    <Divider component="li" />

                                    {/* Add more user information as needed */}
                                    {user.membershipStatus && (
                                        <>
                                            <ListItem sx={{ py: 1 }}>
                                                <ListItemText
                                                    primary="Membership"
                                                    secondary={user.planName || 'Free Plan'}
                                                />
                                            </ListItem>
                                            <Divider component="li" />
                                        </>
                                    )}

                                    <ListItem sx={{ py: 1 }}>
                                        <ListItemText
                                            primary="Account Created"
                                            secondary={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                                        />
                                    </ListItem>
                                </List>
                            </>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Profile; 