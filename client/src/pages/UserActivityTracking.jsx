import React, { useState, useEffect } from 'react';
import {
    Card,
    Table,
    Badge,
    Statistic,
    Progress,
    Row,
    Col,
    Tabs,
    Avatar,
    Tag,
    Button,
    Space,
    Tooltip,
    message,
    Modal,
    Descriptions,
    Timeline,
    Alert,
    Empty,
    Spin,
    Select,
    DatePicker,
    Input,
    Divider
} from 'antd';
import {
    UserOutlined,
    AlertOutlined,
    TrophyOutlined,
    RiseOutlined,
    FallOutlined,
    EyeOutlined,
    SearchOutlined,
    CalendarOutlined,
    TeamOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ExclamationCircleOutlined,
    HeartOutlined,
    SmileOutlined,
    FrownOutlined,
    DatabaseOutlined,
    RocketOutlined,
    WarningOutlined,
    MinusCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import './UserActivityTracking.css';

const { TabPane } = Tabs;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Search } = Input;

const UserActivityTracking = () => {
    const [loading, setLoading] = useState(true);
    const [activityData, setActivityData] = useState({
        usersInQuitProcess: [],
        usersNeedingSupport: [],
        achievementStats: [],
        successRates: {},
        monthlyTrends: [],
        coachPerformance: []
    });
    const [systemOverview, setSystemOverview] = useState({});
    const [selectedUser, setSelectedUser] = useState(null);
    const [userDetailModal, setUserDetailModal] = useState(false);
    const [userProgressData, setUserProgressData] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [filters, setFilters] = useState({
        supportStatus: 'all',
        membershipStatus: 'all',
        coachAssignment: 'all',
        dateRange: null
    });

    useEffect(() => {
        loadActivityData();
        loadSystemOverview();
    }, []);

    const loadActivityData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');

            const response = await axios.get('http://smokeking.wibu.me:4000/api/admin/user-activity', {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                withCredentials: true
            });

            if (response.data.success) {
                setActivityData(response.data.data);
            } else {
                message.error('Không thể tải dữ liệu hoạt động người dùng');
            }
        } catch (error) {
            console.error('Error loading activity data:', error);
            message.error('Lỗi khi tải dữ liệu hoạt động');
        } finally {
            setLoading(false);
        }
    };

    const loadSystemOverview = async () => {
        try {
            const token = localStorage.getItem('adminToken');

            const response = await axios.get('http://smokeking.wibu.me:4000/api/admin/system-overview', {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                withCredentials: true
            });

            if (response.data.success) {
                setSystemOverview(response.data.data);
            }
        } catch (error) {
            console.error('Error loading system overview:', error);
        }
    };

    const loadUserDetails = async (userId) => {
        try {
            const token = localStorage.getItem('adminToken');

            const response = await axios.get(`http://smokeking.wibu.me:4000/api/admin/user-progress-analysis/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                withCredentials: true
            });

            if (response.data.success) {
                setUserProgressData(response.data.data);
                setUserDetailModal(true);
            } else {
                message.error('Không thể tải chi tiết người dùng');
            }
        } catch (error) {
            console.error('Error loading user details:', error);
            message.error('Lỗi khi tải chi tiết người dùng');
        }
    };

    // Destructure data
    const {
        usersInQuitProcess = [],
        usersNeedingSupport = [],
        achievementStats = [],
        coachPerformance = []
    } = activityData;

    // Helper functions
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Critical': return 'red';
            case 'High': return 'orange';
            case 'Medium': return 'gold';
            case 'Low': return 'green';
            default: return 'default';
        }
    };

    const getPriorityIcon = (priority) => {
        switch (priority) {
            case 'Critical': return <ExclamationCircleOutlined />;
            case 'High': return <AlertOutlined />;
            case 'Medium': return <WarningOutlined />;
            case 'Low': return <CheckCircleOutlined />;
            default: return <MinusCircleOutlined />;
        }
    };

    const getPriorityText = (priority) => {
        switch (priority) {
            case 'Critical': return 'Khẩn cấp';
            case 'High': return 'Cao';
            case 'Medium': return 'Trung bình';
            case 'Low': return 'Thấp';
            default: return 'Chưa rõ';
        }
    };

    // Columns for users in quit process table
    const quitProcessColumns = [
        {
            title: 'Người dùng',
            key: 'user',
            render: (_, record) => (
                <Space>
                    <Avatar
                        src={record.Avatar}
                        icon={<UserOutlined />}
                        size="small"
                    />
                    <div>
                        <div style={{ fontWeight: 500 }}>
                            {record.FirstName} {record.LastName}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                            {record.Email}
                        </div>
                    </div>
                </Space>
            ),
            width: 200
        },
        {
            title: 'Tiến trình cai thuốc',
            key: 'progress',
            render: (_, record) => (
                <div>
                    <div style={{ marginBottom: 4 }}>
                        <strong>{record.DaysIntoQuit || 0}</strong> ngày đã cai
                    </div>
                    <Progress
                        percent={record.DaysToTarget > 0 ?
                            Math.min(100, parseFloat((((record.DaysIntoQuit || 0) /
                                ((record.DaysIntoQuit || 0) + record.DaysToTarget)) * 100).toFixed(1))) : 100}
                        size="small"
                        status={record.DaysToTarget <= 0 ? 'success' : 'active'}
                    />
                    <div style={{ fontSize: '12px', color: '#666' }}>
                        {record.DaysToTarget > 0 ?
                            `Còn ${record.DaysToTarget} ngày` :
                            'Đã hoàn thành mục tiêu'}
                    </div>
                </div>
            ),
            width: 200
        },
        {
            title: 'Trạng thái hỗ trợ',
            key: 'supportStatus',
            render: (_, record) => {
                // Determine support status based on record data
                let status = 'Low';
                if (!record.LastProgressDate || record.LastCravingLevel >= 8) {
                    status = 'High';
                } else if (record.LastCravingLevel >= 5 || (record.LastCigarettesSmoked && record.LastCigarettesSmoked > 0)) {
                    status = 'Medium';
                }

                return (
                    <Tag color={getPriorityColor(status)}>
                        {getPriorityIcon(status)}
                        <span style={{ marginLeft: 4 }}>{getPriorityText(status)}</span>
                    </Tag>
                );
            },
            width: 130
        },
        {
            title: 'Coach',
            dataIndex: 'CoachName',
            key: 'coach',
            render: (coach) => coach || <span style={{ color: '#999' }}>Chưa có</span>,
            width: 120
        },
        {
            title: 'Tiến trình gần đây',
            key: 'recentProgress',
            render: (_, record) => (
                <div>
                    {record.LastProgressDate ? (
                        <>
                            <div>
                                🚭 {record.LastCigarettesSmoked || 0} điếu
                            </div>
                            <div>
                                😤 Thèm thuốc: {record.LastCravingLevel || 0}/10
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                                {new Date(record.LastProgressDate).toLocaleDateString('vi-VN')}
                            </div>
                        </>
                    ) : (
                        <div style={{ color: '#999' }}>
                            <div>🚭 Chưa điền</div>
                            <div>😤 Chưa điền</div>
                            <div style={{ fontSize: '12px' }}>Chưa có dữ liệu</div>
                        </div>
                    )}
                </div>
            ),
            width: 150
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => loadUserDetails(record.UserID)}
                    >
                        Chi tiết
                    </Button>
                </Space>
            ),
            width: 100
        }
    ];

    // Columns for users needing support table
    const supportColumns = [
        {
            title: 'Người dùng',
            key: 'user',
            render: (_, record) => (
                <Space>
                    <Avatar
                        src={record.Avatar}
                        icon={<UserOutlined />}
                        size="small"
                    />
                    <div>
                        <div style={{ fontWeight: 500 }}>
                            {record.FullName}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                            {record.Email}
                        </div>
                    </div>
                </Space>
            ),
            width: 200
        },
        {
            title: 'Mức độ ưu tiên',
            dataIndex: 'Priority',
            key: 'priority',
            render: (priority) => (
                <Tag color={getPriorityColor(priority)} style={{ minWidth: '90px' }}>
                    {getPriorityIcon(priority)}
                    <span style={{ marginLeft: 4 }}>{getPriorityText(priority)}</span>
                </Tag>
            ),
            width: 120
        },
        {
            title: 'Lý do cần hỗ trợ',
            dataIndex: 'SupportReason',
            key: 'reason',
            render: (reason) => (
                <div style={{
                    fontSize: '14px',
                    lineHeight: '1.5',
                    maxWidth: '400px',
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    color: '#262626',
                    padding: '4px 0',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                    {reason}
                </div>
            ),
            width: 420
        },
        {
            title: 'Coach phụ trách',
            dataIndex: 'CoachName',
            key: 'coach',
            render: (coach) => coach || <span style={{ color: '#999' }}>Chưa có</span>,
            width: 120
        },
        {
            title: 'Đăng nhập cuối',
            dataIndex: 'LastLoginAt',
            key: 'lastLogin',
            render: (date) => date ?
                new Date(date).toLocaleDateString('vi-VN') :
                <span style={{ color: '#999' }}>Chưa đăng nhập</span>,
            width: 120
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => loadUserDetails(record.UserID)}
                    >
                        Chi tiết
                    </Button>
                </Space>
            ),
            width: 100
        }
    ];

    // Columns for achievement statistics
    const achievementColumns = [
        {
            title: 'Huy hiệu',
            key: 'achievement',
            render: (_, record) => (
                <Space>
                    <Avatar
                        src={record.IconURL}
                        icon={<TrophyOutlined />}
                        size="small"
                    />
                    <div>
                        <div style={{ fontWeight: 500 }}>
                            {record.AchievementName}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                            {record.Description}
                        </div>
                    </div>
                </Space>
            ),
            width: 250
        },
        {
            title: 'Điều kiện',
            key: 'condition',
            render: (_, record) => (
                <div>
                    {record.MilestoneDays && (
                        <div>🗓️ {record.MilestoneDays} ngày</div>
                    )}
                    {record.SavedMoney && (
                        <div>💰 {record.SavedMoney.toLocaleString('vi-VN')} VNĐ</div>
                    )}
                </div>
            ),
            width: 150
        },
        {
            title: 'Số lần đạt được',
            dataIndex: 'TimesEarned',
            key: 'timesEarned',
            render: (count) => (
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    {count}
                </span>
            ),
            width: 120
        },
        {
            title: 'Tỷ lệ đạt được',
            key: 'percentage',
            render: (_, record) => (
                <div>
                    <Progress
                        percent={parseFloat((record.EarnPercentage || 0).toFixed(1))}
                        size="small"
                        format={percent => `${parseFloat(percent.toFixed(1))}%`}
                    />
                    <div style={{ fontSize: '12px', color: '#666' }}>
                        {record.TimesEarned}/{record.TotalEligibleUsers} người dùng
                    </div>
                </div>
            ),
            width: 150
        }
    ];

    const renderOverviewTab = () => {
        return (
            <>
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Tổng thành viên"
                                value={systemOverview.TotalMembers || 0}
                                prefix={<UserOutlined />}
                                valueStyle={{ color: '#3f8600' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Đang hoạt động"
                                value={systemOverview.ActiveMembers || 0}
                                prefix={<CheckCircleOutlined />}
                                valueStyle={{ color: '#1890ff' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Kế hoạch đang chạy"
                                value={systemOverview.ActiveQuitPlans || 0}
                                prefix={<RocketOutlined />}
                                valueStyle={{ color: '#722ed1' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Theo dõi tuần qua"
                                value={systemOverview.UsersTrackingLast7Days || 0}
                                prefix={<CalendarOutlined />}
                                valueStyle={{ color: '#eb2f96' }}
                            />
                        </Card>
                    </Col>
                </Row>

                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                    <Col xs={24} lg={12}>
                        <Card title="⚠️ Cảnh báo cần hỗ trợ">
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Statistic
                                        title="Mức thèm thuốc cao"
                                        value={systemOverview.HighCravingUsers || 0}
                                        valueStyle={{ color: '#f5222d' }}
                                        prefix={<ExclamationCircleOutlined />}
                                    />
                                </Col>
                                <Col span={12}>
                                    <Statistic
                                        title="Hút thuốc gần đây"
                                        value={systemOverview.RecentSmokingUsers || 0}
                                        valueStyle={{ color: '#fa8c16' }}
                                        prefix={<AlertOutlined />}
                                    />
                                </Col>
                            </Row>
                        </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                        <Card title="💰 Doanh thu gần đây">
                            <Statistic
                                title="Doanh thu 30 ngày"
                                value={systemOverview.RevenueLast30Days || 0}
                                formatter={(value) => new Intl.NumberFormat('vi-VN', {
                                    style: 'currency',
                                    currency: 'VND'
                                }).format(value)}
                                precision={0}
                            />
                            <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                                {systemOverview.PaymentsLast30Days || 0} giao dịch
                            </div>
                        </Card>
                    </Col>
                </Row>
            </>
        );
    };

    const renderUsersInProcessTab = () => {
        return (
            <Card title="👥 Danh sách người dùng đang trong tiến trình cai thuốc">
                <Table
                    columns={quitProcessColumns}
                    dataSource={usersInQuitProcess}
                    rowKey="UserID"
                    pagination={{
                        pageSize: 10,
                        showTotal: (total) => `Tổng ${total} người dùng`
                    }}
                    scroll={{ x: 1200 }}
                />
            </Card>
        );
    };

    const renderUsersNeedingSupportTab = () => {
        return (
            <Card>
                <div style={{ marginBottom: 16 }}>
                    <Alert
                        message="Người dùng cần hỗ trợ"
                        description="Danh sách những người dùng đang gặp khó khăn trong quá trình cai thuốc và cần được hỗ trợ kịp thời."
                        type="warning"
                        showIcon
                    />
                </div>

                <Table
                    columns={supportColumns}
                    dataSource={usersNeedingSupport}
                    rowKey="UserID"
                    pagination={{
                        pageSize: 10,
                        showTotal: (total) => `${total} người dùng cần hỗ trợ`
                    }}
                    scroll={{ x: 1200 }}
                />
            </Card>
        );
    };

    const renderAchievementStatsTab = () => {
        return (
            <Card title="🏆 Thống kê huy hiệu và thành tích">
                <Table
                    columns={achievementColumns}
                    dataSource={achievementStats}
                    rowKey="AchievementID"
                    pagination={{
                        pageSize: 10,
                        showTotal: (total) => `${total} loại huy hiệu`
                    }}
                />
            </Card>
        );
    };

    const tabs = [
        {
            key: 'overview',
            label: <span><DatabaseOutlined /> Tổng quan hệ thống</span>,
            children: renderOverviewTab()
        },
        {
            key: 'users-in-process',
            label: <span><TeamOutlined /> Người dùng trong tiến trình ({usersInQuitProcess.length})</span>,
            children: renderUsersInProcessTab()
        },
        {
            key: 'users-needing-support',
            label: <span><ExclamationCircleOutlined /> Cần hỗ trợ ({usersNeedingSupport.length})</span>,
            children: renderUsersNeedingSupportTab()
        },
        {
            key: 'achievements',
            label: <span><TrophyOutlined /> Thống kê huy hiệu</span>,
            children: renderAchievementStatsTab()
        }
    ];

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>Đang tải dữ liệu theo dõi...</div>
            </div>
        );
    }

    return (
        <div className="user-activity-tracking">
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: 8 }}>
                    📊 Theo dõi hoạt động người dùng
                </h1>
                <p style={{ color: '#666', fontSize: '14px' }}>
                    Theo dõi tiến trình cai thuốc, xác định người dùng cần hỗ trợ và phân tích hiệu quả hệ thống
                </p>
            </div>

            <Tabs activeKey={activeTab} onChange={setActiveTab}>
                {tabs.map(tab => (
                    <TabPane tab={tab.label} key={tab.key}>
                        {tab.children}
                    </TabPane>
                ))}
            </Tabs>

            {/* User Detail Modal */}
            <Modal
                title={
                    <span>
                        <UserOutlined /> Chi tiết người dùng
                        {userProgressData?.userInfo && (
                            <span style={{ marginLeft: 8, fontWeight: 'normal' }}>
                                - {userProgressData.userInfo.FirstName} {userProgressData.userInfo.LastName}
                            </span>
                        )}
                    </span>
                }
                open={userDetailModal}
                onCancel={() => {
                    setUserDetailModal(false);
                    setUserProgressData(null);
                }}
                width={1000}
                footer={null}
            >
                {userProgressData && (
                    <div>
                        <Descriptions bordered size="small" column={2}>
                            <Descriptions.Item label="Email">
                                {userProgressData.userInfo.Email}
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày tham gia">
                                {new Date(userProgressData.userInfo.CreatedAt).toLocaleDateString('vi-VN')}
                            </Descriptions.Item>
                            <Descriptions.Item label="Đăng nhập cuối">
                                {userProgressData.userInfo.LastLoginAt ?
                                    new Date(userProgressData.userInfo.LastLoginAt).toLocaleDateString('vi-VN') :
                                    'Chưa đăng nhập'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Gói membership">
                                {userProgressData.userInfo.PlanName || 'Chưa có'}
                            </Descriptions.Item>
                        </Descriptions>

                        <Divider orientation="left">📊 Thống kê tiến trình</Divider>
                        <Row gutter={16}>
                            <Col span={6}>
                                <Statistic
                                    title="Ngày theo dõi"
                                    value={userProgressData.analytics.totalDaysTracked}
                                />
                            </Col>
                            <Col span={6}>
                                <Statistic
                                    title="Ngày không hút"
                                    value={userProgressData.analytics.smokeFreeDays}
                                    valueStyle={{ color: '#52c41a' }}
                                />
                            </Col>
                            <Col span={6}>
                                {userProgressData.analytics.totalMoneySaved > 0 ? (
                                    <Statistic
                                        title="Tiền tiết kiệm"
                                        value={userProgressData.analytics.totalMoneySaved}
                                        suffix="VNĐ"
                                        formatter={(value) => value.toLocaleString('vi-VN')}
                                    />
                                ) : (
                                    <Statistic
                                        title="Tiền tiết kiệm"
                                        value="Chưa điền tiến trình"
                                        valueStyle={{ color: '#999', fontSize: '14px' }}
                                    />
                                )}
                            </Col>
                            <Col span={6}>
                                <Statistic
                                    title="Mức thèm TB"
                                    value={parseFloat((userProgressData.analytics.averageCravingLevel || 0).toFixed(1))}
                                    suffix="/10"
                                    precision={1}
                                />
                            </Col>
                        </Row>

                        {userProgressData.achievements.length > 0 && (
                            <>
                                <Divider orientation="left">🏆 Huy hiệu đạt được</Divider>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {userProgressData.achievements.map((achievement, index) => (
                                        <Tooltip key={index} title={achievement.Description}>
                                            <Tag color="gold" style={{ marginBottom: 8 }}>
                                                🏆 {achievement.Name}
                                            </Tag>
                                        </Tooltip>
                                    ))}
                                </div>
                            </>
                        )}

                        {userProgressData.quitPlans.length > 0 && (
                            <>
                                <Divider orientation="left">🎯 Kế hoạch cai thuốc</Divider>
                                <Timeline>
                                    {userProgressData.quitPlans.map((plan, index) => (
                                        <Timeline.Item
                                            key={index}
                                            color={plan.Status === 'completed' ? 'green' :
                                                plan.Status === 'active' ? 'blue' : 'red'}
                                            dot={plan.Status === 'completed' ? <CheckCircleOutlined /> :
                                                plan.Status === 'active' ? <SmileOutlined /> : <FrownOutlined />}
                                        >
                                            <div>
                                                <strong>Kế hoạch {plan.Status === 'completed' ? 'hoàn thành' :
                                                    plan.Status === 'active' ? 'đang thực hiện' : 'đã hủy'}</strong>
                                                <div>Coach: {plan.CoachName || 'Chưa có'}</div>
                                                <div>Động lực: {plan.MotivationLevel}/10</div>
                                                <div>Thời gian: {new Date(plan.StartDate).toLocaleDateString('vi-VN')} - {new Date(plan.TargetDate).toLocaleDateString('vi-VN')}</div>
                                                {plan.Reason && <div>Lý do: {plan.Reason}</div>}
                                            </div>
                                        </Timeline.Item>
                                    ))}
                                </Timeline>
                            </>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default UserActivityTracking; 