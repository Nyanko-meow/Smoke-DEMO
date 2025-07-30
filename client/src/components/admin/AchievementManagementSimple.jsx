import React, { useState, useEffect } from 'react';
import {
    Table,
    Card,
    Button,
    Space,
    Row,
    Col,
    Statistic,
    Typography,
    Alert,
    message,
    Tag,
    Avatar,
    Modal,
    Form,
    Input,
    InputNumber,
    Select,
    Switch,
    Divider,
    Tabs,
    Popconfirm,
    Tooltip
} from 'antd';
import {
    TrophyOutlined,
    PlusOutlined,
    EyeOutlined,
    EditOutlined,
    DeleteOutlined,
    UserOutlined,
    ReloadOutlined,
    UndoOutlined,
    SearchOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

const AchievementManagementSimple = () => {
    const [loading, setLoading] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [achievements, setAchievements] = useState([]);
    const [users, setUsers] = useState([]);
    const [userAchievements, setUserAchievements] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [userSearchText, setUserSearchText] = useState('');
    const [achievementModalVisible, setAchievementModalVisible] = useState(false);
    const [userAchievementModalVisible, setUserAchievementModalVisible] = useState(false);
    const [editingAchievement, setEditingAchievement] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [activeTab, setActiveTab] = useState('achievements');
    const [error, setError] = useState(null);

    // Thêm state để theo dõi category được chọn
    const [selectedCategory, setSelectedCategory] = useState('');

    const [form] = Form.useForm();

    useEffect(() => {
        loadAchievements();
        loadUsers();
    }, []);

    const loadAchievements = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.get('http://localhost:4000/api/achievements/public');

            if (response.data.success) {
                setAchievements(response.data.data || []);
                message.success(`Đã tải ${response.data.data?.length || 0} thành tích`);
            } else {
                throw new Error(response.data.message || 'Không thể tải danh sách thành tích');
            }
        } catch (error) {
            console.error('Error loading achievements:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Lỗi khi tải danh sách thành tích';
            setError(errorMessage);
            message.error(errorMessage);
            setAchievements([]);
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get('http://localhost:4000/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                setUsers(response.data.data || []);
            }
        } catch (error) {
            console.error('Error loading users:', error);
            message.error('Lỗi khi tải danh sách người dùng');
        }
    };

    const loadUserAchievements = async (userId) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(`http://localhost:4000/api/admin/user-achievements/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                setUserAchievements(response.data.data || []);
            }
        } catch (error) {
            console.error('Error loading user achievements:', error);
            message.error('Lỗi khi tải thành tích của người dùng');
        } finally {
            setLoading(false);
        }
    };

    // Achievement CRUD operations
    const handleCreateAchievement = () => {
        setEditingAchievement(null);
        setSelectedCategory('');
        form.resetFields();
        setAchievementModalVisible(true);
    };

    const handleEditAchievement = (achievement) => {
        setEditingAchievement(achievement);
        setSelectedCategory(achievement.Category);
        form.setFieldsValue({
            name: achievement.Name,
            description: achievement.Description,
            category: achievement.Category,
            points: achievement.Points,
            iconURL: achievement.IconURL,
            isActive: achievement.IsActive,
            milestoneDays: achievement.MilestoneDays,
            savedMoney: achievement.SavedMoney
        });
        setAchievementModalVisible(true);
    };

    const handleSaveAchievement = async (values) => {
        try {
            console.log('🚀 Saving achievement with values:', values);
            console.log('🔧 Editing achievement:', editingAchievement);

            const token = localStorage.getItem('adminToken');
            console.log('🔑 Admin token:', token ? 'Found' : 'Not found');

            const url = editingAchievement
                ? `http://localhost:4000/api/achievements/${editingAchievement.AchievementID}`
                : 'http://localhost:4000/api/achievements';

            const method = editingAchievement ? 'put' : 'post';

            console.log(`📡 Making ${method.toUpperCase()} request to:`, url);
            console.log('📦 Request data:', {
                name: values.name,
                description: values.description,
                category: values.category,
                points: values.points,
                iconURL: values.iconURL,
                isActive: values.isActive,
                milestoneDays: values.milestoneDays,
                savedMoney: values.savedMoney
            });

            const response = await axios[method](url, {
                name: values.name,
                description: values.description,
                category: values.category,
                points: values.points,
                iconURL: values.iconURL,
                isActive: values.isActive,
                milestoneDays: values.milestoneDays,
                savedMoney: values.savedMoney
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log('✅ API Response:', response.data);

            if (response.data.success) {
                message.success(editingAchievement ? 'Cập nhật thành công' : 'Tạo thành công');
                setAchievementModalVisible(false);
                setSelectedCategory('');
                loadAchievements();
            } else {
                console.error('❌ API returned success=false:', response.data);
                message.error(response.data.message || 'Lỗi khi lưu thành tích');
            }
        } catch (error) {
            console.error('❌ Full error object:', error);
            console.error('❌ Error response:', error.response?.data);
            console.error('❌ Error status:', error.response?.status);
            console.error('❌ Error message:', error.message);

            const errorMessage = error.response?.data?.message || error.message || 'Lỗi khi lưu thành tích';
            message.error(`Lỗi khi lưu thành tích: ${errorMessage}`);
        }
    };

    const handleDeleteAchievement = async (achievementId) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.delete(`http://localhost:4000/api/achievements/${achievementId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                message.success('Xóa thành tích thành công');
                loadAchievements();
            }
        } catch (error) {
            console.error('Error deleting achievement:', error);
            message.error('Lỗi khi xóa thành tích');
        }
    };

    // User achievement operations
    const handleViewUserAchievements = (user) => {
        setSelectedUser(user);
        loadUserAchievements(user.UserID);
        setUserAchievementModalVisible(true);
    };

    const handleResetUserAchievements = async (userId) => {
        try {
            setResetLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await axios.post('http://localhost:4000/api/admin/reset-user-achievements', {
                userId: userId
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                message.success('Reset thành tích thành công! Các thành tích đủ điều kiện đã được mở lại.');
                if (selectedUser && selectedUser.UserID === userId) {
                    loadUserAchievements(userId);
                }
            }
        } catch (error) {
            console.error('Error resetting user achievements:', error);
            message.error('Lỗi khi reset thành tích');
        } finally {
            setResetLoading(false);
        }
    };

    const handleResetAllAchievements = async () => {
        try {
            setResetLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await axios.post('http://localhost:4000/api/admin/reset-all-achievements', {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                message.success('Reset tất cả thành tích thành công!');
                loadUsers();
            }
        } catch (error) {
            console.error('Error resetting all achievements:', error);
            message.error('Lỗi khi reset tất cả thành tích');
        } finally {
            setResetLoading(false);
        }
    };

    // Computed filtered data
    const filteredAchievements = achievements.filter(achievement =>
        achievement.Name?.toLowerCase().includes(searchText.toLowerCase()) ||
        achievement.Description?.toLowerCase().includes(searchText.toLowerCase())
    );

    const filteredUsers = users.filter(user =>
        `${user.FirstName} ${user.LastName}`.toLowerCase().includes(userSearchText.toLowerCase()) ||
        user.Email?.toLowerCase().includes(userSearchText.toLowerCase())
    );

    const achievementColumns = [
        {
            title: 'Thành tích',
            dataIndex: 'Name',
            key: 'name',
            render: (text, record) => (
                <Space>
                    <Avatar
                        src={record.IconURL}
                        icon={<TrophyOutlined />}
                        size="small"
                    />
                    <div>
                        <div style={{ fontWeight: 'bold' }}>{text}</div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            {record.Description?.substring(0, 50)}...
                        </Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Danh mục',
            dataIndex: 'Category',
            key: 'category',
            render: (category) => (
                <Tag color="blue">{category}</Tag>
            ),
        },
        {
            title: 'Điểm thưởng',
            dataIndex: 'Points',
            key: 'points',
            render: (points) => (
                <Text strong style={{ color: '#1890ff' }}>
                    {points} điểm
                </Text>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'IsActive',
            key: 'isActive',
            render: (isActive) => (
                <Tag color={isActive ? 'green' : 'red'}>
                    {isActive ? 'Hoạt động' : 'Không hoạt động'}
                </Tag>
            ),
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Sửa">
                        <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleEditAchievement(record)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Xác nhận xóa"
                        description="Bạn có chắc chắn muốn xóa thành tích này?"
                        onConfirm={() => handleDeleteAchievement(record.AchievementID)}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <Tooltip title="Xóa">
                            <Button
                                type="text"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                            />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const userColumns = [
        {
            title: 'Người dùng',
            dataIndex: 'FullName',
            key: 'user',
            render: (text, record) => (
                <Space>
                    <Avatar
                        src={record.Avatar}
                        icon={<UserOutlined />}
                        size="small"
                    />
                    <div>
                        <div style={{ fontWeight: 'bold' }}>{text}</div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            {record.Email}
                        </Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Số thành tích',
            key: 'achievementCount',
            render: (_, record) => (
                <Text>{record.AchievementCount || 0} thành tích</Text>
            ),
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewUserAchievements(record)}
                    >
                        Xem thành tích
                    </Button>
                    <Popconfirm
                        title="Reset thành tích"
                        description="Việc này sẽ xóa tất cả thành tích hiện tại và kiểm tra lại điều kiện. Bạn có chắc chắn?"
                        onConfirm={() => handleResetUserAchievements(record.UserID)}
                        okText="Reset"
                        cancelText="Hủy"
                    >
                        <Button
                            size="small"
                            icon={<UndoOutlined />}
                            loading={resetLoading}
                        >
                            Reset
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <Title level={2}>
                    <TrophyOutlined /> Quản lý Thành tích
                </Title>
                <Text type="secondary">
                    Quản lý thành tích và huy hiệu của người dùng
                </Text>
            </div>

            {/* Error Display */}
            {error && (
                <Alert
                    message="Lỗi"
                    description={error}
                    type="error"
                    showIcon
                    closable
                    onClose={() => setError(null)}
                    style={{ marginBottom: '24px' }}
                />
            )}

            {/* Stats */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Tổng thành tích"
                            value={achievements.length}
                            prefix={<TrophyOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Thành tích hoạt động"
                            value={achievements.filter(a => a.IsActive).length}
                            prefix={<TrophyOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Tổng người dùng"
                            value={users.length}
                            prefix={<UserOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <div>
                            <Popconfirm
                                title="Reset tất cả thành tích"
                                description="Điều này sẽ reset thành tích của TẤT CẢ người dùng. Bạn có chắc chắn?"
                                onConfirm={handleResetAllAchievements}
                                okText="Reset tất cả"
                                cancelText="Hủy"
                                okType="danger"
                            >
                                <Button
                                    danger
                                    icon={<UndoOutlined />}
                                    loading={resetLoading}
                                    style={{ width: '100%' }}
                                >
                                    Reset tất cả
                                </Button>
                            </Popconfirm>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Tabs */}
            <Card>
                <Tabs activeKey={activeTab} onChange={setActiveTab}>
                    <TabPane tab="Quản lý Thành tích" key="achievements">
                        {/* Achievement Controls */}
                        <div style={{ marginBottom: '16px' }}>
                            <Row gutter={[16, 16]} align="middle">
                                <Col span={12}>
                                    <Input
                                        placeholder="Tìm kiếm thành tích..."
                                        prefix={<SearchOutlined />}
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                        allowClear
                                    />
                                </Col>
                                <Col span={12}>
                                    <Space>
                                        <Button
                                            type="primary"
                                            icon={<PlusOutlined />}
                                            onClick={handleCreateAchievement}
                                        >
                                            Tạo thành tích mới
                                        </Button>
                                        <Button
                                            icon={<ReloadOutlined />}
                                            onClick={loadAchievements}
                                            loading={loading}
                                        >
                                            Làm mới
                                        </Button>
                                    </Space>
                                </Col>
                            </Row>
                        </div>

                        {/* Achievement Table */}
                        <Table
                            columns={achievementColumns}
                            dataSource={filteredAchievements}
                            rowKey="AchievementID"
                            loading={loading}
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: true,
                                showTotal: (total, range) =>
                                    `${range[0]}-${range[1]} của ${total} thành tích`,
                            }}
                        />
                    </TabPane>

                    <TabPane tab="Thành tích Người dùng" key="users">
                        {/* User Controls */}
                        <div style={{ marginBottom: '16px' }}>
                            <Row gutter={[16, 16]} align="middle">
                                <Col span={12}>
                                    <Input
                                        placeholder="Tìm kiếm người dùng..."
                                        prefix={<SearchOutlined />}
                                        value={userSearchText}
                                        onChange={(e) => setUserSearchText(e.target.value)}
                                        allowClear
                                    />
                                </Col>
                                <Col span={12}>
                                    <Button
                                        icon={<ReloadOutlined />}
                                        onClick={loadUsers}
                                        loading={loading}
                                    >
                                        Làm mới
                                    </Button>
                                </Col>
                            </Row>
                        </div>

                        {/* User Table */}
                        <Table
                            columns={userColumns}
                            dataSource={filteredUsers}
                            rowKey="UserID"
                            loading={loading}
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: true,
                                showTotal: (total, range) =>
                                    `${range[0]}-${range[1]} của ${total} người dùng`,
                            }}
                        />
                    </TabPane>
                </Tabs>
            </Card>

            {/* Achievement Form Modal */}
            <Modal
                title={editingAchievement ? 'Sửa thành tích' : 'Tạo thành tích mới'}
                open={achievementModalVisible}
                onCancel={() => {
                    setAchievementModalVisible(false);
                    setSelectedCategory('');
                }}
                footer={null}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSaveAchievement}
                >
                    <Form.Item
                        name="name"
                        label="Tên thành tích"
                        rules={[{ required: true, message: 'Vui lòng nhập tên thành tích' }]}
                    >
                        <Input placeholder="Nhập tên thành tích" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Mô tả"
                        rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
                    >
                        <TextArea rows={3} placeholder="Nhập mô tả thành tích" />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="category"
                                label="Danh mục"
                                rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
                            >
                                <Select
                                    placeholder="Chọn danh mục"
                                    onChange={(value) => {
                                        setSelectedCategory(value);
                                        // Reset các trường điều kiện khi đổi danh mục
                                        form.setFieldsValue({
                                            milestoneDays: undefined,
                                            savedMoney: undefined
                                        });
                                    }}
                                >
                                    <Select.Option value="milestone">Cột mốc thời gian</Select.Option>
                                    <Select.Option value="savings">Tiết kiệm tiền</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="points"
                                label="Điểm thưởng"
                                rules={[{ required: true, message: 'Vui lòng nhập điểm thưởng' }]}
                            >
                                <InputNumber min={0} placeholder="Điểm thưởng" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Hiển thị trường điều kiện dựa trên danh mục */}
                    {selectedCategory && (
                        <Row gutter={16}>
                            {selectedCategory === 'milestone' && (
                                <Col span={12}>
                                    <Form.Item
                                        name="milestoneDays"
                                        label="Số ngày mốc *"
                                        rules={[{ required: true, message: 'Vui lòng nhập số ngày mốc' }]}
                                    >
                                        <InputNumber
                                            min={1}
                                            placeholder="Ví dụ: 7, 30, 90..."
                                            style={{ width: '100%' }}
                                            addonAfter="ngày"
                                        />
                                    </Form.Item>
                                </Col>
                            )}
                            {selectedCategory === 'savings' && (
                                <Col span={12}>
                                    <Form.Item
                                        name="savedMoney"
                                        label="Số tiền tiết kiệm *"
                                        rules={[{ required: true, message: 'Vui lòng nhập số tiền cột mốc' }]}
                                    >
                                        <InputNumber
                                            min={1000}
                                            placeholder="Ví dụ: 100000, 500000, 1000000..."
                                            style={{ width: '100%' }}
                                            addonAfter="VND"
                                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                            parser={value => value.replace(/VND\s?|(,*)/g, '')}
                                        />
                                    </Form.Item>
                                </Col>
                            )}
                        </Row>
                    )}

                    <Form.Item
                        name="iconURL"
                        label="URL Icon"
                    >
                        <Input placeholder="Nhập URL của icon" />
                    </Form.Item>

                    <Form.Item
                        name="isActive"
                        label="Trạng thái"
                        valuePropName="checked"
                        initialValue={true}
                    >
                        <Switch checkedChildren="Hoạt động" unCheckedChildren="Không hoạt động" />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => {
                                setAchievementModalVisible(false);
                                setSelectedCategory('');
                            }}>
                                Hủy
                            </Button>
                            <Button type="primary" htmlType="submit">
                                {editingAchievement ? 'Cập nhật' : 'Tạo mới'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* User Achievement Modal */}
            <Modal
                title={`Thành tích của ${selectedUser?.FullName}`}
                open={userAchievementModalVisible}
                onCancel={() => setUserAchievementModalVisible(false)}
                footer={[
                    <Popconfirm
                        key="reset"
                        title="Reset thành tích"
                        description="Việc này sẽ reset tất cả thành tích của người dùng này. Bạn có chắc chắn?"
                        onConfirm={() => selectedUser && handleResetUserAchievements(selectedUser.UserID)}
                        okText="Reset"
                        cancelText="Hủy"
                    >
                        <Button
                            icon={<UndoOutlined />}
                            loading={resetLoading}
                        >
                            Reset thành tích
                        </Button>
                    </Popconfirm>,
                    <Button key="close" onClick={() => setUserAchievementModalVisible(false)}>
                        Đóng
                    </Button>
                ]}
                width={800}
            >
                {selectedUser && (
                    <div>
                        <div style={{ marginBottom: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '6px' }}>
                            <Space>
                                <Avatar src={selectedUser.Avatar} icon={<UserOutlined />} />
                                <div>
                                    <div><strong>{selectedUser.FullName}</strong></div>
                                    <Text type="secondary">{selectedUser.Email}</Text>
                                </div>
                            </Space>
                        </div>

                        <Divider>Danh sách thành tích đã đạt được</Divider>

                        {userAchievements.length > 0 ? (
                            <Row gutter={[16, 16]}>
                                {userAchievements.map(achievement => (
                                    <Col span={12} key={achievement.AchievementID}>
                                        <Card size="small">
                                            <Space>
                                                <Avatar
                                                    src={achievement.IconURL}
                                                    icon={<TrophyOutlined />}
                                                    size="small"
                                                />
                                                <div>
                                                    <div style={{ fontWeight: 'bold' }}>{achievement.Name}</div>
                                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                                        {achievement.Points} điểm
                                                    </Text>
                                                </div>
                                            </Space>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                <TrophyOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                                <div style={{ marginTop: '16px' }}>
                                    <Text type="secondary">Người dùng này chưa có thành tích nào</Text>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AchievementManagementSimple; 