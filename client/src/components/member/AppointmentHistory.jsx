import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Card,
    Table,
    Tag,
    Button,
    Space,
    Typography,
    Avatar,
    Empty,
    Tooltip,
    Popconfirm,
    message
} from 'antd';
import {
    HistoryOutlined,
    UserOutlined,
    DeleteOutlined,
    EyeOutlined,
    ClockCircleOutlined,
    VideoCameraOutlined,
    PhoneOutlined,
    MessageOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

// Fix ResizeObserver error
const suppressResizeObserverError = () => {
    const resizeObserverErrDiv = document.getElementById('webpack-dev-server-client-overlay-div');
    const resizeObserverErr = document.getElementById('webpack-dev-server-client-overlay');
    if (resizeObserverErr) {
        resizeObserverErr.setAttribute('style', 'display: none');
    }
    if (resizeObserverErrDiv) {
        resizeObserverErrDiv.setAttribute('style', 'display: none');
    }
};

// Add global error handler for ResizeObserver
if (typeof window !== 'undefined') {
    window.addEventListener('error', (e) => {
        if (e.message === 'ResizeObserver loop completed with undelivered notifications.') {
            e.stopImmediatePropagation();
            suppressResizeObserverError();
            return false;
        }
    });

    window.addEventListener('unhandledrejection', (e) => {
        if (e.reason?.message?.includes('ResizeObserver loop')) {
            e.preventDefault();
            suppressResizeObserverError();
            return false;
        }
    });
}

const AppointmentHistory = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadAppointments();
    }, []);

    const loadAppointments = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const response = await axios.get('http://localhost:4000/api/chat/appointments', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                setAppointments(response.data.data);
                console.log('✅ Loaded appointments:', response.data.data);
            }
        } catch (error) {
            console.error('❌ Error loading appointments:', error);
            message.error('Không thể tải danh sách lịch hẹn');
        } finally {
            setLoading(false);
        }
    }, []);

    const cancelAppointment = useCallback(async (appointmentId) => {
        try {
            const token = localStorage.getItem('token');

            console.log('🚫 Cancelling appointment:', appointmentId);

            const response = await axios.post(`http://localhost:4000/api/chat/appointments/${appointmentId}/cancel`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                message.success('Hủy lịch hẹn thành công');
                // Use callback to prevent unnecessary re-renders
                setAppointments(prev => prev.map(apt =>
                    apt.id === appointmentId
                        ? { ...apt, status: 'cancelled' }
                        : apt
                ));
            }
        } catch (error) {
            console.error('🚨 Error cancelling appointment:', error);

            if (error.response?.status === 404) {
                message.error('Không tìm thấy lịch hẹn');
            } else if (error.response?.status === 400) {
                message.error(error.response.data?.message || 'Không thể hủy lịch hẹn này');
            } else {
                message.error('Không thể hủy lịch hẹn');
            }
        }
    }, []);

    const getStatusColor = useCallback((status) => {
        switch (status) {
            case 'scheduled': return 'blue';
            case 'confirmed': return 'green';
            case 'completed': return 'purple';
            case 'cancelled': return 'red';
            default: return 'default';
        }
    }, []);

    const getStatusText = useCallback((status) => {
        switch (status) {
            case 'scheduled': return 'Đã lên lịch';
            case 'confirmed': return 'Đã xác nhận';
            case 'completed': return 'Hoàn thành';
            case 'cancelled': return 'Đã hủy';
            default: return status;
        }
    }, []);

    const getTypeIcon = useCallback((type) => {
        switch (type) {
            case 'video': return <VideoCameraOutlined className="text-purple-500" />;
            case 'audio': return <PhoneOutlined className="text-green-500" />;
            default: return <MessageOutlined className="text-blue-500" />;
        }
    }, []);

    const getTypeText = useCallback((type) => {
        switch (type) {
            case 'video': return 'Video call';
            case 'audio': return 'Audio call';
            default: return 'Chat';
        }
    }, []);

    const canCancel = useCallback((status, appointmentDate) => {
        if (status !== 'scheduled' && status !== 'confirmed') return false;
        // Chỉ cho phép hủy nếu còn ít nhất 1 giờ trước giờ hẹn
        const oneHourBeforeAppointment = dayjs(appointmentDate).subtract(1, 'hour');
        return dayjs().isBefore(oneHourBeforeAppointment);
    }, []);

    // Memoize columns to prevent re-renders
    const columns = useMemo(() => [
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
            sorter: (a, b) => dayjs(a.appointmentDate).unix() - dayjs(b.appointmentDate).unix(),
            defaultSortOrder: 'descend',
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
            title: 'Ghi chú',
            dataIndex: 'notes',
            key: 'notes',
            render: (notes) => (
                <div className="max-w-xs">
                    {notes ? (
                        <Tooltip title={notes}>
                            <Text ellipsis className="text-sm text-gray-600">
                                {notes}
                            </Text>
                        </Tooltip>
                    ) : (
                        <Text type="secondary" className="text-sm">Không có ghi chú</Text>
                    )}
                </div>
            ),
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    {canCancel(record.status, record.appointmentDate) && (
                        <Popconfirm
                            title="Bạn có chắc muốn hủy lịch hẹn này?"
                            description="Bạn chỉ có thể hủy lịch hẹn trước ít nhất 1 giờ."
                            onConfirm={() => cancelAppointment(record.id)}
                            okText="Có"
                            cancelText="Không"
                            placement="topRight"
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
                    {record.status === 'cancelled' && (
                        <Text type="secondary" className="text-xs">
                            Đã hủy
                        </Text>
                    )}
                </Space>
            ),
        },
    ], [cancelAppointment, canCancel, getStatusColor, getStatusText, getTypeIcon, getTypeText]);

    // Memoize statistics to prevent re-calculations
    const statistics = useMemo(() => ({
        total: appointments.length,
        completed: appointments.filter(a => a.status === 'completed').length,
        pending: appointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length,
        cancelled: appointments.filter(a => a.status === 'cancelled').length,
    }), [appointments]);

    // Memoize row className function
    const getRowClassName = useCallback((record) => {
        // Highlight upcoming appointments
        if ((record.status === 'scheduled' || record.status === 'confirmed') &&
            dayjs(record.appointmentDate).isAfter(dayjs())) {
            return 'bg-blue-50';
        }
        return '';
    }, []);

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Title level={2} className="mb-2 text-gray-800">
                        <HistoryOutlined className="mr-3 text-green-500" />
                        Lịch sử cuộc hẹn
                    </Title>
                    <Text className="text-gray-600">
                        Xem lại tất cả các cuộc hẹn tư vấn đã đặt với coach
                    </Text>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card className="text-center" style={{ borderRadius: '8px' }}>
                        <div className="text-2xl font-bold text-blue-600">
                            {statistics.total}
                        </div>
                        <div className="text-sm text-gray-600">Tổng cuộc hẹn</div>
                    </Card>
                    <Card className="text-center" style={{ borderRadius: '8px' }}>
                        <div className="text-2xl font-bold text-green-600">
                            {statistics.completed}
                        </div>
                        <div className="text-sm text-gray-600">Đã hoàn thành</div>
                    </Card>
                    <Card className="text-center" style={{ borderRadius: '8px' }}>
                        <div className="text-2xl font-bold text-orange-600">
                            {statistics.pending}
                        </div>
                        <div className="text-sm text-gray-600">Đang chờ</div>
                    </Card>
                    <Card className="text-center" style={{ borderRadius: '8px' }}>
                        <div className="text-2xl font-bold text-red-600">
                            {statistics.cancelled}
                        </div>
                        <div className="text-sm text-gray-600">Đã hủy</div>
                    </Card>
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
                                `${range[0]}-${range[1]} của ${total} cuộc hẹn`,
                        }}
                        locale={{
                            emptyText: (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={
                                        <div>
                                            <p>Chưa có cuộc hẹn nào</p>
                                            <Text type="secondary" className="text-sm">
                                                Đặt lịch tư vấn với coach để bắt đầu hành trình cai thuốc của bạn
                                            </Text>
                                        </div>
                                    }
                                />
                            ),
                        }}
                        rowClassName={getRowClassName}
                        scroll={{ x: 800 }}
                        size="middle"
                    />
                </Card>

                {/* Legend */}
                <Card className="mt-4" style={{ borderRadius: '8px' }}>
                    <Title level={5} className="mb-3">Chú thích:</Title>
                    <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-blue-50 border rounded"></div>
                            <span>Cuộc hẹn sắp tới</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Tag color="blue">Đã lên lịch</Tag>
                            <span>Chờ coach xác nhận</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Tag color="green">Đã xác nhận</Tag>
                            <span>Coach đã xác nhận</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Tag color="purple">Hoàn thành</Tag>
                            <span>Đã kết thúc cuộc hẹn</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Tag color="red">Đã hủy</Tag>
                            <span>Cuộc hẹn bị hủy</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AppointmentHistory; 