import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
    Layout,
    Card,
    Row,
    Col,
    Typography,
    Progress,
    Space,
    Tag,
    Button,
    message,
    Spin,
    Empty,
    Tooltip,
    Badge,
    Divider,
    Alert,
    Result
} from 'antd';
import {
    TrophyOutlined,
    StarOutlined,
    CalendarOutlined,
    DollarOutlined,
    ShareAltOutlined,
    CheckCircleOutlined,
    LockOutlined,
    ExclamationCircleOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const AchievementPage = () => {
    const { user } = useSelector(state => state.auth);
    const [achievements, setAchievements] = useState([]);
    const [earnedAchievements, setEarnedAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [progressData, setProgressData] = useState(null);
    const [databaseError, setDatabaseError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (user) {
            fetchAllData();
        }
    }, [user]);

    const fetchAllData = async () => {
        setLoading(true);
        setDatabaseError(false);
        setErrorMessage('');

        try {
            // Try to fetch achievements with enhanced error handling
            let achievementsData = [];
            try {
                const achievementsRes = await axios.get('/api/achievements/', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                if (achievementsRes.data.success) {
                    achievementsData = achievementsRes.data.data;
                    console.log('✅ Achievements loaded:', achievementsData.length);
                } else {
                    throw new Error('API returned success: false');
                }
            } catch (error) {
                console.error('❌ Achievements API error:', error.response?.status, error.response?.data?.message);

                if (error.response?.status === 500) {
                    setDatabaseError(true);
                    setErrorMessage('Hệ thống huy hiệu chưa được thiết lập. Vui lòng liên hệ admin để chạy script setup.');
                    return; // Exit early if database error
                } else {
                    message.warning('Không thể tải danh sách huy hiệu. Sẽ thử lại sau.');
                }
            }

            // Try to fetch earned achievements
            let earnedData = [];
            try {
                const earnedRes = await axios.get('/api/achievements/earned', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                if (earnedRes.data.success) {
                    earnedData = earnedRes.data.data;
                    console.log('✅ Earned achievements loaded:', earnedData.length);
                }
            } catch (error) {
                console.warn('⚠️ Earned achievements API error:', error.response?.status);
            }

            // Try to fetch progress data
            let progressInfo = null;
            try {
                const progressRes = await axios.get('/api/progress/summary', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                if (progressRes.data.success) {
                    progressInfo = progressRes.data.data;
                    console.log('✅ Progress data loaded');
                }
            } catch (error) {
                console.warn('⚠️ Progress API error:', error.response?.status);
                // Progress not critical for achievements display
            }

            setAchievements(achievementsData);
            setEarnedAchievements(earnedData);
            setProgressData(progressInfo);

        } catch (error) {
            console.error('❌ Error fetching data:', error);
            setErrorMessage('Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const shareAchievement = async (achievement) => {
        try {
            const response = await axios.post('/api/community/share-achievement', {
                achievementId: achievement.AchievementID,
                message: `Tôi vừa đạt được huy hiệu "${achievement.Name}"! 🎉`
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.data.success) {
                message.success('Đã chia sẻ thành tích lên cộng đồng!');
            }
        } catch (error) {
            message.error('Lỗi khi chia sẻ thành tích');
        }
    };

    const getProgressToNextAchievement = (achievement) => {
        if (!progressData) return { progress: 0, total: 100, current: 0 };

        if (achievement.MilestoneDays) {
            const current = progressData.SmokeFreeDays || 0;
            return {
                progress: Math.min((current / achievement.MilestoneDays) * 100, 100),
                total: achievement.MilestoneDays,
                current
            };
        }

        if (achievement.SavedMoney) {
            const current = progressData.TotalMoneySaved || 0;
            return {
                progress: Math.min((current / achievement.SavedMoney) * 100, 100),
                total: achievement.SavedMoney,
                current
            };
        }

        return { progress: 0, total: 100, current: 0 };
    };

    const isAchievementEarned = (achievementId) => {
        return earnedAchievements.some(earned => earned.AchievementID === achievementId);
    };

    const getEarnedDate = (achievementId) => {
        const earned = earnedAchievements.find(e => e.AchievementID === achievementId);
        return earned?.EarnedAt;
    };

    if (loading) {
        return (
            <Content style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Spin size="large" tip="Đang tải huy hiệu..." />
            </Content>
        );
    }

    // Handle database error
    if (databaseError) {
        return (
            <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
                <Content style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                    <Result
                        status="500"
                        title="Hệ thống huy hiệu chưa sẵn sàng"
                        subTitle={errorMessage}
                        icon={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
                        extra={[
                            <Button
                                type="primary"
                                key="retry"
                                icon={<ReloadOutlined />}
                                onClick={fetchAllData}
                            >
                                Thử lại
                            </Button>,
                            <Button key="back" onClick={() => window.history.back()}>
                                Quay lại
                            </Button>
                        ]}
                    >
                        <div style={{ textAlign: 'left', maxWidth: '500px', margin: '0 auto' }}>
                            <Alert
                                message="Hướng dẫn cho Admin"
                                description={
                                    <div>
                                        <p>Để khắc phục lỗi này, admin cần chạy lệnh sau trên server:</p>
                                        <code style={{
                                            background: '#f5f5f5',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            display: 'block',
                                            marginTop: '8px'
                                        }}>
                                            cd server && node fix-achievements-database.js
                                        </code>
                                        <p style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                                            Hoặc double-click file run-fix.bat trong thư mục server
                                        </p>
                                    </div>
                                }
                                type="warning"
                                showIcon
                                style={{ marginTop: 16 }}
                            />
                        </div>
                    </Result>
                </Content>
            </Layout>
        );
    }

    // Handle general error
    if (errorMessage && !achievements.length) {
        return (
            <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
                <Content style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                    <Result
                        status="error"
                        title="Không thể tải dữ liệu"
                        subTitle={errorMessage}
                        extra={[
                            <Button
                                type="primary"
                                key="retry"
                                icon={<ReloadOutlined />}
                                onClick={fetchAllData}
                            >
                                Thử lại
                            </Button>
                        ]}
                    />
                </Content>
            </Layout>
        );
    }

    return (
        <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
            <Content style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                <div style={{ marginBottom: 24 }}>
                    <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                        🏆 Huy hiệu thành tích
                    </Title>
                    <Text type="secondary">
                        Theo dõi và chia sẻ những thành tích trong hành trình cai thuốc
                    </Text>
                </div>

                {/* Summary Stats */}
                {progressData && (
                    <Card style={{ marginBottom: 24 }}>
                        <Row gutter={[16, 16]}>
                            <Col xs={12} sm={6}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '32px', color: '#52c41a' }}>
                                        {earnedAchievements.length}
                                    </div>
                                    <Text>Huy hiệu đã đạt</Text>
                                </div>
                            </Col>
                            <Col xs={12} sm={6}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '32px', color: '#1890ff' }}>
                                        {progressData.SmokeFreeDays || 0}
                                    </div>
                                    <Text>Ngày không hút</Text>
                                </div>
                            </Col>
                            <Col xs={12} sm={6}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '32px', color: '#faad14' }}>
                                        {Math.round((progressData.TotalMoneySaved || 0) / 1000)}K
                                    </div>
                                    <Text>VNĐ tiết kiệm</Text>
                                </div>
                            </Col>
                            <Col xs={12} sm={6}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '32px', color: '#722ed1' }}>
                                        {Math.round(
                                            achievements.length > 0
                                                ? (earnedAchievements.length / achievements.length) * 100
                                                : 0
                                        )}%
                                    </div>
                                    <Text>Hoàn thành</Text>
                                </div>
                            </Col>
                        </Row>
                    </Card>
                )}

                {/* Achievements Grid */}
                <Row gutter={[16, 16]}>
                    {achievements.map((achievement) => {
                        const isEarned = isAchievementEarned(achievement.AchievementID);
                        const earnedDate = getEarnedDate(achievement.AchievementID);
                        const progressInfo = getProgressToNextAchievement(achievement);

                        return (
                            <Col xs={24} sm={12} lg={8} key={achievement.AchievementID}>
                                <Card
                                    hoverable
                                    style={{
                                        position: 'relative',
                                        opacity: isEarned ? 1 : 0.7,
                                        border: isEarned ? '2px solid #52c41a' : '1px solid #d9d9d9'
                                    }}
                                    actions={isEarned ? [
                                        <Tooltip title="Chia sẻ thành tích">
                                            <Button
                                                type="text"
                                                icon={<ShareAltOutlined />}
                                                onClick={() => shareAchievement(achievement)}
                                            >
                                                Chia sẻ
                                            </Button>
                                        </Tooltip>
                                    ] : []}
                                >
                                    {isEarned && (
                                        <Badge.Ribbon
                                            text="Đã đạt"
                                            color="green"
                                            style={{
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}
                                        />
                                    )}

                                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                                        <div style={{
                                            fontSize: '64px',
                                            marginBottom: 8,
                                            filter: isEarned ? 'none' : 'grayscale(100%)'
                                        }}>
                                            {achievement.IconURL ? (
                                                <img
                                                    src={achievement.IconURL}
                                                    alt={achievement.Name}
                                                    style={{ width: 64, height: 64 }}
                                                />
                                            ) : (
                                                isEarned ? '🏆' : '🔒'
                                            )}
                                        </div>

                                        <Title level={4} style={{
                                            margin: 0,
                                            color: isEarned ? '#52c41a' : '#8c8c8c'
                                        }}>
                                            {isEarned ? <CheckCircleOutlined /> : <LockOutlined />}
                                            {' '}{achievement.Name}
                                        </Title>
                                    </div>

                                    <Paragraph style={{ textAlign: 'center', minHeight: 48 }}>
                                        {achievement.Description}
                                    </Paragraph>

                                    {achievement.MilestoneDays && (
                                        <Space direction="vertical" style={{ width: '100%', marginBottom: 12 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Text type="secondary">
                                                    <CalendarOutlined /> {achievement.MilestoneDays} ngày
                                                </Text>
                                                <Text>
                                                    {progressInfo.current}/{progressInfo.total}
                                                </Text>
                                            </div>
                                            <Progress
                                                percent={progressInfo.progress}
                                                size="small"
                                                status={isEarned ? 'success' : 'active'}
                                            />
                                        </Space>
                                    )}

                                    {achievement.SavedMoney && (
                                        <Space direction="vertical" style={{ width: '100%', marginBottom: 12 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Text type="secondary">
                                                    <DollarOutlined /> {achievement.SavedMoney.toLocaleString('vi-VN')} VNĐ
                                                </Text>
                                                <Text>
                                                    {Math.round(progressInfo.current).toLocaleString('vi-VN')}/{progressInfo.total.toLocaleString('vi-VN')}
                                                </Text>
                                            </div>
                                            <Progress
                                                percent={progressInfo.progress}
                                                size="small"
                                                status={isEarned ? 'success' : 'active'}
                                            />
                                        </Space>
                                    )}

                                    {isEarned && earnedDate && (
                                        <>
                                            <Divider style={{ margin: '12px 0' }} />
                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                <StarOutlined /> Đạt được {formatDistanceToNow(new Date(earnedDate), {
                                                    addSuffix: true,
                                                    locale: vi
                                                })}
                                            </Text>
                                        </>
                                    )}
                                </Card>
                            </Col>
                        );
                    })}
                </Row>

                {achievements.length === 0 && (
                    <Card>
                        <Empty
                            description="Chưa có huy hiệu nào"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    </Card>
                )}
            </Content>
        </Layout>
    );
};

export default AchievementPage; 