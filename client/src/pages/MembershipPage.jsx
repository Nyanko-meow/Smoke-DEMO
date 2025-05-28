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
        <Layout>
            <Content style={{ padding: '0 50px', marginTop: 64 }}>
                <div style={{ background: '#fff', padding: 24, minHeight: 380 }}>
                    <Row gutter={[24, 24]} justify="center">
                        <Col xs={24} md={20} lg={18}>
                            <div style={{ textAlign: 'center', marginBottom: 30 }}>
                                <Title>Gói Dịch Vụ</Title>
                                <Paragraph>
                                    Nâng cấp tài khoản để truy cập các tính năng độc quyền và đẩy nhanh hành trình cai thuốc của bạn.
                                </Paragraph>

                                <Steps
                                    current={0}
                                    items={[
                                        {
                                            title: 'Chọn gói',
                                            description: 'Lựa chọn gói phù hợp'
                                        },
                                        {
                                            title: 'Thanh toán',
                                            description: 'Nhập thông tin thanh toán'
                                        },
                                        {
                                            title: 'Hoàn tất',
                                            description: 'Trở thành thành viên'
                                        },
                                    ]}
                                    style={{ maxWidth: 800, margin: '30px auto' }}
                                />
                            </div>

                            <Card
                                title={<Title level={3} style={{ margin: 0 }}>Lợi Ích Khi Nâng Cấp</Title>}
                                style={{
                                    marginBottom: 40,
                                    borderRadius: 8,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                            >
                                <Row gutter={[16, 16]} align="middle">
                                    <Col xs={24} md={8}>
                                        <img
                                            src="/api/images/smoking-cessation-1.svg"
                                            alt="Lợi ích thành viên"
                                            style={{ width: '100%' }}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = '/api/images/default-blog.jpg';
                                            }}
                                        />
                                    </Col>
                                    <Col xs={24} md={16}>
                                        <Paragraph>
                                            Thành viên cao cấp của chúng tôi được hưởng các công cụ và hệ thống hỗ trợ mạnh mẽ:
                                        </Paragraph>
                                        <ul>
                                            <li>Kế hoạch cai thuốc cá nhân hóa phù hợp với thói quen của bạn</li>
                                            <li>Tư vấn một-một với các chuyên gia cai thuốc</li>
                                            <li>Theo dõi tiến độ nâng cao và phân tích chi tiết</li>
                                            <li>Thông báo và nhắc nhở tùy chỉnh</li>
                                            <li>Quyền truy cập độc quyền vào tài nguyên chỉ dành cho thành viên</li>
                                        </ul>
                                    </Col>
                                </Row>
                            </Card>

                            <Title level={3} style={{ textAlign: 'center', margin: '20px 0' }}>Chọn Gói Dịch Vụ</Title>
                            <MembershipPlans />
                        </Col>
                    </Row>
                </div>
            </Content>
        </Layout>
    );
};

export default MembershipPage; 