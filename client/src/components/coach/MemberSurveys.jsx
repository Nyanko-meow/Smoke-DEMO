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
    Avatar,
    message,
    Progress,
    Empty
} from 'antd';
import {
    SearchOutlined,
    EyeOutlined,
    FileTextOutlined,
    UserOutlined,
    ClockCircleOutlined,
    TeamOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { Title, Text } = Typography;

const MemberSurveys = () => {
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

    // Statistics
    const [statistics, setStatistics] = useState(null);

    useEffect(() => {
        fetchMembers();
        fetchOverview();
    }, [pagination.current, pagination.pageSize, searchText]);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/coach/member-surveys', {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page: pagination.current,
                    limit: pagination.pageSize,
                    search: searchText
                }
            });

            setMembers(response.data.members);
            setPagination(prev => ({
                ...prev,
                total: response.data.pagination.total
            }));
        } catch (error) {
            console.error('Error fetching members:', error);
            message.error('Không thể tải danh sách members');
        } finally {
            setLoading(false);
        }
    };

    const fetchOverview = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/coach/survey-overview', {
                headers: { Authorization: `Bearer ${token}` }
            });

            setStatistics(response.data.statistics);
        } catch (error) {
            console.error('Error fetching overview:', error);
        }
    };

    const fetchMemberSurvey = async (memberId) => {
        setMemberSurveyLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/api/coach/member-surveys/${memberId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSelectedMember(response.data.member);
            setMemberSurveyAnswers(response.data.answers);
            setMemberSurveyVisible(true);
        } catch (error) {
            console.error('Error fetching member survey:', error);
            message.error('Không thể tải thông tin khảo sát của member');
        } finally {
            setMemberSurveyLoading(false);
        }
    };

    const handleTableChange = (newPagination) => {
        setPagination(newPagination);
    };

    const handleSearch = (value) => {
        setSearchText(value);
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const getCompletionRate = (totalAnswers, totalQuestions = 10) => {
        return Math.round((totalAnswers / totalQuestions) * 100);
    };

    const getMembershipStatusColor = (status) => {
        const colors = {
            'active': 'green',
            'expired': 'red',
            'cancelled': 'orange'
        };
        return colors[status] || 'default';
    };

    const columns = [
        {
            title: 'Member',
            key: 'member',
            render: (_, record) => (
                <Space>
                    <Avatar icon={<UserOutlined />} />
                    <div>
                        <div className="font-medium">
                            {record.FirstName} {record.LastName}
                        </div>
                        <div className="text-gray-500 text-sm">
                            {record.Email}
                        </div>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Trạng thái Membership',
            key: 'membershipStatus',
            render: (_, record) => (
                <div>
                    <Tag color={getMembershipStatusColor(record.MembershipStatus)}>
                        {record.MembershipStatus}
                    </Tag>
                    <div className="text-xs text-gray-500 mt-1">
                        {moment(record.MembershipStart).format('DD/MM/YYYY')} - {moment(record.MembershipEnd).format('DD/MM/YYYY')}
                    </div>
                </div>
            ),
        },
        {
            title: 'Tiến độ khảo sát',
            key: 'surveyProgress',
            render: (_, record) => (
                <div>
                    <Text strong>{record.TotalAnswers || 0}/10 câu</Text>
                    <div>
                        <Progress
                            percent={getCompletionRate(record.TotalAnswers || 0)}
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
            render: (date) => date ? moment(date).format('DD/MM/YYYY HH:mm') : 'Chưa có dữ liệu',
        },
        {
            title: 'Thao tác',
            key: 'actions',
            render: (_, record) => (
                <Button
                    type="primary"
                    icon={<EyeOutlined />}
                    onClick={() => fetchMemberSurvey(record.UserID)}
                    loading={memberSurveyLoading}
                >
                    Xem khảo sát
                </Button>
            ),
        },
    ];

    return (
        <div className="member-surveys">
            {/* Statistics Overview */}
            {statistics && (
                <Row gutter={16} className="mb-6">
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Tổng số Members"
                                value={statistics.TotalMembers}
                                prefix={<TeamOutlined />}
                                valueStyle={{ color: '#3f8600' }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Đã làm khảo sát"
                                value={statistics.MembersWithSurveys}
                                suffix={`/${statistics.TotalMembers}`}
                                valueStyle={{ color: '#1890ff' }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Tổng câu trả lời"
                                value={statistics.TotalAnswers}
                                valueStyle={{ color: '#722ed1' }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Trung bình/Member"
                                value={statistics.AvgAnswersPerMember}
                                precision={1}
                                suffix="câu"
                                valueStyle={{ color: '#f5222d' }}
                            />
                        </Card>
                    </Col>
                </Row>
            )}

            <Card>
                <div className="flex justify-between items-center mb-6">
                    <Title level={3} className="!mb-0">
                        <FileTextOutlined className="mr-2" />
                        Khảo sát của Members
                    </Title>
                </div>

                <div className="mb-4">
                    <Input.Search
                        placeholder="Tìm kiếm member theo tên hoặc email..."
                        allowClear
                        enterButton={<SearchOutlined />}
                        size="large"
                        onSearch={handleSearch}
                        className="max-w-md"
                    />
                </div>

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
                            `${range[0]}-${range[1]} của ${total} members`,
                    }}
                    onChange={handleTableChange}
                    locale={{
                        emptyText: (
                            <Empty
                                description="Chưa có member nào"
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                        )
                    }}
                />
            </Card>

            {/* Member Survey Detail Modal */}
            <Modal
                title={
                    selectedMember ? (
                        <div>
                            <UserOutlined className="mr-2" />
                            Khảo sát của {selectedMember.FirstName} {selectedMember.LastName}
                        </div>
                    ) : 'Chi tiết khảo sát'
                }
                open={memberSurveyVisible}
                onCancel={() => setMemberSurveyVisible(false)}
                footer={null}
                width={800}
                className="survey-detail-modal"
            >
                {selectedMember && (
                    <div className="mb-4 p-4 bg-gray-50 rounded">
                        <Row gutter={16}>
                            <Col span={12}>
                                <Text strong>Email: </Text>
                                <Text>{selectedMember.Email}</Text>
                            </Col>
                            <Col span={12}>
                                <Text strong>Trạng thái Membership: </Text>
                                <Tag color={getMembershipStatusColor(selectedMember.MembershipStatus)}>
                                    {selectedMember.MembershipStatus}
                                </Tag>
                            </Col>
                            <Col span={12}>
                                <Text strong>Thời gian Membership: </Text>
                                <Text>
                                    {moment(selectedMember.StartDate).format('DD/MM/YYYY')} - {moment(selectedMember.EndDate).format('DD/MM/YYYY')}
                                </Text>
                            </Col>
                        </Row>
                    </div>
                )}

                <div className="max-h-96 overflow-y-auto">
                    {memberSurveyAnswers.length > 0 ? (
                        memberSurveyAnswers.map((item, index) => (
                            <Card
                                key={item.QuestionID}
                                size="small"
                                className="mb-3"
                                title={`Câu ${index + 1}`}
                            >
                                <div className="mb-2">
                                    <Text strong>{item.QuestionText}</Text>
                                    {item.Category && (
                                        <Tag className="ml-2" color="blue">
                                            {item.Category}
                                        </Tag>
                                    )}
                                </div>

                                <div className="p-3 bg-blue-50 rounded">
                                    {item.AnswerText ? (
                                        <Text>{item.AnswerText}</Text>
                                    ) : (
                                        <Text type="secondary" italic>
                                            Chưa trả lời
                                        </Text>
                                    )}
                                </div>

                                {item.SubmittedAt && (
                                    <div className="mt-2 text-right">
                                        <Text type="secondary" size="small">
                                            <ClockCircleOutlined className="mr-1" />
                                            {moment(item.SubmittedAt).format('DD/MM/YYYY HH:mm')}
                                        </Text>
                                    </div>
                                )}
                            </Card>
                        ))
                    ) : (
                        <Empty
                            description="Member này chưa trả lời câu hỏi khảo sát nào"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default MemberSurveys; 