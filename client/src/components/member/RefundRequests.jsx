import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Card,
    Table,
    Typography,
    Tag,
    Space,
    Alert,
    Spin,
    Empty,
    Divider,
    Descriptions,
    Button
} from 'antd';
import {
    BankOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ExclamationCircleOutlined,
    DollarOutlined
} from '@ant-design/icons';
import { getRefundRequests } from '../../store/slices/membershipSlice';

const { Title, Text } = Typography;

const RefundRequests = () => {
    const dispatch = useDispatch();
    const { refundRequests, loading, error } = useSelector(state => state.membership);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadRefundRequests();
    }, [dispatch]);

    const loadRefundRequests = async () => {
        try {
            setRefreshing(true);
            await dispatch(getRefundRequests()).unwrap();
        } catch (error) {
            console.error('Error loading refund requests:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const getStatusTag = (record) => {
        const { Status, RequestType, RefundApproved, TransferConfirmed, RefundReceived } = record;

        // For cancellation requests (new workflow)
        if (RequestType === 'cancellation') {
            if (Status === 'pending') {
                return <Tag color="orange" icon={<ClockCircleOutlined />}>Chờ admin xác nhận HỦY</Tag>;
            } else if (Status === 'approved' && RefundApproved) {
                if (!TransferConfirmed) {
                    return <Tag color="blue" icon={<CheckCircleOutlined />}>Đã duyệt - Chờ chuyển tiền</Tag>;
                } else if (!RefundReceived) {
                    return <Tag color="cyan" icon={<BankOutlined />}>Đã chuyển tiền - Chờ xác nhận</Tag>;
                } else {
                    return <Tag color="green" icon={<CheckCircleOutlined />}>Hoàn tất</Tag>;
                }
            } else if (Status === 'approved' && !RefundApproved) {
                return <Tag color="green" icon={<CheckCircleOutlined />}>Đã hủy (không hoàn tiền)</Tag>;
            } else if (Status === 'rejected') {
                return <Tag color="red" icon={<CloseCircleOutlined />}>Đã từ chối</Tag>;
            } else if (Status === 'transfer_confirmed') {
                return <Tag color="cyan" icon={<BankOutlined />}>Đã chuyển tiền</Tag>;
            } else if (Status === 'completed') {
                return <Tag color="green" icon={<CheckCircleOutlined />}>Hoàn tất</Tag>;
            }
        }

        // For legacy refund requests
        const statusConfig = {
            pending: { color: 'orange', icon: <ClockCircleOutlined />, text: 'Đang chờ xử lý' },
            approved: { color: 'blue', icon: <CheckCircleOutlined />, text: 'Đã duyệt' },
            completed: { color: 'green', icon: <CheckCircleOutlined />, text: 'Đã hoàn tiền' },
            rejected: { color: 'red', icon: <CloseCircleOutlined />, text: 'Đã từ chối' }
        };

        const config = statusConfig[Status] || statusConfig.pending;
        return (
            <Tag color={config.color} icon={config.icon}>
                {config.text}
            </Tag>
        );
    };

    const getRefundAmount = (record) => {
        // For cancellation requests, use ApprovedRefundAmount if available, otherwise RequestedRefundAmount
        if (record.RequestType === 'cancellation') {
            const amount = record.ApprovedRefundAmount || record.RefundAmount;
            return amount;
        }
        // For legacy refunds
        return record.RefundAmount;
    };

    const columns = [
        {
            title: 'Thời gian yêu cầu',
            dataIndex: 'RequestedAt',
            key: 'requestedAt',
            render: (date) => new Date(date).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }),
            width: 150
        },
        {
            title: 'Gói dịch vụ',
            dataIndex: 'PlanName',
            key: 'planName',
            width: 150
        },
        {
            title: 'Số tiền hoàn',
            key: 'refundAmount',
            render: (_, record) => {
                const amount = getRefundAmount(record);
                return amount ? (
                    <Text strong style={{ color: '#52c41a' }}>
                        {amount.toLocaleString('vi-VN')} VNĐ
                    </Text>
                ) : (
                    <Text type="secondary">Không hoàn tiền</Text>
                );
            },
            width: 120
        },
        {
            title: 'Trạng thái',
            key: 'status',
            render: (_, record) => getStatusTag(record),
            width: 180
        },
        {
            title: 'Ngân hàng',
            key: 'bankInfo',
            render: (_, record) => {
                if (!record.BankName) {
                    return <Text type="secondary">-</Text>;
                }
                return (
                    <div>
                        <div><Text strong>{record.BankName}</Text></div>
                        <div><Text type="secondary">{record.BankAccountNumber}</Text></div>
                        <div><Text type="secondary" style={{ fontSize: '12px' }}>{record.AccountHolderName}</Text></div>
                    </div>
                );
            },
            width: 180
        },
        {
            title: 'Ghi chú',
            key: 'notes',
            render: (_, record) => {
                if (record.AdminNotes) {
                    return <Text style={{ fontSize: '12px' }}>{record.AdminNotes}</Text>;
                }
                if (record.RequestType === 'cancellation' && record.Status === 'pending') {
                    return <Text type="secondary" style={{ fontSize: '12px' }}>Đang chờ admin xem xét yêu cầu hủy gói</Text>;
                }
                return <Text type="secondary">-</Text>;
            },
            width: 150
        }
    ];

    if (loading && !refreshing) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <Title level={3} style={{ margin: 0 }}>
                        <DollarOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                        Yêu cầu hoàn tiền
                    </Title>
                    <Button
                        onClick={loadRefundRequests}
                        loading={refreshing}
                        type="primary"
                        ghost
                    >
                        Làm mới
                    </Button>
                </div>

                {error && (
                    <Alert
                        message="Lỗi"
                        description={error}
                        type="error"
                        style={{ marginBottom: '16px' }}
                        showIcon
                    />
                )}

                <Alert
                    message="Quy trình hoàn tiền"
                    description={
                        <div>
                            <p><strong>Bước 1:</strong> Bạn gửi yêu cầu hủy gói → Trạng thái: <Tag color="orange">Chờ admin xác nhận HỦY</Tag></p>
                            <p><strong>Bước 2:</strong> Admin xác nhận → Trạng thái: <Tag color="blue">Đã duyệt - Chờ chuyển tiền</Tag></p>
                            <p><strong>Bước 3:</strong> Admin chuyển tiền → Trạng thái: <Tag color="cyan">Đã chuyển tiền - Chờ xác nhận</Tag></p>
                            <p><strong>Bước 4:</strong> Bạn xác nhận nhận tiền → Trạng thái: <Tag color="green">Hoàn tất</Tag></p>
                            <p>• Thời gian xử lý: 3-5 ngày làm việc sau khi được duyệt.</p>
                        </div>
                    }
                    type="info"
                    style={{ marginBottom: '24px' }}
                    showIcon
                />

                {refundRequests && refundRequests.length > 0 ? (
                    <Table
                        columns={columns}
                        dataSource={refundRequests}
                        rowKey={(record) => record.RequestID || record.RefundRequestID}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: false,
                            showQuickJumper: true,
                            showTotal: (total, range) =>
                                `${range[0]}-${range[1]} của ${total} yêu cầu`,
                        }}
                        expandable={{
                            expandedRowRender: (record) => (
                                <div style={{ margin: 0 }}>
                                    <Descriptions
                                        title="Chi tiết yêu cầu"
                                        bordered
                                        column={2}
                                        size="small"
                                    >
                                        <Descriptions.Item label="Loại yêu cầu">
                                            {record.RequestType === 'cancellation' ? 'Hủy gói dịch vụ' : 'Hoàn tiền cũ'}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Lý do">
                                            {record.RefundReason || record.CancellationReason || '-'}
                                        </Descriptions.Item>
                                        {record.ProcessedAt && (
                                            <Descriptions.Item label="Thời gian xử lý">
                                                {new Date(record.ProcessedAt).toLocaleString('vi-VN')}
                                            </Descriptions.Item>
                                        )}
                                        {record.ProcessedByName && (
                                            <Descriptions.Item label="Được xử lý bởi">
                                                {record.ProcessedByName}
                                            </Descriptions.Item>
                                        )}
                                        {record.TransferDate && (
                                            <Descriptions.Item label="Ngày chuyển tiền">
                                                {new Date(record.TransferDate).toLocaleString('vi-VN')}
                                            </Descriptions.Item>
                                        )}
                                        {record.ReceivedDate && (
                                            <Descriptions.Item label="Ngày xác nhận nhận tiền">
                                                {new Date(record.ReceivedDate).toLocaleString('vi-VN')}
                                            </Descriptions.Item>
                                        )}
                                    </Descriptions>
                                </div>
                            ),
                            rowExpandable: (record) => !!(record.RefundReason || record.CancellationReason || record.ProcessedAt),
                        }}
                    />
                ) : (
                    <Empty
                        description="Chưa có yêu cầu hoàn tiền nào"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                )}
            </Card>
        </div>
    );
};

export default RefundRequests; 