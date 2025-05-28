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
    LinearProgress
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
    EmojiEvents,
    Star
} from '@mui/icons-material';
import { getCurrentUser, logout } from '../../store/slices/authSlice';
import { getCurrentMembership } from '../../store/slices/membershipSlice';
import { updateProfile } from '../../store/slices/userSlice';
import { notification } from 'antd';
import AchievementBadge from '../Achievement/AchievementBadge';

const Profile = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, loading, error, isAuthenticated } = useSelector(state => state.auth);
    const { currentMembership } = useSelector(state => state.membership);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        address: ''
    });
    const [localError, setLocalError] = useState(null);
    const [fetchAttempted, setFetchAttempted] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            if (fetchAttempted || loading) return;

            try {
                setFetchAttempted(true);
                const resultAction = await dispatch(getCurrentUser());

                if (getCurrentUser.rejected.match(resultAction)) {
                    if (resultAction.payload && resultAction.payload.includes('Tài khoản chưa được kích hoạt')) {
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

        if (isAuthenticated && !fetchAttempted && !user) {
            fetchUserData();
        }

        if (!isAuthenticated && !loading) {
            navigate('/login');
        }
    }, [dispatch, isAuthenticated, loading, fetchAttempted, user, navigate]);

    useEffect(() => {
        if (isAuthenticated && user && !currentMembership) {
            dispatch(getCurrentMembership());
        }
    }, [isAuthenticated, user, currentMembership, dispatch]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.firstName || !formData.lastName) {
            setLocalError('Họ và tên không được để trống');
            return;
        }

        setLocalError(null);

        try {
            await dispatch(updateProfile(formData)).unwrap();
            notification.success({
                message: 'Cập nhật thành công',
                description: 'Thông tin cá nhân đã được cập nhật!'
            });
            setEditMode(false);
            dispatch(getCurrentUser());
        } catch (err) {
            console.error('Error updating profile:', err);
            const errorMsg = err?.message || 'Không thể cập nhật thông tin. Vui lòng thử lại.';
            setLocalError(errorMsg);
            notification.error({
                message: 'Lỗi cập nhật',
                description: errorMsg
            });
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!user) {
        return (
            <Container maxWidth="sm">
                <Alert severity="error">
                    Không thể tải thông tin người dùng. Vui lòng thử lại sau.
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Grid container spacing={3}>
                {/* Profile Header */}
                <Grid item xs={12}>
                    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box display="flex" alignItems="center">
                                <Avatar
                                    src={user.avatar}
                                    sx={{ width: 100, height: 100, mr: 3 }}
                                >
                                    {user.firstName?.[0]}
                                </Avatar>
                                <Box>
                                    <Typography variant="h4" gutterBottom>
                                        {user.firstName} {user.lastName}
                                    </Typography>
                                    <Typography variant="body1" color="textSecondary">
                                        {user.role === 'member' ? 'Thành viên' : 'Huấn luyện viên'}
                                    </Typography>
                                </Box>
                            </Box>
                            <Button
                                variant="contained"
                                startIcon={<Edit />}
                                onClick={handleEditToggle}
                            >
                                {editMode ? 'Hủy' : 'Chỉnh sửa'}
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                {/* Main Content */}
                <Grid item xs={12} md={8}>
                    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Thông tin cá nhân
                        </Typography>
                        {editMode ? (
                            <form onSubmit={handleSubmit}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Họ"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            required
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Tên"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            required
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Email"
                                            name="email"
                                            value={formData.email}
                                            disabled
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Số điện thoại"
                                            name="phoneNumber"
                                            value={formData.phoneNumber}
                                            onChange={handleChange}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Địa chỉ"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            multiline
                                            rows={2}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Box display="flex" justifyContent="flex-end" gap={2}>
                                            <Button
                                                variant="outlined"
                                                onClick={handleEditToggle}
                                            >
                                                Hủy
                                            </Button>
                                            <Button
                                                variant="contained"
                                                type="submit"
                                                color="primary"
                                            >
                                                Lưu thay đổi
                                            </Button>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </form>
                        ) : (
                            <List>
                                <ListItem>
                                    <ListItemText
                                        primary="Email"
                                        secondary={user.email}
                                        primaryTypographyProps={{ color: 'textSecondary' }}
                                    />
                                </ListItem>
                                <Divider />
                                <ListItem>
                                    <ListItemText
                                        primary="Số điện thoại"
                                        secondary={user.phoneNumber || 'Chưa cập nhật'}
                                        primaryTypographyProps={{ color: 'textSecondary' }}
                                    />
                                </ListItem>
                                <Divider />
                                <ListItem>
                                    <ListItemText
                                        primary="Địa chỉ"
                                        secondary={user.address || 'Chưa cập nhật'}
                                        primaryTypographyProps={{ color: 'textSecondary' }}
                                    />
                                </ListItem>
                            </List>
                        )}
                    </Paper>
                </Grid>

                {/* Sidebar */}
                <Grid item xs={12} md={4}>
                    {/* Progress Card */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                <EmojiEvents sx={{ mr: 1, verticalAlign: 'middle', color: '#FFD700' }} />
                                Huy hiệu & Thành tích
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Huy hiệu đạt được
                                </Typography>
                                <Typography variant="h4" gutterBottom>
                                    1 / 33
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={3}
                                    sx={{
                                        height: 10,
                                        borderRadius: 5,
                                        backgroundColor: '#e0e0e0',
                                        '& .MuiLinearProgress-bar': {
                                            backgroundColor: '#4CAF50'
                                        }
                                    }}
                                />
                                <Box display="flex" justifyContent="space-between" mt={1}>
                                    <Typography variant="body2" color="textSecondary">
                                        Tỷ lệ hoàn thành
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        3%
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Thành tích gần đây
                                </Typography>
                                <Box mt={2}>
                                    <AchievementBadge
                                        achievement={{
                                            Name: "Ngày đầu tiên",
                                            Description: "Chúc mừng bạn đã hoàn thành ngày đầu tiên không hút thuốc!",
                                            IconURL: "/images/achievements/trophy-bronze.png"
                                        }}
                                        earnedAt={new Date().toISOString()}
                                    />
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Membership Card */}
                    {currentMembership && (
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Gói thành viên
                                </Typography>
                                <Box mt={2}>
                                    <Typography variant="subtitle1" gutterBottom>
                                        {currentMembership.PlanName}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary" paragraph>
                                        {currentMembership.PlanDescription}
                                    </Typography>
                                    <Chip
                                        label={`Còn ${currentMembership.DaysRemaining} ngày`}
                                        color="primary"
                                        variant="outlined"
                                    />
                                </Box>
                            </CardContent>
                        </Card>
                    )}
                </Grid>
            </Grid>

            {localError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {localError}
                </Alert>
            )}
        </Container>
    );
};

export default Profile; 