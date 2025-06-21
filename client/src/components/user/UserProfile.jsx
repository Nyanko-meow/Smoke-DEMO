import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card, Avatar, Button, Form, Input, notification, Row, Col, Tag, Progress, Statistic, Modal, Typography } from 'antd';
import { EditOutlined, UserOutlined, TrophyOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { getCurrentUser, logout } from '../../store/slices/authSlice';
import { updateProfile } from '../../store/slices/userSlice';
import UserBadge from '../common/UserBadge';
import axios from 'axios';
import './UserProfile.css';

const { Text, Title } = Typography;

const UserProfile = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, loading } = useSelector((state) => state.auth);
    const [editMode, setEditMode] = useState(false);
    const [form] = Form.useForm();
    const [achievements, setAchievements] = useState([]);
    const [achievementStats, setAchievementStats] = useState(null);
    const [loadingAchievements, setLoadingAchievements] = useState(true);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deleteForm] = Form.useForm();
    const [deletingAccount, setDeletingAccount] = useState(false);

    // Helper function to render achievement icon
    const renderAchievementIcon = (iconUrl, achievementName, size = '32px') => {
        // Priority 1: Use achievement name to determine emoji
        if (achievementName) {
            const name = achievementName.toLowerCase();
            // Map common achievement names to emojis
            if (name.includes('đầu tiên') || name.includes('first') || name.includes('ngày đầu')) return <span style={{ fontSize: size }}>🥉</span>;
            if (name.includes('tuần') || name.includes('week') || name.includes('7 ngày')) return <span style={{ fontSize: size }}>🥈</span>;
            if (name.includes('tháng') || name.includes('month') || name.includes('30 ngày')) return <span style={{ fontSize: size }}>🥇</span>;
            if (name.includes('đặc biệt') || name.includes('special') || name.includes('vip')) return <span style={{ fontSize: size }}>💎</span>;
            if (name.includes('liên tục') || name.includes('streak') || name.includes('chuỗi')) return <span style={{ fontSize: size }}>🔥</span>;
            if (name.includes('sao') || name.includes('star') || name.includes('xuất sắc')) return <span style={{ fontSize: size }}>⭐</span>;
            if (name.includes('vương') || name.includes('crown') || name.includes('master')) return <span style={{ fontSize: size }}>👑</span>;
            if (name.includes('tim') || name.includes('heart') || name.includes('yêu thương')) return <span style={{ fontSize: size }}>❤️</span>;
            if (name.includes('thử thách') || name.includes('challenge')) return <span style={{ fontSize: size }}>🎯</span>;
            if (name.includes('mốc') || name.includes('milestone')) return <span style={{ fontSize: size }}>🏁</span>;
        }

        // Priority 2: If iconUrl is already an emoji (length <= 4 and not a path)
        if (iconUrl && iconUrl.length <= 4 && !/^\/|^http|\.png|\.jpg|\.gif|\.svg/i.test(iconUrl)) {
            return <span style={{ fontSize: size, display: 'inline-block', lineHeight: 1 }}>{iconUrl}</span>;
        }

        // Priority 3: If iconUrl looks like an image path, determine from URL
        if (iconUrl && (/\/images\/|\.png|\.jpg|\.gif|\.svg/i.test(iconUrl))) {
            const url = iconUrl.toLowerCase();
            if (url.includes('bronze') || url.includes('first') || url.includes('start')) return <span style={{ fontSize: size }}>🥉</span>;
            if (url.includes('silver') || url.includes('week')) return <span style={{ fontSize: size }}>🥈</span>;
            if (url.includes('gold') || url.includes('month')) return <span style={{ fontSize: size }}>🥇</span>;
            if (url.includes('diamond') || url.includes('special')) return <span style={{ fontSize: size }}>💎</span>;
            if (url.includes('fire') || url.includes('streak')) return <span style={{ fontSize: size }}>🔥</span>;
            if (url.includes('star')) return <span style={{ fontSize: size }}>⭐</span>;
            if (url.includes('crown')) return <span style={{ fontSize: size }}>👑</span>;
            if (url.includes('heart')) return <span style={{ fontSize: size }}>❤️</span>;
            // Default trophy for image paths
            return <span style={{ fontSize: size }}>🏆</span>;
        }

        // Default case - show trophy
        return <span style={{ fontSize: size }}>🏆</span>;
    };

    useEffect(() => {
        if (!user) {
            dispatch(getCurrentUser());
        } else {
            // Enhanced debug log to check address field
            console.log('User data in UserProfile:', {
                user,
                hasAddress: 'address' in user,
                addressValue: user.address,
                addressType: typeof user.address,
                hasCreatedAt: 'createdAt' in user,
                createdAtValue: user.createdAt,
                createdAtType: typeof user.createdAt
            });

            // Initialize form with user data
            form.setFieldsValue({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phoneNumber: user.phoneNumber || '',
                address: user.address || '',
            });

            // Fetch achievements
            fetchUserAchievements();
            fetchAchievementStats();
        }
    }, [user, dispatch, form]);

    const fetchUserAchievements = async () => {
        try {
            const response = await axios.get('/api/achievements/earned', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.data.success) {
                setAchievements(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching achievements:', error);
        } finally {
            setLoadingAchievements(false);
        }
    };

    const fetchAchievementStats = async () => {
        try {
            const response = await axios.get('/api/achievements/stats', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.data.success) {
                setAchievementStats(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching achievement stats:', error);
        }
    };

    const handleCancel = () => {
        setEditMode(false);
        form.resetFields();
        if (user) {
            form.setFieldsValue({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phoneNumber: user.phoneNumber || '',
                address: user.address || '',
            });
        }
    };

    const handleSave = (values) => {
        // Validate required fields
        if (!values.firstName?.trim() || !values.lastName?.trim()) {
            notification.error({
                message: 'Lỗi',
                description: 'Họ và tên không được để trống',
            });
            return;
        }

        // Check if user is logged in - handle both id and UserID fields
        if (!user || (!user.id && !user.UserID)) {
            notification.error({
                message: 'Lỗi xác thực',
                description: 'Bạn cần đăng nhập để cập nhật thông tin',
            });
            return;
        }

        console.log('Submitting profile update:', values);
        console.log('User object:', user);

        dispatch(updateProfile(values))
            .unwrap()
            .then((response) => {
                console.log('Profile update successful:', response);
                notification.success({
                    message: 'Thành công',
                    description: 'Thông tin cá nhân đã được cập nhật!',
                });
                setEditMode(false);
                // Refresh user data
                dispatch(getCurrentUser());
            })
            .catch((error) => {
                console.error('Profile update error:', error);

                let errorMessage = 'Không thể cập nhật thông tin';
                if (error && error.message) {
                    errorMessage = error.message;
                }

                notification.error({
                    message: 'Lỗi cập nhật',
                    description: errorMessage,
                });

                // If authentication error, redirect to login
                if (errorMessage.includes('đăng nhập')) {
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 2000);
                }
            });
    };

    const handleDeleteAccount = () => {
        setDeleteModalVisible(true);
    };

    const handleDeleteCancel = () => {
        setDeleteModalVisible(false);
        deleteForm.resetFields();
    };

    const handleDeleteConfirm = async (values) => {
        setDeletingAccount(true);

        try {
            const response = await axios.delete('/api/user/account', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                data: {
                    password: values.password
                }
            });

            if (response.data.success) {
                notification.success({
                    message: 'Tài khoản đã được xóa',
                    description: 'Tài khoản của bạn đã được xóa thành công. Bạn sẽ được chuyển về trang chủ.',
                    duration: 5
                });

                // Clear local storage and logout
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                dispatch(logout());

                // Redirect to home page after delay
                setTimeout(() => {
                    navigate('/');
                }, 2000);
            }
        } catch (error) {
            console.error('Error deleting account:', error);

            let errorMessage = 'Không thể xóa tài khoản';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }

            notification.error({
                message: 'Lỗi xóa tài khoản',
                description: errorMessage,
                duration: 5
            });
        } finally {
            setDeletingAccount(false);
            setDeleteModalVisible(false);
            deleteForm.resetFields();
        }
    };

    if (loading || !user) {
        return <div className="loading-spinner">Loading...</div>;
    }

    return (
        <div className="user-profile-container">
            <h1>User Profile</h1>
            <div className="profile-grid">
                <div className="profile-sidebar">
                    <Card className="profile-card">
                        <div className="profile-avatar">
                            <Avatar size={100} icon={<UserOutlined />} src={user.avatar} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
                            <h2 style={{ margin: '0 8px 0 0' }}>{`${user.firstName} ${user.lastName}`}</h2>
                            <UserBadge userId={user.UserID} size="medium" />
                        </div>
                        <p className="role-text">Role: {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}</p>
                        {!editMode && (
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                onClick={() => setEditMode(true)}
                            >
                                EDIT PROFILE
                            </Button>
                        )}
                        {editMode && (
                            <Button
                                type="primary"
                                onClick={handleCancel}
                            >
                                CANCEL
                            </Button>
                        )}
                        {!editMode && (
                            <Button
                                type="primary"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={handleDeleteAccount}
                                style={{ marginTop: 8 }}
                            >
                                DELETE ACCOUNT
                            </Button>
                        )}
                    </Card>
                </div>
                <div className="profile-content">
                    {editMode ? (
                        <Card title="Edit Profile">
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={handleSave}
                                initialValues={{
                                    firstName: user.firstName || '',
                                    lastName: user.lastName || '',
                                    email: user.email || '',
                                    phoneNumber: user.phoneNumber || '',
                                    address: user.address || '',
                                }}
                            >
                                <Form.Item
                                    label="First Name"
                                    name="firstName"
                                    rules={[{ required: true, message: 'Please enter your first name' }]}
                                >
                                    <Input />
                                </Form.Item>
                                <Form.Item
                                    label="Last Name"
                                    name="lastName"
                                    rules={[{ required: true, message: 'Please enter your last name' }]}
                                >
                                    <Input />
                                </Form.Item>
                                <Form.Item
                                    label="Email"
                                    name="email"
                                >
                                    <Input disabled />
                                </Form.Item>
                                <Form.Item
                                    label="Phone Number"
                                    name="phoneNumber"
                                >
                                    <Input />
                                </Form.Item>
                                <Form.Item
                                    label="Address"
                                    name="address"
                                >
                                    <Input />
                                </Form.Item>
                                <div className="form-buttons">
                                    <Button onClick={handleCancel}>CANCEL</Button>
                                    <Button type="primary" htmlType="submit">SAVE CHANGES</Button>
                                </div>
                            </Form>
                        </Card>
                    ) : (
                        <Card title="Personal Information">
                            <div className="info-item">
                                <p className="info-label">Email</p>
                                <p className="info-value">{user.email || 'Not provided'}</p>
                            </div>
                            <div className="info-item">
                                <p className="info-label">Phone Number</p>
                                <p className="info-value">{user.phoneNumber || 'Not provided'}</p>
                            </div>
                            <div className="info-item">
                                <p className="info-label">Address</p>
                                <p className="info-value">
                                    {user.address ? user.address : 'Not provided'}
                                </p>
                            </div>
                            <div className="info-item">
                                <p className="info-label">Account Created</p>
                                <p className="info-value">
                                    {user.createdAt
                                        ? new Date(user.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })
                                        : 'Unknown'
                                    }
                                </p>
                            </div>
                        </Card>
                    )}

                    {/* Achievements Section */}
                    <Card
                        title={
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <TrophyOutlined style={{ marginRight: 8, color: '#faad14' }} />
                                Huy hiệu & Thành tích
                            </div>
                        }
                        style={{ marginTop: 16 }}
                    >
                        {achievementStats && (
                            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                                <Col xs={12} sm={6}>
                                    <Statistic
                                        title="Huy hiệu đạt được"
                                        value={achievementStats.EarnedCount}
                                        suffix={`/ ${achievementStats.TotalAchievements}`}
                                    />
                                </Col>
                                <Col xs={12} sm={6}>
                                    <Statistic
                                        title="Tỷ lệ hoàn thành"
                                        value={achievementStats.CompletionRate}
                                        suffix="%"
                                    />
                                </Col>
                                <Col xs={12} sm={6}>
                                    <Statistic
                                        title="Tổng điểm"
                                        value={achievementStats.TotalPoints || 0}
                                    />
                                </Col>
                                <Col xs={12} sm={6}>
                                    <Statistic
                                        title="Danh mục hoàn thành"
                                        value={achievementStats.CategoriesCompleted || 0}
                                    />
                                </Col>
                            </Row>
                        )}

                        {achievementStats && (
                            <div style={{ marginBottom: 24 }}>
                                <p style={{ marginBottom: 8 }}>Tiến độ hoàn thành:</p>
                                <Progress
                                    percent={achievementStats.CompletionRate}
                                    strokeColor={{
                                        '0%': '#108ee9',
                                        '100%': '#87d068',
                                    }}
                                />
                            </div>
                        )}

                        <div>
                            <p style={{ marginBottom: 16, fontWeight: 'bold' }}>Huy hiệu đã đạt được:</p>
                            {loadingAchievements ? (
                                <p>Đang tải...</p>
                            ) : achievements.length > 0 ? (
                                <Row gutter={[16, 16]}>
                                    {achievements.map((achievement) => (
                                        <Col key={achievement.AchievementID} xs={24} sm={12} md={8} lg={6}>
                                            <Card
                                                size="small"
                                                style={{
                                                    textAlign: 'center',
                                                    borderColor: achievement.Category === 'pro' ? '#722ed1' :
                                                        achievement.Category === 'premium' ? '#1890ff' : '#52c41a'
                                                }}
                                            >
                                                <div style={{ marginBottom: 8 }}>
                                                    {renderAchievementIcon(achievement.IconURL, achievement.Name, '32px')}
                                                </div>
                                                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: 4 }}>
                                                    {achievement.Name}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#666', marginBottom: 8 }}>
                                                    {achievement.Description}
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Tag color={
                                                        achievement.Category === 'basic' ? 'green' :
                                                            achievement.Category === 'premium' ? 'blue' :
                                                                achievement.Category === 'pro' ? 'purple' :
                                                                    achievement.Category === 'money' ? 'gold' :
                                                                        achievement.Category === 'special' ? 'red' : 'cyan'
                                                    }>
                                                        {achievement.Category}
                                                    </Tag>
                                                    <span style={{ fontSize: '12px', color: '#999' }}>
                                                        {achievement.Points} pts
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#999', marginTop: 4 }}>
                                                    {new Date(achievement.EarnedAt).toLocaleDateString('vi-VN')}
                                                </div>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                                    <TrophyOutlined style={{ fontSize: '48px', marginBottom: 16 }} />
                                    <p>Chưa có huy hiệu nào. Hãy bắt đầu hành trình cai thuốc để nhận huy hiệu đầu tiên!</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Delete Account Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', color: '#ff4d4f' }}>
                        <ExclamationCircleOutlined style={{ marginRight: 8, fontSize: '20px' }} />
                        <span>Xóa tài khoản vĩnh viễn</span>
                    </div>
                }
                open={deleteModalVisible}
                onCancel={handleDeleteCancel}
                footer={null}
                width={500}
                centered
            >
                <div style={{ padding: '20px 0' }}>
                    <div className="delete-warning-box">
                        <Title level={4} className="delete-warning-title">
                            ⚠️ Cảnh báo quan trọng
                        </Title>
                        <Text className="delete-warning-text">
                            Hành động này không thể hoàn tác. Tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn bao gồm:
                        </Text>
                        <ul className="delete-warning-list">
                            <li>Thông tin cá nhân và tài khoản</li>
                            <li>Lịch sử tiến độ cai thuốc</li>
                            <li>Huy hiệu và thành tích</li>
                            <li>Bài viết và bình luận</li>
                            <li>Lịch hẹn và gói thành viên</li>
                        </ul>
                    </div>

                    <Form
                        form={deleteForm}
                        layout="vertical"
                        onFinish={handleDeleteConfirm}
                    >
                        <Form.Item
                            label="Nhập mật khẩu để xác nhận"
                            name="password"
                            rules={[
                                { required: true, message: 'Vui lòng nhập mật khẩu' }
                            ]}
                        >
                            <Input.Password
                                placeholder="Nhập mật khẩu hiện tại"
                                size="large"
                            />
                        </Form.Item>



                        <div className="delete-modal-buttons">
                            <Button
                                className="delete-modal-cancel-btn"
                                onClick={handleDeleteCancel}
                                disabled={deletingAccount}
                            >
                                Hủy bỏ
                            </Button>
                            <Button
                                className="delete-modal-confirm-btn"
                                type="primary"
                                danger
                                htmlType="submit"
                                loading={deletingAccount}
                                icon={<DeleteOutlined />}
                            >
                                {deletingAccount ? 'Đang xóa...' : 'Xóa tài khoản vĩnh viễn'}
                            </Button>
                        </div>
                    </Form>
                </div>
            </Modal>
        </div>
    );
};

export default UserProfile; 