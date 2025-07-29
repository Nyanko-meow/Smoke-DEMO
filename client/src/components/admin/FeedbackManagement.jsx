import React, { useState, useEffect } from 'react';
import {
    Table,
    Card,
    Button,
    Input,
    Space,
    Tag,
    Rate,
    Avatar,
    Row,
    Col,
    Statistic,
    Progress,
    Modal,
    Typography,
    Divider,
    Popconfirm,
    message,
    Tooltip
} from 'antd';
import {
    SearchOutlined,
    ReloadOutlined,
    EyeOutlined,
    DeleteOutlined,
    UserOutlined,
    StarOutlined,
    CommentOutlined,
    TeamOutlined,
    MessageOutlined,
    CalendarOutlined
} from '@ant-design/icons';
import moment from 'moment';
import axios from 'axios';

const { Text, Paragraph, Title } = Typography;

const FeedbackManagement = () => {
    const [loading, setLoading] = useState(false);
    const [feedbacks, setFeedbacks] = useState([]);
    const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [stats, setStats] = useState({
        totalFeedbacks: 0,
        averageRating: 0,
        ratingDistribution: {},
        topRatedCoaches: [],
        recentFeedbacks: 0
    });
    const [coaches, setCoaches] = useState([]);
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        loadFeedbacks();
        loadCoaches();
        loadFeedbackStats();
    }, []);

    useEffect(() => {
        applySearch();
    }, [feedbacks, searchText]);

    const loadFeedbacks = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');

            const response = await axios.get('http://smokeking.wibu.me:4000/api/admin/feedbacks', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                setFeedbacks(response.data.data);
            } else {
                message.error('Không thể tải danh sách phản hồi');
            }
        } catch (error) {
            console.error('Error loading feedbacks:', error);
            message.error('Lỗi khi tải danh sách phản hồi');
        } finally {
            setLoading(false);
        }
    };

    const loadCoaches = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get('http://smokeking.wibu.me:4000/api/admin/coaches', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                setCoaches(response.data.data);
            }
        } catch (error) {
            console.error('Error loading coaches:', error);
        }
    };

    const loadFeedbackStats = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get('http://smokeking.wibu.me:4000/api/admin/feedback-stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Error loading feedback stats:', error);
        }
    };

    const applySearch = () => {
        let filtered = [...feedbacks];

        // Apply search filter
        if (searchText) {
            filtered = filtered.filter(feedback =>
                feedback.MemberName?.toLowerCase().includes(searchText.toLowerCase()) ||
                feedback.MemberEmail?.toLowerCase().includes(searchText.toLowerCase()) ||
                feedback.CoachName?.toLowerCase().includes(searchText.toLowerCase()) ||
                feedback.Comment?.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        setFilteredFeedbacks(filtered);
    };

    const handleViewDetail = (feedback) => {
        setSelectedFeedback(feedback);
        setDetailModalVisible(true);
    };

    const handleDeleteFeedback = async (feedbackId) => {
        try {
            const token = localStorage.getItem('adminToken');

            const response = await axios.delete(`http://smokeking.wibu.me:4000/api/admin/feedbacks/${feedbackId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                message.success('Xóa phản hồi thành công');
                loadFeedbacks();
                loadFeedbackStats();
            } else {
                message.error('Không thể xóa phản hồi');
            }
        } catch (error) {
            console.error('Error deleting feedback:', error);
            message.error('Lỗi khi xóa phản hồi');
        }
    };

    const confirmDelete = (feedback) => {
        Modal.confirm({
            title: 'Xác nhận xóa phản hồi',
            content: `Bạn có chắc chắn muốn xóa phản hồi của ${feedback.MemberName}?`,
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk() {
                handleDeleteFeedback(feedback.FeedbackID);
            },
        });
    };

    const columns = [
        {
            title: 'Người đánh giá',
            dataIndex: 'MemberName',
            key: 'member',
            render: (text, record) => (
                <Space>
                    <Avatar
                        src={record.MemberAvatar}
                        icon={<UserOutlined />}
                        size="small"
                    />
                    <div>
                        <div>{text}</div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            {record.MemberEmail}
                        </Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Coach được đánh giá',
            dataIndex: 'CoachName',
            key: 'coach',
            render: (text, record) => (
                <Space>
                    <Avatar
                        src={record.CoachAvatar}
                        icon={<UserOutlined />}
                        size="small"
                    />
                    {text}
                </Space>
            ),
        },
        {
            title: 'Đánh giá',
            dataIndex: 'Rating',
            key: 'rating',
            render: (rating) => (
                <Space>
                    <Rate disabled defaultValue={rating} style={{ fontSize: '14px' }} />
                    <Text strong>({rating})</Text>
                </Space>
            ),
            sorter: (a, b) => a.Rating - b.Rating,
        },
        {
            title: 'Nội dung',
            dataIndex: 'Comment',
            key: 'comment',
            render: (comment) => (
                <Tooltip title={comment}>
                    <div style={{ maxWidth: '200px' }}>
                        {comment?.length > 50 ? `${comment.substring(0, 50)}...` : comment}
                    </div>
                </Tooltip>
            ),
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'CreatedAt',
            key: 'createdAt',
            render: (date) => moment(date).format('DD/MM/YYYY HH:mm'),
            sorter: (a, b) => moment(a.CreatedAt) - moment(b.CreatedAt),
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewDetail(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Xóa phản hồi">
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => confirmDelete(record)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const getRatingColor = (rating) => {
        if (rating >= 4) return '#52c41a';
        if (rating >= 3) return '#faad14';
        return '#f5222d';
    };

    return (
        <div style={{ padding: '24px' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <Title level={2}>
                    <CommentOutlined /> Quản lý Phản hồi
                </Title>
                <Text type="secondary">
                    Quản lý và theo dõi đánh giá từ người dùng dành cho các coach
                </Text>
            </div>

            {/* Statistics Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Tổng phản hồi"
                            value={stats.totalFeedbacks}
                            prefix={<MessageOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Đánh giá trung bình"
                            value={stats.averageRating}
                            precision={1}
                            suffix="/ 5"
                            prefix={<StarOutlined />}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Phản hồi gần đây"
                            value={stats.recentFeedbacks}
                            suffix="(7 ngày)"
                            prefix={<CalendarOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <div>
                            <Text strong>Chất lượng dịch vụ</Text>
                            <Progress
                                percent={(stats.averageRating / 5) * 100}
                                strokeColor={getRatingColor(stats.averageRating)}
                                style={{ marginTop: '8px' }}
                            />
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Controls */}
            <Card style={{ marginBottom: '24px' }}>
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} sm={12} lg={8}>
                        <Input
                            placeholder="Tìm kiếm theo tên, email hoặc nội dung..."
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={16}>
                        <Space wrap>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={loadFeedbacks}
                                loading={loading}
                            >
                                Làm mới
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {/* Feedback Table */}
            <Card>
                <Table
                    columns={columns}
                    dataSource={filteredFeedbacks}
                    rowKey="FeedbackID"
                    loading={loading}
                    pagination={{
                        total: filteredFeedbacks.length,
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} của ${total} phản hồi`,
                    }}
                />
            </Card>

            {/* Detail Modal */}
            <Modal
                title="Chi tiết phản hồi"
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setDetailModalVisible(false)}>
                        Đóng
                    </Button>
                ]}
                width={600}
            >
                {selectedFeedback && (
                    <div>
                        <Row gutter={[16, 16]}>
                            <Col span={12}>
                                <Card size="small" title="Người đánh giá">
                                    <Space direction="vertical" size="small">
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <Avatar
                                                src={selectedFeedback.MemberAvatar}
                                                icon={<UserOutlined />}
                                                style={{ marginRight: '8px' }}
                                            />
                                            <div>
                                                <div><strong>{selectedFeedback.MemberName}</strong></div>
                                                <Text type="secondary">{selectedFeedback.MemberEmail}</Text>
                                            </div>
                                        </div>
                                    </Space>
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card size="small" title="Coach được đánh giá">
                                    <Space direction="vertical" size="small">
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <Avatar
                                                src={selectedFeedback.CoachAvatar}
                                                icon={<UserOutlined />}
                                                style={{ marginRight: '8px' }}
                                            />
                                            <div>
                                                <div><strong>{selectedFeedback.CoachName}</strong></div>
                                                <Text type="secondary">Coach</Text>
                                            </div>
                                        </div>
                                    </Space>
                                </Card>
                            </Col>
                        </Row>

                        <Divider />

                        <div style={{ marginBottom: '16px' }}>
                            <Text strong>Đánh giá: </Text>
                            <Rate disabled defaultValue={selectedFeedback.Rating} />
                            <Text strong style={{ marginLeft: '8px' }}>
                                ({selectedFeedback.Rating}/5)
                            </Text>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <Text strong>Nội dung phản hồi:</Text>
                            <Paragraph style={{ marginTop: '8px', padding: '12px', background: '#f5f5f5', borderRadius: '6px' }}>
                                {selectedFeedback.Comment || 'Không có nội dung'}
                            </Paragraph>
                        </div>

                        <div>
                            <Text strong>Thời gian tạo: </Text>
                            <Text>{moment(selectedFeedback.CreatedAt).format('DD/MM/YYYY HH:mm:ss')}</Text>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default FeedbackManagement; 