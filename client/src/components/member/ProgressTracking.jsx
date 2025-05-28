import React, { useState, useEffect } from 'react';
import {
    Card,
    Row,
    Col,
    Typography,
    Table,
    Tag,
    Statistic,
    Progress,
    Button,
    Space,
    Badge,
    Empty,
    Tabs,
    List,
    Timeline,
    Modal,
    Form,
    Input,
    Slider,
    DatePicker,
    message,
    Alert,
    Divider
} from 'antd';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title as ChartTitle,
    Tooltip as ChartTooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import {
    TrophyOutlined,
    BarChartOutlined,
    CalendarOutlined,
    DollarOutlined,
    FireOutlined,
    CheckCircleOutlined,
    PlusOutlined,
    EditOutlined,
    HeartOutlined,
    SmileOutlined,
    ThunderboltOutlined,
    BookOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ChartTitle,
    ChartTooltip,
    Legend,
    Filler
);

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const ProgressTracking = () => {
    const [loading, setLoading] = useState(true);
    const [progressData, setProgressData] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [quitPlan, setQuitPlan] = useState(null);
    const [smokingStatus, setSmokingStatus] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [addForm] = Form.useForm();

    useEffect(() => {
        loadProgressData();
        loadAchievements();
        loadQuitPlan();
        loadSmokingStatus();
    }, []);

    const loadProgressData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('memberToken') || localStorage.getItem('token');

            const response = await axios.get('http://localhost:4000/api/users/progress', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                setProgressData(response.data.data || []);
            }
        } catch (error) {
            console.error('Error loading progress data:', error);
            message.warning('Không thể kết nối server. Hiển thị dữ liệu demo...');

            // Use mock data when server is not available
            const mockData = [
                {
                    Date: new Date().toISOString(),
                    CigarettesSmoked: 0,
                    CravingLevel: 3,
                    EmotionNotes: 'Hôm nay cảm thấy khá tốt, không thèm thuốc nhiều',
                    MoneySaved: 100000,
                    DaysSmokeFree: 1,
                    CreatedAt: new Date().toISOString()
                },
                {
                    Date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
                    CigarettesSmoked: 2,
                    CravingLevel: 6,
                    EmotionNotes: 'Hôm qua còn khó khăn, hút 2 điếu',
                    MoneySaved: 80000,
                    DaysSmokeFree: 0,
                    CreatedAt: new Date(Date.now() - 86400000).toISOString()
                }
            ];
            setProgressData(mockData);
        } finally {
            setLoading(false);
        }
    };

    const loadAchievements = async () => {
        try {
            const token = localStorage.getItem('memberToken') || localStorage.getItem('token');

            const response = await axios.get('http://localhost:4000/api/achievements/earned', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                setAchievements(response.data.data || []);
            }
        } catch (error) {
            console.error('Error loading achievements:', error);
            // Use mock achievements as fallback
            const mockAchievements = [
                {
                    AchievementID: 1,
                    Name: 'Ngày đầu tiên',
                    Description: 'Chúc mừng bạn đã hoàn thành ngày đầu tiên không hút thuốc!',
                    IconURL: '🏆',
                    EarnedAt: new Date().toISOString()
                },
                {
                    AchievementID: 2,
                    Name: 'Tiết kiệm 100K',
                    Description: 'Bạn đã tiết kiệm được 100,000 VNĐ nhờ việc không hút thuốc!',
                    IconURL: '💰',
                    EarnedAt: new Date(Date.now() - 86400000).toISOString()
                }
            ];
            setAchievements(mockAchievements);
        }
    };

    const loadQuitPlan = async () => {
        try {
            const token = localStorage.getItem('memberToken') || localStorage.getItem('token');

            const response = await axios.get('http://localhost:4000/api/plans/current', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success && response.data.data) {
                setQuitPlan(response.data.data);
            }
        } catch (error) {
            console.error('Error loading quit plan:', error);
            // Set null as fallback
            setQuitPlan(null);
        }
    };

    const loadSmokingStatus = async () => {
        try {
            const token = localStorage.getItem('memberToken') || localStorage.getItem('token');

            // Try multiple endpoints to get smoking status
            let response;
            try {
                response = await axios.get('http://localhost:4000/api/users/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.data.success) {
                    setSmokingStatus(response.data.data.smokingStatus);
                    return;
                }
            } catch (profileError) {
                console.log('Profile endpoint failed, trying smoking-status endpoint...');
            }

            // Fallback to smoking-status endpoint
            try {
                response = await axios.get('http://localhost:4000/api/users/smoking-status', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.data.success) {
                    setSmokingStatus(response.data.data);
                }
            } catch (smokingError) {
                console.log('Smoking status endpoint failed');
                setSmokingStatus(null);
            }
        } catch (error) {
            console.error('Error loading smoking status:', error);
            setSmokingStatus(null);
        }
    };

    const handleAddProgress = async (values) => {
        try {
            const token = localStorage.getItem('memberToken') || localStorage.getItem('token');

            const progressEntry = {
                date: values.date.format('YYYY-MM-DD'),
                cigarettesSmoked: values.cigarettesSmoked || 0,
                cravingLevel: values.cravingLevel || 1,
                emotionNotes: values.emotionNotes || '',
                healthNotes: values.healthNotes || '',
                moneySaved: calculateMoneySaved(values.cigarettesSmoked || 0),
                daysSmokeFree: calculateDaysSmokeFree(values.cigarettesSmoked || 0)
            };

            const response = await axios.post('http://localhost:4000/api/users/progress', progressEntry, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                message.success('Đã thêm dữ liệu tiến trình thành công!');
                setIsAddModalVisible(false);
                addForm.resetFields();
                loadProgressData();
                loadAchievements(); // Reload achievements as new progress might trigger new ones
            } else {
                message.error(response.data.message || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Error adding progress:', error);
            message.warning('Không thể kết nối server. Dữ liệu sẽ được lưu tạm thời...');

            // Add to local state when server is not available
            const newEntry = {
                Date: values.date.format('YYYY-MM-DD'),
                CigarettesSmoked: values.cigarettesSmoked || 0,
                CravingLevel: values.cravingLevel || 1,
                EmotionNotes: values.emotionNotes || '',
                HealthNotes: values.healthNotes || '',
                MoneySaved: calculateMoneySaved(values.cigarettesSmoked || 0),
                DaysSmokeFree: calculateDaysSmokeFree(values.cigarettesSmoked || 0),
                CreatedAt: new Date().toISOString()
            };

            setProgressData(prev => [newEntry, ...prev]);
            setIsAddModalVisible(false);
            addForm.resetFields();
        }
    };

    const calculateMoneySaved = (cigarettesSmoked) => {
        // Use default values if smoking status is not available
        const cigarettePrice = smokingStatus?.CigarettePrice || smokingStatus?.cigarettePrice || 5000; // Default 5000 VND per cigarette
        const cigarettesPerDay = smokingStatus?.CigarettesPerDay || smokingStatus?.cigarettesPerDay || 20; // Default 20 cigarettes per day

        const dailyBudget = cigarettesPerDay * cigarettePrice;
        const actualSpent = cigarettesSmoked * cigarettePrice;
        return Math.max(0, dailyBudget - actualSpent);
    };

    const calculateDaysSmokeFree = (cigarettesSmoked) => {
        if (cigarettesSmoked === 0) {
            // Count consecutive smoke-free days
            let consecutiveDays = 1;
            for (let i = 0; i < progressData.length; i++) {
                if (progressData[i].CigarettesSmoked === 0) {
                    consecutiveDays++;
                } else {
                    break;
                }
            }
            return consecutiveDays;
        }
        return 0;
    };

    const getProgressStats = () => {
        if (!progressData.length) {
            return {
                totalDays: 0,
                smokFreeDays: 0,
                totalMoneySaved: 0,
                averageCraving: 0,
                currentStreak: 0
            };
        }

        const totalDays = progressData.length;
        const smokFreeDays = progressData.filter(p => p.CigarettesSmoked === 0).length;
        const totalMoneySaved = progressData.reduce((sum, p) => sum + (p.MoneySaved || 0), 0);
        const averageCraving = progressData.reduce((sum, p) => sum + (p.CravingLevel || 0), 0) / totalDays;

        // Calculate current streak
        let currentStreak = 0;
        for (const progress of progressData) {
            if (progress.CigarettesSmoked === 0) {
                currentStreak++;
            } else {
                break;
            }
        }

        return {
            totalDays,
            smokFreeDays,
            totalMoneySaved,
            averageCraving: Math.round(averageCraving * 10) / 10,
            currentStreak
        };
    };

    const createChartData = (dataKey, label, color) => {
        const labels = progressData.slice(0, 30).reverse().map(item =>
            dayjs(item.Date).format('DD/MM')
        );
        const values = progressData.slice(0, 30).reverse().map(item => item[dataKey] || 0);

        return {
            labels,
            datasets: [
                {
                    label,
                    data: values,
                    borderColor: color,
                    backgroundColor: color + '20',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                }
            ]
        };
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                mode: 'index',
                intersect: false,
            },
        },
        scales: {
            x: {
                display: true,
                title: {
                    display: true,
                    text: 'Ngày'
                }
            },
            y: {
                display: true,
                title: {
                    display: true,
                    text: 'Giá trị'
                },
                beginAtZero: true
            }
        },
        interaction: {
            intersect: false,
            mode: 'index',
        },
    };

    const progressColumns = [
        {
            title: 'Ngày',
            dataIndex: 'Date',
            key: 'Date',
            render: (date) => dayjs(date).format('DD/MM/YYYY'),
        },
        {
            title: 'Thuốc hút',
            dataIndex: 'CigarettesSmoked',
            key: 'CigarettesSmoked',
            render: (count) => (
                <Tag color={count === 0 ? 'green' : count <= 2 ? 'orange' : 'red'}>
                    {count || 0} điếu
                </Tag>
            ),
        },
        {
            title: 'Mức thèm',
            dataIndex: 'CravingLevel',
            key: 'CravingLevel',
            render: (level) => (
                <div>
                    <Progress
                        percent={(level || 0) * 10}
                        size="small"
                        status={level <= 3 ? 'success' : level <= 6 ? 'normal' : 'exception'}
                        format={() => `${level || 0}/10`}
                    />
                </div>
            ),
        },
        {
            title: 'Tiền tiết kiệm',
            dataIndex: 'MoneySaved',
            key: 'MoneySaved',
            render: (amount) => `${(amount || 0).toLocaleString('vi-VN')} ₫`,
        },
        {
            title: 'Ghi chú',
            dataIndex: 'EmotionNotes',
            key: 'EmotionNotes',
            render: (notes) => notes || '-',
        },
    ];

    const stats = getProgressStats();

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <Text>Đang tải dữ liệu...</Text>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
            <Row gutter={[24, 24]}>
                {/* Demo Notice */}
                {progressData.length > 0 && progressData[0].Date === new Date().toISOString().split('T')[0] && (
                    <Col span={24}>
                        <Alert
                            message="Chế độ Demo"
                            description="Server chưa khởi động. Dữ liệu hiển thị là dữ liệu mẫu để demo chức năng."
                            type="info"
                            showIcon
                            closable
                            style={{ marginBottom: '16px' }}
                        />
                    </Col>
                )}

                {/* Header */}
                <Col span={24}>
                    <Card style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                                    <BarChartOutlined /> Tiến trình cai thuốc của tôi
                                </Title>
                                <Text type="secondary">Theo dõi và quản lý hành trình cai thuốc</Text>
                            </div>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => setIsAddModalVisible(true)}
                                size="large"
                            >
                                Thêm dữ liệu hôm nay
                            </Button>
                        </div>
                    </Card>
                </Col>

                {/* Statistics Cards */}
                <Col xs={24} sm={12} lg={6}>
                    <Card style={{ textAlign: 'center', borderRadius: '8px' }}>
                        <Statistic
                            title="Tổng số ngày theo dõi"
                            value={stats.totalDays}
                            prefix={<CalendarOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card style={{ textAlign: 'center', borderRadius: '8px' }}>
                        <Statistic
                            title="Ngày không hút thuốc"
                            value={stats.smokFreeDays}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card style={{ textAlign: 'center', borderRadius: '8px' }}>
                        <Statistic
                            title="Tiền tiết kiệm"
                            value={stats.totalMoneySaved}
                            prefix={<DollarOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                            formatter={(value) => `${value.toLocaleString('vi-VN')} ₫`}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card style={{ textAlign: 'center', borderRadius: '8px' }}>
                        <Statistic
                            title="Chuỗi không hút hiện tại"
                            value={stats.currentStreak}
                            suffix="ngày"
                            prefix={<TrophyOutlined />}
                            valueStyle={{ color: '#722ed1' }}
                        />
                    </Card>
                </Col>

                {/* Main Content */}
                <Col span={24}>
                    <Card style={{ borderRadius: '8px' }}>
                        <Tabs activeKey={activeTab} onChange={setActiveTab}>
                            {/* Overview Tab */}
                            <Tabs.TabPane tab="Tổng quan" key="overview">
                                <Row gutter={[16, 16]}>
                                    {/* Current Status */}
                                    <Col xs={24} md={12}>
                                        <Card
                                            title={
                                                <span>
                                                    <HeartOutlined style={{ color: '#f50' }} />
                                                    <span style={{ marginLeft: 8 }}>Tình trạng hiện tại</span>
                                                </span>
                                            }
                                            style={{ height: '100%' }}
                                        >
                                            <Row gutter={[16, 16]}>
                                                <Col span={12}>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                                                            {stats.currentStreak}
                                                        </div>
                                                        <div style={{ color: '#666' }}>Ngày không hút</div>
                                                    </div>
                                                </Col>
                                                <Col span={12}>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                                                            {stats.averageCraving}/10
                                                        </div>
                                                        <div style={{ color: '#666' }}>Mức thèm TB</div>
                                                    </div>
                                                </Col>
                                            </Row>

                                            {quitPlan && (
                                                <>
                                                    <Divider />
                                                    <div>
                                                        <Text strong>Kế hoạch cai thuốc:</Text>
                                                        <div style={{ marginTop: 8 }}>
                                                            <div>📅 Bắt đầu: {dayjs(quitPlan.StartDate).format('DD/MM/YYYY')}</div>
                                                            <div>🎯 Mục tiêu: {dayjs(quitPlan.TargetDate).format('DD/MM/YYYY')}</div>
                                                            <div>💪 Động lực: {quitPlan.MotivationLevel}/10</div>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </Card>
                                    </Col>

                                    {/* Achievements */}
                                    <Col xs={24} md={12}>
                                        <Card
                                            title={
                                                <span>
                                                    <TrophyOutlined style={{ color: '#faad14' }} />
                                                    <span style={{ marginLeft: 8 }}>Thành tích gần đây</span>
                                                </span>
                                            }
                                            style={{ height: '100%' }}
                                        >
                                            {achievements.length > 0 ? (
                                                <List
                                                    dataSource={achievements.slice(0, 3)}
                                                    renderItem={achievement => (
                                                        <List.Item>
                                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                                <Badge
                                                                    count={<TrophyOutlined style={{ color: '#faad14' }} />}
                                                                    style={{ marginRight: 12 }}
                                                                />
                                                                <div>
                                                                    <div style={{ fontWeight: 'bold' }}>{achievement.Name}</div>
                                                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                                                        {dayjs(achievement.EarnedAt).format('DD/MM/YYYY')}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </List.Item>
                                                    )}
                                                />
                                            ) : (
                                                <Empty
                                                    description="Chưa có thành tích nào"
                                                    style={{ padding: '20px' }}
                                                />
                                            )}
                                        </Card>
                                    </Col>
                                </Row>
                            </Tabs.TabPane>

                            {/* Charts Tab */}
                            <Tabs.TabPane tab="Biểu đồ" key="charts">
                                {progressData.length > 0 ? (
                                    <Row gutter={[16, 16]}>
                                        <Col span={24}>
                                            <Card title="Số lượng thuốc hút theo ngày (30 ngày gần nhất)" style={{ marginBottom: 16 }}>
                                                <div style={{ height: '300px' }}>
                                                    <Line
                                                        data={createChartData('CigarettesSmoked', 'Số điếu thuốc', '#ff4d4f')}
                                                        options={chartOptions}
                                                    />
                                                </div>
                                            </Card>
                                        </Col>
                                        <Col span={24}>
                                            <Card title="Mức độ thèm thuốc theo ngày">
                                                <div style={{ height: '300px' }}>
                                                    <Line
                                                        data={createChartData('CravingLevel', 'Mức độ thèm (1-10)', '#faad14')}
                                                        options={{
                                                            ...chartOptions,
                                                            scales: {
                                                                ...chartOptions.scales,
                                                                y: {
                                                                    ...chartOptions.scales.y,
                                                                    max: 10
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </Card>
                                        </Col>
                                    </Row>
                                ) : (
                                    <Empty
                                        description="Chưa có dữ liệu để hiển thị biểu đồ"
                                        style={{ padding: '40px' }}
                                    />
                                )}
                            </Tabs.TabPane>

                            {/* Progress Log Tab */}
                            <Tabs.TabPane tab="Nhật ký tiến trình" key="progress">
                                <Card title="Dữ liệu theo dõi hàng ngày">
                                    {progressData.length > 0 ? (
                                        <Table
                                            columns={progressColumns}
                                            dataSource={progressData}
                                            rowKey={(record, index) => `progress-${index}`}
                                            pagination={{
                                                pageSize: 10,
                                                showSizeChanger: true,
                                                showQuickJumper: true,
                                                showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} bản ghi`,
                                            }}
                                            scroll={{ x: 800 }}
                                        />
                                    ) : (
                                        <Empty
                                            description="Chưa có dữ liệu theo dõi"
                                            style={{ padding: '40px' }}
                                        />
                                    )}
                                </Card>
                            </Tabs.TabPane>

                            {/* Achievements Tab */}
                            <Tabs.TabPane tab="Thành tích" key="achievements">
                                <Card title="Danh sách thành tích đã đạt được">
                                    {achievements.length > 0 ? (
                                        <List
                                            grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
                                            dataSource={achievements}
                                            renderItem={achievement => (
                                                <List.Item>
                                                    <Card
                                                        hoverable
                                                        style={{ textAlign: 'center' }}
                                                    >
                                                        <div style={{ fontSize: '32px', marginBottom: 8 }}>
                                                            🏆
                                                        </div>
                                                        <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                                                            {achievement.Name}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#666', marginBottom: 8 }}>
                                                            {achievement.Description}
                                                        </div>
                                                        <Tag color="gold">
                                                            {dayjs(achievement.EarnedAt).format('DD/MM/YYYY')}
                                                        </Tag>
                                                    </Card>
                                                </List.Item>
                                            )}
                                        />
                                    ) : (
                                        <Empty
                                            description="Chưa có thành tích nào"
                                            style={{ padding: '40px' }}
                                        />
                                    )}
                                </Card>
                            </Tabs.TabPane>
                        </Tabs>
                    </Card>
                </Col>
            </Row>

            {/* Add Progress Modal */}
            <Modal
                title="Thêm dữ liệu tiến trình hôm nay"
                open={isAddModalVisible}
                onCancel={() => setIsAddModalVisible(false)}
                footer={null}
                width={600}
            >
                <Form
                    form={addForm}
                    layout="vertical"
                    onFinish={handleAddProgress}
                    initialValues={{
                        date: dayjs(),
                        cigarettesSmoked: 0,
                        cravingLevel: 1
                    }}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="date"
                                label="Ngày"
                                rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
                            >
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="cigarettesSmoked"
                                label="Số điếu thuốc đã hút"
                            >
                                <Slider
                                    min={0}
                                    max={50}
                                    marks={{
                                        0: '0',
                                        10: '10',
                                        20: '20',
                                        50: '50+'
                                    }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="cravingLevel"
                        label="Mức độ thèm thuốc (1-10)"
                    >
                        <Slider
                            min={1}
                            max={10}
                            marks={{
                                1: '1',
                                3: '3',
                                5: '5',
                                7: '7',
                                10: '10'
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="emotionNotes"
                        label="Cảm xúc hôm nay"
                    >
                        <TextArea
                            placeholder="Ví dụ: Hôm nay tôi cảm thấy khó khăn vì stress công việc..."
                            rows={3}
                        />
                    </Form.Item>

                    <Form.Item
                        name="healthNotes"
                        label="Ghi chú sức khỏe"
                    >
                        <TextArea
                            placeholder="Ví dụ: Hơi thở tươi hơn, ngủ ngon hơn..."
                            rows={2}
                        />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => setIsAddModalVisible(false)}>
                                Hủy
                            </Button>
                            <Button type="primary" htmlType="submit">
                                Lưu tiến trình
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ProgressTracking; 