import React, { useState, useEffect, useRef } from 'react';
import {
    Card,
    Row,
    Col,
    Typography,
    Table,
    Tag,
    Statistic,
    Progress,
    Select,
    DatePicker,
    Spin,
    Alert,
    Timeline,
    Avatar,
    Button,
    Space,
    Tooltip,
    Badge,
    Empty,
    Tabs,
    List
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
    UserOutlined,
    TrophyOutlined,
    BarChartOutlined,
    CalendarOutlined,
    DollarOutlined,
    SmileOutlined,
    FireOutlined,
    CheckCircleOutlined,
    WarningOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
    MinusOutlined,
    HeartOutlined,
    PhoneOutlined,
    MailOutlined
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
const { Option } = Select;
const { TabPane } = Tabs;

const MemberProgressTracking = ({ memberId, onBack }) => {
    const [loading, setLoading] = useState(true);
    const [memberData, setMemberData] = useState(null);
    const [selectedDays, setSelectedDays] = useState(30);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (memberId) {
            loadMemberProgress();
        }
    }, [memberId, selectedDays]);

    const loadMemberProgress = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('coachToken');

            const response = await axios.get(
                `http://localhost:4000/api/coach/members/${memberId}/progress?days=${selectedDays}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                setMemberData(response.data.data);
            } else {
                console.error('Error loading member progress:', response.data.message);
            }
        } catch (error) {
            console.error('Error loading member progress:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'excellent': return 'green';
            case 'good': return 'blue';
            case 'stable': return 'orange';
            case 'needs_attention': return 'red';
            default: return 'default';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'excellent': return 'Xuất sắc';
            case 'good': return 'Tốt';
            case 'stable': return 'Ổn định';
            case 'needs_attention': return 'Cần chú ý';
            case 'no_data': return 'Chưa có dữ liệu';
            default: return 'Không xác định';
        }
    };

    const getTrendIcon = (trend) => {
        switch (trend) {
            case 'improving': return <ArrowDownOutlined style={{ color: 'green' }} />;
            case 'declining': return <ArrowUpOutlined style={{ color: 'red' }} />;
            case 'stable': return <MinusOutlined style={{ color: 'orange' }} />;
            default: return <MinusOutlined style={{ color: 'gray' }} />;
        }
    };

    const getTrendText = (trend) => {
        switch (trend) {
            case 'improving': return 'Cải thiện';
            case 'declining': return 'Giảm sút';
            case 'stable': return 'Ổn định';
            default: return 'Chưa có dữ liệu';
        }
    };

    const createChartData = (data, dataKey, label, color) => {
        const labels = data.map(item => dayjs(item.date).format('DD/MM'));
        const values = data.map(item => item[dataKey] || 0);

        return {
            labels,
            datasets: [
                {
                    label,
                    data: values,
                    borderColor: color,
                    backgroundColor: color + '20',
                    fill: dataKey === 'craving' || dataKey === 'moneySaved',
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
            dataIndex: 'date',
            key: 'date',
            render: (date) => dayjs(date).format('DD/MM/YYYY'),
        },
        {
            title: 'Thuốc hút',
            dataIndex: 'cigarettesSmoked',
            key: 'cigarettesSmoked',
            render: (count) => (
                <Tag color={count === 0 ? 'green' : count <= 2 ? 'orange' : 'red'}>
                    {count} điếu
                </Tag>
            ),
        },
        {
            title: 'Mức thèm',
            dataIndex: 'cravingLevel',
            key: 'cravingLevel',
            render: (level) => (
                <div>
                    <Progress
                        percent={level * 10}
                        size="small"
                        status={level <= 3 ? 'success' : level <= 6 ? 'normal' : 'exception'}
                        format={() => `${level}/10`}
                    />
                </div>
            ),
        },
        {
            title: 'Tiền tiết kiệm',
            dataIndex: 'moneySaved',
            key: 'moneySaved',
            render: (amount) => `${amount.toLocaleString('vi-VN')} ₫`,
        },
        {
            title: 'Ngày không hút',
            dataIndex: 'daysSmokeFree',
            key: 'daysSmokeFree',
            render: (days) => (
                <Badge count={days} style={{ backgroundColor: '#52c41a' }} />
            ),
        },
    ];

    const achievementColumns = [
        {
            title: 'Thành tích',
            dataIndex: 'name',
            key: 'name',
            render: (name, record) => (
                <div className="flex items-center">
                    <img
                        src={record.iconURL}
                        alt={name}
                        className="w-8 h-8 mr-3"
                        onError={(e) => {
                            e.target.src = 'https://img.icons8.com/emoji/48/000000/trophy-emoji.png';
                        }}
                    />
                    <div>
                        <div className="font-medium">{name}</div>
                        <div className="text-gray-500 text-sm">{record.description}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isEarned',
            key: 'isEarned',
            render: (isEarned, record) => (
                <div>
                    {isEarned ? (
                        <Tag color="green" icon={<CheckCircleOutlined />}>
                            Đã đạt được {dayjs(record.earnedAt).format('DD/MM/YYYY')}
                        </Tag>
                    ) : (
                        <Tag color="orange">Chưa đạt được</Tag>
                    )}
                </div>
            ),
        },
        {
            title: 'Điều kiện',
            key: 'condition',
            render: (_, record) => (
                <div className="text-sm">
                    {record.milestoneDays && (
                        <div>🗓️ {record.milestoneDays} ngày không hút thuốc</div>
                    )}
                    {record.savedMoney && (
                        <div>💰 Tiết kiệm {record.savedMoney.toLocaleString('vi-VN')} ₫</div>
                    )}
                </div>
            ),
        },
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spin size="large" />
            </div>
        );
    }

    if (!memberData) {
        return (
            <Alert
                message="Không thể tải dữ liệu thành viên"
                description="Vui lòng thử lại sau."
                type="error"
                showIcon
            />
        );
    }

    const { member, analytics, progressData, quitPlan, smokingStatus, achievements } = memberData;
    const chartData = analytics?.chartData?.daily || [];

    return (
        <div className="p-6">
            {/* Header */}
            <Row gutter={[24, 24]} className="mb-6">
                <Col span={24}>
                    <Card className="shadow-md">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <Button
                                    onClick={onBack}
                                    className="mr-4"
                                >
                                    ← Quay lại
                                </Button>
                                <Avatar
                                    size={64}
                                    src={member.avatar}
                                    icon={<UserOutlined />}
                                    className="mr-4"
                                />
                                <div>
                                    <Title level={3} className="mb-0">{member.fullName}</Title>
                                    <div className="text-gray-600">
                                        <Space>
                                            <MailOutlined /> {member.email}
                                            {member.phoneNumber && (
                                                <>
                                                    <PhoneOutlined /> {member.phoneNumber}
                                                </>
                                            )}
                                        </Space>
                                    </div>
                                    {member.membershipPlan && (
                                        <Tag color="blue">{member.membershipPlan}</Tag>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="mb-2">
                                    <Text className="text-gray-500">Thời gian theo dõi:</Text>
                                    <Select
                                        value={selectedDays}
                                        onChange={setSelectedDays}
                                        className="ml-2"
                                        style={{ width: 120 }}
                                    >
                                        <Option value={7}>7 ngày</Option>
                                        <Option value={14}>14 ngày</Option>
                                        <Option value={30}>30 ngày</Option>
                                        <Option value={60}>60 ngày</Option>
                                        <Option value={90}>90 ngày</Option>
                                    </Select>
                                </div>
                                <Tag
                                    color={getStatusColor(analytics?.summary?.progressStatus)}
                                    className="text-lg px-3 py-1"
                                >
                                    {getStatusText(analytics?.summary?.progressStatus)}
                                </Tag>
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Tabs activeKey={activeTab} onChange={setActiveTab}>
                {/* Overview Tab */}
                <TabPane tab="Tổng quan" key="overview">
                    {/* Statistics Cards */}
                    <Row gutter={[16, 16]} className="mb-6">
                        <Col xs={24} sm={12} lg={6}>
                            <Card className="text-center shadow-sm">
                                <Statistic
                                    title="Ngày theo dõi"
                                    value={analytics?.summary?.totalDaysTracked || 0}
                                    prefix={<CalendarOutlined />}
                                    valueStyle={{ color: '#1890ff' }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card className="text-center shadow-sm">
                                <Statistic
                                    title="TB thuốc/ngày"
                                    value={analytics?.summary?.averageCigarettesPerDay || 0}
                                    prefix={<FireOutlined />}
                                    valueStyle={{
                                        color: (analytics?.summary?.averageCigarettesPerDay || 0) <= 2 ? '#52c41a' :
                                            (analytics?.summary?.averageCigarettesPerDay || 0) <= 5 ? '#faad14' : '#ff4d4f'
                                    }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card className="text-center shadow-sm">
                                <Statistic
                                    title="Tiền tiết kiệm"
                                    value={analytics?.summary?.currentMoneySaved || 0}
                                    prefix={<DollarOutlined />}
                                    valueStyle={{ color: '#52c41a' }}
                                    formatter={(value) => `${value.toLocaleString('vi-VN')} ₫`}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card className="text-center shadow-sm">
                                <Statistic
                                    title="Chuỗi không hút"
                                    value={analytics?.summary?.currentSmokeFreeStreak || 0}
                                    suffix="ngày"
                                    prefix={<TrophyOutlined />}
                                    valueStyle={{ color: '#722ed1' }}
                                />
                            </Card>
                        </Col>
                    </Row>

                    {/* Trends Cards */}
                    <Row gutter={[16, 16]} className="mb-6">
                        <Col xs={24} sm={8}>
                            <Card className="shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Text className="text-gray-500">Xu hướng thuốc hút</Text>
                                        <div className="text-lg font-medium">
                                            {getTrendIcon(analytics?.trends?.cigarettesTrend)}
                                            <span className="ml-2">{getTrendText(analytics?.trends?.cigarettesTrend)}</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Card className="shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Text className="text-gray-500">Xu hướng cơn thèm</Text>
                                        <div className="text-lg font-medium">
                                            {getTrendIcon(analytics?.trends?.cravingTrend)}
                                            <span className="ml-2">{getTrendText(analytics?.trends?.cravingTrend)}</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Card className="shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Text className="text-gray-500">Tiết kiệm tiền</Text>
                                        <div className="text-lg font-medium">
                                            {getTrendIcon(analytics?.trends?.moneySavingTrend)}
                                            <span className="ml-2">{getTrendText(analytics?.trends?.moneySavingTrend)}</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    </Row>

                    {/* Improvements and Concerns */}
                    <Row gutter={[16, 16]} className="mb-6">
                        <Col xs={24} md={12}>
                            <Card
                                title={
                                    <span>
                                        <CheckCircleOutlined className="text-green-500 mr-2" />
                                        Điểm tích cực
                                    </span>
                                }
                                className="shadow-sm"
                            >
                                {analytics?.improvements?.length > 0 ? (
                                    <List
                                        dataSource={analytics.improvements}
                                        renderItem={item => (
                                            <List.Item>
                                                <Text type="success">✓ {item}</Text>
                                            </List.Item>
                                        )}
                                    />
                                ) : (
                                    <Empty description="Chưa có điểm tích cực nào được ghi nhận" />
                                )}
                            </Card>
                        </Col>
                        <Col xs={24} md={12}>
                            <Card
                                title={
                                    <span>
                                        <WarningOutlined className="text-orange-500 mr-2" />
                                        Điểm cần cải thiện
                                    </span>
                                }
                                className="shadow-sm"
                            >
                                {analytics?.concerns?.length > 0 ? (
                                    <List
                                        dataSource={analytics.concerns}
                                        renderItem={item => (
                                            <List.Item>
                                                <Text type="warning">⚠ {item}</Text>
                                            </List.Item>
                                        )}
                                    />
                                ) : (
                                    <Empty description="Không có điểm nào cần cải thiện" />
                                )}
                            </Card>
                        </Col>
                    </Row>
                </TabPane>

                {/* Charts Tab */}
                <TabPane tab="Biểu đồ" key="charts">
                    {chartData.length > 0 ? (
                        <Row gutter={[16, 16]}>
                            <Col span={24}>
                                <Card title="Số lượng thuốc hút theo ngày" className="shadow-sm mb-4">
                                    <div style={{ height: '300px' }}>
                                        <Line
                                            data={createChartData(chartData, 'cigarettes', 'Số điếu thuốc', '#ff4d4f')}
                                            options={chartOptions}
                                        />
                                    </div>
                                </Card>
                            </Col>
                            <Col span={24}>
                                <Card title="Mức độ thèm thuốc theo ngày" className="shadow-sm mb-4">
                                    <div style={{ height: '300px' }}>
                                        <Line
                                            data={createChartData(chartData, 'craving', 'Mức độ thèm (1-10)', '#faad14')}
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
                            <Col span={24}>
                                <Card title="Tiền tiết kiệm theo thời gian" className="shadow-sm">
                                    <div style={{ height: '300px' }}>
                                        <Line
                                            data={createChartData(chartData, 'moneySaved', 'Tiền tiết kiệm (VNĐ)', '#52c41a')}
                                            options={chartOptions}
                                        />
                                    </div>
                                </Card>
                            </Col>
                        </Row>
                    ) : (
                        <Empty
                            description="Chưa có dữ liệu để hiển thị biểu đồ"
                            className="py-20"
                        />
                    )}
                </TabPane>

                {/* Progress Data Tab */}
                <TabPane tab="Nhật ký tiến trình" key="progress">
                    <Card title="Dữ liệu theo dõi hàng ngày" className="shadow-sm">
                        {progressData && progressData.length > 0 ? (
                            <Table
                                columns={progressColumns}
                                dataSource={progressData}
                                rowKey="date"
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
                                description="Thành viên chưa có dữ liệu theo dõi"
                                className="py-10"
                            />
                        )}
                    </Card>
                </TabPane>

                {/* Achievements Tab */}
                <TabPane tab="Thành tích" key="achievements">
                    <Card title="Danh sách thành tích" className="shadow-sm">
                        {achievements && achievements.length > 0 ? (
                            <Table
                                columns={achievementColumns}
                                dataSource={achievements}
                                rowKey="id"
                                pagination={{
                                    pageSize: 10,
                                    showSizeChanger: false,
                                }}
                            />
                        ) : (
                            <Empty
                                description="Chưa có thành tích nào"
                                className="py-10"
                            />
                        )}
                    </Card>
                </TabPane>

                {/* Plans Tab */}
                <TabPane tab="Kế hoạch cai thuốc" key="plans">
                    <Row gutter={[16, 16]}>
                        <Col xs={24} md={12}>
                            <Card title="Kế hoạch cai thuốc hiện tại" className="shadow-sm">
                                {quitPlan ? (
                                    <div>
                                        <div className="mb-4">
                                            <Text strong>Ngày bắt đầu:</Text>
                                            <div>{dayjs(quitPlan.startDate).format('DD/MM/YYYY')}</div>
                                        </div>
                                        <div className="mb-4">
                                            <Text strong>Ngày mục tiêu:</Text>
                                            <div>{dayjs(quitPlan.targetDate).format('DD/MM/YYYY')}</div>
                                        </div>
                                        <div className="mb-4">
                                            <Text strong>Động lực:</Text>
                                            <div>
                                                <Progress
                                                    percent={quitPlan.motivationLevel * 10}
                                                    format={() => `${quitPlan.motivationLevel}/10`}
                                                />
                                            </div>
                                        </div>
                                        <div className="mb-4">
                                            <Text strong>Lý do cai thuốc:</Text>
                                            <Paragraph>{quitPlan.reason}</Paragraph>
                                        </div>
                                        {quitPlan.detailedPlan && (
                                            <div className="mb-4">
                                                <Text strong>Kế hoạch chi tiết:</Text>
                                                <Paragraph>{quitPlan.detailedPlan}</Paragraph>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-sm text-gray-500">
                                            <span>Đã thực hiện: {quitPlan.daysInPlan} ngày</span>
                                            <span>Còn lại: {quitPlan.daysToTarget} ngày</span>
                                        </div>
                                    </div>
                                ) : (
                                    <Empty description="Thành viên chưa có kế hoạch cai thuốc" />
                                )}
                            </Card>
                        </Col>
                        <Col xs={24} md={12}>
                            <Card title="Tình trạng hút thuốc" className="shadow-sm">
                                {smokingStatus ? (
                                    <div>
                                        <div className="mb-4">
                                            <Text strong>Số điếu/ngày trước khi cai:</Text>
                                            <div className="text-lg text-red-500">
                                                {smokingStatus.cigarettesPerDay} điếu
                                            </div>
                                        </div>
                                        <div className="mb-4">
                                            <Text strong>Giá tiền mỗi điếu:</Text>
                                            <div>{smokingStatus.cigarettePrice?.toLocaleString('vi-VN')} ₫</div>
                                        </div>
                                        <div className="mb-4">
                                            <Text strong>Tần suất hút:</Text>
                                            <div>{smokingStatus.smokingFrequency}</div>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Cập nhật lần cuối: {dayjs(smokingStatus.lastUpdated).format('DD/MM/YYYY HH:mm')}
                                        </div>
                                    </div>
                                ) : (
                                    <Empty description="Chưa có thông tin tình trạng hút thuốc" />
                                )}
                            </Card>
                        </Col>
                    </Row>
                </TabPane>
            </Tabs>
        </div>
    );
};

export default MemberProgressTracking; 