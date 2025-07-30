import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Row, Col, Divider, Avatar } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined, LoginOutlined, CrownOutlined, TeamOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title, Text } = Typography;

const AdminLogin = () => {
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const navigate = useNavigate();

    const handleLogin = async (values) => {
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:4000/api/admin/login', {
                email: values.email,
                password: values.password
            }, {
                withCredentials: true
            });

            if (response.data.success) {
                // Store token in localStorage
                localStorage.setItem('adminToken', response.data.token);
                localStorage.setItem('adminUser', JSON.stringify(response.data.user));

                message.success('Đăng nhập thành công!');

                // Redirect to admin dashboard
                setTimeout(() => {
                    navigate('/admin/dashboard');
                }, 1000);
            }
        } catch (error) {
            console.error('Admin login error:', error);
            const errorMessage = error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
            style={{
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                position: 'relative'
            }}
        >
            {/* Background Pattern */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.06"%3E%3Cpath d="M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                    opacity: 0.3
                }}
            />

            <Row justify="center" className="w-full relative z-10">
                <Col xs={24} sm={22} md={20} lg={16} xl={14} xxl={12}>
                    <Card
                        className="shadow-2xl border-0"
                        style={{
                            borderRadius: '24px',
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            overflow: 'hidden',
                            maxWidth: '600px',
                            margin: '0 auto'
                        }}
                        bodyStyle={{ padding: '48px 50px' }}
                    >
                        {/* Header Section */}
                        <div className="text-center mb-8">
                            <Avatar
                                size={80}
                                style={{
                                    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                                    boxShadow: '0 8px 32px rgba(255, 107, 107, 0.4)',
                                    marginBottom: '24px'
                                }}
                            >
                                <SafetyOutlined style={{ fontSize: '40px', color: 'white' }} />
                            </Avatar>

                            <Title
                                level={2}
                                style={{
                                    marginBottom: '8px',
                                    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    fontWeight: 700
                                }}
                            >
                                Admin Portal
                            </Title>

                            <Text
                                style={{
                                    fontSize: '16px',
                                    color: '#6b7280',
                                    lineHeight: 1.6,
                                    display: 'block'
                                }}
                            >
                                Đăng nhập vào hệ thống quản trị viên
                            </Text>

                            <div
                                style={{
                                    width: '60px',
                                    height: '4px',
                                    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                                    margin: '16px auto',
                                    borderRadius: '2px'
                                }}
                            />
                        </div>

                        {/* Login Form */}
                        <Form
                            form={form}
                            name="admin-login"
                            onFinish={handleLogin}
                            autoComplete="off"
                            size="large"
                            layout="vertical"
                        >
                            <Form.Item
                                name="email"
                                label={<span style={{ color: '#374151', fontWeight: 600 }}>Email</span>}
                                rules={[
                                    {
                                        required: true,
                                        message: 'Vui lòng nhập email!'
                                    },
                                    {
                                        type: 'email',
                                        message: 'Email không hợp lệ!'
                                    }
                                ]}
                            >
                                <Input
                                    prefix={<UserOutlined style={{ color: '#9ca3af' }} />}
                                    placeholder="Nhập email của bạn"
                                    style={{
                                        height: '56px',
                                        borderRadius: '12px',
                                        fontSize: '16px',
                                        border: '2px solid #e5e7eb',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#ff6b6b'}
                                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                                />
                            </Form.Item>

                            <Form.Item
                                name="password"
                                label={<span style={{ color: '#374151', fontWeight: 600 }}>Mật khẩu</span>}
                                rules={[
                                    {
                                        required: true,
                                        message: 'Vui lòng nhập mật khẩu!'
                                    }
                                ]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                                    placeholder="Nhập mật khẩu của bạn"
                                    style={{
                                        height: '56px',
                                        borderRadius: '12px',
                                        fontSize: '16px',
                                        border: '2px solid #e5e7eb',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#ff6b6b'}
                                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                                />
                            </Form.Item>

                            <Form.Item style={{ marginBottom: '32px' }}>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                    block
                                    icon={!loading && <LoginOutlined />}
                                    style={{
                                        height: '56px',
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                                        border: 'none',
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        boxShadow: '0 8px 32px rgba(255, 107, 107, 0.4)',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 12px 40px rgba(255, 107, 107, 0.5)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = '0 8px 32px rgba(255, 107, 107, 0.4)';
                                    }}
                                >
                                    {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                                </Button>
                            </Form.Item>
                        </Form>

                        {/* Divider */}
                        <Divider style={{ margin: '32px 0', borderColor: '#e5e7eb' }}>
                            <span style={{ color: '#9ca3af', fontSize: '14px' }}>Hoặc đăng nhập với vai trò khác</span>
                        </Divider>

                        {/* Role-based Login Links */}
                        <Row gutter={12}>
                            <Col span={12}>
                                <Button
                                    block
                                    icon={<TeamOutlined />}
                                    style={{
                                        height: '48px',
                                        borderRadius: '12px',
                                        borderColor: '#667eea',
                                        color: '#667eea',
                                        fontWeight: 500,
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = 'rgba(102, 126, 234, 0.04)';
                                        e.target.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = 'transparent';
                                        e.target.style.transform = 'translateY(0)';
                                    }}
                                    onClick={() => navigate('/login')}
                                >
                                    User
                                </Button>
                            </Col>
                            <Col span={12}>
                                <Button
                                    block
                                    icon={<CrownOutlined />}
                                    style={{
                                        height: '48px',
                                        borderRadius: '12px',
                                        borderColor: '#667eea',
                                        color: '#667eea',
                                        fontWeight: 500,
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = 'rgba(102, 126, 234, 0.04)';
                                        e.target.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = 'transparent';
                                        e.target.style.transform = 'translateY(0)';
                                    }}
                                    onClick={() => navigate('/coach/login')}
                                >
                                    Coach
                                </Button>
                            </Col>
                        </Row>

                        {/* Footer Text */}
                        <div className="text-center mt-6">
                            <Text style={{ color: '#6b7280', fontSize: '14px' }}>
                                Quên mật khẩu?{' '}
                                <a
                                    href="#"
                                    style={{
                                        color: '#ff6b6b',
                                        textDecoration: 'none',
                                        fontWeight: 600
                                    }}
                                >
                                    Khôi phục tài khoản
                                </a>
                            </Text>
                        </div>

                        {/* Warning Box */}
                        <div
                            style={{
                                marginTop: '24px',
                                padding: '16px',
                                backgroundColor: 'rgba(255, 107, 107, 0.08)',
                                borderRadius: '12px',
                                border: '1px solid rgba(255, 107, 107, 0.2)'
                            }}
                        >
                            <Text style={{ color: '#ff6b6b', fontSize: '13px' }}>
                                <strong>⚠️ Cảnh báo:</strong> Đây là khu vực dành riêng cho quản trị viên.
                                Chỉ có tài khoản được cấp quyền Admin mới có thể truy cập.
                            </Text>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default AdminLogin; 