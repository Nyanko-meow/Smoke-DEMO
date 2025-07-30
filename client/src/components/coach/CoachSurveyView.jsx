import React, { useState, useEffect } from 'react';
import {
    Card,
    Table,
    Button,
    Input,
    Typography,
    Modal,
    Space,
    Tag,
    Alert,
    Spin,
    Empty,
    Statistic,
    Row,
    Col,
    Avatar,
    Badge,
    Descriptions,
    Divider,
    message,
    Timeline,
    Progress
} from 'antd';
import {
    SearchOutlined,
    EyeOutlined,
    UserOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    BarChartOutlined,
    FileTextOutlined,
    QuestionCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import './CoachSurveyView.css';

const { Title, Text } = Typography;
const { Search } = Input;

const CoachSurveyView = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });

    // Modal states
    const [selectedMember, setSelectedMember] = useState(null);
    const [memberSurveyVisible, setMemberSurveyVisible] = useState(false);
    const [memberSurveyAnswers, setMemberSurveyAnswers] = useState([]);
    const [memberSurveyLoading, setMemberSurveyLoading] = useState(false);

    // Statistics states
    const [overviewStats, setOverviewStats] = useState(null);
    const [recentActivities, setRecentActivities] = useState([]);

    useEffect(() => {
        fetchMemberSurveys();
        fetchSurveyOverview();
    }, [pagination.current, pagination.pageSize, searchText]);

    const fetchMemberSurveys = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('coachToken');
            const response = await axios.get('http://localhost:4000/api/coach/member-surveys', {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page: pagination.current,
                    limit: pagination.pageSize,
                    search: searchText
                }
            });

            console.log('🔍 Member surveys response:', response.data);
            console.log('📊 Members data:', response.data.members);

            // Log each member's UserID
            if (response.data.members && response.data.members.length > 0) {
                response.data.members.forEach((member, index) => {
                    console.log(`👤 Member ${index + 1}:`, {
                        UserID: member.UserID,
                        FirstName: member.FirstName,
                        LastName: member.LastName,
                        Email: member.Email
                    });
                });
            }

            setMembers(response.data.members || []);
            setPagination(prev => ({
                ...prev,
                total: response.data.pagination?.total || 0
            }));
        } catch (error) {
            console.error('Error fetching member surveys:', error);
            message.error('Không thể tải danh sách khảo sát thành viên');
        } finally {
            setLoading(false);
        }
    };

    const fetchSurveyOverview = async () => {
        try {
            const token = localStorage.getItem('coachToken');
            const response = await axios.get('http://localhost:4000/api/coach/survey-overview', {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('📊 Survey overview response:', response.data);
            setOverviewStats(response.data.statistics || {});
            setRecentActivities(response.data.recentActivities || []);
        } catch (error) {
            console.error('Error fetching survey overview:', error);
        }
    };

    const fetchMemberSurveyDetails = async (memberId) => {
        console.log('🔍 fetchMemberSurveyDetails called with memberId:', memberId, typeof memberId);

        setMemberSurveyLoading(true);
        try {
            const token = localStorage.getItem('coachToken');
            console.log('🔑 Using token:', token ? 'Token exists' : 'No token found');

            const url = `http://localhost:4000/api/coach/member-surveys/${memberId}`;
            console.log('🌐 Requesting URL:', url);

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('📋 Member survey details response:', response.data);
            setSelectedMember(response.data.member);
            setMemberSurveyAnswers(response.data.answers || []);
            setMemberSurveyVisible(true);
        } catch (error) {
            console.error('❌ Error fetching member survey details:', error);
            console.error('❌ Error response:', error.response?.data);
            console.error('❌ Error status:', error.response?.status);
            message.error('Không thể tải chi tiết khảo sát của thành viên');
        } finally {
            setMemberSurveyLoading(false);
        }
    };

    const handleSearch = (value) => {
        setSearchText(value);
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const handleTableChange = (newPagination) => {
        setPagination(newPagination);
    };

    const getCompletionRate = (totalAnswers) => {
        const totalQuestions = memberSurveyAnswers.length || 10; // Fallback to 10 if not available
        return totalAnswers > 0 ? Math.round((totalAnswers / totalQuestions) * 100) : 0;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Chưa có';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const columns = [
        {
            title: 'Thành viên',
            key: 'member',
            render: (_, record) => (
                <Space>
                    <Avatar
                        icon={<UserOutlined />}
                        src={record.Avatar}
                        className="coach-survey-avatar"
                    />
                    <div>
                        <Text strong>{record.FirstName} {record.LastName}</Text>
                        <br />
                        <Text type="secondary" className="coach-survey-email">{record.Email}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Trạng thái thành viên',
            dataIndex: 'MembershipStatus',
            key: 'status',
            render: (status) => (
                <Tag
                    color={status === 'active' ? 'green' : 'orange'}
                    icon={status === 'active' ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                >
                    {status === 'active' ? 'Đang hoạt động' : 'Chờ kích hoạt'}
                </Tag>
            ),
        },
        {
            title: 'Số câu đã trả lời',
            dataIndex: 'TotalAnswers',
            key: 'totalAnswers',
            render: (totalAnswers) => (
                <Space>
                    <Badge
                        count={totalAnswers || 0}
                        showZero
                        style={{ backgroundColor: totalAnswers > 5 ? '#52c41a' : '#faad14' }}
                    />
                    <Progress
                        percent={getCompletionRate(totalAnswers || 0)}
                        size="small"
                        style={{ width: 60 }}
                    />
                </Space>
            ),
        },
        {
            title: 'Cập nhật cuối',
            dataIndex: 'LastSurveyUpdate',
            key: 'lastUpdate',
            render: (date) => (
                <Space>
                    <CalendarOutlined />
                    <Text>{formatDate(date)}</Text>
                </Space>
            ),
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_, record) => (
                <Button
                    type="primary"
                    icon={<EyeOutlined />}
                    onClick={() => fetchMemberSurveyDetails(record.UserID)}
                    className="coach-btn-primary"
                >
                    Xem khảo sát
                </Button>
            ),
        },
    ];

    const renderSurveyModal = () => {
        if (!selectedMember) return null;

        const answeredQuestions = memberSurveyAnswers.filter(q => q.AnswerText && q.AnswerText.trim());
        const completionRate = memberSurveyAnswers.length > 0
            ? Math.round((answeredQuestions.length / memberSurveyAnswers.length) * 100)
            : 0;

        return (
            <Modal
                title={
                    <Space className="coach-survey-modal-title">
                        <Avatar
                            icon={<UserOutlined />}
                            src={selectedMember.Avatar}
                            size="large"
                        />
                        <div>
                            <Title level={4} style={{ margin: 0 }}>
                                Khảo sát của {selectedMember.FirstName} {selectedMember.LastName}
                            </Title>
                            <Text type="secondary">{selectedMember.Email}</Text>
                        </div>
                    </Space>
                }
                open={memberSurveyVisible}
                onCancel={() => setMemberSurveyVisible(false)}
                width={900}
                footer={[
                    <Button key="close" onClick={() => setMemberSurveyVisible(false)}>
                        Đóng
                    </Button>
                ]}
                className="coach-survey-modal"
            >
                <Spin spinning={memberSurveyLoading}>
                    {selectedMember && (
                        <>
                            {/* Member Info Section */}
                            <Card className="coach-survey-member-info" style={{ marginBottom: 24 }}>
                                <Row gutter={[24, 16]}>
                                    <Col span={8}>
                                        <Statistic
                                            title="Tỷ lệ hoàn thành"
                                            value={completionRate}
                                            suffix="%"
                                            valueStyle={{ color: completionRate > 70 ? '#3f8600' : '#cf1322' }}
                                            prefix={<BarChartOutlined />}
                                        />
                                    </Col>
                                    <Col span={8}>
                                        <Statistic
                                            title="Câu đã trả lời"
                                            value={answeredQuestions.length}
                                            suffix={`/ ${memberSurveyAnswers.length}`}
                                            prefix={<CheckCircleOutlined />}
                                        />
                                    </Col>
                                    <Col span={8}>
                                        <Statistic
                                            title="Ngày tham gia"
                                            value={formatDate(selectedMember.CreatedAt)}
                                            prefix={<CalendarOutlined />}
                                        />
                                    </Col>
                                </Row>

                                <Progress
                                    percent={completionRate}
                                    strokeColor={{
                                        '0%': '#108ee9',
                                        '100%': '#87d068',
                                    }}
                                    style={{ marginTop: 16 }}
                                />
                            </Card>

                            {/* Survey Questions and Answers */}
                            <Card title={
                                <Space>
                                    <FileTextOutlined />
                                    <span>Chi tiết câu trả lời khảo sát</span>
                                </Space>
                            }>
                                {memberSurveyAnswers.length > 0 ? (
                                    <div className="coach-survey-questions">
                                        {memberSurveyAnswers.map((item, index) => (
                                            <div key={item.QuestionID} className="coach-survey-question-item">
                                                <div className="coach-survey-question">
                                                    <Space>
                                                        <Badge
                                                            count={index + 1}
                                                            style={{ backgroundColor: '#667eea' }}
                                                        />
                                                        <Text strong>{item.QuestionText}</Text>
                                                        {item.AnswerText ? (
                                                            <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                                        ) : (
                                                            <QuestionCircleOutlined style={{ color: '#faad14' }} />
                                                        )}
                                                    </Space>
                                                </div>

                                                <div className="coach-survey-answer">
                                                    {item.AnswerText ? (
                                                        <div>
                                                            <Text>{item.AnswerText}</Text>
                                                            {item.SubmittedAt && (
                                                                <div style={{ marginTop: 8 }}>
                                                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                                                        <CalendarOutlined style={{ marginRight: 4 }} />
                                                                        Trả lời lúc: {formatDate(item.SubmittedAt)}
                                                                    </Text>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <Text type="secondary" italic>
                                                            Thành viên chưa trả lời câu hỏi này
                                                        </Text>
                                                    )}
                                                </div>

                                                {index < memberSurveyAnswers.length - 1 && <Divider />}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <Empty
                                        description="Không có dữ liệu khảo sát"
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    />
                                )}
                            </Card>
                        </>
                    )}
                </Spin>
            </Modal>
        );
    };

    return (
        <div className="coach-survey-view">
            {/* Overview Statistics */}
            {overviewStats && (
                <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="coach-stat-card">
                            <Statistic
                                title="Tổng thành viên"
                                value={overviewStats.TotalMembers || 0}
                                prefix={<UserOutlined className="coach-stat-icon primary" />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="coach-stat-card">
                            <Statistic
                                title="Đã làm khảo sát"
                                value={overviewStats.MembersWithSurveys || 0}
                                prefix={<FileTextOutlined className="coach-stat-icon success" />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="coach-stat-card">
                            <Statistic
                                title="Tổng câu trả lời"
                                value={overviewStats.TotalAnswers || 0}
                                prefix={<CheckCircleOutlined className="coach-stat-icon info" />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className="coach-stat-card">
                            <Statistic
                                title="TB câu/thành viên"
                                value={Math.round(overviewStats.AvgAnswersPerMember || 0)}
                                prefix={<BarChartOutlined className="coach-stat-icon warning" />}
                            />
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Main Content */}
            <Card
                title={
                    <Space>
                        <FileTextOutlined />
                        <span>Khảo sát của thành viên</span>
                    </Space>
                }
                className="coach-card"
                extra={
                    <Search
                        placeholder="Tìm kiếm thành viên..."
                        allowClear
                        onSearch={handleSearch}
                        style={{ width: 300 }}
                        enterButton={<SearchOutlined />}
                    />
                }
            >
                <Alert
                    message="Thông tin khảo sát thành viên"
                    description="Đây là danh sách khảo sát của các thành viên được phân công cho bạn. Bạn có thể xem chi tiết câu trả lời để hiểu rõ hơn về thói quen và nhu cầu của từng thành viên."
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
                />

                <Table
                    columns={columns}
                    dataSource={members}
                    rowKey="UserID"
                    loading={loading}
                    pagination={{
                        ...pagination,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} của ${total} thành viên`,
                    }}
                    onChange={handleTableChange}
                    className="coach-table"
                />
            </Card>

            {/* Recent Activities */}
            {recentActivities && recentActivities.length > 0 && (
                <Card
                    title={
                        <Space>
                            <ClockCircleOutlined />
                            <span>Hoạt động khảo sát gần đây</span>
                        </Space>
                    }
                    className="coach-card"
                    style={{ marginTop: 24 }}
                >
                    <Timeline
                        items={recentActivities.map((activity, index) => ({
                            key: index,
                            children: (
                                <div>
                                    <Text strong>{activity.MemberName}</Text>
                                    <Text type="secondary"> đã trả lời: </Text>
                                    <Text>{activity.QuestionText}</Text>
                                    <br />
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                        {formatDate(activity.SubmittedAt)}
                                    </Text>
                                </div>
                            ),
                            color: index === 0 ? 'green' : 'blue'
                        }))}
                    />
                </Card>
            )}

            {/* Survey Detail Modal */}
            {renderSurveyModal()}
        </div>
    );
};

export default CoachSurveyView; 