import React from 'react';
import { Card, Button, Spin, Alert } from 'antd';
import { ExclamationCircleOutlined, LockOutlined } from '@ant-design/icons';
import { useMembershipAccess } from '../../hooks/useMembershipAccess';

const { Title, Text } = require('antd').Typography;

const AccessGuard = ({ children, feature = "tính năng này" }) => {
    const { hasAccess, loading, membershipStatus, user } = useMembershipAccess();

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '400px'
            }}>
                <Spin size="large" tip="Đang kiểm tra quyền truy cập..." />
            </div>
        );
    }

    if (!hasAccess) {
        const getAccessMessage = () => {
            switch (membershipStatus) {
                case 'not_logged_in':
                    return {
                        title: 'Chưa đăng nhập',
                        description: 'Bạn cần đăng nhập để truy cập tính năng này.',
                        action: (
                            <Button type="primary" onClick={() => window.location.href = '/login'}>
                                Đăng nhập
                            </Button>
                        )
                    };
                case 'no_active_membership':
                case 'no_payment_history':
                    return {
                        title: 'Không có quyền truy cập',
                        description: `Bạn cần mua gói dịch vụ để truy cập ${feature}.`,
                        action: (
                            <Button type="primary" onClick={() => window.location.href = '/membership'}>
                                Xem gói dịch vụ
                            </Button>
                        )
                    };
                case 'pending_payment':
                    return {
                        title: 'Thanh toán đang chờ xác nhận',
                        description: 'Thanh toán của bạn đang chờ admin xác nhận. Vui lòng đợi hoặc liên hệ admin.',
                        action: (
                            <Button onClick={() => window.location.href = '/membership'}>
                                Kiểm tra trạng thái thanh toán
                            </Button>
                        )
                    };
                case 'wrong_user_type':
                    const userRole = user?.role || user?.Role;
                    return {
                        title: 'Sai loại tài khoản',
                        description: `Tài khoản ${userRole} không được sử dụng giao diện thành viên. Vui lòng sử dụng giao diện dành cho ${userRole}.`,
                        action: (
                            <Button type="primary" onClick={() => {
                                if (userRole === 'admin') {
                                    window.location.href = '/admin/dashboard';
                                } else if (userRole === 'coach') {
                                    window.location.href = '/coach/dashboard';
                                } else {
                                    window.location.href = '/';
                                }
                            }}>
                                Về trang {userRole}
                            </Button>
                        )
                    };
                default:
                    return {
                        title: 'Không có quyền truy cập',
                        description: `Bạn không có quyền truy cập ${feature}.`,
                        action: (
                            <Button type="primary" onClick={() => window.location.href = '/membership'}>
                                Xem gói dịch vụ
                            </Button>
                        )
                    };
            }
        };

        const accessMessage = getAccessMessage();

        return (
            <div className="container mx-auto py-8 px-4">
                <div className="max-w-2xl mx-auto">
                    <Card className="text-center shadow-lg">
                        <div style={{ padding: '40px 20px' }}>
                            <LockOutlined
                                style={{
                                    fontSize: '64px',
                                    color: '#ff4d4f',
                                    marginBottom: '20px'
                                }}
                            />
                            <Title level={3} style={{ color: '#ff4d4f' }}>
                                {accessMessage.title}
                            </Title>
                            <Text style={{ fontSize: '16px', display: 'block', marginBottom: '24px' }}>
                                {accessMessage.description}
                            </Text>

                            {user && (
                                <Alert
                                    message={
                                        <div>
                                            <div><strong>Người dùng:</strong> {user.email || user.Email}</div>
                                            <div><strong>Trạng thái membership:</strong> {membershipStatus}</div>
                                        </div>
                                    }
                                    type="info"
                                    style={{ marginBottom: '20px' }}
                                />
                            )}

                            <div>
                                {accessMessage.action}
                            </div>

                            <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
                                <ExclamationCircleOutlined />
                                {' '}Để sử dụng đầy đủ tính năng, bạn cần:
                                <ul style={{ textAlign: 'left', marginTop: '8px', paddingLeft: '20px' }}>
                                    <li>Đã đăng ký và thanh toán gói dịch vụ</li>
                                    <li>Thanh toán đã được admin xác nhận</li>
                                    <li>Gói dịch vụ chưa hết hạn</li>
                                    <li>Hoặc có role Coach/Admin</li>
                                </ul>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    return children;
};

export default AccessGuard; 