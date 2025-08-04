import React from 'react';
import { Card, Row, Col, Button, Typography, Space } from 'antd';
import { 
    FileTextOutlined, 
    BarChartOutlined, 
    TrophyOutlined,
    DollarCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const SmokingAddictionNavigation = () => {
    const navigate = useNavigate();

    const navigationItems = [
        {
            title: '📝 Khảo Sát Mức Độ Nghiện',
            description: 'Đánh giá mức độ nghiện thuốc lá và tính xác suất thành công',
            icon: <FileTextOutlined />,
            path: '/member/smoking-survey',
            color: '#1890ff'
        },
        {
            title: '📊 Kết Quả Khảo Sát',
            description: 'Xem chi tiết kết quả đánh giá và dự báo',
            icon: <BarChartOutlined />,
            path: '/member/smoking-results',
            color: '#52c41a'
        },
        {
            title: '📈 Tiến Trình Cải Thiện',
            description: 'Theo dõi tiến trình dựa trên dữ liệu cá nhân',
            icon: <TrophyOutlined />,
            path: '/member/enhanced-progress',
            color: '#fa8c16'
        }
    ];

    return (
        <Card title="🚭 Cai Thuốc Lá Thông Minh" style={{ marginBottom: '24px' }}>
            <Text type="secondary" style={{ marginBottom: '16px', display: 'block' }}>
                Hệ thống đánh giá và theo dõi tiến trình cai thuốc dựa trên dữ liệu khoa học
            </Text>
            
            <Row gutter={[16, 16]}>
                {navigationItems.map((item, index) => (
                    <Col xs={24} md={8} key={index}>
                        <Card 
                            size="small" 
                            hoverable
                            style={{ 
                                borderLeft: `4px solid ${item.color}`,
                                cursor: 'pointer',
                                height: '120px'
                            }}
                            onClick={() => navigate(item.path)}
                        >
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <div style={{ fontSize: '24px', color: item.color }}>
                                    {item.icon}
                                </div>
                                <Title level={5} style={{ margin: 0, fontSize: '14px' }}>
                                    {item.title}
                                </Title>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    {item.description}
                                </Text>
                            </Space>
                        </Card>
                    </Col>
                ))}
            </Row>
            
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <Button 
                    type="primary" 
                    icon={<DollarCircleOutlined />}
                    onClick={() => navigate('/member/smoking-survey')}
                >
                    Bắt đầu khảo sát ngay
                </Button>
            </div>
        </Card>
    );
};

export default SmokingAddictionNavigation;