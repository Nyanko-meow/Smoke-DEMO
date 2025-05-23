import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Avatar, Button, Form, Input, notification } from 'antd';
import { EditOutlined, UserOutlined } from '@ant-design/icons';
import { getCurrentUser } from '../../store/slices/authSlice';
import { updateProfile } from '../../store/slices/userSlice';
import './UserProfile.css';

const UserProfile = () => {
    const dispatch = useDispatch();
    const { user, loading } = useSelector((state) => state.auth);
    const [editMode, setEditMode] = useState(false);
    const [form] = Form.useForm();

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
        }
    }, [user, dispatch, form]);

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
                        <h2>{`${user.firstName} ${user.lastName}`}</h2>
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
                </div>
            </div>
        </div>
    );
};

export default UserProfile; 