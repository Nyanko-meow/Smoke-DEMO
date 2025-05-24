import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Avatar, Button, Form, Input, notification, Row, Col, Tag, Progress, Statistic } from 'antd';
import { EditOutlined, UserOutlined, TrophyOutlined } from '@ant-design/icons';
import { getCurrentUser } from '../../store/slices/authSlice';
import { updateProfile } from '../../store/slices/userSlice';
import UserBadge from '../common/UserBadge';
import axios from 'axios';
import './UserProfile.css';

const UserProfile = () => {
    const dispatch = useDispatch();
    const { user, loading } = useSelector((state) => state.auth);
    const [editMode, setEditMode] = useState(false);
    const [form] = Form.useForm();
    const [achievements, setAchievements] = useState([]);
    const [achievementStats, setAchievementStats] = useState(null);
    const [loadingAchievements, setLoadingAchievements] = useState(true);

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
        dispatch(updateProfile(values))
            .unwrap()
            .then((response) => {
                notification.success({
                    message: 'Success',
                    description: 'Profile updated successfully!',
                });
                setEditMode(false);
                dispatch(getCurrentUser());
            })
            .catch((error) => {
                notification.error({
                    message: 'Error',
                    description: error.message || 'Failed to update profile',
                });
            });
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
                                                <div style={{ fontSize: '32px', marginBottom: 8 }}>
                                                    {achievement.IconURL}
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
        </div>
    );
};

export default UserProfile; 