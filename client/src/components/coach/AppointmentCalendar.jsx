import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    Card,
    Calendar,
    Badge,
    Modal,
    Form,
    DatePicker,
    Select,
    InputNumber,
    Input,
    Button,
    List,
    Tag,
    message,
    Tooltip,
    Space,
    Typography,
    Row,
    Col,
    Statistic,
    Empty
} from 'antd';
import {
    CalendarOutlined,
    ClockCircleOutlined,
    UserOutlined,
    VideoCameraOutlined,
    AudioOutlined,
    MessageOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const AppointmentCalendar = React.memo(() => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [members, setMembers] = useState([]);
    const [form] = Form.useForm();
    const [stats, setStats] = useState({
        total: 0,
        scheduled: 0,
        completed: 0,
        cancelled: 0
    });
    const [editingMeetingLink, setEditingMeetingLink] = useState(false);
    const [tempMeetingLink, setTempMeetingLink] = useState('');
    const [savingMeetingLink, setSavingMeetingLink] = useState(false);

    // Add render counter for debugging
    const renderCount = useRef(0);
    renderCount.current += 1;

    useEffect(() => {
        loadAppointments();
        loadMembers();
    }, []);

    const loadAppointments = useCallback(async () => {
        try {
            setLoading(true);
            console.log(`AppointmentCalendar render #${renderCount.current} - Loading appointments...`);

            const token = localStorage.getItem('coachToken');

            const response = await axios.get('http://smokeking.wibu.me:4000/api/coach/appointments', {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                params: {
                    limit: 100 // Load more appointments for calendar view
                }
            });

            if (response.data.success) {
                const appointmentsData = response.data.data;

                // Log for debugging
                console.log('Raw appointments data from API:', appointmentsData);

                // Deduplicate by id to ensure unique appointments
                const uniqueAppointments = appointmentsData.reduce((acc, appointment) => {
                    const isDuplicate = acc.some(existing => existing.id === appointment.id);
                    if (!isDuplicate) {
                        acc.push(appointment);
                    } else {
                        console.warn('Duplicate appointment found and removed:', appointment);
                    }
                    return acc;
                }, []);

                console.log('Unique appointments after deduplication:', uniqueAppointments);
                setAppointments(uniqueAppointments);
                calculateStats(uniqueAppointments);
            }
        } catch (error) {
            console.error('Error loading appointments:', error);
            message.error('Không thể tải danh sách lịch hẹn');
        } finally {
            setLoading(false);
        }
    }, []);

    const loadMembers = useCallback(async () => {
        try {
            const token = localStorage.getItem('coachToken');

            const response = await axios.get('http://smokeking.wibu.me:4000/api/coach/members', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                const membersData = response.data.data;

                // Deduplicate members as well
                const uniqueMembers = membersData.reduce((acc, member) => {
                    const isDuplicate = acc.some(existing => existing.id === member.id);
                    if (!isDuplicate) {
                        acc.push(member);
                    } else {
                        console.warn('Duplicate member found and removed in AppointmentCalendar:', member);
                    }
                    return acc;
                }, []);

                setMembers(uniqueMembers);
            }
        } catch (error) {
            console.error('Error loading members:', error);
        }
    }, []);

    // Memoize the appointments data to prevent unnecessary re-renders
    const memoizedAppointments = useMemo(() => {
        console.log('Memoizing appointments, current count:', appointments.length);
        // Double-check for unique appointments by id
        const uniqueAppointments = appointments.reduce((acc, appointment) => {
            const existing = acc.find(a => a.id === appointment.id);
            if (!existing) {
                acc.push(appointment);
            }
            return acc;
        }, []);
        console.log('Final unique appointments count:', uniqueAppointments.length);
        return uniqueAppointments;
    }, [appointments]);

    // Memoize the members data
    const memoizedMembers = useMemo(() => {
        console.log('Memoizing members in AppointmentCalendar, current count:', members.length);
        const uniqueMembers = members.reduce((acc, member) => {
            const existing = acc.find(m => m.id === member.id);
            if (!existing) {
                acc.push(member);
            }
            return acc;
        }, []);
        console.log('Final unique members count in AppointmentCalendar:', uniqueMembers.length);
        return uniqueMembers;
    }, [members]);

    const calculateStats = (appointmentList) => {
        const stats = {
            total: appointmentList.length,
            scheduled: appointmentList.filter(apt => apt.status === 'scheduled').length,
            confirmed: appointmentList.filter(apt => apt.status === 'confirmed').length,
            completed: appointmentList.filter(apt => apt.status === 'completed').length,
            cancelled: appointmentList.filter(apt => apt.status === 'cancelled').length
        };
        setStats(stats);
    };

    const createAppointment = async (values) => {
        try {
            const token = localStorage.getItem('coachToken');

            const response = await axios.post('http://smokeking.wibu.me:4000/api/coach/schedule', {
                memberId: values.memberId,
                appointmentDate: values.appointmentDate.toISOString(),
                duration: values.duration,
                type: values.type,
                notes: values.notes
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                message.success('Lịch hẹn đã được tạo thành công');
                setShowCreateModal(false);
                form.resetFields();
                loadAppointments();
            }
        } catch (error) {
            console.error('Error creating appointment:', error);
            message.error(error.response?.data?.message || 'Không thể tạo lịch hẹn');
        }
    };

    const updateAppointmentStatus = async (appointmentId, status) => {
        try {
            const token = localStorage.getItem('coachToken');

            const response = await axios.patch(`http://smokeking.wibu.me:4000/api/coach/appointments/${appointmentId}`, {
                status
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                message.success('Cập nhật trạng thái thành công');
                loadAppointments();
                setShowDetailModal(false);
            }
        } catch (error) {
            console.error('Error updating appointment:', error);
            message.error('Không thể cập nhật trạng thái');
        }
    };

    const deleteAppointment = async (appointmentId) => {
        try {
            const token = localStorage.getItem('coachToken');

            const response = await axios.delete(`http://smokeking.wibu.me:4000/api/coach/appointments/${appointmentId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                message.success('Xóa lịch hẹn thành công');
                loadAppointments();
                setShowDetailModal(false);
            }
        } catch (error) {
            console.error('Error deleting appointment:', error);
            message.error('Không thể xóa lịch hẹn');
        }
    };

    const cancelAppointment = async (appointment) => {
        const appointmentDate = dayjs(appointment.appointmentDate);
        const now = dayjs();
        const hoursUntil = appointmentDate.diff(now, 'hour');

        if (hoursUntil < 1 && hoursUntil > 0) {
            Modal.warning({
                title: 'Không thể hủy lịch hẹn',
                content: 'Không thể hủy lịch hẹn cách thời gian hẹn dưới 1 giờ.',
                okText: 'Đã hiểu'
            });
            return;
        }

        Modal.confirm({
            title: 'Xác nhận hủy lịch hẹn',
            icon: <ExclamationCircleOutlined />,
            content: (
                <div>
                    <p>Bạn có chắc chắn muốn hủy lịch hẹn tư vấn với:</p>
                    <p><strong>Thành viên:</strong> {appointment.member.fullName}</p>
                    <p><strong>Thời gian:</strong> {appointmentDate.format('DD/MM/YYYY HH:mm')}</p>
                    <p className="text-orange-600 mt-3">
                        <ClockCircleOutlined /> Việc hủy lịch sẽ gửi thông báo đến thành viên.
                    </p>
                </div>
            ),
            okText: 'Hủy lịch hẹn',
            okType: 'danger',
            cancelText: 'Không',
            onOk: () => updateAppointmentStatus(appointment.id, 'cancelled')
        });
    };

    const saveMeetingLink = async (appointmentId) => {
        try {
            setSavingMeetingLink(true);
            const token = localStorage.getItem('coachToken');

            const response = await axios.patch(
                `http://smokeking.wibu.me:4000/api/coach/appointments/${appointmentId}`,
                {
                    meetingLink: tempMeetingLink
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                message.success('Link tham gia đã được cập nhật');

                // Update the selected appointment
                setSelectedAppointment(prev => ({
                    ...prev,
                    meetingLink: tempMeetingLink
                }));

                // Update appointments list
                setAppointments(prev => prev.map(apt =>
                    apt.id === appointmentId
                        ? { ...apt, meetingLink: tempMeetingLink }
                        : apt
                ));

                setEditingMeetingLink(false);
            } else {
                message.error(response.data.message || 'Không thể cập nhật link tham gia');
            }
        } catch (error) {
            console.error('Error updating meeting link:', error);
            message.error('Có lỗi xảy ra khi cập nhật link tham gia');
        } finally {
            setSavingMeetingLink(false);
        }
    };

    const getAppointmentsForDate = useCallback((date) => {
        const dateStr = date.format('YYYY-MM-DD');
        return memoizedAppointments.filter(apt =>
            dayjs(apt.appointmentDate).format('YYYY-MM-DD') === dateStr
        );
    }, [memoizedAppointments]);

    const dateCellRender = useCallback((date) => {
        const dayAppointments = getAppointmentsForDate(date);

        if (dayAppointments.length === 0) return null;

        return (
            <div className="appointment-badges">
                {dayAppointments.slice(0, 3).map(apt => (
                    <Badge
                        key={apt.id}
                        status={getStatusColor(apt.status)}
                        text={
                            <span className="text-xs">
                                {dayjs(apt.appointmentDate).format('HH:mm')} - {apt.member.firstName}
                            </span>
                        }
                    />
                ))}
                {dayAppointments.length > 3 && (
                    <Badge status="default" text={`+${dayAppointments.length - 3} more`} />
                )}
            </div>
        );
    }, [getAppointmentsForDate]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled': return 'processing';
            case 'confirmed': return 'success';
            case 'completed': return 'default';
            case 'cancelled': return 'error';
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
            case 'video': return <VideoCameraOutlined />;
            case 'audio': return <AudioOutlined />;
            case 'chat': return <MessageOutlined />;
            default: return <CalendarOutlined />;
        }
    };

    const onDateSelect = useCallback((date) => {
        setSelectedDate(date);
        const dayAppointments = getAppointmentsForDate(date);
        if (dayAppointments.length > 0) {
            // Show appointments for selected date
        }
    }, [getAppointmentsForDate]);

    // Memoize selected date appointments
    const selectedDateAppointments = useMemo(() => {
        return getAppointmentsForDate(selectedDate);
    }, [getAppointmentsForDate, selectedDate]);

    return (
        <div className="appointment-calendar">
            {/* Statistics Cards */}
            <Row gutter={[16, 16]} className="mb-6">
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic
                            title="Tổng lịch hẹn"
                            value={stats.total}
                            prefix={<CalendarOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic
                            title="Đã lên lịch"
                            value={stats.scheduled}
                            prefix={<ClockCircleOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic
                            title="Hoàn thành"
                            value={stats.completed}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic
                            title="Đã hủy"
                            value={stats.cancelled}
                            prefix={<CloseCircleOutlined />}
                            valueStyle={{ color: '#ff4d4f' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[24, 24]}>
                {/* Calendar */}
                <Col xs={24} lg={16}>
                    <Card
                        title={
                            <div className="flex items-center justify-between">
                                <span>
                                    <CalendarOutlined className="mr-2" />
                                    Lịch hẹn tư vấn
                                </span>
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => setShowCreateModal(true)}
                                >
                                    Tạo lịch hẹn
                                </Button>
                            </div>
                        }
                        className="shadow-md"
                    >
                        <Calendar
                            dateCellRender={dateCellRender}
                            onSelect={onDateSelect}
                            value={selectedDate}
                        />
                    </Card>
                </Col>

                {/* Appointments for selected date */}
                <Col xs={24} lg={8}>
                    <Card
                        title={
                            <span>
                                <CalendarOutlined className="mr-2" />
                                Lịch hẹn ngày {selectedDate.format('DD/MM/YYYY')}
                            </span>
                        }
                        className="shadow-md"
                    >
                        {selectedDateAppointments.length === 0 ? (
                            <Empty
                                description="Không có lịch hẹn nào"
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                        ) : (
                            <List
                                dataSource={selectedDateAppointments}
                                renderItem={appointment => (
                                    <List.Item
                                        className="cursor-pointer hover:bg-gray-50 p-3 rounded"
                                        onClick={() => {
                                            setSelectedAppointment(appointment);
                                            setShowDetailModal(true);
                                        }}
                                    >
                                        <div className="w-full">
                                            <div className="flex items-center justify-between mb-2">
                                                <Text strong>
                                                    {getTypeIcon(appointment.type)} {dayjs(appointment.appointmentDate).format('HH:mm')}
                                                </Text>
                                                <Tag color={getStatusColor(appointment.status)}>
                                                    {getStatusText(appointment.status)}
                                                </Tag>
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                <UserOutlined className="mr-1" />
                                                {appointment.member.fullName}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                <ClockCircleOutlined className="mr-1" />
                                                {appointment.duration} phút
                                            </div>
                                        </div>
                                    </List.Item>
                                )}
                            />
                        )}
                    </Card>
                </Col>
            </Row>

            {/* Create Appointment Modal */}
            <Modal
                title={
                    <div className="flex items-center">
                        <PlusOutlined className="mr-2" />
                        Tạo lịch hẹn mới
                    </div>
                }
                open={showCreateModal}
                onCancel={() => {
                    setShowCreateModal(false);
                    form.resetFields();
                }}
                footer={null}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={createAppointment}
                    className="mt-4"
                >
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="memberId"
                                label="Chọn thành viên"
                                rules={[{ required: true, message: 'Vui lòng chọn thành viên' }]}
                            >
                                <Select
                                    placeholder="Chọn thành viên"
                                    showSearch
                                    filterOption={(input, option) => {
                                        const member = memoizedMembers.find(m => m.id === option.value);
                                        if (!member) return false;
                                        const memberText = `${member.firstName || ''} ${member.lastName || ''} ${member.email || ''}`;
                                        return memberText.toLowerCase().indexOf(input.toLowerCase()) >= 0;
                                    }}
                                >
                                    {memoizedMembers.map(member => (
                                        <Option key={member.id} value={member.id}>
                                            {member.firstName} {member.lastName} - {member.email}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="type"
                                label="Loại tư vấn"
                                rules={[{ required: true, message: 'Vui lòng chọn loại tư vấn' }]}
                                initialValue="chat"
                            >
                                <Select
                                    filterOption={(input, option) => {
                                        const typeLabels = {
                                            'chat': 'Chat',
                                            'audio': 'Audio Call',
                                            'video': 'Video Call'
                                        };
                                        const typeText = typeLabels[option.value] || '';
                                        return typeText.toLowerCase().indexOf(input.toLowerCase()) >= 0;
                                    }}
                                >
                                    <Option value="chat">
                                        <MessageOutlined className="mr-2" />
                                        Chat
                                    </Option>
                                    <Option value="audio">
                                        <AudioOutlined className="mr-2" />
                                        Audio Call
                                    </Option>
                                    <Option value="video">
                                        <VideoCameraOutlined className="mr-2" />
                                        Video Call
                                    </Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="appointmentDate"
                                label="Thời gian hẹn"
                                rules={[{ required: true, message: 'Vui lòng chọn thời gian' }]}
                            >
                                <DatePicker
                                    showTime
                                    format="DD/MM/YYYY HH:mm"
                                    placeholder="Chọn ngày và giờ"
                                    disabledDate={(current) => current && current < dayjs().startOf('day')}
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="duration"
                                label="Thời lượng (phút)"
                                rules={[{ required: true, message: 'Vui lòng chọn thời lượng' }]}
                                initialValue={30}
                            >
                                <Select style={{ width: '100%' }} placeholder="Chọn thời lượng">
                                    <Option value={15}>15 phút</Option>
                                    <Option value={30}>30 phút</Option>
                                    <Option value={45}>45 phút</Option>
                                    <Option value={60}>60 phút</Option>
                                    <Option value={90}>90 phút</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="notes"
                        label="Ghi chú"
                    >
                        <TextArea
                            rows={3}
                            placeholder="Ghi chú về cuộc hẹn..."
                        />
                    </Form.Item>

                    <Form.Item className="mb-0 text-right">
                        <Space>
                            <Button onClick={() => {
                                setShowCreateModal(false);
                                form.resetFields();
                            }}>
                                Hủy
                            </Button>
                            <Button type="primary" htmlType="submit">
                                Tạo lịch hẹn
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Appointment Detail Modal */}
            <Modal
                title={
                    <div className="flex items-center">
                        <CalendarOutlined className="mr-2" />
                        Chi tiết lịch hẹn
                    </div>
                }
                open={showDetailModal}
                onCancel={() => {
                    setShowDetailModal(false);
                    setSelectedAppointment(null);
                    setEditingMeetingLink(false);
                    setTempMeetingLink('');
                }}
                footer={null}
                width={600}
            >
                {selectedAppointment && (
                    <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <Row gutter={[16, 16]}>
                                <Col span={12}>
                                    <Text strong>Thành viên:</Text>
                                    <div>{selectedAppointment.member.fullName}</div>
                                    <div className="text-sm text-gray-500">{selectedAppointment.member.email}</div>
                                </Col>
                                <Col span={12}>
                                    <Text strong>Loại tư vấn:</Text>
                                    <div>
                                        {getTypeIcon(selectedAppointment.type)} {selectedAppointment.type}
                                    </div>
                                </Col>
                            </Row>
                        </div>

                        <Row gutter={[16, 16]}>
                            <Col span={12}>
                                <Text strong>Thời gian:</Text>
                                <div>{dayjs(selectedAppointment.appointmentDate).format('DD/MM/YYYY HH:mm')}</div>
                            </Col>
                            <Col span={12}>
                                <Text strong>Thời lượng:</Text>
                                <div>{selectedAppointment.duration} phút</div>
                            </Col>
                        </Row>

                        <div>
                            <Text strong>Trạng thái:</Text>
                            <div>
                                <Tag color={getStatusColor(selectedAppointment.status)} className="ml-2">
                                    {getStatusText(selectedAppointment.status)}
                                </Tag>
                            </div>
                        </div>

                        {selectedAppointment.notes && (
                            <div>
                                <Text strong>Ghi chú:</Text>
                                <div className="mt-1 p-3 bg-gray-50 rounded">
                                    {selectedAppointment.notes}
                                </div>
                            </div>
                        )}

                        <div>
                            <Text strong>Link tham gia:</Text>
                            <div className="mt-1 space-y-2">
                                {editingMeetingLink ? (
                                    <div className="space-y-2">
                                        <Input
                                            value={tempMeetingLink}
                                            onChange={(e) => setTempMeetingLink(e.target.value)}
                                            placeholder="Nhập link tham gia cuộc họp..."
                                            onPressEnter={() => saveMeetingLink(selectedAppointment.id)}
                                        />
                                        <Space>
                                            <Button
                                                type="primary"
                                                size="small"
                                                onClick={() => saveMeetingLink(selectedAppointment.id)}
                                                loading={savingMeetingLink}
                                            >
                                                Lưu
                                            </Button>
                                            <Button
                                                size="small"
                                                onClick={() => {
                                                    setEditingMeetingLink(false);
                                                    setTempMeetingLink(selectedAppointment.meetingLink || '');
                                                }}
                                            >
                                                Hủy
                                            </Button>
                                        </Space>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            {selectedAppointment.meetingLink ? (
                                                <a
                                                    href={selectedAppointment.meetingLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    {selectedAppointment.meetingLink}
                                                </a>
                                            ) : (
                                                <span className="text-gray-400 italic">Chưa có link tham gia</span>
                                            )}
                                        </div>
                                        <Button
                                            type="link"
                                            size="small"
                                            icon={<EditOutlined />}
                                            onClick={() => {
                                                setEditingMeetingLink(true);
                                                setTempMeetingLink(selectedAppointment.meetingLink || '');
                                            }}
                                        >
                                            {selectedAppointment.meetingLink ? 'Sửa' : 'Thêm'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-between pt-4 border-t">
                            <Space>
                                {selectedAppointment.status === 'scheduled' && (
                                    <Button
                                        type="primary"
                                        icon={<CheckCircleOutlined />}
                                        onClick={() => updateAppointmentStatus(selectedAppointment.id, 'confirmed')}
                                    >
                                        Xác nhận
                                    </Button>
                                )}
                                {(selectedAppointment.status === 'scheduled' || selectedAppointment.status === 'confirmed') && (
                                    <Button
                                        icon={<CheckCircleOutlined />}
                                        onClick={() => updateAppointmentStatus(selectedAppointment.id, 'completed')}
                                    >
                                        Hoàn thành
                                    </Button>
                                )}
                            </Space>
                            <Space>
                                {(selectedAppointment.status === 'scheduled' || selectedAppointment.status === 'confirmed') && (
                                    <Button
                                        danger
                                        icon={<CloseCircleOutlined />}
                                        onClick={() => cancelAppointment(selectedAppointment)}
                                        className="cancel-appointment-btn"
                                    >
                                        Hủy lịch hẹn
                                    </Button>
                                )}
                                {selectedAppointment.status !== 'completed' && selectedAppointment.status !== 'cancelled' && (
                                    <Button
                                        danger
                                        type="primary"
                                        icon={<DeleteOutlined />}
                                        onClick={() => {
                                            Modal.confirm({
                                                title: 'Xác nhận xóa',
                                                icon: <ExclamationCircleOutlined />,
                                                content: 'Bạn có chắc chắn muốn xóa vĩnh viễn lịch hẹn này? Hành động này không thể hoàn tác.',
                                                okText: 'Xóa',
                                                okType: 'danger',
                                                cancelText: 'Hủy',
                                                onOk: () => deleteAppointment(selectedAppointment.id)
                                            });
                                        }}
                                    >
                                        Xóa
                                    </Button>
                                )}
                            </Space>
                        </div>
                    </div>
                )}
            </Modal>

            <style>{`
                .appointment-badges .ant-badge {
                    display: block;
                    margin-bottom: 2px;
                }
                .appointment-badges .ant-badge-status-text {
                    font-size: 11px;
                }
                .cancel-appointment-btn {
                    background: linear-gradient(135deg, #ff7875 0%, #ff4d4f 100%) !important;
                    border: none !important;
                    box-shadow: 0 2px 8px rgba(255, 77, 79, 0.3) !important;
                    transition: all 0.3s ease !important;
                }
                .cancel-appointment-btn:hover {
                    background: linear-gradient(135deg, #ff4d4f 0%, #f5222d 100%) !important;
                    transform: translateY(-1px) !important;
                    box-shadow: 0 4px 12px rgba(255, 77, 79, 0.4) !important;
                }
            `}</style>
        </div>
    );
});

export default AppointmentCalendar; 