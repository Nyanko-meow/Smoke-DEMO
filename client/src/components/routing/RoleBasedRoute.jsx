import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Card, Button, Alert } from 'antd';
import { WarningOutlined, ArrowLeftOutlined } from '@ant-design/icons';

const { Title, Text } = require('antd').Typography;

const RoleBasedRoute = ({
    children,
    allowedRoles = [],
    redirectTo = '/',
    showAccessDenied = true
}) => {
    const { user, isAuthenticated } = useSelector((state) => state.auth);

    // If not authenticated, redirect to login
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    // Check if user's role is allowed
    const userRole = user.role || user.Role;
    const hasAccess = allowedRoles.length === 0 || allowedRoles.includes(userRole);

    if (!hasAccess) {
        if (!showAccessDenied) {
            return <Navigate to={redirectTo} replace />;
        }

        // Show access denied message
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                padding: '20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
                <Card style={{
                    maxWidth: '500px',
                    width: '100%',
                    textAlign: 'center',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ padding: '40px 20px' }}>
                        <WarningOutlined
                            style={{
                                fontSize: '64px',
                                color: '#ff7875',
                                marginBottom: '24px'
                            }}
                        />

                        <Title level={3} style={{ color: '#ff7875', marginBottom: '16px' }}>
                            Không có quyền truy cập
                        </Title>

                        <Text style={{
                            fontSize: '16px',
                            display: 'block',
                            marginBottom: '24px',
                            color: '#666'
                        }}>
                            Tài khoản <strong>{userRole}</strong> không được phép truy cập trang này.
                        </Text>

                        <Alert
                            message="Thông tin quyền truy cập"
                            description={
                                <div style={{ textAlign: 'left' }}>
                                    <p><strong>Role hiện tại:</strong> {userRole}</p>
                                    <p><strong>Role được phép:</strong> {allowedRoles.join(', ')}</p>
                                    <p><strong>Email:</strong> {user.email || user.Email}</p>
                                </div>
                            }
                            type="info"
                            showIcon
                            style={{ marginBottom: '24px' }}
                        />

                        <div style={{ marginBottom: '20px' }}>
                            <Button
                                type="primary"
                                icon={<ArrowLeftOutlined />}
                                onClick={() => {
                                    // Redirect based on user role
                                    if (userRole === 'admin') {
                                        window.location.href = '/admin/dashboard';
                                    } else if (userRole === 'coach') {
                                        window.location.href = '/coach/dashboard';
                                    } else {
                                        window.location.href = '/';
                                    }
                                }}
                                size="large"
                            >
                                Về trang chính của {userRole}
                            </Button>
                        </div>

                        <Text type="secondary" style={{ fontSize: '14px' }}>
                            Mỗi loại tài khoản có giao diện riêng được thiết kế phù hợp.
                        </Text>
                    </div>
                </Card>
            </div>
        );
    }

    return children;
};

export default RoleBasedRoute; 