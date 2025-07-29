import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Row, Col, Divider, Avatar, Space } from 'antd';
import { UserOutlined, LockOutlined, CrownOutlined, LoginOutlined, SafetyOutlined, TeamOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title, Text } = Typography;

const CoachLogin = () => {
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const navigate = useNavigate();

    const handleLogin = async (values) => {
        setLoading(true);
        try {
            const response = await axios.post('http://smokeking.wibu.me:4000/api/coaches/login', {
                email: values.email,
                password: values.password
            }, {
                withCredentials: true
            });

            if (response.data.success) {
                // Store token in localStorage
                localStorage.setItem('coachToken', response.data.token);
                localStorage.setItem('coachUser', JSON.stringify(response.data.user));

                message.success('Đăng nhập thành công!');

                // Redirect to coach dashboard
                setTimeout(() => {
                    navigate('/coach/dashboard');
                }, 1000);
            }
        } catch (error) {
            console.error('Coach login error:', error);
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
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                    background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                    opacity: 0.3
                }}
            />

            <Row justify="center" className="w-full relative z-10">
                <Col xs={24} sm={20} md={16} lg={12} xl={10} xxl={8}>
                    <Card
                        className="shadow-2xl border-0"
                        style={{
                            borderRadius: '24px',
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            overflow: 'hidden'
                        }}
                        bodyStyle={{ padding: '48px 40px' }}
                    >
                        {/* Header Section */}
                        <div className="text-center mb-8">
                            <Avatar
                                size={80}
                                style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
                                    marginBottom: '24px'
                                }}
                            >
                                <CrownOutlined style={{ fontSize: '40px', color: 'white' }} />
                            </Avatar>

                            <Title
                                level={2}
                                style={{
                                    marginBottom: '8px',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    fontWeight: 700
                                }}
                            >
                                Coach Portal
                            </Title>

                            <Text
                                style={{
                                    fontSize: '16px',
                                    color: '#6b7280',
                                    lineHeight: 1.6,
                                    display: 'block'
                                }}
                            >
                                Đăng nhập vào hệ thống dành cho huấn luyện viên
                            </Text>

                            <div
                                style={{
                                    width: '60px',
                                    height: '4px',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    margin: '16px auto',
                                    borderRadius: '2px'
                                }}
                            />
                        </div>

                        {/* Login Form */}
                        <Form
                            form={form}
                            name="coach-login"
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
                                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
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
                                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
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
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        border: 'none',
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 12px 40px rgba(102, 126, 234, 0.5)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = '0 8px 32px rgba(102, 126, 234, 0.4)';
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
                                    icon={<SafetyOutlined />}
                                    style={{
                                        height: '48px',
                                        borderRadius: '12px',
                                        borderColor: '#ff6b6b',
                                        color: '#ff6b6b',
                                        fontWeight: 500,
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = 'rgba(255, 107, 107, 0.04)';
                                        e.target.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = 'transparent';
                                        e.target.style.transform = 'translateY(0)';
                                    }}
                                    onClick={() => navigate('/admin/login')}
                                >
                                    Admin
                                </Button>
                            </Col>
                        </Row>

                        {/* Footer Text */}
                        <div className="text-center mt-6">
                            <Text style={{ color: '#6b7280', fontSize: '14px' }}>
                                Cần hỗ trợ?{' '}
                                <a
                                    href="#"
                                    style={{
                                        color: '#667eea',
                                        textDecoration: 'none',
                                        fontWeight: 600
                                    }}
                                >
                                    Liên hệ Admin
                                </a>
                            </Text>
                        </div>

                        {/* Info Box */}
                        <div
                            style={{
                                marginTop: '24px',
                                padding: '16px',
                                backgroundColor: 'rgba(102, 126, 234, 0.08)',
                                borderRadius: '12px',
                                border: '1px solid rgba(102, 126, 234, 0.2)'
                            }}
                        >
                            <Text style={{ color: '#667eea', fontSize: '13px' }}>
                                <strong>Lưu ý:</strong> Trang đăng nhập này chỉ dành cho huấn luyện viên (Coach).
                                Tài khoản của bạn phải có quyền Coach để có thể đăng nhập.
                            </Text>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default CoachLogin; 