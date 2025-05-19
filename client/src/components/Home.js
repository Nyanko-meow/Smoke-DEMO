import React from 'react';
import { Link } from 'react-router-dom';
import { Typography, Button, Card, Row, Col, Statistic, Divider, Avatar } from 'antd';
import {
    ClockCircleOutlined,
    HeartOutlined,
    DollarOutlined,
    TrophyOutlined,
    RocketOutlined,
    SmileOutlined,
    UserOutlined,
    TeamOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const Home = () => {
    return (
        <div className="home-container">
            {/* Hero Section */}
            <div className="hero-section">
                <div className="container mx-auto px-4 py-16 md:py-24">
                    <Row gutter={[48, 32]} align="middle" justify="space-between">
                        <Col xs={24} md={12}>
                            <Title level={1} className="hero-title">
                                Bắt đầu hành trình cai thuốc lá của bạn
                            </Title>
                            <Paragraph className="hero-subtitle">
                                SmokeKing giúp bạn cai thuốc lá hiệu quả với phương pháp khoa học và cộng đồng hỗ trợ. Hãy tham gia cùng hàng nghìn người đã thành công trên hành trình này.
                            </Paragraph>
                            <div className="hero-buttons">
                                <Button
                                    type="primary"
                                    size="large"
                                    className="register-btn"
                                >
                                    <Link to="/register">Đăng ký miễn phí</Link>
                                </Button>
                                <Button
                                    ghost
                                    size="large"
                                    className="plans-btn"
                                >
                                    <Link to="/plans">Xem gói dịch vụ</Link>
                                </Button>
                            </div>
                        </Col>
                        <Col xs={24} md={12}>
                            <div className="hero-image-container">
                                <img
                                    src="https://placehold.co/600x400/6eedaf/white?text=Healthy+Life"
                                    alt="Healthy Life"
                                    className="hero-image"
                                />
                            </div>
                        </Col>
                    </Row>
                </div>
            </div>

            {/* Stats Section */}
            <div className="stats-section">
                <div className="container mx-auto px-4">
                    <Title level={2} className="section-title">
                        Thống kê từ cộng đồng SmokeKing
                    </Title>
                    <Row gutter={[32, 32]} className="stats-row">
                        <Col xs={24} sm={12} md={6}>
                            <Card className="stat-card">
                                <Statistic
                                    title={<span className="stat-title">Người dùng</span>}
                                    value={15243}
                                    prefix={<TeamOutlined className="stat-icon team-icon" />}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card className="stat-card">
                                <Statistic
                                    title={<span className="stat-title">Số điếu không hút</span>}
                                    value={1438921}
                                    prefix={<SmileOutlined className="stat-icon smile-icon" />}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card className="stat-card">
                                <Statistic
                                    title={<span className="stat-title">Tiền tiết kiệm (VND)</span>}
                                    value={28778420000}
                                    precision={0}
                                    prefix={<DollarOutlined className="stat-icon dollar-icon" />}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card className="stat-card">
                                <Statistic
                                    title={<span className="stat-title">Sức khỏe cải thiện</span>}
                                    value={92}
                                    suffix="%"
                                    prefix={<HeartOutlined className="stat-icon heart-icon" />}
                                />
                            </Card>
                        </Col>
                    </Row>
                </div>
            </div>

            {/* Features Section */}
            <div className="features-section">
                <div className="container mx-auto px-4">
                    <Title level={2} className="section-title">
                        Tại sao chọn SmokeKing?
                    </Title>
                    <Paragraph className="section-subtitle">
                        Chúng tôi kết hợp khoa học, công nghệ và cộng đồng để giúp bạn cai thuốc lá thành công
                    </Paragraph>

                    <Row gutter={[32, 32]} className="features-row">
                        <Col xs={24} sm={12} lg={8}>
                            <Card className="feature-card">
                                <div className="feature-icon-container">
                                    <ClockCircleOutlined className="feature-icon" />
                                </div>
                                <Title level={4} className="feature-title">Theo dõi tiến trình</Title>
                                <Paragraph className="feature-description">
                                    Ghi nhận quá trình cai thuốc, xem thống kê chi tiết và theo dõi tiến bộ hàng ngày với ứng dụng trực quan.
                                </Paragraph>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={8}>
                            <Card className="feature-card">
                                <div className="feature-icon-container">
                                    <TeamOutlined className="feature-icon" />
                                </div>
                                <Title level={4} className="feature-title">Cộng đồng hỗ trợ</Title>
                                <Paragraph className="feature-description">
                                    Kết nối với những người cùng mục tiêu cai thuốc lá, chia sẻ kinh nghiệm và động viên nhau trên hành trình.
                                </Paragraph>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={8}>
                            <Card className="feature-card">
                                <div className="feature-icon-container">
                                    <UserOutlined className="feature-icon" />
                                </div>
                                <Title level={4} className="feature-title">Tư vấn chuyên gia</Title>
                                <Paragraph className="feature-description">
                                    Nhận hỗ trợ từ đội ngũ chuyên gia về cai thuốc lá qua tư vấn trực tiếp và kế hoạch cá nhân hóa.
                                </Paragraph>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </div>

            {/* Testimonials */}
            <div className="testimonials-section">
                <div className="container mx-auto px-4">
                    <Title level={2} className="section-title">
                        Khách hàng nói gì về chúng tôi
                    </Title>

                    <Row gutter={[32, 32]} className="testimonials-row">
                        <Col xs={24} md={12}>
                            <Card className="testimonial-card">
                                <div className="testimonial-content">
                                    <Avatar size={80} src="https://placehold.co/200/blue/white?text=N" className="testimonial-avatar" />
                                    <div className="testimonial-text">
                                        <Title level={4} className="testimonial-name">Nguyễn Văn A</Title>
                                        <Text type="secondary" className="testimonial-info">Đã cai thuốc 8 tháng</Text>
                                        <Paragraph className="testimonial-quote">
                                            "Tôi đã thử nhiều phương pháp cai thuốc nhưng đều thất bại. Với SmokeKing, tôi đã cai thuốc thành công và cảm thấy khỏe mạnh hơn rất nhiều. Cảm ơn đội ngũ SmokeKing!"
                                        </Paragraph>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                        <Col xs={24} md={12}>
                            <Card className="testimonial-card">
                                <div className="testimonial-content">
                                    <Avatar size={80} src="https://placehold.co/200/pink/white?text=T" className="testimonial-avatar" />
                                    <div className="testimonial-text">
                                        <Title level={4} className="testimonial-name">Trần Thị B</Title>
                                        <Text type="secondary" className="testimonial-info">Đã cai thuốc 1 năm</Text>
                                        <Paragraph className="testimonial-quote">
                                            "Cộng đồng hỗ trợ trên SmokeKing thực sự giúp tôi vượt qua những giai đoạn khó khăn nhất. Giờ đây tôi đã có thể hít thở tự do và tiết kiệm được rất nhiều tiền."
                                        </Paragraph>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </div>

            {/* CTA Section */}
            <div className="cta-section">
                <div className="container mx-auto px-4 text-center">
                    <Title level={2} className="cta-title">
                        Sẵn sàng bắt đầu?
                    </Title>
                    <Paragraph className="cta-subtitle">
                        Đăng ký ngay hôm nay và nhận gói dịch vụ miễn phí cho người mới bắt đầu
                    </Paragraph>
                    <Button
                        type="primary"
                        size="large"
                        className="cta-button"
                    >
                        <Link to="/register">Bắt đầu ngay</Link>
                    </Button>
                </div>
            </div>

            {/* Footer */}
            <footer className="footer-section">
                <div className="container mx-auto px-4">
                    <Row gutter={[32, 32]} className="footer-content">
                        <Col xs={24} sm={12} md={8}>
                            <Title level={4} className="footer-title">SmokeKing</Title>
                            <Paragraph className="footer-text">
                                Hỗ trợ bạn trong hành trình cai thuốc lá và sống khỏe mạnh hơn.
                            </Paragraph>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Title level={4} className="footer-title">Liên kết</Title>
                            <ul className="footer-links">
                                <li><Link to="/" className="footer-link">Trang chủ</Link></li>
                                <li><Link to="/plans" className="footer-link">Gói dịch vụ</Link></li>
                                <li><Link to="/blog" className="footer-link">Blog</Link></li>
                                <li><Link to="/community" className="footer-link">Cộng đồng</Link></li>
                            </ul>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Title level={4} className="footer-title">Liên hệ</Title>
                            <ul className="footer-contact">
                                <li className="footer-contact-item"><span className="footer-contact-icon">📍</span> 123 Đường Cai Thuốc, TP.HCM</li>
                                <li className="footer-contact-item"><span className="footer-contact-icon">📞</span> (028) 1234 5678</li>
                                <li className="footer-contact-item"><span className="footer-contact-icon">📧</span> info@smokeking.vn</li>
                            </ul>
                        </Col>
                    </Row>
                    <Divider className="footer-divider" />
                    <div className="footer-copyright">
                        <Text className="copyright-text">© 2024 SmokeKing. Đã đăng ký bản quyền.</Text>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home; 