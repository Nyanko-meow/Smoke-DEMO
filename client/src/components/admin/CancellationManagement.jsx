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
    Space,
    Tooltip,
    Avatar,
    InputNumber,
    Switch
} from 'antd';
import {
    CheckCircleOutlined,
    EyeOutlined,
    UserOutlined,
    CalendarOutlined,
    CloseCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { confirm } = Modal;

const CancellationManagement = () => {
    const [pendingRequests, setPendingRequests] = useState([]);

    const [loading, setLoading] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [approveModalVisible, setApproveModalVisible] = useState(false);
    const [approveForm] = Form.useForm();
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [rejectForm] = Form.useForm();

    useEffect(() => {
        loadPendingRequests();
    }, []);

    const loadPendingRequests = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await axios.get('http://localhost:4000/api/admin/pending-membership-cancellations', {
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



    const handleViewDetails = (record) => {
        setSelectedRequest(record);
        setDetailModalVisible(true);
    };

    const handleApprove = (record) => {
        setSelectedRequest(record);
        approveForm.setFieldsValue({
            adminNotes: ''
        });
        setApproveModalVisible(true);
    };



    const submitApproval = async (values) => {
        try {
            console.log('🔍 Submitting approval for request:', selectedRequest);
            console.log('🔍 MembershipID:', selectedRequest?.MembershipID);

            if (!selectedRequest?.MembershipID) {
                message.error('Không tìm thấy ID membership');
                return;
            }

            const token = localStorage.getItem('adminToken');
            const response = await axios.post(
                `http://localhost:4000/api/admin/confirm-membership-cancellation/${selectedRequest.MembershipID}`,
                values,
                {
                    headers: { 'Authorization': `Bearer ${token}` },
                    withCredentials: true
                }
            );

            if (response.data.success) {
                message.success('Đã xác nhận hủy gói thành công! User có thể đặt mua gói mới.');
                setApproveModalVisible(false);
                approveForm.resetFields();
                loadPendingRequests();
            }
        } catch (error) {
            console.error('Error approving cancellation:', error);
            message.error('Lỗi khi xác nhận hủy gói');
        }
    };

    const handleReject = (record) => {
        setSelectedRequest(record);
        rejectForm.setFieldsValue({
            adminNotes: ''
        });
        setRejectModalVisible(true);
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
        if (!date) {
            return 'Chưa cập nhật';
        }

        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
            return 'Ngày không hợp lệ';
        }

        return dateObj.toLocaleDateString('vi-VN', {
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
            width: 300,
            render: (record) => (
                <div className="flex items-center space-x-3">
                    <Avatar icon={<UserOutlined />} />
                    <div>
                        <div className="font-medium">{`${record.FirstName} ${record.LastName}`}</div>
                        <div className="text-sm text-gray-500">{record.Email}</div>
                        {record.PhoneNumber && (
                            <div className="text-sm text-gray-500">📞 {record.PhoneNumber}</div>
                        )}
                        <div className="text-sm text-blue-600 font-medium">
                            👤 {record.AccountHolderName || 'Chưa cập nhật'}
                        </div>
                        <div className="text-sm text-green-600 font-medium">
                            💳 {record.BankAccountNumber || 'Chưa cập nhật'}
                        </div>
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
            title: 'Ngân hàng',
            key: 'bankName',
            width: 150,
            render: (record) => (
                <div className="text-sm">
                    <div className="font-medium text-purple-600">
                        🏦 {record.BankName || 'Chưa cập nhật'}
                    </div>
                </div>
            ),
        },
        {
            title: 'Lí do hủy gói',
            key: 'cancellationReason',
            width: 200,
            render: (record) => (
                <div className="text-sm">
                    <Tooltip title={record.CancellationReason}>
                        <div style={{ 
                            maxHeight: '60px', 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {record.CancellationReason || 'Chưa cập nhật'}
                        </div>
                    </Tooltip>
                </div>
            ),
        },
        {
            title: 'Ngày yêu cầu',
            dataIndex: 'CancellationRequestedAt',
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
                            type="primary"
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



    return (
        <div className="p-6">
            <div className="mb-6">
                <Title level={2}>Quản lý yêu cầu hủy gói dịch vụ</Title>
                <Text className="text-gray-600">
                    Xem và xử lý các yêu cầu hủy gói dịch vụ từ khách hàng
                </Text>
            </div>



            <Card title={`Yêu cầu chờ xử lý (${pendingRequests.length})`}>
                <Table
                    dataSource={pendingRequests}
                    columns={pendingColumns}
                    loading={loading}
                    rowKey="RequestID"
                    locale={{
                        emptyText: 'Không có yêu cầu hủy gói nào đang chờ xử lý'
                    }}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} của ${total} yêu cầu`,
                    }}
                />
            </Card>

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
                                    type="primary"
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
                okButtonProps={{ type: 'primary', danger: true }}
            >
                <div className="mb-4">
                    <Text type="warning">
                        Bạn có chắc chắn muốn từ chối yêu cầu hủy gói dịch vụ này?
                    </Text>
                </div>

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
                            placeholder="Nhập lý do tại sao từ chối yêu cầu hủy gói này..."
                        />
                    </Form.Item>
                </Form>
            </Modal>

        </div>
    );
};

export default CancellationManagement; 