import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
    CardContent,
    Chip,
    Tabs,
    Tab
} from '@mui/material';
import {
    AccountCircle,
    Email,
    Phone,
    LocationOn,
    Edit,
    SmokingRooms,
    MonitorHeart,
    Assignment,
    EmojiEvents
} from '@mui/icons-material';
import { getCurrentUser, logout } from '../../store/slices/authSlice';
import { getCurrentMembership } from '../../store/slices/membershipSlice';
import { updateProfile } from '../../store/slices/userSlice';
import { notification } from 'antd';

const Profile = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, loading, error, isAuthenticated } = useSelector(state => state.auth);
    const { currentMembership } = useSelector(state => state.membership);
    const [editMode, setEditMode] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        address: ''
    });
    const [localError, setLocalError] = useState(null);
    const [fetchAttempted, setFetchAttempted] = useState(false);
    const [lastMembershipStatus, setLastMembershipStatus] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            if (fetchAttempted || loading) return;

            try {
                setFetchAttempted(true);
                const resultAction = await dispatch(getCurrentUser());

                if (getCurrentUser.rejected.match(resultAction)) {
                    // Handle specific error for inactive accounts
                    if (resultAction.payload && resultAction.payload.includes('Tài khoản chưa được kích hoạt')) {
                        console.log('Account not activated, redirecting to login');
                        dispatch(logout());
                        navigate('/login?activation=required');
                        return;
                    }

                    setLocalError(resultAction.payload || 'Failed to load profile data');
                }
            } catch (err) {
                console.error('Error fetching profile:', err);
                setLocalError('An unexpected error occurred. Please try reloading the page.');
            }
        };

        // Only fetch if authenticated and no previous fetch attempted
        if (isAuthenticated && !fetchAttempted && !user) {
            fetchUserData();
        }

        // Handle case where we have auth token but user is not loaded
        if (isAuthenticated && !user && !loading && !fetchAttempted) {
            fetchUserData();
        }

        // Handle case where authentication is lost
        if (!isAuthenticated && !loading) {
            navigate('/login');
        }
    }, [dispatch, isAuthenticated, loading, fetchAttempted, user, navigate]);

    // Monitor membership status changes to refresh user data
    useEffect(() => {
        if (currentMembership && lastMembershipStatus !== currentMembership.Status) {
            // If membership status changed from pending to active, refresh the user data to get updated role
            if (lastMembershipStatus === 'pending' && currentMembership.Status === 'active') {
                console.log('Membership activated, refreshing user data to update role');
                setFetchAttempted(false); // Allow re-fetching
                dispatch(getCurrentUser());
            }
            setLastMembershipStatus(currentMembership.Status);
        }
    }, [currentMembership, lastMembershipStatus, dispatch]);

    // Load membership data if not already loaded
    useEffect(() => {
        if (isAuthenticated && user && !currentMembership) {
            dispatch(getCurrentMembership());
        }
    }, [isAuthenticated, user, currentMembership, dispatch]);

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

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate required fields
        if (!formData.firstName || !formData.lastName) {
            setLocalError('First name and last name are required');
            return;
        }

        // Clear any previous error
        setLocalError(null);

        console.log('Submitting profile update:', formData);

        dispatch(updateProfile(formData))
            .unwrap()
            .then(response => {
                // Show success message
                notification.success({
                    message: 'Profile Updated',
                    description: 'Your profile information has been updated successfully!'
                });

                // Exit edit mode
                setEditMode(false);

                // Refresh user data
                dispatch(getCurrentUser());
            })
            .catch(err => {
                console.error('Error updating profile:', err);
                let errorMsg = 'Failed to update profile. Please try again.';

                if (err && typeof err === 'object') {
                    if (err.message) {
                        errorMsg = err.message;
                    }
                } else if (typeof err === 'string') {
                    errorMsg = err;
                }

                setLocalError(errorMsg);

                notification.error({
                    message: 'Update Failed',
                    description: errorMsg
                });
            });
    };

    // Force redirect if there's an activation error
    useEffect(() => {
        if (error && error.includes('Tài khoản chưa được kích hoạt')) {
            dispatch(logout());
            navigate('/login?activation=required');
        }
    }, [error, dispatch, navigate]);

    if (loading) {
        return (
            <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
                <CircularProgress />
                <Typography variant="body1" sx={{ mt: 2 }}>
                    Loading your profile...
                </Typography>
            </Container>
        );
    }

    if (error || localError) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="error">{error || localError}</Alert>
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate('/login')}
                    >
                        Return to Login
                    </Button>
                </Box>
            </Container>
        );
    }

    if (!user) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="warning">Please log in to view your profile</Alert>
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate('/login')}
                    >
                        Go to Login
                    </Button>
                </Box>
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

                            <Typography variant="body2" color="textSecondary" gutterBottom>
                                Role: {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
                            </Typography>

                            {user.membershipStatus && (
                                <Chip
                                    label={user.planName || 'Premium Member'}
                                    color="primary"
                                    size="small"
                                    sx={{ mb: 2 }}
                                />
                            )}

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
                                <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
                                    <Tab icon={<AccountCircle />} label="PERSONAL" />
                                    <Tab icon={<SmokingRooms />} label="SMOKING" />
                                    <Tab icon={<MonitorHeart />} label="HEALTH" />
                                    <Tab icon={<EmojiEvents />} label="PROGRESS" />
                                </Tabs>

                                {activeTab === 0 && (
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

                                            {user.membershipStatus && (
                                                <>
                                                    <ListItem sx={{ py: 1 }}>
                                                        <ListItemText
                                                            primary="Membership"
                                                            secondary={user.planName || 'Premium Plan'}
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

                                {activeTab === 1 && (
                                    <>
                                        <Typography variant="h6" gutterBottom>
                                            Smoking Information
                                        </Typography>

                                        {user.smokingStatus ? (
                                            <List>
                                                <ListItem sx={{ py: 1 }}>
                                                    <ListItemText
                                                        primary="Cigarettes Per Day"
                                                        secondary={user.smokingStatus.CigarettesPerDay || 'Not specified'}
                                                    />
                                                </ListItem>
                                                <Divider component="li" />

                                                <ListItem sx={{ py: 1 }}>
                                                    <ListItemText
                                                        primary="Cigarette Price"
                                                        secondary={user.smokingStatus.CigarettePrice ? `$${user.smokingStatus.CigarettePrice}` : 'Not specified'}
                                                    />
                                                </ListItem>
                                                <Divider component="li" />

                                                <ListItem sx={{ py: 1 }}>
                                                    <ListItemText
                                                        primary="Smoking Frequency"
                                                        secondary={user.smokingStatus.SmokingFrequency || 'Not specified'}
                                                    />
                                                </ListItem>
                                                <Divider component="li" />

                                                <ListItem sx={{ py: 1 }}>
                                                    <ListItemText
                                                        primary="Last Updated"
                                                        secondary={user.smokingStatus.LastUpdated ? new Date(user.smokingStatus.LastUpdated).toLocaleDateString() : 'Not specified'}
                                                    />
                                                </ListItem>
                                            </List>
                                        ) : (
                                            <Alert severity="info">
                                                No smoking information provided yet. Please update your smoking status.
                                            </Alert>
                                        )}
                                    </>
                                )}

                                {activeTab === 2 && (
                                    <>
                                        <Typography variant="h6" gutterBottom>
                                            Health Metrics
                                        </Typography>

                                        {user.healthMetrics ? (
                                            <List>
                                                <ListItem sx={{ py: 1 }}>
                                                    <ListItemText
                                                        primary="Blood Pressure"
                                                        secondary={user.healthMetrics.BloodPressure || 'Not recorded'}
                                                    />
                                                </ListItem>
                                                <Divider component="li" />

                                                <ListItem sx={{ py: 1 }}>
                                                    <ListItemText
                                                        primary="Heart Rate"
                                                        secondary={user.healthMetrics.HeartRate ? `${user.healthMetrics.HeartRate} bpm` : 'Not recorded'}
                                                    />
                                                </ListItem>
                                                <Divider component="li" />

                                                <ListItem sx={{ py: 1 }}>
                                                    <ListItemText
                                                        primary="Oxygen Level"
                                                        secondary={user.healthMetrics.OxygenLevel ? `${user.healthMetrics.OxygenLevel}%` : 'Not recorded'}
                                                    />
                                                </ListItem>
                                                <Divider component="li" />

                                                <ListItem sx={{ py: 1 }}>
                                                    <ListItemText
                                                        primary="Notes"
                                                        secondary={user.healthMetrics.Notes || 'No notes'}
                                                    />
                                                </ListItem>
                                                <Divider component="li" />

                                                <ListItem sx={{ py: 1 }}>
                                                    <ListItemText
                                                        primary="Last Updated"
                                                        secondary={user.healthMetrics.Date ? new Date(user.healthMetrics.Date).toLocaleDateString() : 'Not recorded'}
                                                    />
                                                </ListItem>
                                            </List>
                                        ) : (
                                            <Alert severity="info">
                                                No health metrics recorded yet. Track your health to see progress.
                                            </Alert>
                                        )}
                                    </>
                                )}

                                {activeTab === 3 && (
                                    <>
                                        <Typography variant="h6" gutterBottom>
                                            Progress & Goals
                                        </Typography>

                                        {user.activePlan ? (
                                            <List>
                                                <ListItem sx={{ py: 1 }}>
                                                    <ListItemText
                                                        primary="Quit Plan"
                                                        secondary={`${user.activePlan.Status} since ${new Date(user.activePlan.StartDate).toLocaleDateString()}`}
                                                    />
                                                </ListItem>
                                                <Divider component="li" />

                                                <ListItem sx={{ py: 1 }}>
                                                    <ListItemText
                                                        primary="Target Date"
                                                        secondary={new Date(user.activePlan.TargetDate).toLocaleDateString()}
                                                    />
                                                </ListItem>
                                                <Divider component="li" />

                                                <ListItem sx={{ py: 1 }}>
                                                    <ListItemText
                                                        primary="Motivation Level"
                                                        secondary={`${user.activePlan.MotivationLevel}/10`}
                                                    />
                                                </ListItem>
                                                <Divider component="li" />

                                                <ListItem sx={{ py: 1 }}>
                                                    <ListItemText
                                                        primary="Reason"
                                                        secondary={user.activePlan.Reason || 'Not specified'}
                                                    />
                                                </ListItem>
                                            </List>
                                        ) : (
                                            <Alert severity="info">
                                                No active quit plan. Create a plan to track your progress.
                                            </Alert>
                                        )}

                                        {user.achievementCount > 0 && (
                                            <Box sx={{ mt: 3 }}>
                                                <Typography variant="subtitle1" gutterBottom>
                                                    Achievements: {user.achievementCount}
                                                </Typography>
                                                <Button variant="outlined" size="small">
                                                    View All Achievements
                                                </Button>
                                            </Box>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Profile; 