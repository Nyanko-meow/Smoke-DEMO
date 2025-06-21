import React, { useState, useEffect, useCallback } from 'react';
import {
    Card,
    List,
    Badge,
    Button,
    Empty,
    Spin,
    message,
    Tag,
    Space,
    Typography,
    Divider,
    Dropdown,
    Menu,
    Modal,
    Popconfirm,
    Descriptions,
    Input
} from 'antd';
import {
    BellOutlined,
    CheckOutlined,
    DeleteOutlined,
    EyeOutlined,
    CreditCardOutlined,
    UserOutlined,
    MoreOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    DollarOutlined,
    BankOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const AdminNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [confirmTransferModalVisible, setConfirmTransferModalVisible] = useState(false);
    const [selectedCancellation, setSelectedCancellation] = useState(null);
    const [confirmTransferLoading, setConfirmTransferLoading] = useState(false);
    const [transferNotes, setTransferNotes] = useState('');

    // Tải thông báo
    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/admin/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setNotifications(response.data.data);
                const unread = response.data.data.filter(n => !n.IsRead).length;
                setUnreadCount(unread);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            message.error('Không thể tải thông báo');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const markAsRead = async (notificationId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/admin/notifications/${notificationId}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setNotifications(prev =>
                prev.map(n => n.NotificationID === notificationId ? { ...n, IsRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
            message.error('Không thể đánh dấu đã đọc');
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put('/api/admin/notifications/read-all', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setNotifications(prev => prev.map(n => ({ ...n, IsRead: true })));
            setUnreadCount(0);
            message.success('Đã đánh dấu tất cả thông báo là đã đọc');
        } catch (error) {
            console.error('Error marking all as read:', error);
            message.error('Không thể đánh dấu tất cả đã đọc');
        }
    };

    const viewNotificationDetail = async (notification) => {
        setSelectedNotification(notification);

        // Mark as read if not already
        if (!notification.IsRead) {
            await markAsRead(notification.NotificationID);
        }

        // If it's a cancellation notification, fetch cancellation details
        if (notification.Type === 'admin_cancellation' && notification.RelatedID) {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`/api/admin/pending-cancellations`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.data.success) {
                    const cancellation = response.data.data.find(c =>
                        c.CancellationRequestID === notification.RelatedID
                    );
                    setSelectedCancellation(cancellation);
                }
            } catch (error) {
                console.error('Error fetching cancellation details:', error);
            }
        }

        setDetailModalVisible(true);
    };

    const handleConfirmTransfer = async () => {
        if (!selectedCancellation) return;

        setConfirmTransferLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`/api/admin/confirm-transfer/${selectedCancellation.CancellationRequestID}`, {
                adminNotes: transferNotes
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            message.success('Đã xác nhận chuyển tiền thành công');
            setConfirmTransferModalVisible(false);
            setDetailModalVisible(false);
            setTransferNotes('');
            fetchNotifications(); // Refresh notifications
        } catch (error) {
            console.error('Error confirming transfer:', error);
            message.error(error.response?.data?.message || 'Không thể xác nhận chuyển tiền');
        } finally {
            setConfirmTransferLoading(false);
        }
    };

    const goToPaymentManagement = (paymentId) => {
        // Navigate to payment management with specific payment highlighted
        window.location.hash = '#payments';
        setDetailModalVisible(false);
    };

    const goToCancellationManagement = () => {
        // Navigate to cancellation management
        window.location.hash = '#cancellations';
        setDetailModalVisible(false);
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'payment':
                return <CreditCardOutlined style={{ color: '#1890ff' }} />;
            case 'admin_cancellation':
                return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
            case 'transfer_confirmed':
                return <BankOutlined style={{ color: '#52c41a' }} />;
            case 'admin_refund_completed':
                return <DollarOutlined style={{ color: '#faad14' }} />;
            default:
                return <BellOutlined style={{ color: '#666' }} />;
        }
    };

    const getNotificationTypeTag = (type) => {
        switch (type) {
            case 'payment':
                return <Tag color="blue">Thanh toán</Tag>;
            case 'admin_cancellation':
                return <Tag color="red">Yêu cầu hủy gói</Tag>;
            case 'transfer_confirmed':
                return <Tag color="green">Xác nhận chuyển tiền</Tag>;
            case 'admin_refund_completed':
                return <Tag color="orange">Hoàn tiền hoàn tất</Tag>;
            default:
                return <Tag>Thông báo</Tag>;
        }
    };

    const formatDate = (dateString) => {
        try {
            return new Date(dateString).toLocaleString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    };

    const formatCurrency = (amount) => {
        if (!amount) return '0';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const notificationMenuItems = (notification) => [
        {
            key: 'view',
            icon: <EyeOutlined />,
            label: 'Xem chi tiết',
            onClick: () => viewNotificationDetail(notification)
        },
        {
            key: 'mark-read',
            icon: <CheckOutlined />,
            label: notification.IsRead ? 'Đã đọc' : 'Đánh dấu đã đọc',
            disabled: notification.IsRead,
            onClick: () => markAsRead(notification.NotificationID)
        }
    ];

    return (
        <Card
            title={
                <Space>
                    <BellOutlined />
                    <span>Thông báo Admin</span>
                    {unreadCount > 0 && (
                        <Badge count={unreadCount} style={{ backgroundColor: '#ff4d4f' }} />
                    )}
                </Space>
            }
            extra={
                <Button onClick={markAllAsRead} disabled={unreadCount === 0}>
                    Đánh dấu tất cả đã đọc
                </Button>
            }
        >
            {loading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Spin size="large" />
                </div>
            ) : notifications.length === 0 ? (
                <Empty description="Không có thông báo nào" />
            ) : (
                <List
                    dataSource={notifications}
                    renderItem={(notification) => (
                        <List.Item
                            style={{
                                backgroundColor: notification.IsRead ? 'white' : '#f6ffed',
                                border: notification.IsRead ? '1px solid #f0f0f0' : '1px solid #b7eb8f',
                                marginBottom: '8px',
                                borderRadius: '4px',
                                padding: '12px'
                            }}
                            actions={[
                                <Dropdown
                                    menu={{ items: notificationMenuItems(notification) }}
                                    trigger={['click']}
                                >
                                    <Button type="text" icon={<MoreOutlined />} />
                                </Dropdown>
                            ]}
                        >
                            <List.Item.Meta
                                avatar={getNotificationIcon(notification.Type)}
                                title={
                                    <Space>
                                        <Text strong={!notification.IsRead}>
                                            {notification.Title}
                                        </Text>
                                        {getNotificationTypeTag(notification.Type)}
                                    </Space>
                                }
                                description={
                                    <div>
                                        <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0 }}>
                                            {notification.Message}
                                        </Paragraph>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                            {formatDate(notification.CreatedAt)}
                                        </Text>
                                    </div>
                                }
                            />
                        </List.Item>
                    )}
                />
            )}

            {/* Notification Detail Modal */}
            <Modal
                title="Chi tiết thông báo"
                open={detailModalVisible}
                onCancel={() => {
                    setDetailModalVisible(false);
                    setSelectedNotification(null);
                    setSelectedCancellation(null);
                }}
                width={800}
                footer={
                    selectedNotification?.Type === 'admin_cancellation' && selectedCancellation ? [
                        <Button key="manage" onClick={goToCancellationManagement}>
                            Quản lý hủy gói
                        </Button>,
                        selectedCancellation.Status === 'approved' && selectedCancellation.RefundApproved && !selectedCancellation.TransferConfirmed ? [
                            <Button
                                key="confirm-transfer"
                                type="primary"
                                icon={<BankOutlined />}
                                onClick={() => setConfirmTransferModalVisible(true)}
                            >
                                Xác nhận đã chuyển tiền
                            </Button>
                        ] : null,
                        <Button key="close" onClick={() => setDetailModalVisible(false)}>
                            Đóng
                        </Button>
                    ] : [
                        selectedNotification?.Type === 'payment' && (
                            <Button key="payment" type="primary" onClick={() => goToPaymentManagement(selectedNotification.RelatedID)}>
                                Quản lý thanh toán
                            </Button>
                        ),
                        <Button key="close" onClick={() => setDetailModalVisible(false)}>
                            Đóng
                        </Button>
                    ]
                }
            >
                {selectedNotification && (
                    <div>
                        <Descriptions bordered column={1}>
                            <Descriptions.Item label="Tiêu đề">
                                {selectedNotification.Title}
                            </Descriptions.Item>
                            <Descriptions.Item label="Loại">
                                {getNotificationTypeTag(selectedNotification.Type)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Thời gian">
                                {formatDate(selectedNotification.CreatedAt)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Trạng thái">
                                <Tag color={selectedNotification.IsRead ? 'green' : 'orange'}>
                                    {selectedNotification.IsRead ? 'Đã đọc' : 'Chưa đọc'}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Nội dung">
                                <Paragraph>{selectedNotification.Message}</Paragraph>
                            </Descriptions.Item>
                        </Descriptions>

                        {/* Show cancellation details if available */}
                        {selectedCancellation && (
                            <>
                                <Divider>Chi tiết yêu cầu hủy gói</Divider>
                                <Descriptions bordered column={2}>
                                    <Descriptions.Item label="Khách hàng" span={2}>
                                        {selectedCancellation.FirstName} {selectedCancellation.LastName}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Email">
                                        {selectedCancellation.Email}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Số điện thoại">
                                        {selectedCancellation.PhoneNumber}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Gói dịch vụ">
                                        {selectedCancellation.PlanName}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Giá gói">
                                        {formatCurrency(selectedCancellation.PlanPrice)}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Số tiền yêu cầu hoàn" span={2}>
                                        <Text strong style={{ color: '#ff4d4f' }}>
                                            {formatCurrency(selectedCancellation.RequestedRefundAmount)}
                                        </Text>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Lý do hủy" span={2}>
                                        {selectedCancellation.CancellationReason}
                                    </Descriptions.Item>

                                    {/* Bank Information */}
                                    {selectedCancellation.BankAccountNumber && (
                                        <>
                                            <Descriptions.Item label="Số tài khoản">
                                                <Text copyable>{selectedCancellation.BankAccountNumber}</Text>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Ngân hàng">
                                                {selectedCancellation.BankName}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Tên chủ tài khoản" span={2}>
                                                {selectedCancellation.AccountHolderName}
                                            </Descriptions.Item>
                                        </>
                                    )}

                                    <Descriptions.Item label="Trạng thái">
                                        <Tag color={
                                            selectedCancellation.Status === 'pending' ? 'orange' :
                                                selectedCancellation.Status === 'approved' ? 'green' :
                                                    selectedCancellation.Status === 'transfer_confirmed' ? 'blue' :
                                                        selectedCancellation.Status === 'completed' ? 'purple' : 'red'
                                        }>
                                            {selectedCancellation.Status === 'pending' ? 'Chờ xử lý' :
                                                selectedCancellation.Status === 'approved' ? 'Đã duyệt' :
                                                    selectedCancellation.Status === 'transfer_confirmed' ? 'Đã chuyển tiền' :
                                                        selectedCancellation.Status === 'completed' ? 'Hoàn tất' : 'Từ chối'}
                                        </Tag>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Yêu cầu lúc">
                                        {formatDate(selectedCancellation.RequestedAt)}
                                    </Descriptions.Item>

                                    {selectedCancellation.TransferConfirmed && (
                                        <>
                                            <Descriptions.Item label="Đã chuyển tiền">
                                                <Tag color="green">
                                                    <CheckCircleOutlined /> Đã xác nhận
                                                </Tag>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Thời gian chuyển">
                                                {formatDate(selectedCancellation.TransferDate)}
                                            </Descriptions.Item>
                                        </>
                                    )}

                                    {selectedCancellation.RefundReceived && (
                                        <>
                                            <Descriptions.Item label="Khách hàng xác nhận">
                                                <Tag color="purple">
                                                    <CheckCircleOutlined /> Đã nhận tiền
                                                </Tag>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Thời gian nhận">
                                                {formatDate(selectedCancellation.ReceivedDate)}
                                            </Descriptions.Item>
                                        </>
                                    )}
                                </Descriptions>
                            </>
                        )}
                    </div>
                )}
            </Modal>

            {/* Confirm Transfer Modal */}
            <Modal
                title="Xác nhận đã chuyển tiền"
                open={confirmTransferModalVisible}
                onOk={handleConfirmTransfer}
                onCancel={() => {
                    setConfirmTransferModalVisible(false);
                    setTransferNotes('');
                }}
                confirmLoading={confirmTransferLoading}
                okText="Xác nhận đã chuyển"
                cancelText="Hủy"
            >
                {selectedCancellation && (
                    <>
                        <p>Xác nhận bạn đã chuyển tiền hoàn trả cho:</p>
                        <Descriptions bordered column={1} size="small">
                            <Descriptions.Item label="Khách hàng">
                                {selectedCancellation.FirstName} {selectedCancellation.LastName}
                            </Descriptions.Item>
                            <Descriptions.Item label="Số tiền">
                                <Text strong style={{ color: '#ff4d4f' }}>
                                    {formatCurrency(selectedCancellation.RefundAmount)}
                                </Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Tài khoản">
                                {selectedCancellation.BankName} - {selectedCancellation.BankAccountNumber}
                            </Descriptions.Item>
                            <Descriptions.Item label="Chủ tài khoản">
                                {selectedCancellation.AccountHolderName}
                            </Descriptions.Item>
                        </Descriptions>

                        <div style={{ marginTop: '16px' }}>
                            <Text>Ghi chú (tùy chọn):</Text>
                            <TextArea
                                value={transferNotes}
                                onChange={(e) => setTransferNotes(e.target.value)}
                                placeholder="Nhập ghi chú về việc chuyển tiền..."
                                rows={3}
                                style={{ marginTop: '8px' }}
                            />
                        </div>
                    </>
                )}
            </Modal>
        </Card>
    );
};

export default AdminNotifications; 