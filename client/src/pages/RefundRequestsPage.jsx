import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { Typography } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import RefundRequests from '../components/member/RefundRequests';

const { Title } = Typography;

const RefundRequestsPage = () => {
    const { isAuthenticated, user } = useSelector(state => state.auth);

    // Redirect if not authenticated or not a member
    if (!isAuthenticated) {
        return <Navigate to="/login?redirect=refund-requests" replace />;
    }

    if (user?.role !== 'member') {
        return <Navigate to="/" replace />;
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '24px'
        }}>
            {/* Header Section */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '20px',
                padding: '32px',
                marginBottom: '24px',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                textAlign: 'center'
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)'
                }}>
                    <DollarOutlined style={{ fontSize: '32px', color: 'white' }} />
                </div>
                <Title level={2} style={{
                    margin: 0,
                    marginBottom: '12px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 700
                }}>
                    Yêu cầu hoàn tiền
                </Title>
                <p style={{
                    margin: 0,
                    color: '#6b7280',
                    fontSize: '16px',
                    fontWeight: 500,
                    lineHeight: '1.6'
                }}>
                    Theo dõi và quản lý các yêu cầu hoàn tiền của bạn
                </p>
            </div>

            {/* Content Section */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '20px',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                overflow: 'hidden'
            }}>
                <RefundRequests />
            </div>
        </div>
    );
};

export default RefundRequestsPage; 