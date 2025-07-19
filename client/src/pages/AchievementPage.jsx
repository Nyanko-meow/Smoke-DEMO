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

    // Helper function to render achievement icon
    const renderAchievementIcon = (achievement, actuallyEarned, shouldShowEligible) => {
        const iconUrl = achievement.IconURL;

        // If no IconURL, show default emojis based on status
        if (!iconUrl) {
            return (
                <span style={{ fontSize: '64px' }}>
                    {actuallyEarned ? '🏆' : shouldShowEligible ? '🎯' : '🔒'}
                </span>
            );
        }

        // If IconURL is already an emoji (length <= 4 and not a path)
        if (iconUrl.length <= 4 && !/^\/|^http|\.png|\.jpg|\.gif|\.svg/i.test(iconUrl)) {
            return <span style={{ fontSize: '64px' }}>{iconUrl}</span>;
        }

        // If IconURL looks like an image path, show actual image
        if (/\/images\/|\/api\/images\/|\.png|\.jpg|\.gif|\.svg/i.test(iconUrl)) {
            return (
                <img
                    src={iconUrl}
                    alt={achievement.Name}
                    style={{
                        width: '64px',
                        height: '64px',
                        objectFit: 'contain',
                        filter: actuallyEarned ? 'none' : shouldShowEligible ? 'none' : 'grayscale(100%) opacity(0.5)'
                    }}
                    onError={(e) => {
                        // Fallback to emoji if image fails to load
                        e.target.outerHTML = `<span style="font-size: 64px">${actuallyEarned ? '🏆' : shouldShowEligible ? '🎯' : '🔒'}</span>`;
                    }}
                />
            );
        }

        // Default case - show emoji
        return (
            <span style={{ fontSize: '64px' }}>
                {actuallyEarned ? '🏆' : shouldShowEligible ? '🎯' : '🔒'}
            </span>
        );
    };

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
                // First try authenticated endpoint
                let achievementsRes;
                const token = localStorage.getItem('token');

                if (token) {
                    try {
                        achievementsRes = await axios.get('/api/achievements/', {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                    } catch (authError) {
                        console.warn('Auth achievements failed, trying public endpoint');
                        achievementsRes = await axios.get('/api/achievements/public');
                    }
                } else {
                    achievementsRes = await axios.get('/api/achievements/public');
                }

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
                const token = localStorage.getItem('token');
                if (token) {
                    const earnedRes = await axios.get('/api/achievements/earned', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (earnedRes.data.success) {
                        earnedData = earnedRes.data.data;
                        console.log('✅ Earned achievements loaded:', earnedData.length);
                    }
                }
            } catch (error) {
                console.warn('⚠️ Earned achievements API error:', error.response?.status);
            }

            // Try to fetch progress data
            let progressInfo = null;
            try {
                const token = localStorage.getItem('token');
                let progressRes;

                if (token) {
                    try {
                        progressRes = await axios.get('/api/progress/summary', {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                    } catch (authError) {
                        console.warn('Auth progress failed, trying public endpoint');
                        progressRes = await axios.get('/api/progress/public-summary');
                    }
                } else {
                    progressRes = await axios.get('/api/progress/public-summary');
                }

                if (progressRes.data.success) {
                    progressInfo = progressRes.data.data;
                    console.log('✅ Progress data loaded');
                }
            } catch (error) {
                console.warn('⚠️ Progress API error:', error.response?.status);
                // Use dummy data if both auth and public fail
                progressInfo = {
                    SmokeFreeDays: 7,
                    TotalMoneySaved: 350000,
                    TotalDaysTracked: 7
                };
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

    const fixAchievements = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            if (!token) {
                message.error('Vui lòng đăng nhập để kiểm tra huy hiệu');
                return;
            }

            const response = await axios.post('/api/achievements/fix-unlock', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                message.success(response.data.message);

                if (response.data.newAchievements && response.data.newAchievements.length > 0) {
                    // Show notification for new achievements
                    response.data.newAchievements.forEach(achievement => {
                        message.success(`🏆 Mở khóa huy hiệu: ${achievement.Name}`, 5);
                    });
                }

                // Refresh data
                await fetchAllData();
            } else {
                // Handle case where user doesn't have progress data
                if (response.data.needsProgress) {
                    message.warning('Bạn cần ghi nhật ký tiến trình trước khi có thể nhận huy hiệu!');
                } else {
                    message.info(response.data.message || 'Không có huy hiệu mới để mở khóa');
                }

                // Show debug info if available
                if (response.data.debug) {
                    console.log('🔍 Achievement Debug Info:', response.data.debug);
                }
            }
        } catch (error) {
            console.error('Error fixing achievements:', error);

            if (error.response?.data?.message) {
                message.error(error.response.data.message);
            } else {
                message.error('Lỗi khi kiểm tra huy hiệu: ' + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const clearAchievements = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            if (!token) {
                message.error('Vui lòng đăng nhập để xóa huy hiệu');
                return;
            }

            const response = await axios.post('/api/achievements/clear-my-achievements', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                message.success(response.data.message);
                await fetchAllData();
            } else {
                message.error(response.data.message || 'Lỗi khi xóa huy hiệu');
            }
        } catch (error) {
            console.error('Error clearing achievements:', error);
            message.error('Lỗi khi xóa huy hiệu: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const isAchievementEarned = (achievementId) => {
        return earnedAchievements.some(earned => earned.AchievementID === achievementId);
    };

    const isAchievementEligible = (achievement) => {
        // if (isAchievementEarned(achievement.AchievementID)) {
        //     return true;
        // }
        // Check if achievement has IsEligible property from API
        if (achievement.hasOwnProperty('IsEligible')) {
            return achievement.IsEligible === 1;
        }

        // Fallback: check eligibility based on progress data
        if (!progressData) return false;

        // For milestone days achievements
        if (achievement.MilestoneDays !== null) {
            const current = progressData.SmokeFreeDays || 0;
            const required = achievement.MilestoneDays;
            return current >= required;
        }

        // For saved money achievements  
        if (achievement.SavedMoney !== null) {
            const current = progressData.TotalMoneySaved || 0;
            const required = achievement.SavedMoney;
            return current >= required;
        }

        // For special achievements (no specific requirements), check earned status
        if (achievement.MilestoneDays === null && achievement.SavedMoney === null) {
            return isAchievementEarned(achievement.AchievementID);
        }

        return false;
    };

    const getProgressToNextAchievement = (achievement) => {
        if (!progressData) return { progress: 0, total: 100, current: 0 };

        if (achievement.MilestoneDays) {
            const current = progressData.SmokeFreeDays || 0;
            return {
                progress: Math.round(Math.min((current / achievement.MilestoneDays) * 100, 100) * 10) / 10,
                total: achievement.MilestoneDays,
                current
            };
        }

        if (achievement.SavedMoney) {
            const current = progressData.TotalMoneySaved || 0;
            return {
                progress: Math.round(Math.min((current / achievement.SavedMoney) * 100, 100) * 10) / 10,
                total: achievement.SavedMoney,
                current
            };
        }

        return { progress: 0, total: 100, current: 0 };
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
            <Layout style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
                <Content style={{
                    padding: '32px 24px',
                    maxWidth: '800px',
                    margin: '0 auto',
                    width: '100%'
                }}>
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '20px',
                        padding: '48px 32px',
                        textAlign: 'center',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                        <div style={{
                            fontSize: '72px',
                            marginBottom: '24px'
                        }}>
                            🔧
                        </div>
                        <Title level={3} style={{ color: '#d97706', marginBottom: '16px' }}>
                            Hệ thống cần được thiết lập
                        </Title>
                        <Text style={{ color: '#6b7280', fontSize: '16px', display: 'block', marginBottom: '24px' }}>
                            Vui lòng liên hệ admin để hoàn tất cài đặt huy hiệu thành tích
                        </Text>

                        <div style={{
                            background: 'rgba(245, 158, 11, 0.1)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            borderRadius: '12px',
                            padding: '20px',
                            textAlign: 'left',
                            maxWidth: '500px',
                            margin: '0 auto'
                        }}>
                            <Text strong style={{ color: '#d97706', display: 'block', marginBottom: '12px' }}>
                                Hướng dẫn cho Admin:
                            </Text>
                            <Text style={{ color: '#6b7280', display: 'block', marginBottom: '12px' }}>
                                Để khắc phục lỗi này, admin cần chạy lệnh sau trên server:
                            </Text>
                            <div style={{
                                background: '#f3f4f6',
                                padding: '12px',
                                borderRadius: '8px',
                                fontFamily: 'monospace',
                                fontSize: '14px',
                                color: '#374151',
                                marginBottom: '12px'
                            }}>
                                cd server && node fix-achievements-database.js
                            </div>
                            <Text style={{ fontSize: '12px', color: '#9ca3af' }}>
                                Hoặc double-click file run-fix.bat trong thư mục server
                            </Text>
                        </div>
                    </div>
                </Content>
            </Layout>
        );
    }

    // Handle general error
    if (errorMessage && !achievements.length) {
        return (
            <Layout style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
                <Content style={{
                    padding: '32px 24px',
                    maxWidth: '800px',
                    margin: '0 auto',
                    width: '100%'
                }}>
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '20px',
                        padding: '48px 32px',
                        textAlign: 'center',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                        <div style={{
                            fontSize: '72px',
                            marginBottom: '24px'
                        }}>
                            ⚠️
                        </div>
                        <Title level={3} style={{ color: '#ef4444', marginBottom: '16px' }}>
                            Không thể tải dữ liệu
                        </Title>
                        <Text style={{ color: '#6b7280', fontSize: '16px', display: 'block', marginBottom: '32px' }}>
                            {errorMessage}
                        </Text>
                        <Button
                            type="primary"
                            size="large"
                            icon={<ReloadOutlined />}
                            onClick={fetchAllData}
                            style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                border: 'none',
                                borderRadius: '12px',
                                height: '48px',
                                paddingInline: '32px',
                                fontSize: '16px',
                                fontWeight: 600
                            }}
                        >
                            Thử lại
                        </Button>
                    </div>
                </Content>
            </Layout>
        );
    }

    return (
        <Layout style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
            <Content style={{
                padding: '32px 24px',
                maxWidth: '1200px',
                margin: '0 auto',
                width: '100%'
            }}>
                {/* Header Section */}
                <div style={{
                    marginBottom: 32,
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '20px',
                    padding: '32px',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '28px'
                            }}>
                                🏆
                            </div>
                            <div>
                                <Title level={2} style={{
                                    margin: 0,
                                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    fontWeight: 700
                                }}>
                                    Huy hiệu thành tích
                                </Title>
                                <Text style={{
                                    color: '#6b7280',
                                    fontSize: '16px',
                                    fontWeight: 500
                                }}>
                                    Theo dõi và chia sẻ những thành tích trong hành trình cai thuốc
                                </Text>
                            </div>
                        </div>
                        <Space>
                            <Button
                                type="primary"
                                icon={<ReloadOutlined />}
                                onClick={fetchAllData}
                                loading={loading}
                                style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    height: '40px',
                                    paddingInline: '20px',
                                    fontSize: '14px',
                                    fontWeight: 600
                                }}
                            >
                                Làm mới
                            </Button>
                            <Button
                                danger
                                onClick={clearAchievements}
                                loading={loading}
                                style={{
                                    borderRadius: '12px',
                                    height: '40px',
                                    paddingInline: '20px',
                                    fontSize: '14px',
                                    fontWeight: 500
                                }}
                            >
                                Reset huy hiệu
                            </Button>
                        </Space>
                    </div>
                </div>

                {/* Summary Stats */}
                {progressData && (
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '20px',
                        padding: '32px',
                        marginBottom: 32,
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                        <Row gutter={[24, 24]}>
                            <Col xs={12} sm={6}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 12px',
                                        boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)'
                                    }}>
                                        <span style={{
                                            fontSize: '32px',
                                            color: 'white',
                                            fontWeight: 700
                                        }}>
                                            {achievements.filter(achievement => {
                                                const isEarned = isAchievementEarned(achievement.AchievementID);
                                                const isEligible = isAchievementEligible(achievement);
                                                return isEarned && isEligible;
                                            }).length}
                                        </span>
                                    </div>
                                    <Text style={{
                                        color: '#1f2937',
                                        fontSize: '14px',
                                        fontWeight: 600
                                    }}>
                                        Huy hiệu đã đạt
                                    </Text>
                                </div>
                            </Col>
                            <Col xs={12} sm={6}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 12px',
                                        boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)'
                                    }}>
                                        <span style={{
                                            fontSize: '32px',
                                            color: 'white',
                                            fontWeight: 700
                                        }}>
                                            {progressData.SmokeFreeDays || 0}
                                        </span>
                                    </div>
                                    <Text style={{
                                        color: '#1f2937',
                                        fontSize: '14px',
                                        fontWeight: 600
                                    }}>
                                        Ngày không hút
                                    </Text>
                                </div>
                            </Col>
                            <Col xs={12} sm={6}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 12px',
                                        boxShadow: '0 8px 24px rgba(251, 191, 36, 0.3)'
                                    }}>
                                        <span style={{
                                            fontSize: '24px',
                                            color: 'white',
                                            fontWeight: 700
                                        }}>
                                            {Math.round((progressData.TotalMoneySaved || 0) / 1000)}K
                                        </span>
                                    </div>
                                    <Text style={{
                                        color: '#1f2937',
                                        fontSize: '14px',
                                        fontWeight: 600
                                    }}>
                                        VNĐ tiết kiệm
                                    </Text>
                                </div>
                            </Col>
                            <Col xs={12} sm={6}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 12px',
                                        boxShadow: '0 8px 24px rgba(139, 92, 246, 0.3)'
                                    }}>
                                        <span style={{
                                            fontSize: '24px',
                                            color: 'white',
                                            fontWeight: 700
                                        }}>
                                            {Math.round(
                                                achievements.length > 0
                                                    ? (achievements.filter(achievement => {
                                                        const isEarned = isAchievementEarned(achievement.AchievementID);
                                                        const isEligible = isAchievementEligible(achievement);
                                                        return isEarned && isEligible;
                                                    }).length / achievements.length) * 100
                                                    : 0
                                            )}%
                                        </span>
                                    </div>
                                    <Text style={{
                                        color: '#1f2937',
                                        fontSize: '14px',
                                        fontWeight: 600
                                    }}>
                                        Hoàn thành
                                    </Text>
                                </div>
                            </Col>
                        </Row>
                    </div>
                )}

                {/* Achievements Grid */}
                <Row gutter={[24, 24]}>
                    {achievements.map((achievement) => {
                        const isEarned = isAchievementEarned(achievement.AchievementID);
                        const isEligible = isAchievementEligible(achievement);
                        const earnedDate = getEarnedDate(achievement.AchievementID);
                        const progressInfo = getProgressToNextAchievement(achievement);

                        const actuallyEarned = isEarned && isEligible;
                        const shouldShowEligible = !actuallyEarned && isEligible;
                        const isLocked = !actuallyEarned && !isEligible;

                        return (
                            <Col xs={24} sm={12} lg={8} key={achievement.AchievementID}>
                                <div
                                    style={{
                                        position: 'relative',
                                        background: actuallyEarned
                                            ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
                                            : shouldShowEligible
                                                ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'
                                                : 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                                        borderRadius: '20px',
                                        padding: '24px',
                                        backdropFilter: 'blur(20px)',
                                        boxShadow: actuallyEarned
                                            ? '0 8px 32px rgba(16, 185, 129, 0.2)'
                                            : shouldShowEligible
                                                ? '0 8px 32px rgba(245, 158, 11, 0.2)'
                                                : '0 8px 32px rgba(0, 0, 0, 0.05)',
                                        border: actuallyEarned
                                            ? '2px solid rgba(16, 185, 129, 0.3)'
                                            : shouldShowEligible
                                                ? '2px solid rgba(245, 158, 11, 0.3)'
                                                : '1px solid rgba(0, 0, 0, 0.1)',
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer',
                                        opacity: isLocked ? 0.6 : 1
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isLocked) {
                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                            e.currentTarget.style.boxShadow = actuallyEarned
                                                ? '0 12px 40px rgba(16, 185, 129, 0.3)'
                                                : shouldShowEligible
                                                    ? '0 12px 40px rgba(245, 158, 11, 0.3)'
                                                    : '0 12px 40px rgba(0, 0, 0, 0.1)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = actuallyEarned
                                            ? '0 8px 32px rgba(16, 185, 129, 0.2)'
                                            : shouldShowEligible
                                                ? '0 8px 32px rgba(245, 158, 11, 0.2)'
                                                : '0 8px 32px rgba(0, 0, 0, 0.05)';
                                    }}
                                >
                                    {/* Status Badge */}
                                    {actuallyEarned && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '16px',
                                            right: '16px',
                                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                            color: 'white',
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                                        }}>
                                            ✅ Đã đạt
                                        </div>
                                    )}

                                    {shouldShowEligible && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '16px',
                                            right: '16px',
                                            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                                            color: 'white',
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                                        }}>
                                            🔓 Sẵn sàng
                                        </div>
                                    )}

                                    {isLocked && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '16px',
                                            right: '16px',
                                            background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                                            color: 'white',
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)'
                                        }}>
                                            🔒 Khóa
                                        </div>
                                    )}

                                    {/* Achievement Icon */}
                                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                        <div style={{
                                            width: '80px',
                                            height: '80px',
                                            borderRadius: '50%',
                                            background: actuallyEarned
                                                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                                : shouldShowEligible
                                                    ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                                                    : 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto',
                                            boxShadow: actuallyEarned
                                                ? '0 8px 24px rgba(16, 185, 129, 0.3)'
                                                : shouldShowEligible
                                                    ? '0 8px 24px rgba(245, 158, 11, 0.3)'
                                                    : '0 8px 24px rgba(107, 114, 128, 0.2)',
                                            filter: isLocked ? 'grayscale(100%)' : 'none'
                                        }}>
                                            <span style={{ fontSize: '32px' }}>
                                                {actuallyEarned ? '🏆' : shouldShowEligible ? '🎯' : '🔒'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Achievement Info */}
                                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                        <Title level={4} style={{
                                            margin: '0 0 8px 0',
                                            color: actuallyEarned
                                                ? '#059669'
                                                : shouldShowEligible
                                                    ? '#d97706'
                                                    : '#6b7280',
                                            fontSize: '16px',
                                            fontWeight: 600
                                        }}>
                                            {achievement.Name}
                                        </Title>
                                        <Text style={{
                                            color: '#6b7280',
                                            fontSize: '14px',
                                            lineHeight: '1.5',
                                            display: 'block'
                                        }}>
                                            {achievement.Description}
                                        </Text>
                                    </div>

                                    {/* Progress or Requirements */}
                                    {!actuallyEarned && progressInfo && (
                                        <div style={{
                                            background: 'rgba(255, 255, 255, 0.5)',
                                            borderRadius: '12px',
                                            padding: '12px',
                                            marginBottom: 16
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '8px'
                                            }}>
                                                <Text style={{ fontSize: '12px', color: '#6b7280' }}>
                                                    {progressInfo.label}
                                                </Text>
                                                <Text style={{ fontSize: '12px', fontWeight: 600, color: '#1f2937' }}>
                                                    {progressInfo.current}/{progressInfo.target}
                                                </Text>
                                            </div>
                                            <div style={{
                                                width: '100%',
                                                height: '6px',
                                                background: '#e5e7eb',
                                                borderRadius: '3px',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    width: `${Math.min(progressInfo.percentage, 100)}%`,
                                                    height: '100%',
                                                    background: shouldShowEligible
                                                        ? 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)'
                                                        : 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)',
                                                    transition: 'width 0.3s ease'
                                                }} />
                                            </div>
                                        </div>
                                    )}

                                    {/* Earned Date */}
                                    {actuallyEarned && earnedDate && (
                                        <div style={{
                                            background: 'rgba(16, 185, 129, 0.1)',
                                            borderRadius: '12px',
                                            padding: '12px',
                                            marginBottom: 16,
                                            textAlign: 'center'
                                        }}>
                                            <Text style={{
                                                fontSize: '12px',
                                                color: '#059669',
                                                fontWeight: 600
                                            }}>
                                                🗓️ Đạt được {formatDistanceToNow(new Date(earnedDate), {
                                                    addSuffix: true,
                                                    locale: vi
                                                })}
                                            </Text>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                        {actuallyEarned && (
                                            <Button
                                                type="primary"
                                                icon={<ShareAltOutlined />}
                                                onClick={() => shareAchievement(achievement)}
                                                style={{
                                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    fontSize: '12px',
                                                    fontWeight: 600
                                                }}
                                            >
                                                Chia sẻ
                                            </Button>
                                        )}

                                        {shouldShowEligible && (
                                            <Button
                                                type="primary"
                                                icon={<TrophyOutlined />}
                                                onClick={fixAchievements}
                                                style={{
                                                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    fontSize: '12px',
                                                    fontWeight: 600
                                                }}
                                            >
                                                Mở khóa
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Col>
                        );
                    })}
                </Row>

                {/* Empty State */}
                {!loading && achievements.length === 0 && (
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '20px',
                        padding: '64px 32px',
                        textAlign: 'center',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                        <div style={{
                            fontSize: '72px',
                            marginBottom: '24px'
                        }}>
                            🏆
                        </div>
                        <Title level={3} style={{ color: '#6b7280', marginBottom: '16px' }}>
                            Chưa có huy hiệu nào
                        </Title>
                        <Text style={{ color: '#9ca3af', fontSize: '16px' }}>
                            Hãy bắt đầu hành trình cai thuốc để mở khóa các huy hiệu thành tích!
                        </Text>
                    </div>
                )}
            </Content>
        </Layout>
    );
};

export default AchievementPage; 