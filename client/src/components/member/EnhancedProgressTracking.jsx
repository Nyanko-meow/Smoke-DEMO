import React, { useState, useEffect } from 'react';
import {
    Card,
    Row,
    Col,
    Typography,
    Statistic,
    Progress,
    Button,
    Space,
    Alert,
    Divider,
    Tag,
    Timeline,
    Modal,
    Tabs
} from 'antd';
import {
    TrophyOutlined,
    DollarCircleOutlined,
    CalendarOutlined,
    HeartOutlined,
    BarChartOutlined,
    InfoCircleOutlined,
    ReloadOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import {
    calculateActualSavings,
    calculateCigarettesNotSmoked,
    getHealthImprovements,
    calculateAchievementScore,
    createSavingsForecast,
    getPriceRangeById,
    getAddictionLevel,
    getHealthRiskLevel
} from '../../utils/smokingCalculations';
import AccessGuard from '../common/AccessGuard';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const EnhancedProgressTracking = () => {
    const [loading, setLoading] = useState(true);
    const [progressData, setProgressData] = useState(null);
    const [surveyData, setSurveyData] = useState(null);
    const [enhancedStats, setEnhancedStats] = useState(null);
    const [showSurveyPrompt, setShowSurveyPrompt] = useState(false);

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadProgressData(),
                loadSurveyData()
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadProgressData = async () => {
        try {
            const token = localStorage.getItem('token');
            
            // Load progress summary
            const summaryResponse = await axios.get('/api/progress/summary', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (summaryResponse.data.success) {
                setProgressData(summaryResponse.data.data);
            }
        } catch (error) {
            console.error('Error loading progress data:', error);
            // Set empty data
            setProgressData({
                TotalDaysTracked: 0,
                SmokeFreeDays: 0,
                TotalMoneySaved: 0,
                AverageCravingLevel: 0,
                CigarettesNotSmoked: 0,
                SmokeFreePercentage: 0
            });
        }
    };

    const loadSurveyData = async () => {
        try {
            const token = localStorage.getItem('token');
            
            const response = await axios.get('/api/smoking-addiction-survey', {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSurveyData(response.data);
        } catch (error) {
            console.error('Error loading survey data:', error);
            // If no survey data, show prompt
            setShowSurveyPrompt(true);
        }
    };

    // Calculate enhanced statistics
    useEffect(() => {
        if (progressData && surveyData) {
            calculateEnhancedStats();
        }
    }, [progressData, surveyData]);

    const calculateEnhancedStats = () => {
        const smokeFreeDays = progressData.SmokeFreeDays || 0;
        const dailySavings = surveyData.dailySavings || 0;
        
        // Calculate actual savings based on survey data and smoke-free days
        const actualSavings = calculateActualSavings(smokeFreeDays, dailySavings);
        
        // Calculate cigarettes not smoked based on survey data
        const cigarettesNotSmoked = calculateCigarettesNotSmoked(
            smokeFreeDays, 
            surveyData.cigarettesPerDay || 0
        );
        
        // Get health improvements
        const healthImprovements = getHealthImprovements(smokeFreeDays);
        
        // Calculate achievement score
        const achievementScore = calculateAchievementScore({
            smokeFreeDays,
            totalMoneySaved: actualSavings,
            currentStreak: progressData.CurrentStreak || 0,
            smokeFreePercentage: progressData.SmokeFreePercentage || 0
        });
        
        // Create savings forecast
        const savingsForecast = createSavingsForecast(dailySavings, smokeFreeDays);
        
        // Get package info
        const packageInfo = getPriceRangeById(surveyData.priceRangeId);
        
        // Get addiction and health risk levels
        const addictionLevel = getAddictionLevel(surveyData.cigarettesPerDay, surveyData.packYear);
        const healthRisk = getHealthRiskLevel(surveyData.packYear);

        setEnhancedStats({
            actualSavings,
            cigarettesNotSmoked,
            healthImprovements,
            achievementScore,
            savingsForecast,
            packageInfo,
            addictionLevel,
            healthRisk,
            dailySavings,
            successProbability: surveyData.successProbability
        });
    };

    const navigateToSurvey = () => {
        window.location.href = '/member/smoking-survey';
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <div>Đang tải dữ liệu...</div>
            </div>
        );
    }

    // Show survey prompt if no survey data
    if (showSurveyPrompt && !surveyData) {
        return (
            <AccessGuard requiredMembership="Basic">
                <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
                    <Alert
                        message="Khảo sát mức độ nghiện thuốc lá"
                        description="Để có thể theo dõi tiến trình chính xác và tính toán số tiền tiết kiệm đúng, bạn cần hoàn thành khảo sát mức độ nghiện thuốc lá trước."
                        type="info"
                        showIcon
                        action={
                            <Button type="primary" onClick={navigateToSurvey}>
                                Làm khảo sát ngay
                            </Button>
                        }
                        style={{ marginBottom: '24px' }}
                    />
                    
                    <Card>
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <Title level={3}>🚭 Theo Dõi Tiến Trình Cai Thuốc</Title>
                            <Paragraph>
                                Sau khi hoàn thành khảo sát, bạn sẽ có thể:
                            </Paragraph>
                            <Row gutter={[16, 16]}>
                                <Col xs={24} md={8}>
                                    <Card size="small">
                                        <DollarCircleOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                                        <Title level={5}>Tính toán chính xác số tiền tiết kiệm</Title>
                                        <Text>Dựa trên loại thuốc và thói quen hút của bạn</Text>
                                    </Card>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Card size="small">
                                        <TrophyOutlined style={{ fontSize: '24px', color: '#fa8c16' }} />
                                        <Title level={5}>Xem xác suất thành công</Title>
                                        <Text>Dự báo khoa học dựa trên profile của bạn</Text>
                                    </Card>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Card size="small">
                                        <HeartOutlined style={{ fontSize: '24px', color: '#f5222d' }} />
                                        <Title level={5}>Theo dõi cải thiện sức khỏe</Title>
                                        <Text>Timeline lợi ích sức khỏe cụ thể</Text>
                                    </Card>
                                </Col>
                            </Row>
                        </div>
                    </Card>
                </div>
            </AccessGuard>
        );
    }

    return (
        <AccessGuard requiredMembership="Basic">
            <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <Title level={2}>📊 Theo Dõi Tiến Trình Cải Thiện</Title>
                    <Text type="secondary">
                        Dựa trên dữ liệu khảo sát và thói quen cá nhân của bạn
                    </Text>
                </div>

                {/* Overview Statistics */}
                <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Ngày không hút thuốc"
                                value={progressData?.SmokeFreeDays || 0}
                                valueStyle={{ color: '#52c41a' }}
                                prefix={<CalendarOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Tiền đã tiết kiệm"
                                value={enhancedStats?.actualSavings || 0}
                                formatter={(value) => `${value.toLocaleString()}đ`}
                                valueStyle={{ color: '#fa8c16' }}
                                prefix={<DollarCircleOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Điếu thuốc đã tránh"
                                value={enhancedStats?.cigarettesNotSmoked || 0}
                                valueStyle={{ color: '#1890ff' }}
                                prefix="🚭"
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Xác suất thành công"
                                value={surveyData?.successProbability || 0}
                                suffix="%"
                                valueStyle={{ color: '#722ed1' }}
                                prefix={<TrophyOutlined />}
                            />
                        </Card>
                    </Col>
                </Row>

                <Tabs defaultActiveKey="progress">
                    <TabPane tab="📈 Tiến Trình" key="progress">
                        <Row gutter={[16, 16]}>
                            {/* Progress Overview */}
                            <Col xs={24} lg={12}>
                                <Card title="🎯 Tổng Quan Tiến Trình">
                                    <Space direction="vertical" style={{ width: '100%' }}>
                                        <div>
                                            <Text strong>Tỷ lệ không hút thuốc:</Text>
                                            <Progress 
                                                percent={progressData?.SmokeFreePercentage || 0}
                                                strokeColor="#52c41a"
                                                style={{ marginLeft: '16px' }}
                                            />
                                        </div>
                                        
                                        <div>
                                            <Text strong>Điểm thành tích:</Text>
                                            <div style={{ marginTop: '8px' }}>
                                                <Progress
                                                    type="circle"
                                                    percent={Math.min(100, (enhancedStats?.achievementScore || 0))}
                                                    format={() => `${enhancedStats?.achievementScore || 0}`}
                                                    size={80}
                                                />
                                            </div>
                                        </div>

                                        <Divider />

                                        <div>
                                            <Row gutter={16}>
                                                <Col span={12}>
                                                    <Text strong>Mức độ nghiện ban đầu:</Text>
                                                    <br />
                                                    <Tag color={enhancedStats?.addictionLevel.color}>
                                                        {enhancedStats?.addictionLevel.level}
                                                    </Tag>
                                                </Col>
                                                <Col span={12}>
                                                    <Text strong>Pack-Year:</Text>
                                                    <br />
                                                    <Text style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                                        {surveyData?.packYear}
                                                    </Text>
                                                </Col>
                                            </Row>
                                        </div>
                                    </Space>
                                </Card>
                            </Col>

                            {/* Health Improvements */}
                            <Col xs={24} lg={12}>
                                <Card title="🏥 Cải Thiện Sức Khỏe">
                                    <Timeline size="small">
                                        {enhancedStats?.healthImprovements.map((improvement, index) => (
                                            <Timeline.Item 
                                                key={index}
                                                color={improvement.achieved ? 'green' : 'gray'}
                                                dot={improvement.achieved ? <CheckCircleOutlined /> : undefined}
                                            >
                                                <Text strong style={{ color: improvement.achieved ? '#52c41a' : '#999' }}>
                                                    {improvement.time}
                                                </Text>
                                                <br />
                                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                                    {improvement.benefit}
                                                </Text>
                                            </Timeline.Item>
                                        ))}
                                    </Timeline>
                                </Card>
                            </Col>
                        </Row>
                    </TabPane>

                    <TabPane tab="💰 Tiết Kiệm" key="savings">
                        <Row gutter={[16, 16]}>
                            <Col xs={24} lg={12}>
                                <Card title="💵 Chi Tiết Tiết Kiệm">
                                    <Space direction="vertical" style={{ width: '100%' }}>
                                        <Alert
                                            message={`Dựa trên gói thuốc: ${enhancedStats?.packageInfo?.name}`}
                                            description={`Giá: ${enhancedStats?.packageInfo?.price.toLocaleString()}đ/gói`}
                                            type="info"
                                            showIcon
                                        />
                                        
                                        <Divider />
                                        
                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Statistic
                                                    title="Tiết kiệm/ngày"
                                                    value={enhancedStats?.dailySavings || 0}
                                                    formatter={(value) => `${Math.round(value).toLocaleString()}đ`}
                                                    valueStyle={{ color: '#52c41a' }}
                                                />
                                            </Col>
                                            <Col span={12}>
                                                <Statistic
                                                    title="Đã tiết kiệm"
                                                    value={enhancedStats?.actualSavings || 0}
                                                    formatter={(value) => `${value.toLocaleString()}đ`}
                                                    valueStyle={{ color: '#fa8c16' }}
                                                />
                                            </Col>
                                        </Row>
                                    </Space>
                                </Card>
                            </Col>

                            <Col xs={24} lg={12}>
                                <Card title="📊 Dự Báo Tiết Kiệm">
                                    <Space direction="vertical" style={{ width: '100%' }}>
                                        {enhancedStats?.savingsForecast.slice(0, 5).map((forecast, index) => (
                                            <Row key={index} justify="space-between" align="middle">
                                                <Col>
                                                    <Text>{forecast.period}:</Text>
                                                </Col>
                                                <Col>
                                                    <Text strong style={{ color: '#fa8c16' }}>
                                                        {forecast.formattedSavings}
                                                    </Text>
                                                </Col>
                                            </Row>
                                        ))}
                                    </Space>
                                </Card>
                            </Col>
                        </Row>
                    </TabPane>

                    <TabPane tab="⚕️ Sức Khỏe" key="health">
                        <Row gutter={[16, 16]}>
                            <Col xs={24} lg={8}>
                                <Card title="🎯 Đánh Giá Rủi Ro">
                                    <div style={{ textAlign: 'center' }}>
                                        <Progress
                                            type="circle"
                                            percent={Math.min(100, (surveyData?.packYear / 30) * 100)}
                                            format={() => `${surveyData?.packYear}`}
                                            strokeColor={enhancedStats?.healthRisk.color}
                                        />
                                        <div style={{ marginTop: '16px' }}>
                                            <Tag color={enhancedStats?.healthRisk.color}>
                                                {enhancedStats?.healthRisk.level}
                                            </Tag>
                                            <br />
                                            <Text type="secondary" style={{ marginTop: '8px', display: 'block' }}>
                                                {enhancedStats?.healthRisk.description}
                                            </Text>
                                        </div>
                                    </div>
                                </Card>
                            </Col>

                            <Col xs={24} lg={16}>
                                <Card title="💡 Lời Khuyên Cá Nhân">
                                    <Space direction="vertical" style={{ width: '100%' }}>
                                        {surveyData?.successProbability > 70 && (
                                            <Alert
                                                message="Xác suất thành công cao!"
                                                description="Bạn có cơ hội thành công rất tốt. Hãy duy trì động lực và kiên trì với kế hoạch."
                                                type="success"
                                                showIcon
                                            />
                                        )}
                                        
                                        {surveyData?.successProbability <= 50 && (
                                            <Alert
                                                message="Cần thêm hỗ trợ"
                                                description="Hãy tìm kiếm thêm hỗ trợ từ gia đình, bạn bè hoặc chuyên gia để tăng cơ hội thành công."
                                                type="warning"
                                                showIcon
                                            />
                                        )}

                                        <Alert
                                            message="Tập trung vào số tiền tiết kiệm"
                                            description={`Với ${enhancedStats?.dailySavings?.toLocaleString()}đ/ngày, bạn sẽ tiết kiệm được ${Math.round((enhancedStats?.dailySavings || 0) * 30).toLocaleString()}đ/tháng nếu bỏ thuốc hoàn toàn.`}
                                            type="info"
                                            showIcon
                                        />
                                    </Space>
                                </Card>
                            </Col>
                        </Row>
                    </TabPane>
                </Tabs>

                <div style={{ textAlign: 'center', marginTop: '32px' }}>
                    <Space>
                        <Button type="primary" icon={<ReloadOutlined />} onClick={loadAllData}>
                            Làm mới dữ liệu
                        </Button>
                        <Button icon={<BarChartOutlined />} onClick={navigateToSurvey}>
                            Cập nhật khảo sát
                        </Button>
                    </Space>
                </div>
            </div>
        </AccessGuard>
    );
};

export default EnhancedProgressTracking;