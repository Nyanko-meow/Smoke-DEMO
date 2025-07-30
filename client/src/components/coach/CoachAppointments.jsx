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
    Popconfirm,
    Badge,
    Statistic
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
    CheckCircleOutlined,
    CloseCircleOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

const CoachAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [statistics, setStatistics] = useState({
        total: 0,
        scheduled: 0,
        completed: 0,
        cancelled: 0
    });
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadAppointments();
        loadMembers();
    }, []);

    const loadAppointments = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('coachToken');
            const response = await axios.get('http://localhost:4000/api/chat/appointments', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                const appointmentData = response.data.data;
                setAppointments(appointmentData);

                // Calculate statistics
                const stats = {
                    total: appointmentData.length,
                    scheduled: appointmentData.filter(a => a.status === 'scheduled').length,
                    completed: appointmentData.filter(a => a.status === 'completed').length,
                    cancelled: appointmentData.filter(a => a.status === 'cancelled').length
                };
                setStatistics(stats);
            }
        } catch (error) {
            console.error('Error loading appointments:', error);
            message.error('Không thể tải danh sách lịch hẹn');
        } finally {
            setLoading(false);
        }
    };

    const loadMembers = async () => {
        try {
            const token = localStorage.getItem('coachToken');
            const response = await axios.get('http://localhost:4000/api/coach/members', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                setMembers(response.data.data);
            }
        } catch (error) {
            console.error('Error loading members:', error);
            message.error('Không thể tải danh sách thành viên');
        }
    };

    const createAppointment = async (values) => {
        try {
            setSubmitting(true);

            // First get member's membership info to validate appointment date
            const membershipResponse = await axios.get(`http://localhost:4000/api/coach/members/${values.memberId}/details`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (membershipResponse.data.success && membershipResponse.data.data.membership) {
                const membershipEndDate = dayjs(membershipResponse.data.data.membership.endDate);
                const appointmentDate = dayjs(values.appointmentDate);

                if (appointmentDate.isAfter(membershipEndDate)) {
                    message.error(`Không thể đặt lịch vào ngày ${appointmentDate.format('DD/MM/YYYY')} vì membership của thành viên hết hạn vào ngày ${membershipEndDate.format('DD/MM/YYYY')}`);
                    setSubmitting(false);
                    return;
                }
            }

            const response = await axios.post('http://localhost:4000/api/coach/schedule', {
                memberId: values.memberId,
                appointmentDate: dayjs(values.appointmentDate).toISOString(),
                duration: parseInt(values.duration),
                type: values.type,
                notes: values.notes || ''
            }, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.data.success) {
                message.success('Đặt lịch tư vấn thành công!');
                setShowCreateModal(false);
                form.resetFields();
                loadAppointments();
            }
        } catch (error) {
            console.error('Error creating appointment:', error);
            if (error.response?.status === 400) {
                message.error(error.response.data?.message || 'Thông tin đặt lịch không hợp lệ');
            } else if (error.response?.status === 409) {
                message.error('Thời gian này đã có lịch hẹn khác. Vui lòng chọn thời gian khác');
            } else {
                message.error('Không thể đặt lịch tư vấn. Vui lòng thử lại sau');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const updateAppointmentStatus = async (appointmentId, status) => {
        try {
            const token = localStorage.getItem('coachToken');
            const response = await axios.patch(`http://localhost:4000/api/coach/appointments/${appointmentId}`, {
                status
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                message.success('Cập nhật trạng thái thành công');
                loadAppointments();
            }
        } catch (error) {
            console.error('Error updating appointment:', error);
            message.error('Không thể cập nhật trạng thái');
        }
    };

    const cancelAppointment = async (appointmentId) => {
        try {
            const token = localStorage.getItem('coachToken');
            const response = await axios.post(`http://localhost:4000/api/chat/appointments/${appointmentId}/cancel`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                message.success('Hủy lịch hẹn thành công');
                loadAppointments();
            }
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            message.error('Không thể hủy lịch hẹn');
        }
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
            title: 'Thành viên',
            dataIndex: 'member',
            key: 'member',
            render: (member) => (
                <div className="flex items-center space-x-3">
                    <Avatar
                        size={40}
                        src={member?.avatar}
                        icon={<UserOutlined />}
                        className="border-2 border-blue-100"
                    />
                    <div>
                        <div className="font-medium text-gray-800">{member?.fullName}</div>
                        <div className="text-sm text-gray-500">{member?.email}</div>
                        {member?.membershipPlan && (
                            <Tag size="small" color="blue">{member.membershipPlan}</Tag>
                        )}
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
            sorter: (a, b) => dayjs(a.appointmentDate).unix() - dayjs(b.appointmentDate).unix(),
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
            filters: [
                { text: 'Đã lên lịch', value: 'scheduled' },
                { text: 'Đã xác nhận', value: 'confirmed' },
                { text: 'Hoàn thành', value: 'completed' },
                { text: 'Đã hủy', value: 'cancelled' },
            ],
            onFilter: (value, record) => record.status === value,
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    {record.status === 'scheduled' && (
                        <>
                            <Tooltip title="Xác nhận lịch hẹn">
                                <Button
                                    type="text"
                                    icon={<CheckCircleOutlined />}
                                    size="small"
                                    className="text-green-600 hover:bg-green-50"
                                    onClick={() => updateAppointmentStatus(record.id, 'confirmed')}
                                >
                                    Xác nhận
                                </Button>
                            </Tooltip>
                            <Popconfirm
                                title="Bạn có chắc muốn hủy lịch hẹn này?"
                                onConfirm={() => cancelAppointment(record.id)}
                                okText="Có"
                                cancelText="Không"
                            >
                                <Button
                                    type="text"
                                    danger
                                    icon={<CloseCircleOutlined />}
                                    size="small"
                                >
                                    Hủy
                                </Button>
                            </Popconfirm>
                        </>
                    )}
                    {record.status === 'confirmed' && (
                        <Button
                            type="text"
                            icon={<CheckCircleOutlined />}
                            size="small"
                            className="text-purple-600 hover:bg-purple-50"
                            onClick={() => updateAppointmentStatus(record.id, 'completed')}
                        >
                            Hoàn thành
                        </Button>
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
                                Quản lý lịch hẹn
                            </Title>
                            <Text className="text-gray-600">
                                Quản lý lịch hẹn tư vấn với các thành viên
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
                            Tạo lịch hẹn
                        </Button>
                    </div>
                </div>

                {/* Statistics */}
                <Row gutter={16} className="mb-6">
                    <Col span={6}>
                        <Card className="text-center">
                            <Statistic
                                title="Tổng lịch hẹn"
                                value={statistics.total}
                                prefix={<CalendarOutlined />}
                                valueStyle={{ color: '#1890ff' }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card className="text-center">
                            <Statistic
                                title="Đã lên lịch"
                                value={statistics.scheduled}
                                prefix={<ExclamationCircleOutlined />}
                                valueStyle={{ color: '#faad14' }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card className="text-center">
                            <Statistic
                                title="Hoàn thành"
                                value={statistics.completed}
                                prefix={<CheckCircleOutlined />}
                                valueStyle={{ color: '#52c41a' }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card className="text-center">
                            <Statistic
                                title="Đã hủy"
                                value={statistics.cancelled}
                                prefix={<CloseCircleOutlined />}
                                valueStyle={{ color: '#ff4d4f' }}
                            />
                        </Card>
                    </Col>
                </Row>

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
                                <div className="text-lg font-semibold text-gray-800">Tạo lịch hẹn mới</div>
                                <div className="text-sm text-gray-500">Lên lịch tư vấn với thành viên</div>
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
                                    name="memberId"
                                    label={<span className="font-medium text-gray-700">Chọn thành viên</span>}
                                    rules={[{ required: true, message: 'Vui lòng chọn thành viên' }]}
                                >
                                    <Select
                                        placeholder="Chọn thành viên để tư vấn"
                                        style={{ height: '48px' }}
                                        optionLabelProp="label"
                                        showSearch
                                        filterOption={(input, option) =>
                                            option.children.props.children[1].props.children[0].props.children
                                                .toLowerCase().includes(input.toLowerCase())
                                        }
                                    >
                                        {members.map(member => (
                                            <Option
                                                key={member.UserID}
                                                value={member.UserID}
                                                label={`${member.FirstName} ${member.LastName}`}
                                            >
                                                <div className="flex items-center space-x-3 py-2">
                                                    <Avatar
                                                        size={32}
                                                        src={member.Avatar}
                                                        icon={<UserOutlined />}
                                                    />
                                                    <div>
                                                        <div className="font-medium">
                                                            {member.FirstName} {member.LastName}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {member.Email}
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
                                    Tạo lịch hẹn
                                </Button>
                            </div>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </div>
    );
};

export default CoachAppointments; 