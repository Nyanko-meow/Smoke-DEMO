import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Row, Col, Divider } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
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
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <Row justify="center" className="w-full">
                <Col xs={24} sm={20} md={16} lg={12} xl={10} xxl={8}>
                    <Card
                        className="shadow-2xl border-0 rounded-2xl"
                        style={{
                            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                            border: 'none'
                        }}
                    >
                        <div className="bg-white rounded-xl p-8">
                            <div className="text-center mb-8">
                                <div className="mx-auto flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-orange-600 rounded-full mb-4">
                                    <SafetyOutlined className="text-white text-2xl" />
                                </div>
                                <Title level={2} className="text-gray-800 mb-2">
                                    Admin Portal
                                </Title>
                                <Text className="text-gray-600 text-lg">
                                    Đăng nhập vào hệ thống quản trị viên
                                </Text>
                            </div>

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
                                    label={<span className="text-gray-700 font-semibold">Email</span>}
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
                                        prefix={<UserOutlined className="text-gray-400" />}
                                        placeholder="Nhập email của bạn"
                                        className="rounded-lg"
                                        style={{ height: '50px' }}
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="password"
                                    label={<span className="text-gray-700 font-semibold">Mật khẩu</span>}
                                    rules={[
                                        {
                                            required: true,
                                            message: 'Vui lòng nhập mật khẩu!'
                                        }
                                    ]}
                                >
                                    <Input.Password
                                        prefix={<LockOutlined className="text-gray-400" />}
                                        placeholder="Nhập mật khẩu của bạn"
                                        className="rounded-lg"
                                        style={{ height: '50px' }}
                                    />
                                </Form.Item>

                                <Form.Item className="mb-6">
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={loading}
                                        block
                                        className="rounded-lg font-semibold"
                                        style={{
                                            height: '50px',
                                            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                                            border: 'none'
                                        }}
                                    >
                                        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                                    </Button>
                                </Form.Item>
                            </Form>

                            <Divider className="my-6">
                                <span className="text-gray-400 text-sm">Hoặc</span>
                            </Divider>

                            <div className="text-center">
                                <Text className="text-gray-600">
                                    Bạn là người dùng thông thường?{' '}
                                    <Link
                                        to="/login"
                                        className="text-red-600 hover:text-red-800 font-semibold"
                                    >
                                        Đăng nhập tại đây
                                    </Link>
                                </Text>
                                <br />
                                <Text className="text-gray-600 mt-2">
                                    Bạn là huấn luyện viên?{' '}
                                    <Link
                                        to="/coach/login"
                                        className="text-blue-600 hover:text-blue-800 font-semibold"
                                    >
                                        Đăng nhập Coach
                                    </Link>
                                </Text>
                            </div>

                            <div className="mt-6 p-4 bg-red-50 rounded-lg">
                                <Text className="text-red-800 text-sm">
                                    <strong>Lưu ý:</strong> Trang đăng nhập này chỉ dành cho quản trị viên (Admin).
                                    Tài khoản của bạn phải có quyền Admin để có thể đăng nhập.
                                </Text>
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default AdminLogin; 