import React, { useState, useEffect } from 'react';
import {
    Card,
    Typography,
    Row,
    Col,
    Rate,
    Avatar,
    Tag,
    Pagination,
    Spin,
    Empty,
    Statistic,
    Progress,
    Divider,
    Space,
    Button,
    Modal,
    message,
    Badge,
    Tooltip,
    Select
} from 'antd';
import {
    StarOutlined,
    UserOutlined,
    CalendarOutlined,
    MessageOutlined,
    TrophyOutlined,
    EyeOutlined,
    FilterOutlined,
    BarChartOutlined
} from '@ant-design/icons';
import axios from 'axios';
import './CoachFeedbackView.css';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const CoachFeedbackView = () => {
    const [loading, setLoading] = useState(true);
    const [feedbackData, setFeedbackData] = useState([]);
    const [statistics, setStatistics] = useState({});
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [filterStatus, setFilterStatus] = useState('active');

    useEffect(() => {
        loadFeedback();
    }, [pagination.current, pagination.pageSize, filterStatus]);

    const loadFeedback = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('coachToken');

            const response = await axios.get('http://smokeking.wibu.me:4000/api/coach/feedback', {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                params: {
                    page: pagination.current,
                    limit: pagination.pageSize,
                    status: filterStatus
                }
            });

            if (response.data.success) {
                setFeedbackData(response.data.data.feedback);
                setStatistics(response.data.data.statistics);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.data.pagination.total
                }));
            } else {
                message.error(response.data.message || 'Lỗi khi tải đánh giá');
            }
        } catch (error) {
            console.error('Error loading feedback:', error);
            message.error('Lỗi khi tải đánh giá từ thành viên');
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (page, pageSize) => {
        setPagination(prev => ({
            ...prev,
            current: page,
            pageSize: pageSize
        }));
    };

    const handleViewDetail = (feedback) => {
        setSelectedFeedback(feedback);
        setDetailModalVisible(true);
    };

    const getRatingColor = (rating) => {
        if (rating >= 4.5) return '#52c41a';
        if (rating >= 3.5) return '#faad14';
        if (rating >= 2.5) return '#fa8c16';
        return '#f5222d';
    };

    const getRatingText = (rating) => {
        if (rating >= 4.5) return 'Xuất sắc';
        if (rating >= 3.5) return 'Tốt';
        if (rating >= 2.5) return 'Trung bình';
        return 'Cần cải thiện';
    };

    const renderStatistics = () => (
        <Row gutter={[24, 24]} className="mb-6">
            <Col xs={24} sm={12} lg={6}>
                <Card className="text-center shadow-md hover:shadow-lg transition-shadow">
                    <Statistic
                        title="Tổng đánh giá"
                        value={statistics.totalReviews || 0}
                        prefix={<MessageOutlined className="text-blue-500" />}
                        valueStyle={{ color: '#1890ff' }}
                    />
                </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
                <Card className="text-center shadow-md hover:shadow-lg transition-shadow">
                    <Statistic
                        title="Điểm trung bình"
                        value={statistics.averageRating || 0}
                        precision={1}
                        suffix="/ 5"
                        prefix={<StarOutlined className="text-yellow-500" />}
                        valueStyle={{ color: getRatingColor(statistics.averageRating) }}
                    />
                </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
                <Card className="text-center shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-center mb-2">
                        <TrophyOutlined className="text-green-500 text-xl mr-2" />
                        <span className="text-gray-600">Đánh giá 5 sao</span>
                    </div>
                    <div className="text-2xl font-bold text-green-500">
                        {statistics.ratingDistribution?.[5] || 0}
                    </div>
                </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
                <Card className="text-center shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-center mb-2">
                        <BarChartOutlined className="text-purple-500 text-xl mr-2" />
                        <span className="text-gray-600">Tỷ lệ hài lòng</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-500">
                        {statistics.totalReviews > 0
                            ? Math.round(((statistics.ratingDistribution?.[4] || 0) + (statistics.ratingDistribution?.[5] || 0)) / statistics.totalReviews * 100)
                            : 0}%
                    </div>
                </Card>
            </Col>
        </Row>
    );

    const renderRatingDistribution = () => (
        <Card title="Phân bố đánh giá" className="mb-6 shadow-md">
            <div className="space-y-3">
                {[5, 4, 3, 2, 1].map(star => {
                    const count = statistics.ratingDistribution?.[star] || 0;
                    const percentage = statistics.totalReviews > 0 ? (count / statistics.totalReviews * 100) : 0;

                    return (
                        <div key={star} className="flex items-center">
                            <div className="flex items-center w-16">
                                <span className="mr-2">{star}</span>
                                <StarOutlined className="text-yellow-500" />
                            </div>
                            <div className="flex-1 mx-4">
                                <Progress
                                    percent={percentage}
                                    showInfo={false}
                                    strokeColor={getRatingColor(star)}
                                    trailColor="#f0f0f0"
                                />
                            </div>
                            <div className="w-16 text-right">
                                <Text strong>{count}</Text>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );

    const renderFeedbackCard = (feedback) => (
        <Card
            key={feedback.FeedbackID}
            className="mb-4 shadow-md hover:shadow-lg transition-shadow"
            actions={[
                <Button
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewDetail(feedback)}
                >
                    Xem chi tiết
                </Button>
            ]}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                    <Avatar
                        size={48}
                        src={feedback.MemberAvatar}
                        icon={<UserOutlined />}
                        className="border-2 border-gray-200"
                    />
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <Text strong className="text-lg">{feedback.MemberName}</Text>
                                {feedback.AppointmentDate && (
                                    <div className="flex items-center mt-1 text-gray-500">
                                        <CalendarOutlined className="mr-1" />
                                        <Text className="text-sm">
                                            Buổi tư vấn: {new Date(feedback.AppointmentDate).toLocaleDateString('vi-VN')}
                                        </Text>
                                    </div>
                                )}
                            </div>
                            <div className="text-right">
                                <div className="flex items-center mb-1">
                                    <Rate disabled value={feedback.Rating} className="text-sm" />
                                    <Text strong className="ml-2" style={{ color: getRatingColor(feedback.Rating) }}>
                                        {feedback.Rating}/5
                                    </Text>
                                </div>
                                <Tag color={getRatingColor(feedback.Rating) === '#52c41a' ? 'green' :
                                    getRatingColor(feedback.Rating) === '#faad14' ? 'gold' :
                                        getRatingColor(feedback.Rating) === '#fa8c16' ? 'orange' : 'red'}>
                                    {getRatingText(feedback.Rating)}
                                </Tag>
                            </div>
                        </div>

                        {feedback.Comment && (
                            <div className="mb-3">
                                <Paragraph
                                    ellipsis={{ rows: 2, expandable: true, symbol: 'Xem thêm' }}
                                    className="text-gray-700 mb-0"
                                >
                                    {feedback.Comment}
                                </Paragraph>
                            </div>
                        )}

                        {feedback.Categories && (
                            <div className="mb-3">
                                <Text className="text-sm text-gray-500 mb-2 block">Đánh giá chi tiết:</Text>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(feedback.Categories).map(([key, value]) => {
                                        const categoryLabels = {
                                            professionalism: 'Chuyên nghiệp',
                                            helpfulness: 'Hữu ích',
                                            communication: 'Giao tiếp',
                                            knowledge: 'Kiến thức'
                                        };

                                        return (
                                            <div key={key} className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">{categoryLabels[key]}:</span>
                                                <div className="flex items-center">
                                                    <Rate disabled value={value} className="text-xs" />
                                                    <span className="ml-1 text-gray-500">{value}/5</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center">
                                <CalendarOutlined className="mr-1" />
                                <span>Đánh giá vào: {new Date(feedback.CreatedAt).toLocaleDateString('vi-VN')}</span>
                            </div>
                            {feedback.AppointmentType && (
                                <Tag color="blue">{feedback.AppointmentType}</Tag>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );

    const renderDetailModal = () => (
        <Modal
            title={
                <div className="flex items-center">
                    <MessageOutlined className="mr-2" />
                    <span>Chi tiết đánh giá</span>
                </div>
            }
            open={detailModalVisible}
            onCancel={() => setDetailModalVisible(false)}
            footer={null}
            width={600}
        >
            {selectedFeedback && (
                <div>
                    <div className="flex items-center mb-4">
                        <Avatar
                            size={64}
                            src={selectedFeedback.MemberAvatar}
                            icon={<UserOutlined />}
                            className="mr-4"
                        />
                        <div>
                            <Title level={4} className="mb-1">{selectedFeedback.MemberName}</Title>
                            <div className="flex items-center">
                                <Rate disabled value={selectedFeedback.Rating} />
                                <Text strong className="ml-2" style={{ color: getRatingColor(selectedFeedback.Rating) }}>
                                    {selectedFeedback.Rating}/5 - {getRatingText(selectedFeedback.Rating)}
                                </Text>
                            </div>
                        </div>
                    </div>

                    <Divider />

                    {selectedFeedback.Comment && (
                        <>
                            <Title level={5}>Nhận xét:</Title>
                            <Paragraph className="bg-gray-50 p-3 rounded-lg">
                                {selectedFeedback.Comment}
                            </Paragraph>
                        </>
                    )}

                    {selectedFeedback.Categories && (
                        <>
                            <Title level={5}>Đánh giá chi tiết:</Title>
                            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                {Object.entries(selectedFeedback.Categories).map(([key, value]) => {
                                    const categoryLabels = {
                                        professionalism: 'Tính chuyên nghiệp',
                                        helpfulness: 'Tính hữu ích',
                                        communication: 'Kỹ năng giao tiếp',
                                        knowledge: 'Kiến thức chuyên môn'
                                    };

                                    return (
                                        <div key={key} className="flex items-center justify-between">
                                            <span className="font-medium">{categoryLabels[key]}:</span>
                                            <div className="flex items-center">
                                                <Rate disabled value={value} />
                                                <span className="ml-2 font-bold">{value}/5</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    <Divider />

                    <div className="text-sm text-gray-500">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <CalendarOutlined className="mr-1" />
                                <span>Đánh giá vào: {new Date(selectedFeedback.CreatedAt).toLocaleDateString('vi-VN')}</span>
                            </div>
                            {selectedFeedback.AppointmentDate && (
                                <div className="flex items-center">
                                    <CalendarOutlined className="mr-1" />
                                    <span>Buổi tư vấn: {new Date(selectedFeedback.AppointmentDate).toLocaleDateString('vi-VN')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <Title level={2} className="mb-2">Đánh giá từ thành viên</Title>
                    <Text className="text-gray-600">
                        Xem và quản lý tất cả đánh giá từ các thành viên đã tư vấn
                    </Text>
                </div>
                <div className="flex items-center space-x-3">
                    <Select
                        value={filterStatus}
                        onChange={setFilterStatus}
                        style={{ width: 150 }}
                        prefix={<FilterOutlined />}
                    >
                        <Option value="active">Đang hiển thị</Option>
                        <Option value="hidden">Đã ẩn</Option>
                        <Option value="deleted">Đã xóa</Option>
                    </Select>
                </div>
            </div>

            {/* Statistics */}
            {renderStatistics()}

            <Row gutter={[24, 24]}>
                {/* Rating Distribution */}
                <Col xs={24} lg={8}>
                    {renderRatingDistribution()}
                </Col>

                {/* Feedback List */}
                <Col xs={24} lg={16}>
                    <Card title="Danh sách đánh giá" className="shadow-md">
                        <Spin spinning={loading}>
                            {feedbackData.length > 0 ? (
                                <>
                                    {feedbackData.map(renderFeedbackCard)}

                                    <div className="text-center mt-6">
                                        <Pagination
                                            current={pagination.current}
                                            pageSize={pagination.pageSize}
                                            total={pagination.total}
                                            onChange={handlePageChange}
                                            showSizeChanger
                                            showQuickJumper
                                            showTotal={(total, range) =>
                                                `${range[0]}-${range[1]} của ${total} đánh giá`
                                            }
                                        />
                                    </div>
                                </>
                            ) : (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description="Chưa có đánh giá nào"
                                />
                            )}
                        </Spin>
                    </Card>
                </Col>
            </Row>

            {/* Detail Modal */}
            {renderDetailModal()}
        </div>
    );
};

export default CoachFeedbackView; 