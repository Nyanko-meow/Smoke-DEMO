import React, { useState, useEffect } from 'react';
import {
    Card,
    Button,
    Table,
    Modal,
    Form,
    DatePicker,
    Select,
    Input,
    message,
    Tag,
    Space,
    Typography,
    Row,
    Col,
    Avatar,
    Divider,
    Empty,
    Tooltip,
    Popconfirm
} from 'antd';
import {
    CalendarOutlined,
    PlusOutlined,
    VideoCameraOutlined,
    PhoneOutlined,
    MessageOutlined,
    ClockCircleOutlined,
    UserOutlined,
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    StarOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import AppointmentSuccessModal from '../chat/AppointmentSuccessModal';
import CoachFeedback from './CoachFeedback';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

const Appointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [coaches, setCoaches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [appointmentData, setAppointmentData] = useState(null);
    const [selectedCoach, setSelectedCoach] = useState(null);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        loadAppointments();
        loadCoaches();
    }, []);

    const loadAppointments = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:4000/api/chat/appointments', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                setAppointments(response.data.data);
            }
        } catch (error) {
            console.error('Error loading appointments:', error);
            message.error('Không thể tải danh sách lịch hẹn');
        } finally {
            setLoading(false);
        }
    };

    const loadCoaches = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:4000/api/coaches', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                setCoaches(response.data.data);
            }
        } catch (error) {
            console.error('Error loading coaches:', error);
            message.error('Không thể tải danh sách coach');
        }
    };

    const createAppointment = async (values) => {
        try {
            const token = localStorage.getItem('token');
            const appointmentDateTime = dayjs(values.appointmentDate).toISOString();

            console.log('📋 Creating appointment with data:', {
                receiverId: parseInt(values.coachId),
                appointmentDate: appointmentDateTime,
                duration: parseInt(values.duration),
                type: values.type,
                notes: values.notes || ''
            });

            // Try main chat appointment API first
            let response;
            try {
                response = await axios.post('http://localhost:4000/api/chat/appointment', {
                    receiverId: parseInt(values.coachId),
                    appointmentDate: appointmentDateTime,
                    duration: parseInt(values.duration),
                    type: values.type,
                    notes: values.notes || ''
                }, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            } catch (primaryError) {
                console.log('⚠️ Primary API failed, trying fallback...');
                console.log('Error:', primaryError.response?.data);

                // Fallback to coach schedule API
                const userData = JSON.parse(localStorage.getItem('user') || '{}');
                response = await axios.post('http://localhost:4000/api/coach/schedule', {
                    memberId: userData.id || 2, // Default to member ID 2 for testing
                    appointmentDate: appointmentDateTime,
                    duration: parseInt(values.duration),
                    type: values.type,
                    notes: values.notes || ''
                }, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }

            if (response.data.success) {
                setAppointmentData(response.data.data);
                setSelectedCoach(coaches.find(c => c.UserID === values.coachId));
                setShowCreateModal(false);
                setShowSuccessModal(true);
                form.resetFields();
                message.success('Đặt lịch tư vấn thành công! 🎉');
                loadAppointments();
            }
        } catch (error) {
            console.error('🚨 Error creating appointment:', error);
            console.error('🚨 Error response:', error.response);
            console.error('🚨 Error status:', error.response?.status);
            console.error('🚨 Error data:', error.response?.data);

            // Check if appointment was actually created despite the error
            setTimeout(() => {
                console.log('🔄 Checking if appointment was created...');
                loadAppointments();
            }, 1000);

            if (error.response?.status === 400) {
                message.error(error.response.data?.message || 'Thông tin đặt lịch không hợp lệ');
            } else if (error.response?.status === 409) {
                message.error('Thời gian này đã có lịch hẹn khác. Vui lòng chọn thời gian khác');
            } else if (error.response?.status === 500) {
                message.error('Lỗi server. Đang kiểm tra lại...');
                // Don't close modal immediately on 500 error
                setTimeout(() => {
                    loadAppointments();
                    setShowCreateModal(false);
                    message.success('Lịch hẹn có thể đã được tạo. Vui lòng kiểm tra danh sách!');
                }, 2000);
            } else {
                message.error('Không thể đặt lịch tư vấn. Vui lòng thử lại sau');
            }
        }
    };

    const cancelAppointment = async (appointmentId) => {
        try {
            const token = localStorage.getItem('token');

            console.log('🚫 Cancelling appointment:', appointmentId);

            const response = await axios.post(`http://localhost:4000/api/chat/appointments/${appointmentId}/cancel`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                message.success('Hủy lịch hẹn thành công');
                loadAppointments();
            }
        } catch (error) {
            console.error('🚨 Error cancelling appointment:', error);
            console.error('🚨 Error status:', error.response?.status);
            console.error('🚨 Error data:', error.response?.data);

            // Check if appointment was actually cancelled despite the error
            setTimeout(() => {
                console.log('🔄 Checking if appointment was cancelled...');
                loadAppointments();
            }, 1000);

            if (error.response?.status === 404) {
                message.error('Không tìm thấy lịch hẹn');
            } else if (error.response?.status === 400) {
                message.error(error.response.data?.message || 'Không thể hủy lịch hẹn này');
            } else if (error.response?.status === 500) {
                message.warning('Lỗi server. Đang kiểm tra lại...');
                setTimeout(() => {
                    loadAppointments();
                    message.success('Lịch hẹn có thể đã được hủy. Vui lòng kiểm tra lại!');
                }, 2000);
            } else {
                message.error('Không thể hủy lịch hẹn');
            }
        }
    };

    const handleRateCoach = (appointment) => {
        setSelectedAppointment(appointment);
        setShowFeedbackModal(true);
    };

    const handleFeedbackSuccess = () => {
        setShowFeedbackModal(false);
        setSelectedAppointment(null);
        // Optionally reload appointments to update any UI indicators
        loadAppointments();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled': return 'blue';
            case 'confirmed': return 'green';
            case 'completed': return 'purple';
            case 'cancelled': return 'red';
            default: return 'default';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'scheduled': return 'Đã lên lịch';
            case 'confirmed': return 'Đã xác nhận';
            case 'completed': return 'Hoàn thành';
            case 'cancelled': return 'Đã hủy';
            default: return status;
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'video': return <VideoCameraOutlined className="text-purple-500" />;
            case 'audio': return <PhoneOutlined className="text-green-500" />;
            default: return <MessageOutlined className="text-blue-500" />;
        }
    };

    const getTypeText = (type) => {
        switch (type) {
            case 'video': return 'Video call';
            case 'audio': return 'Audio call';
            default: return 'Chat';
        }
    };

    const columns = [
        {
            title: 'Coach',
            dataIndex: 'coach',
            key: 'coach',
            render: (coach) => (
                <div className="flex items-center space-x-3">
                    <Avatar
                        size={40}
                        src={coach?.avatar}
                        icon={<UserOutlined />}
                        className="border-2 border-blue-100"
                    />
                    <div>
                        <div className="font-medium text-gray-800">{coach?.fullName}</div>
                        <div className="text-sm text-gray-500">{coach?.email}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Thời gian',
            dataIndex: 'appointmentDate',
            key: 'appointmentDate',
            render: (date) => (
                <div>
                    <div className="font-medium text-gray-800">
                        {dayjs(date).format('DD/MM/YYYY')}
                    </div>
                    <div className="text-sm text-gray-500">
                        {dayjs(date).format('HH:mm')}
                    </div>
                </div>
            ),
        },
        {
            title: 'Thời lượng',
            dataIndex: 'duration',
            key: 'duration',
            render: (duration) => (
                <div className="flex items-center space-x-1">
                    <ClockCircleOutlined className="text-orange-500" />
                    <span>{duration} phút</span>
                </div>
            ),
        },
        {
            title: 'Loại',
            dataIndex: 'type',
            key: 'type',
            render: (type) => (
                <div className="flex items-center space-x-2">
                    {getTypeIcon(type)}
                    <span>{getTypeText(type)}</span>
                </div>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={getStatusColor(status)} className="font-medium">
                    {getStatusText(status)}
                </Tag>
            ),
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    {record.status === 'scheduled' && (
                        <Popconfirm
                            title="Bạn có chắc muốn hủy lịch hẹn này?"
                            onConfirm={() => cancelAppointment(record.id)}
                            okText="Có"
                            cancelText="Không"
                        >
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                size="small"
                            >
                                Hủy
                            </Button>
                        </Popconfirm>
                    )}
                    {record.meetingLink && (
                        <Button
                            type="link"
                            icon={<EyeOutlined />}
                            size="small"
                            onClick={() => window.open(record.meetingLink, '_blank')}
                        >
                            Tham gia
                        </Button>
                    )}
                    {(record.status === 'completed' || record.status === 'confirmed') && (
                        <Tooltip title="Đánh giá coach">
                            <Button
                                type="text"
                                icon={<StarOutlined />}
                                size="small"
                                onClick={() => handleRateCoach(record)}
                                style={{ color: '#faad14' }}
                            >
                                Đánh giá
                            </Button>
                        </Tooltip>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Title level={2} className="mb-2 text-gray-800">
                                <CalendarOutlined className="mr-3 text-blue-500" />
                                Lịch hẹn tư vấn
                            </Title>
                            <Text className="text-gray-600">
                                Quản lý và đặt lịch hẹn với các coach chuyên nghiệp
                            </Text>
                        </div>
                        <Button
                            type="primary"
                            size="large"
                            icon={<PlusOutlined />}
                            onClick={() => setShowCreateModal(true)}
                            style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                height: '48px',
                                paddingLeft: '24px',
                                paddingRight: '24px'
                            }}
                            className="hover:shadow-lg transition-all duration-200"
                        >
                            Đặt lịch mới
                        </Button>
                    </div>
                </div>

                {/* Appointments Table */}
                <Card
                    className="shadow-lg"
                    style={{ borderRadius: '12px' }}
                    bodyStyle={{ padding: '24px' }}
                >
                    <Table
                        columns={columns}
                        dataSource={appointments}
                        loading={loading}
                        rowKey="id"
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) =>
                                `${range[0]}-${range[1]} của ${total} lịch hẹn`,
                        }}
                        locale={{
                            emptyText: (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description="Chưa có lịch hẹn nào"
                                />
                            ),
                        }}
                    />
                </Card>

                {/* Create Appointment Modal */}
                <Modal
                    title={
                        <div className="flex items-center space-x-3 py-2">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <CalendarOutlined className="text-white text-lg" />
                            </div>
                            <div>
                                <div className="text-lg font-semibold text-gray-800">Đặt lịch tư vấn</div>
                                <div className="text-sm text-gray-500">Chọn coach và thời gian phù hợp</div>
                            </div>
                        </div>
                    }
                    open={showCreateModal}
                    onCancel={() => {
                        form.resetFields();
                        setShowCreateModal(false);
                    }}
                    footer={null}
                    width={600}
                    style={{ borderRadius: '16px' }}
                    bodyStyle={{ padding: '24px' }}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={createAppointment}
                        className="space-y-4"
                    >
                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item
                                    name="coachId"
                                    label={<span className="font-medium text-gray-700">Chọn Coach</span>}
                                    rules={[{ required: true, message: 'Vui lòng chọn coach' }]}
                                >
                                    <Select
                                        placeholder="Chọn coach tư vấn"
                                        style={{ height: '48px' }}
                                        optionLabelProp="label"
                                    >
                                        {coaches.map(coach => (
                                            <Option
                                                key={coach.UserID}
                                                value={coach.UserID}
                                                label={`${coach.FirstName} ${coach.LastName}`}
                                            >
                                                <div className="flex items-center space-x-3 py-2">
                                                    <Avatar
                                                        size={32}
                                                        src={coach.Avatar}
                                                        icon={<UserOutlined />}
                                                    />
                                                    <div>
                                                        <div className="font-medium">
                                                            {coach.FirstName} {coach.LastName}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {coach.Email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="appointmentDate"
                                    label={<span className="font-medium text-gray-700">Thời gian</span>}
                                    rules={[
                                        { required: true, message: 'Vui lòng chọn thời gian' },
                                        {
                                            validator: (_, value) => {
                                                if (!value) return Promise.resolve();
                                                if (value.isBefore(dayjs())) {
                                                    return Promise.reject('Thời gian hẹn phải trong tương lai');
                                                }
                                                return Promise.resolve();
                                            }
                                        }
                                    ]}
                                >
                                    <DatePicker
                                        showTime
                                        format="DD/MM/YYYY HH:mm"
                                        placeholder="Chọn ngày và giờ"
                                        disabledDate={(current) => current && current < dayjs().endOf('day')}
                                        style={{ width: '100%', height: '48px' }}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="duration"
                                    label={<span className="font-medium text-gray-700">Thời lượng</span>}
                                    initialValue={30}
                                    rules={[{ required: true, message: 'Vui lòng chọn thời lượng' }]}
                                >
                                    <Select style={{ height: '48px' }}>
                                        <Option value={15}>15 phút</Option>
                                        <Option value={30}>30 phút</Option>
                                        <Option value={45}>45 phút</Option>
                                        <Option value={60}>60 phút</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            name="type"
                            label={<span className="font-medium text-gray-700">Loại tư vấn</span>}
                            initialValue="chat"
                            rules={[{ required: true, message: 'Vui lòng chọn loại tư vấn' }]}
                        >
                            <Select style={{ height: '48px' }}>
                                <Option value="chat">
                                    <div className="flex items-center">
                                        <MessageOutlined className="mr-2 text-blue-500" />
                                        Chat text
                                    </div>
                                </Option>
                                <Option value="audio">
                                    <div className="flex items-center">
                                        <PhoneOutlined className="mr-2 text-green-500" />
                                        Tư vấn audio
                                    </div>
                                </Option>
                                <Option value="video">
                                    <div className="flex items-center">
                                        <VideoCameraOutlined className="mr-2 text-purple-500" />
                                        Tư vấn video
                                    </div>
                                </Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="notes"
                            label={<span className="font-medium text-gray-700">Ghi chú</span>}
                        >
                            <TextArea
                                rows={3}
                                placeholder="Ghi chú về nội dung tư vấn..."
                                style={{ borderRadius: '8px' }}
                            />
                        </Form.Item>

                        <Form.Item className="mb-0 pt-4">
                            <div className="flex justify-end space-x-3">
                                <Button
                                    onClick={() => setShowCreateModal(false)}
                                    style={{ height: '44px', borderRadius: '8px' }}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    style={{
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        border: 'none',
                                        height: '44px',
                                        borderRadius: '8px'
                                    }}
                                >
                                    Đặt lịch
                                </Button>
                            </div>
                        </Form.Item>
                    </Form>
                </Modal>

                {/* Success Modal */}
                <AppointmentSuccessModal
                    visible={showSuccessModal}
                    onClose={() => setShowSuccessModal(false)}
                    appointmentData={appointmentData}
                    receiverInfo={selectedCoach}
                />

                {/* Coach Feedback Modal */}
                {showFeedbackModal && selectedAppointment && (
                    <CoachFeedback
                        coachId={selectedAppointment.coach?.id || selectedAppointment.coachId}
                        appointmentId={selectedAppointment.id}
                        onClose={() => setShowFeedbackModal(false)}
                        onSubmitSuccess={handleFeedbackSuccess}
                    />
                )}
            </div>
        </div>
    );
};

export default Appointments; 