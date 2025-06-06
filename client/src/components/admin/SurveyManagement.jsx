import React, { useState, useEffect } from 'react';
import {
    Table,
    Input,
    Button,
    Modal,
    Card,
    Typography,
    Space,
    Tag,
    Statistic,
    Row,
    Col,
    Drawer,
    List,
    Avatar,
    Divider,
    message,
    Spin,
    Select,
    Progress,
    Alert,
    Empty
} from 'antd';
import {
    SearchOutlined,
    EyeOutlined,
    FileTextOutlined,
    UserOutlined,
    BarChartOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;

// Dữ liệu mẫu cho khảo sát
const SAMPLE_SURVEY_DATA = [
    {
        UserID: 1,
        FirstName: 'Nguyễn',
        LastName: 'Văn A',
        Email: 'nguyenvana@example.com',
        Role: 'member',
        UserCreatedAt: '2024-01-15T08:30:00.000Z',
        LastSurveyUpdate: '2024-12-15T14:30:00.000Z',
        TotalAnswers: 8
    },
    {
        UserID: 2,
        FirstName: 'Trần',
        LastName: 'Thị B',
        Email: 'tranthib@example.com',
        Role: 'member',
        UserCreatedAt: '2024-01-20T10:15:00.000Z',
        LastSurveyUpdate: '2024-12-14T16:45:00.000Z',
        TotalAnswers: 10
    },
    {
        UserID: 3,
        FirstName: 'Lê',
        LastName: 'Minh C',
        Email: 'leminhc@example.com',
        Role: 'member',
        UserCreatedAt: '2024-02-01T09:00:00.000Z',
        LastSurveyUpdate: '2024-12-13T11:20:00.000Z',
        TotalAnswers: 6
    },
    {
        UserID: 4,
        FirstName: 'Phạm',
        LastName: 'Thu D',
        Email: 'phamthud@example.com',
        Role: 'member',
        UserCreatedAt: '2024-02-10T13:45:00.000Z',
        LastSurveyUpdate: '2024-12-12T09:30:00.000Z',
        TotalAnswers: 9
    },
    {
        UserID: 5,
        FirstName: 'Hoàng',
        LastName: 'Văn E',
        Email: 'hoangvane@example.com',
        Role: 'member',
        UserCreatedAt: '2024-02-15T07:20:00.000Z',
        LastSurveyUpdate: '2024-12-11T15:10:00.000Z',
        TotalAnswers: 5
    }
];

const SAMPLE_STATISTICS = {
    TotalRespondents: 5,
    TotalQuestions: 10,
    TotalAnswers: 38,
    AvgAnswersPerUser: 7.6
};

const SAMPLE_QUESTION_STATS = [
    {
        QuestionID: 1,
        QuestionText: 'Bạn đã hút thuốc trong bao lâu rồi?',
        Category: 'Thông tin cơ bản',
        ResponseCount: 5,
        ResponseRate: 100
    },
    {
        QuestionID: 2,
        QuestionText: 'Trung bình mỗi ngày bạn hút bao nhiêu điếu?',
        Category: 'Thông tin cơ bản',
        ResponseCount: 5,
        ResponseRate: 100
    },
    {
        QuestionID: 3,
        QuestionText: 'Khoảng thời gian và hoàn cảnh nào bạn thường hút nhất?',
        Category: 'Thói quen',
        ResponseCount: 4,
        ResponseRate: 80
    },
    {
        QuestionID: 4,
        QuestionText: 'Lý do chính bạn muốn cai thuốc là gì?',
        Category: 'Động lực',
        ResponseCount: 5,
        ResponseRate: 100
    },
    {
        QuestionID: 5,
        QuestionText: 'Bạn đã từng cố gắng cai thuốc trước đây không? Kết quả ra sao?',
        Category: 'Kinh nghiệm',
        ResponseCount: 4,
        ResponseRate: 80
    }
];

const SAMPLE_RECENT_ACTIVITIES = [
    {
        UserName: 'Nguyễn Văn A',
        Email: 'nguyenvana@example.com',
        QuestionText: 'Lý do chính bạn muốn cai thuốc là gì?',
        AnswerText: 'Vì sức khỏe và gia đình',
        SubmittedAt: '2024-12-15T14:30:00.000Z'
    },
    {
        UserName: 'Trần Thị B',
        Email: 'tranthib@example.com',
        QuestionText: 'Trung bình mỗi ngày bạn hút bao nhiêu điếu?',
        AnswerText: '10-15 điếu mỗi ngày',
        SubmittedAt: '2024-12-14T16:45:00.000Z'
    }
];

const SAMPLE_USER_ANSWERS = [
    {
        QuestionID: 1,
        QuestionText: 'Bạn đã hút thuốc trong bao lâu rồi?',
        QuestionType: 'text',
        Category: 'Thông tin cơ bản',
        AnswerText: 'Khoảng 5 năm',
        SubmittedAt: '2024-12-15T14:30:00.000Z',
        UpdatedAt: '2024-12-15T14:30:00.000Z'
    },
    {
        QuestionID: 2,
        QuestionText: 'Trung bình mỗi ngày bạn hút bao nhiêu điếu?',
        QuestionType: 'number',
        Category: 'Thông tin cơ bản',
        AnswerText: '10-15 điếu',
        SubmittedAt: '2024-12-15T14:25:00.000Z',
        UpdatedAt: '2024-12-15T14:25:00.000Z'
    },
    {
        QuestionID: 3,
        QuestionText: 'Khoảng thời gian và hoàn cảnh nào bạn thường hút nhất?',
        QuestionType: 'text',
        Category: 'Thói quen',
        AnswerText: 'Sau bữa ăn và khi stress',
        SubmittedAt: '2024-12-15T14:20:00.000Z',
        UpdatedAt: '2024-12-15T14:20:00.000Z'
    },
    {
        QuestionID: 4,
        QuestionText: 'Lý do chính bạn muốn cai thuốc là gì?',
        QuestionType: 'text',
        Category: 'Động lực',
        AnswerText: 'Vì sức khỏe và gia đình',
        SubmittedAt: '2024-12-15T14:15:00.000Z',
        UpdatedAt: '2024-12-15T14:15:00.000Z'
    },
    {
        QuestionID: 5,
        QuestionText: 'Bạn đã từng cố gắng cai thuốc trước đây không? Kết quả ra sao?',
        QuestionType: 'text',
        Category: 'Kinh nghiệm',
        AnswerText: 'Đã thử 2 lần nhưng chưa thành công',
        SubmittedAt: '2024-12-15T14:10:00.000Z',
        UpdatedAt: '2024-12-15T14:10:00.000Z'
    },
    {
        QuestionID: 6,
        QuestionText: 'Bạn mong muốn nhận hỗ trợ gì nhất từ một nền tảng?',
        QuestionType: 'text',
        Category: 'Hỗ trợ',
        AnswerText: 'Thông báo nhắc nhở và cộng đồng hỗ trợ',
        SubmittedAt: '2024-12-15T14:05:00.000Z',
        UpdatedAt: '2024-12-15T14:05:00.000Z'
    },
    {
        QuestionID: 7,
        QuestionText: 'Bạn sẵn sàng chi trả bao nhiêu mỗi tháng để sử dụng dịch vụ?',
        QuestionType: 'number',
        Category: 'Tài chính',
        AnswerText: '50.000 - 100.000 VNĐ',
        SubmittedAt: '2024-12-15T14:00:00.000Z',
        UpdatedAt: '2024-12-15T14:00:00.000Z'
    },
    {
        QuestionID: 8,
        QuestionText: 'Bạn ưu tiên sử dụng nền tảng trên thiết bị di động hay web?',
        QuestionType: 'select',
        Category: 'Công nghệ',
        AnswerText: 'Thiết bị di động',
        SubmittedAt: '2024-12-15T13:55:00.000Z',
        UpdatedAt: '2024-12-15T13:55:00.000Z'
    },
    {
        QuestionID: 9,
        QuestionText: 'Các chỉ số nào bạn quan tâm nhất khi theo dõi tiến trình?',
        QuestionType: 'text',
        Category: 'Theo dõi',
        AnswerText: null,
        SubmittedAt: null,
        UpdatedAt: null
    },
    {
        QuestionID: 10,
        QuestionText: 'Bạn có thường chia sẻ tiến trình lên mạng xã hội không?',
        QuestionType: 'select',
        Category: 'Chia sẻ',
        AnswerText: null,
        SubmittedAt: null,
        UpdatedAt: null
    }
];

const SurveyManagement = () => {
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });

    // Modal states
    const [selectedUser, setSelectedUser] = useState(null);
    const [userSurveyVisible, setUserSurveyVisible] = useState(false);
    const [userSurveyAnswers, setUserSurveyAnswers] = useState([]);
    const [userSurveyLoading, setUserSurveyLoading] = useState(false);

    // Statistics states
    const [statistics, setStatistics] = useState(null);
    const [questionStats, setQuestionStats] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);
    const [statsVisible, setStatsVisible] = useState(false);

    // Error handling
    const [useLocalData, setUseLocalData] = useState(false);
    const [apiError, setApiError] = useState(null);

    useEffect(() => {
        fetchSurveys();
        fetchStatistics();
    }, [pagination.current, pagination.pageSize, searchText]);

    const fetchSurveys = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken') || localStorage.getItem('token');

            if (!token) {
                console.warn('No auth token found, using local data');
                setUseLocalData(true);
                setSurveys(SAMPLE_SURVEY_DATA);
                setPagination(prev => ({ ...prev, total: SAMPLE_SURVEY_DATA.length }));
                setLoading(false);
                return;
            }

            const response = await axios.get('/api/admin/surveys', {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page: pagination.current,
                    limit: pagination.pageSize,
                    search: searchText
                },
                timeout: 5000 // 5 second timeout
            });

            setSurveys(response.data.surveys);
            setPagination(prev => ({
                ...prev,
                total: response.data.pagination.total
            }));
            setUseLocalData(false);
            setApiError(null);
        } catch (error) {
            console.error('Error fetching surveys:', error);

            // Fallback to local data
            console.log('Falling back to local sample data');
            setUseLocalData(true);
            setApiError('Không thể kết nối đến server. Hiển thị dữ liệu mẫu.');

            // Filter sample data based on search
            let filteredData = SAMPLE_SURVEY_DATA;
            if (searchText) {
                filteredData = SAMPLE_SURVEY_DATA.filter(user =>
                    user.FirstName.toLowerCase().includes(searchText.toLowerCase()) ||
                    user.LastName.toLowerCase().includes(searchText.toLowerCase()) ||
                    user.Email.toLowerCase().includes(searchText.toLowerCase())
                );
            }

            setSurveys(filteredData);
            setPagination(prev => ({ ...prev, total: filteredData.length }));
        } finally {
            setLoading(false);
        }
    };

    const fetchStatistics = async () => {
        try {
            const token = localStorage.getItem('adminToken') || localStorage.getItem('token');

            if (!token) {
                setStatistics(SAMPLE_STATISTICS);
                setQuestionStats(SAMPLE_QUESTION_STATS);
                setRecentActivities(SAMPLE_RECENT_ACTIVITIES);
                return;
            }

            const response = await axios.get('/api/admin/survey-statistics', {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 5000
            });

            setStatistics(response.data.statistics);
            setQuestionStats(response.data.questionStats);
            setRecentActivities(response.data.recentActivities);
        } catch (error) {
            console.error('Error fetching statistics:', error);
            // Fallback to sample data
            setStatistics(SAMPLE_STATISTICS);
            setQuestionStats(SAMPLE_QUESTION_STATS);
            setRecentActivities(SAMPLE_RECENT_ACTIVITIES);
        }
    };

    const fetchUserSurvey = async (userId) => {
        setUserSurveyLoading(true);

        console.log('🔍 Fetching survey for user:', userId);

        try {
            const token = localStorage.getItem('adminToken') || localStorage.getItem('token');

            // Try API first if we have token and not using local data
            if (token && !useLocalData) {
                try {
                    console.log('📡 Attempting API call...');
                    const response = await axios.get(`/api/admin/surveys/${userId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                        timeout: 5000
                    });

                    console.log('✅ API response received:', response.data);
                    setSelectedUser(response.data.user);
                    setUserSurveyAnswers(response.data.answers);
                    setUserSurveyVisible(true);
                    return; // Success, exit early
                } catch (apiError) {
                    console.warn('⚠️ API call failed, falling back to sample data:', apiError.message);
                    // Continue to fallback below
                }
            } else {
                console.log('🔧 Using local data (no token or already in local mode)');
            }

            // Fallback to sample data
            console.log('📊 Using sample data for user:', userId);
            const selectedSampleUser = SAMPLE_SURVEY_DATA.find(u => u.UserID === userId);

            if (selectedSampleUser) {
                setSelectedUser(selectedSampleUser);
                setUserSurveyAnswers(SAMPLE_USER_ANSWERS);
                setUserSurveyVisible(true);

                // Show appropriate message
                if (token && !useLocalData) {
                    message.info('📋 Hiển thị dữ liệu khảo sát mẫu (API tạm thời không khả dụng)', 4);
                }

                console.log('✅ Sample data loaded successfully');
            } else {
                console.error('❌ No sample user found for ID:', userId);
                message.error('Không tìm thấy thông tin người dùng');
            }

        } catch (error) {
            console.error('❌ Unexpected error in fetchUserSurvey:', error);

            // Emergency fallback - always try to show sample data
            const selectedSampleUser = SAMPLE_SURVEY_DATA.find(u => u.UserID === userId);
            if (selectedSampleUser) {
                setSelectedUser(selectedSampleUser);
                setUserSurveyAnswers(SAMPLE_USER_ANSWERS);
                setUserSurveyVisible(true);
                message.warning('🔄 Sử dụng dữ liệu mẫu do lỗi kết nối', 4);
            } else {
                message.error('Không thể tải thông tin khảo sát');
            }
        } finally {
            setUserSurveyLoading(false);
            console.log('🏁 fetchUserSurvey completed');
        }
    };

    const handleTableChange = (newPagination) => {
        setPagination(newPagination);
    };

    const handleSearch = (value) => {
        setSearchText(value);
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const getRoleColor = (role) => {
        const colors = {
            'admin': 'red',
            'coach': 'blue',
            'member': 'green',
            'guest': 'default'
        };
        return colors[role] || 'default';
    };

    const getCompletionRate = (totalAnswers, totalQuestions = 10) => {
        return Math.round((totalAnswers / totalQuestions) * 100);
    };

    const columns = [
        {
            title: 'Người dùng',
            key: 'user',
            render: (_, record) => (
                <Space>
                    <Avatar icon={<UserOutlined />} />
                    <div>
                        <div style={{ fontWeight: 500 }}>
                            {record.FirstName} {record.LastName}
                        </div>
                        <div style={{ color: '#666', fontSize: '12px' }}>
                            {record.Email}
                        </div>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Vai trò',
            dataIndex: 'Role',
            key: 'role',
            render: (role) => (
                <Tag color={getRoleColor(role)}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                </Tag>
            ),
        },
        {
            title: 'Số câu trả lời',
            dataIndex: 'TotalAnswers',
            key: 'totalAnswers',
            render: (count) => (
                <div>
                    <Text strong>{count}</Text>
                    <div>
                        <Progress
                            percent={getCompletionRate(count)}
                            size="small"
                            showInfo={false}
                        />
                    </div>
                </div>
            ),
        },
        {
            title: 'Cập nhật lần cuối',
            dataIndex: 'LastSurveyUpdate',
            key: 'lastUpdate',
            render: (date) => date ? moment(date).format('DD/MM/YYYY HH:mm') : 'Chưa có',
        },
        {
            title: 'Ngày đăng ký',
            dataIndex: 'UserCreatedAt',
            key: 'createdAt',
            render: (date) => moment(date).format('DD/MM/YYYY'),
        },
        {
            title: 'Thao tác',
            key: 'actions',
            render: (_, record) => (
                <Button
                    type="primary"
                    icon={<EyeOutlined />}
                    onClick={() => fetchUserSurvey(record.UserID)}
                    loading={userSurveyLoading}
                >
                    Xem chi tiết
                </Button>
            ),
        },
    ];

    return (
        <div className="survey-management">
            <Card>
                {apiError && (
                    <Alert
                        message="Chế độ Demo"
                        description={apiError}
                        type="warning"
                        showIcon
                        style={{ marginBottom: 16 }}
                        closable
                        onClose={() => setApiError(null)}
                    />
                )}

                {useLocalData && !apiError && (
                    <Alert
                        message="Dữ liệu mẫu"
                        description="Hiển thị dữ liệu khảo sát mẫu để demo chức năng."
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <Title level={3} style={{ margin: 0 }}>
                        <FileTextOutlined style={{ marginRight: '8px' }} />
                        Quản lý Khảo sát
                    </Title>
                    <Space>
                        <Button
                            type="default"
                            icon={<BarChartOutlined />}
                            onClick={() => setStatsVisible(true)}
                        >
                            Xem thống kê
                        </Button>
                    </Space>
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <Input.Search
                        placeholder="Tìm kiếm theo tên hoặc email..."
                        allowClear
                        enterButton={<SearchOutlined />}
                        size="large"
                        onSearch={handleSearch}
                        style={{ maxWidth: '400px' }}
                    />
                </div>

                {surveys && surveys.length > 0 ? (
                    <Table
                        columns={columns}
                        dataSource={surveys}
                        rowKey="UserID"
                        loading={loading}
                        pagination={{
                            ...pagination,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) =>
                                `${range[0]}-${range[1]} của ${total} người dùng`,
                        }}
                        onChange={handleTableChange}
                    />
                ) : (
                    !loading && (
                        <Empty
                            description="Chưa có dữ liệu khảo sát"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    )
                )}
            </Card>

            {/* User Survey Detail Modal */}
            <Modal
                title={
                    selectedUser ? (
                        <div>
                            <UserOutlined style={{ marginRight: '8px' }} />
                            Khảo sát của {selectedUser.FirstName} {selectedUser.LastName}
                            {useLocalData && (
                                <Tag color="blue" style={{ marginLeft: '8px' }}>
                                    Dữ liệu mẫu
                                </Tag>
                            )}
                        </div>
                    ) : 'Chi tiết khảo sát'
                }
                open={userSurveyVisible}
                onCancel={() => setUserSurveyVisible(false)}
                footer={null}
                width={800}
                className="survey-detail-modal"
            >
                {useLocalData && (
                    <Alert
                        message="Dữ liệu Demo"
                        description="Đây là dữ liệu khảo sát mẫu để minh họa chức năng. Trong thực tế sẽ hiển thị dữ liệu khảo sát thật của member."
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                )}

                {selectedUser && (
                    <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Text strong>Email: </Text>
                                <Text>{selectedUser.Email}</Text>
                            </Col>
                            <Col span={12}>
                                <Text strong>Vai trò: </Text>
                                <Tag color={getRoleColor(selectedUser.Role)}>
                                    {selectedUser.Role}
                                </Tag>
                            </Col>
                            <Col span={12}>
                                <Text strong>Ngày đăng ký: </Text>
                                <Text>{moment(selectedUser.UserCreatedAt || selectedUser.CreatedAt).format('DD/MM/YYYY')}</Text>
                            </Col>
                            <Col span={12}>
                                <Text strong>Tiến độ khảo sát: </Text>
                                <Text>{selectedUser.TotalAnswers || 8}/10 câu</Text>
                                <Progress
                                    percent={getCompletionRate(selectedUser.TotalAnswers || 8)}
                                    size="small"
                                    style={{ marginTop: 4 }}
                                />
                            </Col>
                        </Row>
                    </div>
                )}

                <Title level={5} style={{ marginBottom: '16px' }}>
                    📋 Chi tiết câu trả lời khảo sát
                </Title>

                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {userSurveyAnswers && userSurveyAnswers.length > 0 ? (
                        userSurveyAnswers.map((item, index) => (
                            <Card
                                key={item.QuestionID}
                                size="small"
                                style={{ marginBottom: '12px' }}
                                title={
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>Câu {index + 1}</span>
                                        {item.AnswerText ? (
                                            <Tag color="green" size="small">Đã trả lời</Tag>
                                        ) : (
                                            <Tag color="red" size="small">Chưa trả lời</Tag>
                                        )}
                                    </div>
                                }
                            >
                                <div style={{ marginBottom: '8px' }}>
                                    <Text strong>{item.QuestionText}</Text>
                                    {item.Category && (
                                        <Tag style={{ marginLeft: '8px' }} color="blue">
                                            {item.Category}
                                        </Tag>
                                    )}
                                </div>

                                <div style={{
                                    padding: '12px',
                                    backgroundColor: item.AnswerText ? '#f0f8ff' : '#f5f5f5',
                                    borderRadius: '4px',
                                    border: item.AnswerText ? '1px solid #d9d9d9' : '1px dashed #d9d9d9'
                                }}>
                                    {item.AnswerText ? (
                                        <Text>{item.AnswerText}</Text>
                                    ) : (
                                        <Text type="secondary" italic>
                                            Chưa trả lời câu hỏi này
                                        </Text>
                                    )}
                                </div>

                                {item.SubmittedAt && (
                                    <div style={{ marginTop: '8px', textAlign: 'right' }}>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                            <ClockCircleOutlined style={{ marginRight: '4px' }} />
                                            Trả lời lúc: {moment(item.SubmittedAt).format('DD/MM/YYYY HH:mm')}
                                        </Text>
                                    </div>
                                )}
                            </Card>
                        ))
                    ) : (
                        <Empty
                            description="Chưa có câu trả lời nào"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    )}
                </div>
            </Modal>

            {/* Statistics Drawer */}
            <Drawer
                title="Thống kê Khảo sát"
                placement="right"
                size="large"
                open={statsVisible}
                onClose={() => setStatsVisible(false)}
            >
                {statistics && (
                    <div>
                        <Title level={4}>Tổng quan</Title>
                        <Row gutter={16} style={{ marginBottom: '24px' }}>
                            <Col span={12}>
                                <Card>
                                    <Statistic
                                        title="Tổng số người tham gia"
                                        value={statistics.TotalRespondents}
                                        valueStyle={{ color: '#3f8600' }}
                                    />
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card>
                                    <Statistic
                                        title="Tổng số câu trả lời"
                                        value={statistics.TotalAnswers}
                                        valueStyle={{ color: '#1890ff' }}
                                    />
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card>
                                    <Statistic
                                        title="Số câu hỏi"
                                        value={statistics.TotalQuestions}
                                        valueStyle={{ color: '#722ed1' }}
                                    />
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card>
                                    <Statistic
                                        title="Trung bình câu trả lời/người"
                                        value={statistics.AvgAnswersPerUser}
                                        precision={1}
                                        valueStyle={{ color: '#f5222d' }}
                                    />
                                </Card>
                            </Col>
                        </Row>

                        <Divider />

                        <Title level={4}>Tỷ lệ trả lời theo câu hỏi</Title>
                        <div style={{ marginBottom: '24px' }}>
                            {questionStats && questionStats.length > 0 ? (
                                questionStats.map((stat, index) => (
                                    <Card key={stat.QuestionID} size="small" style={{ marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ flex: 1 }}>
                                                <Text strong>Câu {index + 1}: </Text>
                                                <Text>{stat.QuestionText}</Text>
                                                {stat.Category && (
                                                    <Tag style={{ marginLeft: '8px' }} color="blue" size="small">
                                                        {stat.Category}
                                                    </Tag>
                                                )}
                                            </div>
                                            <div style={{ marginLeft: '16px' }}>
                                                <Progress
                                                    percent={Math.round(stat.ResponseRate)}
                                                    size="small"
                                                    format={(percent) => `${percent}% (${stat.ResponseCount})`}
                                                />
                                            </div>
                                        </div>
                                    </Card>
                                ))
                            ) : (
                                <Empty description="Chưa có dữ liệu thống kê" />
                            )}
                        </div>

                        <Divider />

                        <Title level={4}>Hoạt động gần đây</Title>
                        {recentActivities && recentActivities.length > 0 ? (
                            <List
                                dataSource={recentActivities}
                                renderItem={(item) => (
                                    <List.Item>
                                        <List.Item.Meta
                                            avatar={<Avatar icon={<UserOutlined />} />}
                                            title={item.UserName}
                                            description={
                                                <div>
                                                    <div style={{ color: '#1890ff', marginBottom: '4px' }}>
                                                        {item.QuestionText}
                                                    </div>
                                                    <div style={{ color: '#666' }}>
                                                        {item.AnswerText}
                                                    </div>
                                                    <div style={{ color: '#999', fontSize: '12px', marginTop: '4px' }}>
                                                        {moment(item.SubmittedAt).fromNow()}
                                                    </div>
                                                </div>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                        ) : (
                            <Empty description="Chưa có hoạt động gần đây" />
                        )}
                    </div>
                )}
            </Drawer>
        </div>
    );
};

export default SurveyManagement; 