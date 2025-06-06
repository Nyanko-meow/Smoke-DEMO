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
    Modal,
    notification,
    Descriptions,
    Popconfirm
} from 'antd';
import {
    BellOutlined,
    CheckOutlined,
    CreditCardOutlined,
    GiftOutlined,
    InfoCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    EyeOutlined,
    BankOutlined,
    DollarOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;

const UserNotifications = ({ visible, onClose }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [confirmRefundLoading, setConfirmRefundLoading] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/notifications', {
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
        if (visible) {
            fetchNotifications();
        }
    }, [visible, fetchNotifications]);

    const markAsRead = async (notificationId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/notifications/${notificationId}/read`, {}, {
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
            await axios.put('/api/notifications/read-all', {}, {
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

        setDetailModalVisible(true);
    };

    const confirmRefundReceived = async (cancellationId) => {
        setConfirmRefundLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`/api/membership/confirm-refund-received/${cancellationId}`, {
                confirmed: true
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            message.success('Đã xác nhận nhận tiền hoàn trả thành công!');
            setDetailModalVisible(false);
            fetchNotifications(); // Refresh notifications

            // Update user role if changed to guest
            notification.success({
                message: 'Hoàn thành quy trình hủy gói',
                description: 'Cảm ơn bạn đã xác nhận. Quy trình hủy gói dịch vụ đã hoàn tất.',
                duration: 5
            });
        } catch (error) {
            console.error('Error confirming refund received:', error);
            message.error(error.response?.data?.message || 'Không thể xác nhận nhận tiền');
        } finally {
            setConfirmRefundLoading(false);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'payment':
                return <CreditCardOutlined style={{ color: '#1890ff' }} />;
            case 'cancellation':
                return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
            case 'cancellation_rejected':
                return <CloseCircleOutlined style={{ color: '#ff7875' }} />;
            case 'transfer_confirmed':
                return <BankOutlined style={{ color: '#52c41a' }} />;
            case 'refund_completed':
                return <DollarOutlined style={{ color: '#faad14' }} />;
            case 'achievement':
                return <GiftOutlined style={{ color: '#fa8c16' }} />;
            default:
                return <InfoCircleOutlined style={{ color: '#666' }} />;
        }
    };

    const getNotificationTypeTag = (type) => {
        switch (type) {
            case 'payment':
                return <Tag color="blue">Thanh toán</Tag>;
            case 'cancellation':
                return <Tag color="orange">Yêu cầu hủy gói</Tag>;
            case 'cancellation_rejected':
                return <Tag color="red">Hủy gói bị từ chối</Tag>;
            case 'transfer_confirmed':
                return <Tag color="green">Xác nhận chuyển tiền</Tag>;
            case 'refund_completed':
                return <Tag color="purple">Hoàn tiền hoàn tất</Tag>;
            case 'achievement':
                return <Tag color="gold">Thành tích</Tag>;
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

    return (
        <Modal
            title={
                <Space>
                    <BellOutlined />
                    <span>Thông báo của tôi</span>
                    {unreadCount > 0 && (
                        <Badge count={unreadCount} style={{ backgroundColor: '#ff4d4f' }} />
                    )}
                </Space>
            }
            open={visible}
            onCancel={onClose}
            width={800}
            footer={[
                <Button key="mark-all" onClick={markAllAsRead} disabled={unreadCount === 0}>
                    Đánh dấu tất cả đã đọc
                </Button>,
                <Button key="close" onClick={onClose}>
                    Đóng
                </Button>
            ]}
            bodyStyle={{ maxHeight: '60vh', overflowY: 'auto' }}
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
                    renderItem={(notif) => (
                        <List.Item
                            style={{
                                backgroundColor: notif.IsRead ? 'white' : '#f6ffed',
                                border: notif.IsRead ? '1px solid #f0f0f0' : '1px solid #b7eb8f',
                                marginBottom: '8px',
                                borderRadius: '4px',
                                padding: '12px',
                                cursor: 'pointer'
                            }}
                            onClick={() => viewNotificationDetail(notif)}
                            actions={[
                                <Button
                                    key="view"
                                    type="text"
                                    icon={<EyeOutlined />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        viewNotificationDetail(notif);
                                    }}
                                />
                            ]}
                        >
                            <List.Item.Meta
                                avatar={getNotificationIcon(notif.Type)}
                                title={
                                    <Space>
                                        <Text strong={!notif.IsRead}>
                                            {notif.Title}
                                        </Text>
                                        {getNotificationTypeTag(notif.Type)}
                                    </Space>
                                }
                                description={
                                    <div>
                                        <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0 }}>
                                            {notif.Message}
                                        </Paragraph>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                            {formatDate(notif.CreatedAt)}
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
                }}
                width={600}
                footer={[
                    // Show confirm refund button for transfer_confirmed notifications
                    selectedNotification?.Type === 'transfer_confirmed' && (
                        <Popconfirm
                            key="confirm-refund"
                            title="Xác nhận đã nhận tiền hoàn trả?"
                            description="Bạn có chắc chắn đã nhận được tiền hoàn trả vào tài khoản của mình không?"
                            onConfirm={() => confirmRefundReceived(selectedNotification.RelatedID)}
                            okText="Đã nhận được"
                            cancelText="Chưa nhận"
                        >
                            <Button
                                type="primary"
                                icon={<CheckOutlined />}
                                loading={confirmRefundLoading}
                            >
                                Xác nhận đã nhận tiền
                            </Button>
                        </Popconfirm>
                    ),
                    <Button key="close" onClick={() => setDetailModalVisible(false)}>
                        Đóng
                    </Button>
                ]}
            >
                {selectedNotification && (
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

                        {/* Special instructions for transfer_confirmed notifications */}
                        {selectedNotification.Type === 'transfer_confirmed' && (
                            <Descriptions.Item label="Hướng dẫn">
                                <div style={{ backgroundColor: '#fff7e6', padding: '12px', borderRadius: '4px', border: '1px solid #ffd591' }}>
                                    <Text strong style={{ color: '#fa8c16' }}>
                                        📋 Vui lòng kiểm tra tài khoản ngân hàng của bạn
                                    </Text>
                                    <br />
                                    <Text>
                                        Sau khi đã nhận được tiền hoàn trả, bấm nút "Xác nhận đã nhận tiền" để hoàn thành quy trình hủy gói dịch vụ.
                                    </Text>
                                </div>
                            </Descriptions.Item>
                        )}
                    </Descriptions>
                )}
            </Modal>
        </Modal>
    );
};

export default UserNotifications; 