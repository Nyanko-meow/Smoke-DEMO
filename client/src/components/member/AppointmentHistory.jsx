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
    message,
    Alert
} from 'antd';
import {
    HistoryOutlined,
    UserOutlined,
    DeleteOutlined,
    EyeOutlined,
    ClockCircleOutlined,
    VideoCameraOutlined,
    PhoneOutlined,
    MessageOutlined,
    WarningOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined
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

    // Add membership status state
    const [membershipStatus, setMembershipStatus] = useState(null);
    const [membershipLoading, setMembershipLoading] = useState(true);

    useEffect(() => {
        // Check membership status first before loading appointments
        checkMembershipStatus();
    }, []);

    const checkMembershipStatus = async () => {
        try {
            setMembershipLoading(true);
            const token = localStorage.getItem('token');

            const response = await axios.get('http://localhost:4000/api/membership/current', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success && response.data.data) {
                const membership = response.data.data;

                // Check if membership is active and not expired
                const isActive = membership.Status === 'active' &&
                    new Date(membership.EndDate) > new Date();

                setMembershipStatus({
                    isActive,
                    status: membership.Status,
                    endDate: membership.EndDate,
                    planName: membership.Name
                });

                // Only load appointments if membership is active
                if (isActive) {
                    loadAppointments();
                }
            } else {
                // No active membership
                setMembershipStatus({
                    isActive: false,
                    status: null,
                    endDate: null,
                    planName: null
                });
            }
        } catch (error) {
            console.error('Error checking membership status:', error);
            setMembershipStatus({
                isActive: false,
                status: null,
                endDate: null,
                planName: null
            });
        } finally {
            setMembershipLoading(false);
        }
    };

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

    // If membership is not active, show membership required message
    if (membershipLoading) {
        return (
            <Card loading={true}>
                <div className="text-center py-8">
                    <Text>Đang kiểm tra trạng thái membership...</Text>
                </div>
            </Card>
        );
    }

    if (!membershipStatus?.isActive) {
        return (
            <div>
                <Alert
                    message="🚫 Không thể xem lịch hẹn"
                    description={
                        <div>
                            <p>Gói membership của bạn đã hết hạn hoặc bị hủy. Lịch sử lịch hẹn không còn khả dụng.</p>
                            {membershipStatus?.status === 'expired' && (
                                <p className="mt-2">
                                    <strong>Trạng thái:</strong> Đã hết hạn vào {dayjs(membershipStatus.endDate).format('DD/MM/YYYY')}
                                </p>
                            )}
                            {membershipStatus?.status === 'cancelled' && (
                                <p className="mt-2">
                                    <strong>Trạng thái:</strong> Gói đã bị hủy
                                </p>
                            )}
                            <p className="mt-2">
                                Vui lòng mua gói mới để tiếp tục sử dụng dịch vụ tư vấn.
                            </p>
                        </div>
                    }
                    type="warning"
                    showIcon
                    className="mb-6"
                />

                <Card>
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <div className="text-center">
                                <Text type="secondary">Không có lịch sử lịch hẹn</Text>
                                <br />
                                <Text type="secondary" className="text-sm">
                                    Dữ liệu sẽ được ẩn khi membership không còn active
                                </Text>
                            </div>
                        }
                    />
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '24px'
        }}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div
                        className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
                        style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.3)'
                        }}
                    >
                        <HistoryOutlined style={{ fontSize: '32px', color: 'white' }} />
                    </div>
                    <Title level={1} style={{ color: 'white', marginBottom: '8px', fontWeight: 700 }}>
                        Lịch sử cuộc hẹn
                    </Title>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px' }}>
                        Xem lại tất cả các cuộc hẹn tư vấn đã đặt với coach
                    </Text>
                </div>

                {/* Summary Cards - Elegant Compact */}
                <div className="mb-6">
                    <div className="flex flex-wrap gap-3 justify-center">
                        {[
                            {
                                value: statistics.total,
                                label: 'Tổng cuộc hẹn',
                                bgColor: 'rgba(148, 163, 184, 0.1)',
                                accentColor: '#64748b',
                                icon: '📅'
                            },
                            {
                                value: statistics.completed,
                                label: 'Hoàn thành',
                                bgColor: 'rgba(34, 197, 94, 0.1)',
                                accentColor: '#22c55e',
                                icon: '✅'
                            },
                            {
                                value: statistics.pending,
                                label: 'Đang chờ',
                                bgColor: 'rgba(245, 158, 11, 0.1)',
                                accentColor: '#f59e0b',
                                icon: '⏳'
                            },
                            {
                                value: statistics.cancelled,
                                label: 'Đã hủy',
                                bgColor: 'rgba(239, 68, 68, 0.1)',
                                accentColor: '#ef4444',
                                icon: '❌'
                            }
                        ].map((stat, index) => (
                            <div
                                key={index}
                                className="px-4 py-3 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.9)',
                                    backdropFilter: 'blur(10px)',
                                    border: `2px solid ${stat.bgColor}`,
                                    minWidth: '140px',
                                    maxWidth: '160px'
                                }}
                            >
                                <div className="text-center">
                                    <div className="text-lg mb-1" style={{ opacity: 0.8 }}>
                                        {stat.icon}
                                    </div>
                                    <div
                                        className="text-xl font-bold mb-1"
                                        style={{ color: stat.accentColor }}
                                    >
                                        {stat.value}
                                    </div>
                                    <div className="text-xs text-gray-600 font-medium">
                                        {stat.label}
                                    </div>
                                </div>
                                {/* Accent line */}
                                <div
                                    className="w-full h-0.5 mt-2 rounded-full"
                                    style={{
                                        background: `linear-gradient(90deg, ${stat.accentColor}20, ${stat.accentColor}, ${stat.accentColor}20)`
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Appointments Table */}
                <Card
                    className="shadow-2xl transform hover:shadow-3xl transition-all duration-300"
                    style={{
                        borderRadius: '20px',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        overflow: 'hidden'
                    }}
                    bodyStyle={{ padding: '32px' }}
                >
                    <div className="mb-6">
                        <Title level={3} style={{ margin: 0, color: '#1f2937' }}>
                            📅 Danh sách cuộc hẹn
                        </Title>
                        <Text style={{ color: '#6b7280', fontSize: '14px' }}>
                            Quản lý và theo dõi tất cả lịch hẹn của bạn
                        </Text>
                    </div>

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
                            style: {
                                marginTop: '24px'
                            }
                        }}
                        locale={{
                            emptyText: (
                                <div className="py-12">
                                    <div
                                        className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
                                        style={{
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            color: 'white'
                                        }}
                                    >
                                        <CalendarOutlined style={{ fontSize: '32px' }} />
                                    </div>
                                    <Title level={4} style={{ color: '#6b7280', marginBottom: '8px' }}>
                                        Chưa có cuộc hẹn nào
                                    </Title>
                                    <Text style={{ color: '#9ca3af', fontSize: '14px' }}>
                                        Đặt lịch tư vấn với coach để bắt đầu hành trình cai thuốc của bạn
                                    </Text>
                                </div>
                            ),
                        }}
                        rowClassName={getRowClassName}
                        scroll={{ x: 800 }}
                        size="middle"
                        style={{
                            borderRadius: '12px',
                            overflow: 'hidden'
                        }}
                    />
                </Card>

                {/* Legend */}
                <Card
                    className="mt-6 transform hover:shadow-lg transition-all duration-300"
                    style={{
                        borderRadius: '16px',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                    bodyStyle={{ padding: '24px' }}
                >
                    <Title level={4} className="mb-4" style={{ color: '#1f2937' }}>
                        🏷️ Chú thích trạng thái:
                    </Title>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
                        <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50">
                            <div className="w-4 h-4 bg-blue-100 border-2 border-blue-300 rounded"></div>
                            <span className="font-medium text-blue-800">Cuộc hẹn sắp tới</span>
                        </div>
                        <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50">
                            <Tag color="blue" style={{ margin: 0 }}>Đã lên lịch</Tag>
                            <span className="text-blue-700">Chờ xác nhận</span>
                        </div>
                        <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50">
                            <Tag color="green" style={{ margin: 0 }}>Đã xác nhận</Tag>
                            <span className="text-green-700">Đã xác nhận</span>
                        </div>
                        <div className="flex items-center space-x-3 p-3 rounded-lg bg-purple-50">
                            <Tag color="purple" style={{ margin: 0 }}>Hoàn thành</Tag>
                            <span className="text-purple-700">Đã kết thúc</span>
                        </div>
                        <div className="flex items-center space-x-3 p-3 rounded-lg bg-red-50">
                            <Tag color="red" style={{ margin: 0 }}>Đã hủy</Tag>
                            <span className="text-red-700">Bị hủy</span>
                        </div>
                    </div>
                </Card>
            </div>

            <style>{`
                .ant-table-thead > tr > th {
                    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%) !important;
                    border-bottom: 2px solid #e2e8f0 !important;
                    font-weight: 600 !important;
                    color: #374151 !important;
                    padding: 16px 12px !important;
                }
                
                .ant-table-tbody > tr:hover > td {
                    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%) !important;
                }
                
                .ant-table-tbody > tr > td {
                    padding: 12px !important;
                    border-bottom: 1px solid #f1f5f9 !important;
                }
                
                .ant-pagination .ant-pagination-item {
                    border-radius: 8px !important;
                    border: 1px solid #e2e8f0 !important;
                }
                
                .ant-pagination .ant-pagination-item-active {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                    border-color: #667eea !important;
                }
                
                .ant-pagination .ant-pagination-item-active a {
                    color: white !important;
                }
                
                .ant-card-body {
                    border-radius: inherit !important;
                }
                
                .ant-tag {
                    border-radius: 8px !important;
                    font-weight: 500 !important;
                    padding: 2px 8px !important;
                }
            `}</style>
        </div>
    );
};

export default AppointmentHistory; 