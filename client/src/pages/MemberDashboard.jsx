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
    Spin
} from 'antd';
import {
    CalendarOutlined,
    FireOutlined,
    DollarOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Appointments from '../components/member/Appointments';
import AccessGuard from '../components/common/AccessGuard';
import SavingsDisplay from '../components/common/SavingsDisplay';

const { Content, Sider } = Layout;
const { Text } = Typography;

const MemberDashboard = () => {
    const [activeMenu, setActiveMenu] = useState('appointments');
    const [memberInfo, setMemberInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadMemberInfo();
        // Mặc định vào mục lịch hẹn
        setActiveMenu('appointments');
    }, []);

    const loadMemberInfo = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('memberToken') || localStorage.getItem('token');

            if (!token) {
                message.error('Vui lòng đăng nhập lại');
                navigate('/login');
                return;
            }

            let userProfile = null;
            let progressData = null;
            let streakData = {};

            try {
                const profileResponse = await axios.get('http://smokeking.wibu.me:4000/api/user/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (profileResponse.data.success) {
                    userProfile = profileResponse.data.data.userInfo;
                }
            } catch (profileError) {
                console.error('Lỗi tải profile:', profileError.response?.data?.message);
                userProfile = {
                    id: 1,
                    firstName: 'Member',
                    lastName: 'User',
                    email: 'member@example.com',
                    avatar: null
                };
            }

            try {
                const progressResponse = await axios.get('http://smokeking.wibu.me:4000/api/progress/summary', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (progressResponse.data.success) {
                    progressData = progressResponse.data.data;
                }
            } catch (progressError) {
                console.error('Lỗi tải dữ liệu tiến trình:', progressError.response?.data?.message);
                progressData = {
                    SmokeFreeDays: 0,
                    CigarettesNotSmoked: 0,
                    TotalMoneySaved: 0,
                    TotalDaysTracked: 0
                };
            }

            try {
                const streakResponse = await axios.get('http://smokeking.wibu.me:4000/api/progress/streak', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (streakResponse.data.success) {
                    streakData = streakResponse.data.data;
                }
            } catch (streakError) {
                console.error('Lỗi tải dữ liệu streak:', streakError.response?.data?.message);
                streakData = { currentStreak: 0, longestStreak: 0 };
            }

            if (userProfile && progressData) {
                setMemberInfo({
                    id: userProfile.id,
                    firstName: userProfile.firstName,
                    lastName: userProfile.lastName,
                    email: userProfile.email,
                    avatar: userProfile.avatar,
                    smokingStatus: {
                        daysSinceQuit: progressData.SmokeFreeDays || 0,
                        cigarettesAvoided: progressData.CigarettesNotSmoked || 0,
                        moneySaved: progressData.TotalMoneySaved || 0,
                        currentStreak: streakData.currentStreak || 0,
                        longestStreak: streakData.longestStreak || 0,
                        totalDaysTracked: progressData.TotalDaysTracked || 0
                    }
                });
            } else {
                console.warn('Dùng dữ liệu mặc định - lỗi gọi API');
                setMemberInfo({
                    id: 1,
                    firstName: 'Member',
                    lastName: 'User',
                    email: 'member@example.com',
                    avatar: null,
                    smokingStatus: {
                        daysSinceQuit: 0,
                        cigarettesAvoided: 0,
                        moneySaved: 0,
                        currentStreak: 0,
                        longestStreak: 0,
                        totalDaysTracked: 0
                    }
                });
            }

        } catch (error) {
            console.error('Lỗi khi tải thông tin:', error);
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
        }
    ];

    const renderContent = () => {
        return <Appointments />;
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <AccessGuard feature="dashboard thành viên">
            <Layout style={{ minHeight: '100vh' }}>
                <Layout>
                    <Sider
                        width={280}
                        style={{
                            background: '#fff',
                            boxShadow: '2px 0 8px rgba(0,0,0,0.1)'
                        }}
                    >
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
                                        <SavingsDisplay
                                            title="Điếu thuốc tránh được"
                                            displayType="cigarettes"
                                            showDetails={false}
                                            style={{ textAlign: 'center' }}
                                            valueStyle={{ color: '#cf1322', fontSize: 16 }}
                                        />
                                    </Col>
                                    <Col span={24}>
                                        <SavingsDisplay
                                            title="Tiền tiết kiệm"
                                            displayType="money"
                                            showDetails={false}
                                            style={{ textAlign: 'center' }}
                                            valueStyle={{ color: '#389e0d', fontSize: 16 }}
                                            prefix={<DollarOutlined />}
                                            suffix="VND"
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
        </AccessGuard>
    );
};

export default MemberDashboard;
