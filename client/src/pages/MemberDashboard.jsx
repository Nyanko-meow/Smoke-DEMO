import React, { useState, useEffect } from 'react';
import {
    Layout,
    Card,
    Typography,
    Row,
    Col,
    message,
    Menu,
    Badge,
    Statistic
} from 'antd';
import {
    CalendarOutlined,
    BarChartOutlined,
    HeartOutlined,
    FireOutlined,
    DollarOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Appointments from '../components/member/Appointments';
import ProgressTracking from '../components/member/ProgressTracking';

const { Content, Sider } = Layout;
const { Title, Text } = Typography;

const MemberDashboard = () => {
    const [activeMenu, setActiveMenu] = useState('appointments');
    const [memberInfo, setMemberInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadMemberInfo();

        // Check if should open appointments tab from navbar
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('tab') === 'appointments') {
            setActiveMenu('appointments');
        }
    }, []);

    const loadMemberInfo = async () => {
        try {
            setLoading(true);
            // Get from localStorage or API
            const token = localStorage.getItem('memberToken') || localStorage.getItem('token');
            if (!token) {
                navigate('/auth');
                return;
            }

            // Mock member info - in real app, fetch from API
            setMemberInfo({
                id: 1,
                firstName: 'Nguyễn',
                lastName: 'Văn A',
                email: 'member@example.com',
                avatar: null,
                smokingStatus: {
                    daysSinceQuit: 15,
                    cigarettesAvoided: 150,
                    moneySaved: 450000
                }
            });
        } catch (error) {
            console.error('Error loading member info:', error);
            message.error('Không thể tải thông tin thành viên');
        } finally {
            setLoading(false);
        }
    };



    const menuItems = [
        {
            key: 'appointments',
            icon: <CalendarOutlined />,
            label: 'Lịch hẹn tư vấn',
        },
        {
            key: 'progress',
            icon: <BarChartOutlined />,
            label: 'Tiến trình cai thuốc',
        },
    ];

    const renderContent = () => {
        switch (activeMenu) {
            case 'appointments':
                return <Appointments />;
            case 'progress':
                return <ProgressTracking />;
            default:
                return <Appointments />;
        }
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Layout>
                <Sider
                    width={280}
                    style={{
                        background: '#fff',
                        boxShadow: '2px 0 8px rgba(0,0,0,0.1)'
                    }}
                >
                    {/* Member Stats */}
                    {memberInfo?.smokingStatus && (
                        <Card
                            style={{
                                margin: 16,
                                borderRadius: 8,
                                background: 'linear-gradient(135deg, #f6f9fc 0%, #e9f4ff 100%)'
                            }}
                        >
                            <div style={{ textAlign: 'center', marginBottom: 16 }}>
                                <Badge count={memberInfo.smokingStatus.daysSinceQuit} showZero color="#52c41a">
                                    <FireOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                                </Badge>
                                <div style={{ marginTop: 8 }}>
                                    <Text strong>Ngày không hút thuốc</Text>
                                </div>
                            </div>

                            <Row gutter={[8, 8]}>
                                <Col span={24}>
                                    <Statistic
                                        title="Điếu thuốc tránh được"
                                        value={memberInfo.smokingStatus.cigarettesAvoided}
                                        prefix={<HeartOutlined />}
                                        valueStyle={{ color: '#cf1322', fontSize: 16 }}
                                    />
                                </Col>
                                <Col span={24}>
                                    <Statistic
                                        title="Tiền tiết kiệm"
                                        value={memberInfo.smokingStatus.moneySaved}
                                        prefix={<DollarOutlined />}
                                        suffix="VNĐ"
                                        valueStyle={{ color: '#389e0d', fontSize: 16 }}
                                    />
                                </Col>
                            </Row>
                        </Card>
                    )}

                    <Menu
                        mode="inline"
                        selectedKeys={[activeMenu]}
                        onClick={({ key }) => setActiveMenu(key)}
                        style={{
                            border: 'none',
                            padding: '0 16px'
                        }}
                        items={menuItems}
                    />
                </Sider>

                <Layout style={{ padding: 0, background: '#f0f2f5' }}>
                    <Content style={{ margin: 0, overflow: 'auto' }}>
                        {renderContent()}
                    </Content>
                </Layout>
            </Layout>
        </Layout>
    );
};

export default MemberDashboard; 