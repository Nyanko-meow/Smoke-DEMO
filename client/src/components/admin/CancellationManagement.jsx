import React, { useState, useEffect } from 'react';
import {
    Table,
    Card,
    Button,
    message,
    Tag,
    Modal,
    Form,
    Input,
    Descriptions,
    Typography,
    Tabs,
    Space,
    Tooltip,
    Avatar,
    Row,
    Col,
    Statistic,
    InputNumber,
    Switch
} from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    EyeOutlined,
    UserOutlined,
    InfoCircleOutlined,
    DollarOutlined,
    CalendarOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { confirm } = Modal;

const CancellationManagement = () => {
    const [pendingRequests, setPendingRequests] = useState([]);
    const [cancellationHistory, setCancellationHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [approveModalVisible, setApproveModalVisible] = useState(false);
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [approveForm] = Form.useForm();
    const [rejectForm] = Form.useForm();

    useEffect(() => {
        loadPendingRequests();
        loadCancellationHistory();
    }, []);

    const loadPendingRequests = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await axios.get('http://localhost:4000/api/admin/pending-cancellations', {
                headers: { 'Authorization': `Bearer ${token}` },
                withCredentials: true
            });

            if (response.data.success) {
                setPendingRequests(response.data.data);
            }
        } catch (error) {
            console.error('Error loading pending cancellation requests:', error);
            message.error('Lỗi khi tải danh sách yêu cầu hủy gói');
        } finally {
            setLoading(false);
        }
    };

    const loadCancellationHistory = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get('http://localhost:4000/api/admin/cancellation-history', {
                headers: { 'Authorization': `Bearer ${token}` },
                withCredentials: true
            });

            if (response.data.success) {
                setCancellationHistory(response.data.data);
            }
        } catch (error) {
            console.error('Error loading cancellation history:', error);
            message.error('Lỗi khi tải lịch sử hủy gói');
        }
    };

    const handleViewDetails = (record) => {
        setSelectedRequest(record);
        setDetailModalVisible(true);
    };

    const handleApprove = (record) => {
        setSelectedRequest(record);
        approveForm.setFieldsValue({
            approveRefund: record.RequestedRefundAmount > 0,
            refundAmount: record.RequestedRefundAmount || 0,
            adminNotes: ''
        });
        setApproveModalVisible(true);
    };

    const handleReject = (record) => {
        setSelectedRequest(record);
        rejectForm.setFieldsValue({
            adminNotes: ''
        });
        setRejectModalVisible(true);
    };

    const submitApproval = async (values) => {
        try {
            console.log('🔍 Submitting approval for request:', selectedRequest);
            console.log('🔍 RequestID:', selectedRequest?.RequestID);

            if (!selectedRequest?.RequestID) {
                message.error('Không tìm thấy ID yêu cầu hủy gói');
                return;
            }

            const token = localStorage.getItem('adminToken');
            const response = await axios.post(
                `http://localhost:4000/api/admin/debug-approve/${selectedRequest.RequestID}`,
                values,
                {
                    headers: { 'Authorization': `Bearer ${token}` },
                    withCredentials: true
                }
            );

            if (response.data.success) {
                message.success('Đã chấp nhận yêu cầu hủy gói');
                setApproveModalVisible(false);
                approveForm.resetFields();
                loadPendingRequests();
                loadCancellationHistory();
            }
        } catch (error) {
            console.error('Error approving cancellation:', error);
            message.error('Lỗi khi chấp nhận yêu cầu hủy gói');
        }
    };

    const submitRejection = async (values) => {
        try {
            console.log('🔍 Submitting rejection for request:', selectedRequest);
            console.log('🔍 RequestID:', selectedRequest?.RequestID);

            if (!selectedRequest?.RequestID) {
                message.error('Không tìm thấy ID yêu cầu hủy gói');
                return;
            }

            const token = localStorage.getItem('adminToken');
            const response = await axios.post(
                `http://localhost:4000/api/admin/reject-cancellation/${selectedRequest.RequestID}`,
                values,
                {
                    headers: { 'Authorization': `Bearer ${token}` },
                    withCredentials: true
                }
            );

            if (response.data.success) {
                message.success('Đã từ chối yêu cầu hủy gói');
                setRejectModalVisible(false);
                rejectForm.resetFields();
                loadPendingRequests();
                loadCancellationHistory();
            }
        } catch (error) {
            console.error('Error rejecting cancellation:', error);
            message.error('Lỗi khi từ chối yêu cầu hủy gói');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const pendingColumns = [
        {
            title: 'Khách hàng',
            key: 'customer',
            render: (record) => (
                <div className="flex items-center space-x-3">
                    <Avatar icon={<UserOutlined />} />
                    <div>
                        <div className="font-medium">{`${record.FirstName} ${record.LastName}`}</div>
                        <div className="text-sm text-gray-500">{record.Email}</div>
                        {record.PhoneNumber && (
                            <div className="text-sm text-gray-500">{record.PhoneNumber}</div>
                        )}
                    </div>
                </div>
            ),
        },
        {
            title: 'Gói dịch vụ',
            key: 'plan',
            render: (record) => (
                <div>
                    <div className="font-medium text-blue-600">{record.PlanName}</div>
                    <div className="text-sm text-gray-500">{formatCurrency(record.PlanPrice)}</div>
                    <div className="text-sm text-gray-500">{record.Duration} ngày</div>
                </div>
            ),
        },
        {
            title: 'Thời gian sử dụng',
            key: 'duration',
            render: (record) => (
                <div>
                    <div className="text-sm">
                        <CalendarOutlined className="mr-1" />
                        Từ: {formatDate(record.MembershipStartDate)}
                    </div>
                    <div className="text-sm">
                        <CalendarOutlined className="mr-1" />
                        Đến: {formatDate(record.MembershipEndDate)}
                    </div>
                </div>
            ),
        },
        {
            title: 'Yêu cầu hoàn tiền',
            key: 'refund',
            align: 'center',
            render: (record) => (
                <div>
                    {record.RequestedRefundAmount > 0 ? (
                        <div>
                            <Tag color="orange">Có yêu cầu</Tag>
                            <div className="text-sm font-medium text-orange-600">
                                {formatCurrency(record.RequestedRefundAmount)}
                            </div>
                        </div>
                    ) : (
                        <Tag color="gray">Không yêu cầu</Tag>
                    )}
                </div>
            ),
        },
        {
            title: 'Ngày yêu cầu',
            dataIndex: 'RequestedAt',
            key: 'requestedAt',
            render: (date) => formatDate(date),
        },
        {
            title: 'Thao tác',
            key: 'actions',
            align: 'center',
            render: (record) => (
                <Space>
                    <Tooltip title="Xem chi tiết">
                        <Button
                            icon={<EyeOutlined />}
                            onClick={() => handleViewDetails(record)}
                            size="small"
                        />
                    </Tooltip>
                    <Tooltip title="Chấp nhận">
                        <Button
                            icon={<CheckCircleOutlined />}
                            type="primary"
                            ghost
                            onClick={() => handleApprove(record)}
                            size="small"
                        />
                    </Tooltip>
                    <Tooltip title="Từ chối">
                        <Button
                            icon={<CloseCircleOutlined />}
                            danger
                            ghost
                            onClick={() => handleReject(record)}
                            size="small"
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const historyColumns = [
        {
            title: 'Khách hàng',
            key: 'customer',
            render: (record) => (
                <div>
                    <div className="font-medium">{record.CustomerName}</div>
                    <div className="text-sm text-gray-500">{record.CustomerEmail}</div>
                </div>
            ),
        },
        {
            title: 'Gói dịch vụ',
            dataIndex: 'PlanName',
            key: 'plan',
            render: (text, record) => (
                <div>
                    <div className="font-medium text-blue-600">{text}</div>
                    <div className="text-sm text-gray-500">{formatCurrency(record.PlanPrice)}</div>
                </div>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'Status',
            key: 'status',
            align: 'center',
            render: (status) => {
                const statusConfig = {
                    approved: { color: 'green', text: 'Đã chấp nhận' },
                    rejected: { color: 'red', text: 'Đã từ chối' }
                };
                const config = statusConfig[status] || { color: 'gray', text: status };
                return <Tag color={config.color}>{config.text}</Tag>;
            },
        },
        {
            title: 'Hoàn tiền',
            key: 'refund',
            align: 'center',
            render: (record) => (
                <div>
                    {record.RefundApproved ? (
                        <div>
                            <Tag color="green">Đã hoàn</Tag>
                            <div className="text-sm font-medium text-green-600">
                                {formatCurrency(record.RefundAmount)}
                            </div>
                        </div>
                    ) : (
                        <Tag color="gray">Không hoàn</Tag>
                    )}
                </div>
            ),
        },
        {
            title: 'Admin xử lý',
            dataIndex: 'AdminName',
            key: 'admin',
        },
        {
            title: 'Ngày xử lý',
            dataIndex: 'ProcessedAt',
            key: 'processedAt',
            render: (date) => formatDate(date),
        },
        {
            title: 'Thao tác',
            key: 'actions',
            align: 'center',
            render: (record) => (
                <Tooltip title="Xem chi tiết">
                    <Button
                        icon={<EyeOutlined />}
                        onClick={() => handleViewDetails(record)}
                        size="small"
                    />
                </Tooltip>
            ),
        },
    ];

    return (
        <div className="p-6">
            <div className="mb-6">
                <Title level={2}>Quản lý yêu cầu hủy gói dịch vụ</Title>
                <Text className="text-gray-600">
                    Xem và xử lý các yêu cầu hủy gói dịch vụ từ khách hàng
                </Text>
            </div>

            {/* Statistics */}
            <Row gutter={[16, 16]} className="mb-6">
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Yêu cầu chờ xử lý"
                            value={pendingRequests.length}
                            prefix={<ExclamationCircleOutlined />}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Đã xử lý hôm nay"
                            value={cancellationHistory.filter(h =>
                                new Date(h.ProcessedAt).toDateString() === new Date().toDateString()
                            ).length}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Tổng số yêu cầu"
                            value={pendingRequests.length + cancellationHistory.length}
                            prefix={<InfoCircleOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Tiền hoàn tháng này"
                            value={cancellationHistory
                                .filter(h => h.RefundApproved &&
                                    new Date(h.ProcessedAt).getMonth() === new Date().getMonth())
                                .reduce((sum, h) => sum + (h.RefundAmount || 0), 0)}
                            formatter={(value) => formatCurrency(value)}
                            prefix={<DollarOutlined />}
                            valueStyle={{ color: '#f5222d' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Tabs defaultActiveKey="pending">
                <TabPane tab={`Chờ xử lý (${pendingRequests.length})`} key="pending">
                    <Card>
                        <Table
                            dataSource={pendingRequests}
                            columns={pendingColumns}
                            loading={loading}
                            rowKey="RequestID"
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                showTotal: (total, range) =>
                                    `${range[0]}-${range[1]} của ${total} yêu cầu`,
                            }}
                        />
                    </Card>
                </TabPane>

                <TabPane tab={`Lịch sử (${cancellationHistory.length})`} key="history">
                    <Card>
                        <Table
                            dataSource={cancellationHistory}
                            columns={historyColumns}
                            loading={loading}
                            rowKey="RequestID"
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                showTotal: (total, range) =>
                                    `${range[0]}-${range[1]} của ${total} yêu cầu`,
                            }}
                        />
                    </Card>
                </TabPane>
            </Tabs>

            {/* Detail Modal */}
            <Modal
                title="Chi tiết yêu cầu hủy gói"
                visible={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={null}
                width={800}
            >
                {selectedRequest && (
                    <div>
                        <Descriptions title="Thông tin khách hàng" bordered>
                            <Descriptions.Item label="Họ tên" span={2}>
                                {`${selectedRequest.FirstName} ${selectedRequest.LastName}`}
                            </Descriptions.Item>
                            <Descriptions.Item label="Email" span={1}>
                                {selectedRequest.Email}
                            </Descriptions.Item>
                            <Descriptions.Item label="Số điện thoại" span={3}>
                                {selectedRequest.PhoneNumber || 'Chưa cập nhật'}
                            </Descriptions.Item>
                        </Descriptions>

                        <Descriptions title="Thông tin gói dịch vụ" bordered className="mt-4">
                            <Descriptions.Item label="Tên gói" span={2}>
                                {selectedRequest.PlanName}
                            </Descriptions.Item>
                            <Descriptions.Item label="Giá" span={1}>
                                {formatCurrency(selectedRequest.PlanPrice)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Thời hạn" span={1}>
                                {selectedRequest.Duration} ngày
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày bắt đầu" span={1}>
                                {formatDate(selectedRequest.MembershipStartDate)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày kết thúc" span={1}>
                                {formatDate(selectedRequest.MembershipEndDate)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Mô tả" span={3}>
                                {selectedRequest.PlanDescription}
                            </Descriptions.Item>
                        </Descriptions>

                        <Descriptions title="Thông tin yêu cầu hủy" bordered className="mt-4">
                            <Descriptions.Item label="Ngày yêu cầu" span={1}>
                                {formatDate(selectedRequest.RequestedAt)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Yêu cầu hoàn tiền" span={1}>
                                {selectedRequest.RequestedRefundAmount > 0 ?
                                    formatCurrency(selectedRequest.RequestedRefundAmount) : 'Không yêu cầu'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Trạng thái" span={1}>
                                <Tag color={selectedRequest.Status === 'pending' ? 'orange' :
                                    selectedRequest.Status === 'approved' ? 'green' : 'red'}>
                                    {selectedRequest.Status === 'pending' ? 'Chờ xử lý' :
                                        selectedRequest.Status === 'approved' ? 'Đã chấp nhận' : 'Đã từ chối'}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Lý do hủy" span={3}>
                                <div className="bg-gray-50 p-3 rounded">
                                    {selectedRequest.CancellationReason}
                                </div>
                            </Descriptions.Item>
                            {selectedRequest.AdminNotes && (
                                <Descriptions.Item label="Ghi chú admin" span={3}>
                                    <div className="bg-blue-50 p-3 rounded">
                                        {selectedRequest.AdminNotes}
                                    </div>
                                </Descriptions.Item>
                            )}
                        </Descriptions>

                        {/* Thông tin ngân hàng để hoàn tiền */}
                        {selectedRequest.RequestedRefundAmount > 0 && (
                            <Descriptions title="Thông tin hoàn tiền" bordered className="mt-4">
                                <Descriptions.Item label="Số tài khoản" span={1}>
                                    <Text copyable>{selectedRequest.BankAccountNumber}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Ngân hàng" span={1}>
                                    {selectedRequest.BankName}
                                </Descriptions.Item>
                                <Descriptions.Item label="Chủ tài khoản" span={1}>
                                    {selectedRequest.AccountHolderName}
                                </Descriptions.Item>
                                <Descriptions.Item label="Số tiền yêu cầu hoàn" span={3}>
                                    <Text strong style={{ color: '#ff4d4f', fontSize: '16px' }}>
                                        {formatCurrency(selectedRequest.RequestedRefundAmount)}
                                    </Text>
                                </Descriptions.Item>
                            </Descriptions>
                        )}

                        {selectedRequest.Status === 'pending' && (
                            <div className="mt-6 flex justify-center space-x-4">
                                <Button
                                    type="primary"
                                    icon={<CheckCircleOutlined />}
                                    onClick={() => {
                                        setDetailModalVisible(false);
                                        handleApprove(selectedRequest);
                                    }}
                                >
                                    Chấp nhận
                                </Button>
                                <Button
                                    danger
                                    icon={<CloseCircleOutlined />}
                                    onClick={() => {
                                        setDetailModalVisible(false);
                                        handleReject(selectedRequest);
                                    }}
                                >
                                    Từ chối
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Approve Modal */}
            <Modal
                title="Chấp nhận yêu cầu hủy gói"
                visible={approveModalVisible}
                onCancel={() => setApproveModalVisible(false)}
                onOk={() => approveForm.submit()}
                okText="Chấp nhận"
                cancelText="Hủy"
                okButtonProps={{ type: 'primary' }}
            >
                <Form
                    form={approveForm}
                    layout="vertical"
                    onFinish={submitApproval}
                >
                    <Form.Item
                        name="approveRefund"
                        label="Chấp nhận hoàn tiền"
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) =>
                            prevValues.approveRefund !== currentValues.approveRefund}
                    >
                        {({ getFieldValue }) =>
                            getFieldValue('approveRefund') ? (
                                <Form.Item
                                    name="refundAmount"
                                    label="Số tiền hoàn lại"
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập số tiền hoàn lại' },
                                        { type: 'number', min: 0, message: 'Số tiền phải lớn hơn 0' }
                                    ]}
                                >
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                        addonAfter="VNĐ"
                                        placeholder="Nhập số tiền hoàn lại"
                                    />
                                </Form.Item>
                            ) : null
                        }
                    </Form.Item>

                    <Form.Item
                        name="adminNotes"
                        label="Ghi chú"
                        rules={[{ required: true, message: 'Vui lòng nhập ghi chú' }]}
                    >
                        <TextArea
                            rows={4}
                            placeholder="Nhập ghi chú về quyết định chấp nhận..."
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Reject Modal */}
            <Modal
                title="Từ chối yêu cầu hủy gói"
                visible={rejectModalVisible}
                onCancel={() => setRejectModalVisible(false)}
                onOk={() => rejectForm.submit()}
                okText="Từ chối"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
            >
                <Form
                    form={rejectForm}
                    layout="vertical"
                    onFinish={submitRejection}
                >
                    <Form.Item
                        name="adminNotes"
                        label="Lý do từ chối"
                        rules={[{ required: true, message: 'Vui lòng nhập lý do từ chối' }]}
                    >
                        <TextArea
                            rows={4}
                            placeholder="Nhập lý do từ chối yêu cầu hủy gói..."
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default CancellationManagement; 