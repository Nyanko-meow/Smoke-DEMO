import React, { useState, useEffect } from 'react';
import {
    Card,
    Typography,
    Table,
    Tag,
    Button,
    Modal,
    Form,
    Input,
    InputNumber,
    Select,
    message,
    Space,
    Tooltip
} from 'antd';
import {
    EyeOutlined,
    EditOutlined,
    UserOutlined,
    CalendarOutlined,
    HeartOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { format, parseISO, differenceInDays } from 'date-fns';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Create axios instance with defaults
const api = axios.create({
    baseURL: 'http://localhost:4000',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: true
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const CoachQuitPlanDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        loadAllPlans();
    }, []);

    const loadAllPlans = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/quit-plan/all');
            setPlans(response.data.data || []);
        } catch (error) {
            console.error('Error loading plans:', error);
            message.error('Không thể tải danh sách kế hoạch');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (plan) => {
        setSelectedPlan(plan);
        form.setFieldsValue({
            detailedPlan: plan.DetailedPlan,
            status: plan.Status,
            motivationLevel: plan.MotivationLevel
        });
        setEditModalVisible(true);
    };

    const handleViewDetail = (plan) => {
        setSelectedPlan(plan);
        setDetailModalVisible(true);
    };

    const handleUpdate = async (values) => {
        try {
            const response = await api.put(`/api/quit-plan/${selectedPlan.PlanID}`, values);
            message.success('Cập nhật kế hoạch thành công');
            setEditModalVisible(false);
            loadAllPlans();
        } catch (error) {
            console.error('Error updating plan:', error);
            message.error('Lỗi khi cập nhật kế hoạch');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'green';
            case 'completed': return 'blue';
            case 'cancelled': return 'red';
            default: return 'default';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'active': return 'Đang thực hiện';
            case 'completed': return 'Hoàn thành';
            case 'cancelled': return 'Đã hủy';
            default: return 'Không xác định';
        }
    };

    const columns = [
        {
            title: 'Người dùng',
            dataIndex: 'UserName',
            key: 'user',
            render: (text, record) => (
                <Space direction="vertical" size="small">
                    <Text strong>{text}</Text>
                    <Text className="text-sm text-gray-500">{record.UserEmail}</Text>
                </Space>
            ),
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'CreatedAt',
            key: 'created',
            render: (date) => format(parseISO(date), 'dd/MM/yyyy'),
            width: 120,
        },
        {
            title: 'Mục tiêu',
            dataIndex: 'TargetDate',
            key: 'target',
            render: (date, record) => {
                const daysLeft = differenceInDays(parseISO(date), new Date());
                return (
                    <Space direction="vertical" size="small">
                        <Text>{format(parseISO(date), 'dd/MM/yyyy')}</Text>
                        {record.Status === 'active' && (
                            <Text className={`text-sm ${daysLeft > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {daysLeft > 0 ? `Còn ${daysLeft} ngày` : 'Đã quá hạn'}
                            </Text>
                        )}
                    </Space>
                );
            },
            width: 120,
        },
        {
            title: 'Động lực',
            dataIndex: 'MotivationLevel',
            key: 'motivation',
            render: (level) => (
                <Tag color={level >= 8 ? 'green' : level >= 5 ? 'orange' : 'red'}>
                    {level}/10
                </Tag>
            ),
            width: 100,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'Status',
            key: 'status',
            render: (status) => (
                <Tag color={getStatusColor(status)}>
                    {getStatusText(status)}
                </Tag>
            ),
            width: 120,
        },
        {
            title: 'Lý do',
            dataIndex: 'Reason',
            key: 'reason',
            render: (text) => (
                <Paragraph
                    ellipsis={{ rows: 2, expandable: false }}
                    style={{ marginBottom: 0, maxWidth: 200 }}
                >
                    {text}
                </Paragraph>
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewDetail(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                </Space>
            ),
            width: 100,
        },
    ];

    return (
        <div className="container mx-auto py-8 px-4">
            <Card className="shadow-lg rounded-lg">
                <div className="mb-6">
                    <Title level={2}>
                        <UserOutlined className="mr-2" />
                        Dashboard Coach - Quản lý Kế hoạch Cai thuốc
                    </Title>
                    <Text className="text-gray-600">
                        Xem và can thiệp vào các kế hoạch cai thuốc của người dùng
                    </Text>
                </div>

                <Table
                    columns={columns}
                    dataSource={plans}
                    rowKey="PlanID"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total) => `Tổng ${total} kế hoạch`,
                    }}
                    scroll={{ x: 1000 }}
                />
            </Card>

            {/* Modal xem chi tiết */}
            <Modal
                title="Chi tiết kế hoạch cai thuốc"
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setDetailModalVisible(false)}>
                        Đóng
                    </Button>,
                    <Button
                        key="edit"
                        type="primary"
                        onClick={() => {
                            setDetailModalVisible(false);
                            handleEdit(selectedPlan);
                        }}
                    >
                        Chỉnh sửa
                    </Button>,
                ]}
                width={600}
            >
                {selectedPlan && (
                    <div className="space-y-4">
                        <div>
                            <Text strong>Người dùng: </Text>
                            <Text>{selectedPlan.UserName} ({selectedPlan.UserEmail})</Text>
                        </div>

                        <div>
                            <Text strong>Ngày bắt đầu: </Text>
                            <Text>{format(parseISO(selectedPlan.StartDate), 'dd/MM/yyyy')}</Text>
                        </div>

                        <div>
                            <Text strong>Ngày mục tiêu: </Text>
                            <Text>{format(parseISO(selectedPlan.TargetDate), 'dd/MM/yyyy')}</Text>
                        </div>

                        <div>
                            <Text strong>Mức độ động lực: </Text>
                            <Tag color={selectedPlan.MotivationLevel >= 8 ? 'green' : selectedPlan.MotivationLevel >= 5 ? 'orange' : 'red'}>
                                {selectedPlan.MotivationLevel}/10
                            </Tag>
                        </div>

                        <div>
                            <Text strong>Trạng thái: </Text>
                            <Tag color={getStatusColor(selectedPlan.Status)}>
                                {getStatusText(selectedPlan.Status)}
                            </Tag>
                        </div>

                        <div>
                            <Text strong>Lý do cai thuốc: </Text>
                            <Paragraph>{selectedPlan.Reason}</Paragraph>
                        </div>

                        {selectedPlan.DetailedPlan && (
                            <div>
                                <Text strong>Kế hoạch chi tiết: </Text>
                                <Paragraph>{selectedPlan.DetailedPlan}</Paragraph>
                            </div>
                        )}

                        <div>
                            <Text strong>Ngày tạo: </Text>
                            <Text>{format(parseISO(selectedPlan.CreatedAt), 'dd/MM/yyyy HH:mm')}</Text>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal chỉnh sửa */}
            <Modal
                title="Can thiệp kế hoạch cai thuốc"
                open={editModalVisible}
                onCancel={() => setEditModalVisible(false)}
                footer={null}
                width={600}
            >
                {selectedPlan && (
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleUpdate}
                    >
                        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                            <Text strong>Người dùng: </Text>
                            <Text>{selectedPlan.UserName} ({selectedPlan.UserEmail})</Text>
                        </div>

                        <Form.Item
                            label="Kế hoạch chi tiết (Coach can thiệp)"
                            name="detailedPlan"
                        >
                            <TextArea
                                rows={6}
                                placeholder="Thêm/chỉnh sửa kế hoạch chi tiết, lời khuyên, các bước cụ thể..."
                            />
                        </Form.Item>

                        <Form.Item
                            label="Điều chỉnh mức độ động lực"
                            name="motivationLevel"
                        >
                            <InputNumber
                                min={1}
                                max={10}
                                style={{ width: '100%' }}
                                placeholder="Đánh giá lại mức độ động lực"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Cập nhật trạng thái"
                            name="status"
                        >
                            <Select placeholder="Chọn trạng thái">
                                <Option value="active">Đang thực hiện</Option>
                                <Option value="completed">Hoàn thành</Option>
                                <Option value="cancelled">Đã hủy</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item className="mb-0">
                            <Space>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    icon={<CheckCircleOutlined />}
                                >
                                    Cập nhật
                                </Button>
                                <Button onClick={() => setEditModalVisible(false)}>
                                    Hủy
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                )}
            </Modal>
        </div>
    );
};

export default CoachQuitPlanDashboard; 