import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { Typography, Layout, Row, Col, Card, Steps } from 'antd';
import MembershipPlans from '../components/membership/MembershipPlans';

const { Title, Paragraph } = Typography;
const { Content } = Layout;

const MembershipPage = () => {
    const { isAuthenticated } = useSelector(state => state.auth);

    // Redirect if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login?redirect=membership" replace />;
    }

    return (
        <div className="min-h-screen" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            paddingTop: '80px',
            paddingBottom: '40px'
        }}>
            <div className="max-w-6xl mx-auto px-6">
                {/* Simplified Header */}
                <div className="text-center mb-8">
                    <Title level={1} style={{ color: 'white', marginBottom: '16px', fontWeight: 700 }}>
                        💎 Gói Dịch Vụ
                    </Title>

                    <Paragraph style={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: '18px',
                        maxWidth: '600px',
                        margin: '0 auto 32px auto',
                        lineHeight: 1.6
                    }}>
                        Mua gói dịch vụ để truy cập các tính năng độc quyền và đẩy nhanh hành trình cai thuốc của bạn.
                    </Paragraph>

                    {/* Compact Benefits Row */}
                    <div
                        className="flex flex-wrap justify-center gap-6 mb-8"
                        style={{
                            background: 'rgba(255, 255, 255, 0.15)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '16px',
                            padding: '24px',
                            maxWidth: '900px',
                            margin: '0 auto'
                        }}
                    >
                        {[
                            { icon: '🎯', text: 'Kế hoạch cá nhân hóa' },
                            { icon: '👨‍⚕️', text: 'Tư vấn chuyên gia' },
                            { icon: '📊', text: 'Theo dõi nâng cao' },
                            { icon: '🔔', text: 'Thông báo thông minh' },
                            { icon: '🎁', text: 'Nội dung độc quyền' }
                        ].map((benefit, index) => (
                            <div key={index} className="flex items-center text-white" style={{ minWidth: '160px' }}>
                                <span style={{ fontSize: '20px', marginRight: '8px' }}>{benefit.icon}</span>
                                <span style={{ fontSize: '14px', fontWeight: 500 }}>{benefit.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Clean Plans Section */}
                <div
                    style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '20px',
                        padding: '32px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                    }}
                >
                    <MembershipPlans />
                </div>
            </div>

            <style>{`
                .flex {
                    display: flex;
                }
                .flex-wrap {
                    flex-wrap: wrap;
                }
                .justify-center {
                    justify-content: center;
                }
                .items-center {
                    align-items: center;
                }
                .gap-6 {
                    gap: 24px;
                }
                .text-white {
                    color: white;
                }
                .mb-8 {
                    margin-bottom: 32px;
                }
                
                @media (max-width: 768px) {
                    .flex-wrap > div {
                        min-width: 140px;
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    );
};

export default MembershipPage; 