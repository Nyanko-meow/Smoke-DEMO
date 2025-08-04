import React, { useState, useEffect } from 'react';
import {
    Card,
    Typography,
    Spin,
    Alert,
    Row,
    Col,
    Statistic,
    Progress,
    Tag,
    Divider,
    Empty,
    Button,
    Space,
    Timeline,
    Table
} from 'antd';
import {
    TrophyOutlined,
    DollarCircleOutlined,
    CalendarOutlined,
    HeartOutlined,
    SmileOutlined,
    MehOutlined,
    FrownOutlined,
    ExclamationCircleOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import AccessGuard from '../common/AccessGuard';

const { Title, Text, Paragraph } = Typography;

const SmokingAddictionResults = () => {
    const [surveyData, setSurveyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSurveyResults();
    }, []);

    const fetchSurveyResults = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Bạn cần đăng nhập để xem kết quả khảo sát');
                return;
            }

            const response = await axios.get('/api/smoking-addiction-survey/my-results', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Extract data và convert field names để match component expectations
            const data = response.data.success ? response.data.data : response.data;
            
            // Convert field names from PascalCase to camelCase for component compatibility
            const normalizedData = {
                ...data,
                packYear: data.PackYear || data.packYear || 0,
                monthlySavings: data.MonthlySavings || data.monthlySavings || 0,
                successProbability: data.SuccessProbability || data.successProbability || 50,
                addictionLevel: data.AddictionLevel || data.addictionLevel || 'Chưa xác định',
                dailySavings: data.DailySavings || data.dailySavings || 0,
                submittedAt: data.SubmittedAt || data.submittedAt || new Date().toISOString()
            };
            
            setSurveyData(normalizedData);

            setSurveyData(response.data);
        } catch (error) {
            console.error('Error fetching survey results:', error);
            if (error.response?.status === 404) {
                setError('Bạn chưa thực hiện khảo sát mức độ nghiện thuốc lá');
            } else if (error.response?.status === 401) {
                setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            } else {
                setError('Không thể tải kết quả khảo sát. Vui lòng thử lại sau.');
            }
        } finally {
            setLoading(false);
        }
    };

    const getAddictionLevelColor = (level) => {
        switch (level) {
            case 'Nhẹ': return 'green';
            case 'Trung bình': return 'orange';
            case 'Nặng': return 'red';
            case 'Rất nặng': return 'darkred';
            default: return 'default';
        }
    };

    const getMotivationIcon = (motivation) => {
        switch (motivation) {
            case 'very_high': return <SmileOutlined style={{ color: '#52c41a' }} />;
            case 'high': return <SmileOutlined style={{ color: '#1890ff' }} />;
            case 'medium': return <MehOutlined style={{ color: '#fa8c16' }} />;
            case 'low': return <FrownOutlined style={{ color: '#faad14' }} />;
            case 'very_low': return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
            default: return <MehOutlined />;
        }
    };

    const getMotivationText = (motivation) => {
        const motivationMap = {
            'very_high': 'Rất cao',
            'high': 'Cao',
            'medium': 'Trung bình',
            'low': 'Thấp',
            'very_low': 'Rất thấp'
        };
        return motivationMap[motivation] || 'Chưa xác định';
    };

    const getHealthRiskLevel = (packYear) => {
        if (packYear < 5) return { level: 'Thấp', color: 'green' };
        if (packYear < 10) return { level: 'Trung bình', color: 'orange' };
        if (packYear < 20) return { level: 'Cao', color: 'red' };
        return { level: 'Rất cao', color: 'darkred' };
    };

    // Tính timeline dự kiến nếu bỏ thuốc thành công
    const getQuitTimeline = () => {
        return [
            {
                title: '20 phút đầu',
                description: 'Nhịp tim và huyết áp giảm xuống bình thường',
                color: 'green'
            },
            {
                title: '12 giờ',
                description: 'Lượng carbon monoxide trong máu giảm xuống mức bình thường',
                color: 'green'
            },
            {
                title: '2-12 tuần',
                description: 'Lưu thông máu cải thiện và chức năng phổi tăng lên',
                color: 'blue'
            },
            {
                title: '1-9 tháng',
                description: 'Ho và khó thở giảm đáng kể',
                color: 'blue'
            },
            {
                title: '1 năm',
                description: 'Nguy cơ bệnh tim giảm còn một nửa so với người hút thuốc',
                color: 'orange'
            },
            {
                title: '5 năm',
                description: 'Nguy cơ đột quỵ giảm xuống mức của người không hút thuốc',
                color: 'orange'
            },
            {
                title: '10 năm',
                description: 'Nguy cơ ung thư phổi giảm còn một nửa so với người hút thuốc',
                color: 'red'
            },
            {
                title: '15 năm',
                description: 'Nguy cơ bệnh tim bằng với người không bao giờ hút thuốc',
                color: 'purple'
            }
        ];
    };

    const getSavingsProjection = (surveyData) => {
        if (!surveyData) return [];

        const data = [];
        const periods = [
            { label: '1 tuần', multiplier: 7, key: 'week' },
            { label: '1 tháng', multiplier: 30, key: 'month' },
            { label: '3 tháng', multiplier: 90, key: 'quarter' },
            { label: '6 tháng', multiplier: 180, key: 'halfYear' },
            { label: '1 năm', multiplier: 365, key: 'year' },
            { label: '5 năm', multiplier: 365 * 5, key: 'fiveYears' }
        ];

        periods.forEach(period => {
            const savings = surveyData.dailySavings * period.multiplier;
            data.push({
                period: period.label,
                savings: savings,
                formattedSavings: savings.toLocaleString() + 'đ'
            });
        });

        return data;
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
                <Alert
                    message="Lỗi"
                    description={error}
                    type="error"
                    showIcon
                    action={
                        <Button size="small" icon={<ReloadOutlined />} onClick={fetchSurveyResults}>
                            Thử lại
                        </Button>
                    }
                />
            </div>
        );
    }

    if (!surveyData) {
        return (
            <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
                <Empty
                    description="Bạn chưa thực hiện khảo sát mức độ nghiện thuốc lá"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            </div>
        );
    }

    const healthRisk = getHealthRiskLevel(surveyData.packYear);
    const savingsProjection = getSavingsProjection(surveyData);
    const quitTimeline = getQuitTimeline();

    const savingsColumns = [
        {
            title: 'Thời gian',
            dataIndex: 'period',
            key: 'period',
        },
        {
            title: 'Số tiền tiết kiệm',
            dataIndex: 'formattedSavings',
            key: 'savings',
            align: 'right'
        }
    ];

    return (
        <AccessGuard requiredMembership="Basic">
            <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <Title level={2}>📊 Kết Quả Khảo Sát Mức Độ Nghiện Thuốc Lá</Title>
                    <Text type="secondary">
                        Cập nhật lần cuối: {moment(surveyData.submittedAt).format('DD/MM/YYYY HH:mm')}
                    </Text>
                </div>

                {/* Thống kê tổng quan */}
                <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Pack-Year"
                                value={surveyData.packYear}
                                precision={2}
                                valueStyle={{ color: '#1890ff' }}
                                prefix="📏"
                            />
                            <Text type="secondary">Chỉ số y học</Text>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Mức độ nghiện"
                                value={surveyData.addictionLevel}
                                valueStyle={{ color: getAddictionLevelColor(surveyData.addictionLevel) }}
                                prefix="🎯"
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Xác suất thành công"
                                value={surveyData.successProbability}
                                suffix="%"
                                valueStyle={{ color: '#52c41a' }}
                                prefix="📈"
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Tiết kiệm/tháng"
                                value={surveyData.monthlySavings}
                                formatter={(value) => `${value?.toLocaleString()}đ`}
                                valueStyle={{ color: '#fa8c16' }}
                                prefix="💰"
                            />
                        </Card>
                    </Col>
                </Row>

                <Row gutter={[16, 16]}>
                    {/* Thông tin chi tiết */}
                    <Col xs={24} lg={8}>
                        <Card title="📋 Thông Tin Cá Nhân" style={{ height: '100%' }}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <div>
                                    <Text strong>Tuổi:</Text> {surveyData.age} tuổi
                                </div>
                                <div>
                                    <Text strong>Số điếu/ngày:</Text> {surveyData.cigarettesPerDay} điếu
                                </div>
                                <div>
                                    <Text strong>Số năm hút thuốc:</Text> {surveyData.yearsSmoked} năm
                                </div>
                                <div>
                                    <Text strong>Loại thuốc:</Text> {surveyData.packageName}
                                </div>
                                <div>
                                    <Text strong>Mức độ quyết tâm:</Text>{' '}
                                    <Space>
                                        {getMotivationIcon(surveyData.motivation)}
                                        {getMotivationText(surveyData.motivation)}
                                    </Space>
                                </div>
                            </Space>
                        </Card>
                    </Col>

                    {/* Đánh giá rủi ro sức khỏe */}
                    <Col xs={24} lg={8}>
                        <Card title="⚕️ Đánh Giá Rủi Ro Sức Khỏe" style={{ height: '100%' }}>
                            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                                <Progress
                                    type="circle"
                                    percent={Math.min((surveyData.packYear / 30) * 100, 100)}
                                    format={() => `${surveyData.packYear}`}
                                    strokeColor={healthRisk.color}
                                />
                                <div style={{ marginTop: '8px' }}>
                                    <Tag color={healthRisk.color}>{healthRisk.level}</Tag>
                                </div>
                            </div>
                            <Alert
                                message="Giải thích Pack-Year"
                                description={`Với ${surveyData.packYear} pack-year, mức rủi ro sức khỏe của bạn được đánh giá ở mức ${healthRisk.level.toLowerCase()}. Pack-year là chỉ số quan trọng để đánh giá nguy cơ ung thư phổi và các bệnh liên quan đến hút thuốc.`}
                                type="warning"
                                showIcon
                                style={{ fontSize: '12px' }}
                            />
                        </Card>
                    </Col>

                    {/* Xác suất thành công */}
                    <Col xs={24} lg={8}>
                        <Card title="🎯 Dự Báo Thành Công" style={{ height: '100%' }}>
                            <div style={{ textAlign: 'center' }}>
                                <Progress
                                    type="circle"
                                    percent={surveyData.successProbability}
                                    strokeColor={{
                                        '0%': '#ff4d4f',
                                        '50%': '#faad14',
                                        '100%': '#52c41a'
                                    }}
                                />
                            </div>
                            <Divider />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                Xác suất này được tính dựa trên tuổi, mức độ nghiện, thời gian hút thuốc và mức độ quyết tâm của bạn.
                            </Text>
                        </Card>
                    </Col>

                    {/* Bảng tiết kiệm tiền */}
                    <Col xs={24} lg={12}>
                        <Card title="💵 Dự Báo Tiết Kiệm Tiền">
                            <Table
                                columns={savingsColumns}
                                dataSource={savingsProjection}
                                pagination={false}
                                size="small"
                                rowKey="period"
                            />
                        </Card>
                    </Col>

                    {/* Timeline lợi ích sức khỏe */}
                    <Col xs={24} lg={12}>
                        <Card title="🏥 Lợi Ích Sức Khỏe Khi Bỏ Thuốc">
                            <Timeline size="small">
                                {quitTimeline.map((item, index) => (
                                    <Timeline.Item key={index} color={item.color}>
                                        <Text strong>{item.title}</Text>
                                        <br />
                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                            {item.description}
                                        </Text>
                                    </Timeline.Item>
                                ))}
                            </Timeline>
                        </Card>
                    </Col>
                </Row>

                {/* Lời khuyên */}
                <Card style={{ marginTop: '24px' }}>
                    <Title level={4}>💡 Lời Khuyên Dành Cho Bạn</Title>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} md={8}>
                            <Alert
                                message="Chiến thuật tâm lý"
                                description="Hãy tập trung vào số tiền tiết kiệm được và lợi ích sức khỏe thay vì nghĩ đến việc 'từ bỏ' thuốc lá."
                                type="info"
                                showIcon
                            />
                        </Col>
                        <Col xs={24} md={8}>
                            <Alert
                                message="Thay thế thói quen"
                                description="Tìm hoạt động thay thế cho những lúc thường hút thuốc: uống nước, nhai kẹo cao su, tập thể dục nhẹ."
                                type="success"
                                showIcon
                            />
                        </Col>
                        <Col xs={24} md={8}>
                            <Alert
                                message="Hỗ trợ xã hội"
                                description="Chia sẻ kế hoạch bỏ thuốc với gia đình, bạn bè và tìm kiếm sự hỗ trợ từ cộng đồng."
                                type="warning"
                                showIcon
                            />
                        </Col>
                    </Row>
                </Card>

                <div style={{ textAlign: 'center', marginTop: '32px' }}>
                    <Button type="primary" icon={<ReloadOutlined />} onClick={fetchSurveyResults}>
                        Làm mới dữ liệu
                    </Button>
                </div>
            </div>
        </AccessGuard>
    );
};

export default SmokingAddictionResults;