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
    Button,
    Modal,
    message
} from 'antd';
import {
    BankOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ExclamationCircleOutlined,
    DollarOutlined
} from '@ant-design/icons';
import { getRefundRequests, confirmRefundReceived } from '../../store/slices/membershipSlice';

const { Title, Text } = Typography;

const RefundRequests = () => {
    const dispatch = useDispatch();
    const { refundRequests, loading, error } = useSelector(state => state.membership);
    const [refreshing, setRefreshing] = useState(false);
    const [confirmingRefund, setConfirmingRefund] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);

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

    const handleConfirmRefund = async (request) => {
        setSelectedRequest(request);

        // Debug log để xem tất cả field trong request
        console.log('Full request object:', request);
        console.log('Available ID fields:', {
            CancellationRequestID: request.CancellationRequestID,
            RequestID: request.RequestID,
            RefundRequestID: request.RefundRequestID,
            ID: request.ID
        });

        Modal.confirm({
            title: 'Xác nhận đã nhận tiền hoàn trả',
            content: (
                <div>
                    <p>Bạn có chắc chắn đã nhận được tiền hoàn trả không?</p>
                    <div style={{ marginTop: '16px', padding: '12px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '6px' }}>
                        <Text strong>Số tiền: </Text>
                        <Text style={{ color: '#52c41a' }}>
                            {(request.ApprovedRefundAmount || request.RefundAmount)?.toLocaleString('vi-VN')} VNĐ
                        </Text>
                        <br />
                        <Text strong>Ngân hàng: </Text>
                        <Text>{request.BankName} - {request.BankAccountNumber}</Text>
                    </div>
                    <p style={{ marginTop: '12px', color: '#666' }}>
                        <strong>Lưu ý:</strong> Sau khi xác nhận, quy trình hoàn tiền sẽ hoàn tất và không thể thay đổi.
                    </p>
                </div>
            ),
            okText: 'Xác nhận đã nhận tiền',
            cancelText: 'Hủy',
            onOk: async () => {
                setConfirmingRefund(true);
                try {
                    // Tìm ID phù hợp - thử các field có thể
                    const requestId = request.CancellationRequestID || request.RequestID || request.RefundRequestID || request.ID;
                    console.log('Using requestId:', requestId);

                    if (!requestId) {
                        throw new Error('Không tìm thấy ID của yêu cầu');
                    }

                    await dispatch(confirmRefundReceived(requestId)).unwrap();
                    message.success('Đã xác nhận nhận tiền hoàn trả thành công!');
                    await loadRefundRequests(); // Refresh data
                } catch (error) {
                    message.error(error.message || 'Không thể xác nhận nhận tiền hoàn trả');
                } finally {
                    setConfirmingRefund(false);
                }
            }
        });
    };

    const getStatusTag = (record) => {
        const { Status, RequestType, RefundApproved, TransferConfirmed, RefundReceived } = record;

        // For cancellation requests (new workflow)
        if (RequestType === 'cancellation') {
            if (Status === 'pending') {
                return <Tag color="orange" icon={<ClockCircleOutlined />}>Chờ admin xác nhận HỦY</Tag>;
            } else if (Status === 'approved') {
                if (RefundApproved) {
                    // Có hoàn tiền
                    if (!TransferConfirmed) {
                        return <Tag color="blue" icon={<CheckCircleOutlined />}>Đã duyệt - Chờ chuyển tiền</Tag>;
                    } else if (!RefundReceived) {
                        return <Tag color="cyan" icon={<BankOutlined />}>Đã chuyển tiền - Chờ xác nhận</Tag>;
                    } else {
                        return <Tag color="green" icon={<CheckCircleOutlined />}>Hoàn tất</Tag>;
                    }
                } else {
                    // Không hoàn tiền - cũng là hoàn tất
                    return <Tag color="green" icon={<CheckCircleOutlined />}>Hoàn tất</Tag>;
                }
            } else if (Status === 'rejected') {
                return <Tag color="red" icon={<CloseCircleOutlined />}>Từ chối hủy</Tag>;
            } else if (Status === 'transfer_confirmed') {
                return <Tag color="cyan" icon={<BankOutlined />}>Đã chuyển tiền - Chờ xác nhận</Tag>;
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
        },
        {
            title: 'Thao tác',
            key: 'actions',
            render: (_, record) => {
                // Điều kiện hiển thị nút: request đã được approve với refund nhưng chưa xác nhận nhận tiền
                const canConfirmReceived = record.RequestType === 'cancellation' &&
                    record.Status === 'approved' &&
                    record.RefundApproved &&
                    !record.RefundReceived;

                if (canConfirmReceived) {
                    return (
                        <Button
                            type="primary"
                            size="small"
                            loading={confirmingRefund}
                            onClick={() => handleConfirmRefund(record)}
                            style={{
                                background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: 500
                            }}
                        >
                            Xác nhận đã nhận tiền
                        </Button>
                    );
                }
                return <Text type="secondary">-</Text>;
            },
            width: 150
        }
    ];

    if (loading && !refreshing) {
        return (
            <div style={{
                minHeight: '60vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '32px 16px'
            }}>
                <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '20px',
                    padding: '48px 32px',
                    textAlign: 'center',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px',
                        boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
                        animation: 'spin 1s linear infinite'
                    }}>
                        <Spin indicator={false} />
                    </div>
                    <div style={{
                        fontSize: '16px',
                        color: '#6b7280',
                        fontWeight: 500
                    }}>
                        Đang tải yêu cầu hoàn tiền...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: '32px' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <DollarOutlined style={{
                        fontSize: '24px',
                        color: '#667eea',
                        marginRight: '12px'
                    }} />
                    <Title level={3} style={{
                        margin: 0,
                        color: '#374151',
                        fontWeight: 600
                    }}>
                        Yêu cầu hoàn tiền
                    </Title>
                </div>
                <Button
                    onClick={loadRefundRequests}
                    loading={refreshing}
                    size="large"
                    style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        color: 'white',
                        fontWeight: 600,
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                    }}
                >
                    Làm mới
                </Button>
            </div>

            {error && (
                <div style={{
                    background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '24px',
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '12px'
                        }}>
                            ⚠️
                        </div>
                        <div>
                            <div style={{ color: '#dc2626', fontWeight: 600, marginBottom: '4px' }}>
                                Lỗi
                            </div>
                            <div style={{ color: '#7f1d1d' }}>
                                {error}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div style={{
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '24px',
                border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '12px'
                    }}>
                        ℹ️
                    </div>
                    <Title level={4} style={{
                        margin: 0,
                        color: '#1e40af',
                        fontWeight: 600
                    }}>
                        Quy trình hoàn tiền
                    </Title>
                </div>
                <div style={{ marginLeft: '52px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '12px',
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.7)',
                        borderRadius: '8px'
                    }}>
                        <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '12px',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 600
                        }}>
                            1
                        </div>
                        <div>
                            <strong>Bước 1:</strong> Bạn gửi yêu cầu hủy gói → Trạng thái:
                            <span style={{
                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 600,
                                marginLeft: '8px'
                            }}>
                                Chờ admin xác nhận HỦY
                            </span>
                        </div>
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '12px',
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.7)',
                        borderRadius: '8px'
                    }}>
                        <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '12px',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 600
                        }}>
                            2
                        </div>
                        <div>
                            <strong>Bước 2:</strong> Admin duyệt và chuyển tiền → Trạng thái:
                            <span style={{
                                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 600,
                                marginLeft: '8px'
                            }}>
                                Đã duyệt - Chờ chuyển tiền
                            </span>
                        </div>
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '12px',
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.7)',
                        borderRadius: '8px'
                    }}>
                        <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '12px',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 600
                        }}>
                            3
                        </div>
                        <div>
                            <strong>Bước 3:</strong> Bạn xác nhận nhận tiền → Trạng thái:
                            <span style={{
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 600,
                                marginLeft: '8px'
                            }}>
                                Hoàn tất
                            </span>
                        </div>
                    </div>
                    <div style={{
                        color: '#1e40af',
                        fontSize: '14px',
                        fontWeight: 500,
                        marginTop: '16px'
                    }}>
                        • Thời gian xử lý: 3-5 ngày làm việc sau khi được duyệt.
                    </div>
                </div>
            </div>

            {refundRequests && refundRequests.length > 0 ? (
                <div style={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid rgba(0, 0, 0, 0.05)'
                }}>
                    <Table
                        columns={columns}
                        dataSource={refundRequests}
                        rowKey="RequestID"
                        pagination={{
                            pageSize: 5,
                            showSizeChanger: false,
                            showQuickJumper: true,
                            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} yêu cầu`,
                            style: { marginTop: '24px' }
                        }}
                        expandable={{
                            expandedRowRender: (record) => (
                                <div style={{
                                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    margin: '12px 0'
                                }}>
                                    <Descriptions bordered size="small" column={2}>
                                        <Descriptions.Item label="Loại yêu cầu">
                                            <span style={{
                                                background: record.RequestType === 'cancellation'
                                                    ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                                                    : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                                                color: 'white',
                                                padding: '4px 8px',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                fontWeight: 600
                                            }}>
                                                {record.RequestType === 'cancellation' ? 'Hủy gói dịch vụ' : 'Hoàn tiền cũ'}
                                            </span>
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
                                                <span style={{
                                                    fontWeight: 600,
                                                    color: '#667eea'
                                                }}>
                                                    {record.ProcessedByName}
                                                </span>
                                            </Descriptions.Item>
                                        )}
                                        {record.TransferDate && (
                                            <Descriptions.Item label="Ngày chuyển tiền">
                                                {new Date(record.TransferDate).toLocaleString('vi-VN')}
                                            </Descriptions.Item>
                                        )}
                                    </Descriptions>
                                </div>
                            ),
                            expandIcon: ({ expanded, onExpand, record }) => (
                                <Button
                                    size="small"
                                    type="text"
                                    onClick={e => onExpand(record, e)}
                                    style={{
                                        background: expanded
                                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                            : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                                        color: expanded ? 'white' : '#374151',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontWeight: 500
                                    }}
                                >
                                    {expanded ? 'Thu gọn' : 'Chi tiết'}
                                </Button>
                            )
                        }}
                        style={{
                            '& .ant-table-thead > tr > th': {
                                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                                color: '#374151',
                                fontWeight: 600,
                                borderBottom: '2px solid #e5e7eb'
                            },
                            '& .ant-table-tbody > tr:hover > td': {
                                background: 'rgba(102, 126, 234, 0.05) !important'
                            }
                        }}
                    />
                </div>
            ) : (
                <div style={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '20px',
                    padding: '64px 32px',
                    textAlign: 'center',
                    border: '1px solid rgba(0, 0, 0, 0.05)'
                }}>
                    <div style={{
                        fontSize: '72px',
                        marginBottom: '24px'
                    }}>
                        💰
                    </div>
                    <Title level={3} style={{ color: '#6b7280', marginBottom: '16px' }}>
                        Chưa có yêu cầu hoàn tiền nào
                    </Title>
                    <p style={{ color: '#9ca3af', fontSize: '16px', margin: 0 }}>
                        Tất cả yêu cầu hoàn tiền của bạn sẽ hiển thị tại đây
                    </p>
                </div>
            )}
        </div>
    );
};

export default RefundRequests; 