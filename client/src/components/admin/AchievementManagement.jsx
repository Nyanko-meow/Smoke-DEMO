import React, { useState, useEffect } from 'react';
import {
    Table,
    Card,
    Button,
    Input,
    Space,
    Tag,
    Avatar,
    Row,
    Col,
    Statistic,
    Modal,
    Typography,
    Form,
    InputNumber,
    Select,
    Upload,
    message,
    Tooltip,
    Popconfirm,
    Divider,
    Badge,
    Progress,
    Switch,
    Spin,
    Alert
} from 'antd';
import {
    SearchOutlined,
    ReloadOutlined,
    EyeOutlined,
    DeleteOutlined,
    EditOutlined,
    PlusOutlined,
    TrophyOutlined,
    UserOutlined,
    UploadOutlined,
    StarOutlined,
    CrownOutlined,
    CalendarOutlined,
    DollarOutlined,
    TeamOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined
} from '@ant-design/icons';
import moment from 'moment';
import axios from 'axios';
import './AchievementManagement.css';

const { Text, Paragraph, Title } = Typography;
const { Option } = Select;

const AchievementManagement = () => {
    // Test fallback để debug
    const [debugMode] = useState(false); // Tắt debug mode

    if (debugMode) {
        return (
            <div style={{ padding: '24px' }}>
                <Alert
                    message="Debug Mode - Testing Phase 1"
                    description="AchievementManagement component đã load thành công!"
                    type="success"
                    showIcon
                />
                <Title level={2}>
                    <TrophyOutlined /> Test Achievement Management
                </Title>
                <p>Bây giờ tôi sẽ test từng phần để tìm lỗi...</p>

                {/* Test basic states */}
                <Card style={{ marginTop: '16px' }}>
                    <h3>Test States:</h3>
                    <p>Loading: false</p>
                    <p>Achievements: []</p>
                    <p>Error: null</p>
                </Card>
            </div>
        );
    }

    const [loading, setLoading] = useState(false);
    const [achievements, setAchievements] = useState([]);
    const [filteredAchievements, setFilteredAchievements] = useState([]);
    const [selectedAchievement, setSelectedAchievement] = useState(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [resetModalVisible, setResetModalVisible] = useState(false);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userAchievements, setUserAchievements] = useState([]);
    const [error, setError] = useState(null);

    // Thêm state để theo dõi category được chọn trong form
    const [selectedCategoryCreate, setSelectedCategoryCreate] = useState('');
    const [selectedCategoryEdit, setSelectedCategoryEdit] = useState('');

    const [stats, setStats] = useState({
        totalAchievements: 0,
        activeAchievements: 0,
        totalUsersWithAchievements: 0,
        mostEarnedAchievement: null,
        categoryStats: []
    });
    const [searchText, setSearchText] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterDifficulty, setFilterDifficulty] = useState('');

    const [createForm] = Form.useForm();
    const [editForm] = Form.useForm();

    const categories = ['milestone', 'savings'];
    const difficulties = [1, 2, 3, 4, 5];

    useEffect(() => {
        console.log('🚀 AchievementManagement component mounted');
        try {
            loadAchievements();
            loadUsers();
            loadAchievementStats();
        } catch (error) {
            console.error('❌ Error in useEffect:', error);
            setError('Lỗi khởi tạo component: ' + error.message);
        }
    }, []);

    useEffect(() => {
        try {
            applyFilters();
        } catch (error) {
            console.error('❌ Error in filter effect:', error);
        }
    }, [achievements, searchText, filterCategory, filterDifficulty]);

    const loadAchievements = async () => {
        try {
            console.log('📥 Loading achievements...');
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('adminToken');
            console.log('🔑 Admin token:', token ? 'Found' : 'Not found');

            if (!token) {
                throw new Error('Không tìm thấy token admin. Vui lòng đăng nhập lại.');
            }

            const response = await axios.get('http://localhost:4000/api/achievements/public');
            console.log('📊 Achievements response:', response.data);

            if (response.data.success) {
                setAchievements(response.data.data || []);
                console.log('✅ Loaded achievements:', response.data.data?.length || 0);
            } else {
                throw new Error(response.data.message || 'Không thể tải danh sách thành tích');
            }
        } catch (error) {
            console.error('❌ Error loading achievements:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Lỗi khi tải danh sách thành tích';
            setError(errorMessage);
            message.error(errorMessage);
            // Set empty array để tránh crash
            setAchievements([]);
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            console.log('👥 Loading users...');
            const token = localStorage.getItem('adminToken');

            if (!token) {
                console.warn('⚠️ No admin token for loading users');
                return;
            }

            const response = await axios.get('http://localhost:4000/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                setUsers(response.data.data || []);
                console.log('✅ Loaded users:', response.data.data?.length || 0);
            } else {
                console.error('❌ Failed to load users:', response.data.message);
            }
        } catch (error) {
            console.error('❌ Error loading users:', error);
            // Don't show error message for users loading as it's not critical
            setUsers([]);
        }
    };

    const loadAchievementStats = async () => {
        try {
            console.log('📈 Loading achievement stats...');
            const token = localStorage.getItem('adminToken');

            // Get basic achievement stats
            const achievementResponse = await axios.get('http://localhost:4000/api/achievements/public');
            const achievements = achievementResponse.data.data || [];

            // Calculate stats (mock for now - you can implement proper endpoints)
            const statsData = {
                totalAchievements: achievements.length,
                activeAchievements: achievements.filter(a => a.IsActive).length,
                totalUsersWithAchievements: 0, // Need proper endpoint
                mostEarnedAchievement: achievements[0], // Need proper endpoint
                categoryStats: categories.map(cat => ({
                    category: cat,
                    count: achievements.filter(a => a.Category === cat).length
                }))
            };

            setStats(statsData);
            console.log('✅ Loaded stats:', statsData);
        } catch (error) {
            console.error('❌ Error loading achievement stats:', error);
            // Don't crash, just use default stats
            setStats({
                totalAchievements: 0,
                activeAchievements: 0,
                totalUsersWithAchievements: 0,
                mostEarnedAchievement: null,
                categoryStats: []
            });
        }
    };

    const applyFilters = () => {
        try {
            console.log('🔍 Applying filters...');
            let filtered = [...(achievements || [])];

            // Apply search filter
            if (searchText) {
                filtered = filtered.filter(achievement =>
                    achievement.Name?.toLowerCase().includes(searchText.toLowerCase()) ||
                    achievement.Description?.toLowerCase().includes(searchText.toLowerCase()) ||
                    achievement.Category?.toLowerCase().includes(searchText.toLowerCase())
                );
            }

            // Apply category filter
            if (filterCategory) {
                filtered = filtered.filter(achievement => achievement.Category === filterCategory);
            }

            // Apply difficulty filter
            if (filterDifficulty) {
                filtered = filtered.filter(achievement => achievement.Difficulty === parseInt(filterDifficulty));
            }

            setFilteredAchievements(filtered);
            console.log('✅ Filtered results:', filtered.length);
        } catch (error) {
            console.error('❌ Error in applyFilters:', error);
            setFilteredAchievements([]);
        }
    };

    const handleCreateAchievement = async (values) => {
        try {
            const token = localStorage.getItem('adminToken');

            const response = await axios.post('http://localhost:4000/api/achievements', {
                name: values.name,
                description: values.description,
                iconURL: values.iconUrl,
                category: values.category,
                milestoneDays: values.milestoneDays,
                savedMoney: values.savedMoney,
                requiredPlan: values.requiredPlan,
                difficulty: values.difficulty,
                points: values.points
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                message.success('Tạo thành tích mới thành công');
                setCreateModalVisible(false);
                setSelectedCategoryCreate('');
                createForm.resetFields();
                loadAchievements();
                loadAchievementStats();
            } else {
                message.error('Không thể tạo thành tích mới');
            }
        } catch (error) {
            console.error('Error creating achievement:', error);
            message.error('Lỗi khi tạo thành tích mới');
        }
    };

    const handleEditAchievement = async (values) => {
        try {
            const token = localStorage.getItem('adminToken');

            const response = await axios.put(`http://localhost:4000/api/achievements/${selectedAchievement.AchievementID}`, {
                name: values.name,
                description: values.description,
                iconURL: values.iconUrl,
                category: values.category,
                milestoneDays: values.milestoneDays,
                savedMoney: values.savedMoney,
                requiredPlan: values.requiredPlan,
                difficulty: values.difficulty,
                points: values.points,
                isActive: values.isActive
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                message.success('Cập nhật thành tích thành công');
                setEditModalVisible(false);
                setSelectedCategoryEdit('');
                editForm.resetFields();
                loadAchievements();
                loadAchievementStats();
            } else {
                message.error('Không thể cập nhật thành tích');
            }
        } catch (error) {
            console.error('Error updating achievement:', error);
            message.error('Lỗi khi cập nhật thành tích');
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
                loadAchievementStats();
            } else {
                message.error('Không thể xóa thành tích');
            }
        } catch (error) {
            console.error('Error deleting achievement:', error);
            message.error('Lỗi khi xóa thành tích');
        }
    };

    const handleResetUserAchievements = async () => {
        if (!selectedUser) {
            message.error('Vui lòng chọn người dùng');
            return;
        }

        try {
            const token = localStorage.getItem('adminToken');

            const response = await axios.post(`http://localhost:4000/api/admin/reset-user-achievements`, {
                userId: selectedUser
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                message.success('Reset thành tích người dùng thành công');
                setResetModalVisible(false);
                setSelectedUser(null);
                loadUsers();
            } else {
                message.error('Không thể reset thành tích người dùng');
            }
        } catch (error) {
            console.error('Error resetting user achievements:', error);
            message.error('Lỗi khi reset thành tích người dùng');
        }
    };

    const handleResetAllAchievements = async () => {
        try {
            const token = localStorage.getItem('adminToken');

            const response = await axios.post(`http://localhost:4000/api/admin/reset-all-achievements`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                message.success('Reset tất cả thành tích thành công');
                loadUsers();
            } else {
                message.error('Không thể reset tất cả thành tích');
            }
        } catch (error) {
            console.error('Error resetting all achievements:', error);
            message.error('Lỗi khi reset tất cả thành tích');
        }
    };

    const loadUserAchievements = async (userId) => {
        try {
            const token = localStorage.getItem('adminToken');

            const response = await axios.get(`http://localhost:4000/api/admin/user-achievements/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                setUserAchievements(response.data.data);
            }
        } catch (error) {
            console.error('Error loading user achievements:', error);
        }
    };

    const handleViewDetail = (achievement) => {
        setSelectedAchievement(achievement);
        setDetailModalVisible(true);
    };

    const handleEdit = (achievement) => {
        setSelectedAchievement(achievement);
        setSelectedCategoryEdit(achievement.Category);
        editForm.setFieldsValue({
            name: achievement.Name,
            description: achievement.Description,
            iconURL: achievement.IconURL,
            category: achievement.Category,
            milestoneDays: achievement.MilestoneDays,
            savedMoney: achievement.SavedMoney,
            requiredPlan: achievement.RequiredPlan,
            difficulty: achievement.Difficulty,
            points: achievement.Points,
            isActive: achievement.IsActive
        });
        setEditModalVisible(true);
    };

    const confirmDelete = (achievement) => {
        Modal.confirm({
            title: 'Xác nhận xóa thành tích',
            content: `Bạn có chắc chắn muốn xóa thành tích "${achievement.Name}"?`,
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk() {
                handleDeleteAchievement(achievement.AchievementID);
            },
        });
    };

    const getDifficultyColor = (difficulty) => {
        const colors = {
            1: 'green',
            2: 'blue',
            3: 'orange',
            4: 'red',
            5: 'purple'
        };
        return colors[difficulty] || 'default';
    };

    const getDifficultyText = (difficulty) => {
        const texts = {
            1: 'Dễ',
            2: 'Trung bình',
            3: 'Khó',
            4: 'Rất khó',
            5: 'Siêu khó'
        };
        return texts[difficulty] || 'Không xác định';
    };

    const getCategoryIcon = (category) => {
        const icons = {
            milestone: <CalendarOutlined />,
            savings: <DollarOutlined />
        };
        return icons[category] || <TrophyOutlined />;
    };

    const getCategoryText = (category) => {
        const texts = {
            milestone: 'Cột mốc thời gian',
            savings: 'Tiết kiệm tiền'
        };
        return texts[category] || category;
    };

    const columns = [
        {
            title: 'Thành tích',
            dataIndex: 'Name',
            key: 'name',
            render: (text, record) => (
                <div className="achievement-item">
                    <Avatar
                        src={record.IconURL}
                        icon={<TrophyOutlined />}
                        size="small"
                        className="achievement-avatar"
                    />
                    <div className="achievement-info">
                        <h4>{text}</h4>
                        <p>
                            {record.Description?.substring(0, 50)}...
                        </p>
                    </div>
                </div>
            ),
        },
        {
            title: 'Danh mục',
            dataIndex: 'Category',
            key: 'category',
            render: (category) => (
                <Tag
                    icon={getCategoryIcon(category)}
                    className={`achievement-tag ${category}`}
                >
                    {getCategoryText(category)}
                </Tag>
            ),
            filters: [
                { text: 'Cột mốc thời gian', value: 'milestone' },
                { text: 'Tiết kiệm tiền', value: 'savings' }
            ],
            onFilter: (value, record) => record.Category === value,
        },
        {
            title: 'Độ khó',
            dataIndex: 'Difficulty',
            key: 'difficulty',
            render: (difficulty) => {
                const difficultyClass = {
                    1: 'easy',
                    2: 'medium',
                    3: 'hard',
                    4: 'very-hard',
                    5: 'extreme'
                }[difficulty] || 'medium';

                return (
                    <div className={`achievement-difficulty-tag ${difficultyClass}`}>
                        {getDifficultyText(difficulty)}
                    </div>
                );
            },
            sorter: (a, b) => a.Difficulty - b.Difficulty,
        },
        {
            title: 'Điểm thưởng',
            dataIndex: 'Points',
            key: 'points',
            render: (points) => (
                <div className="achievement-points">
                    {points} điểm
                </div>
            ),
            sorter: (a, b) => a.Points - b.Points,
        },
        {
            title: 'Điều kiện',
            key: 'requirements',
            render: (_, record) => (
                <div className="achievement-requirements">
                    {record.MilestoneDays && (
                        <div className="achievement-requirement-tag">
                            📅 {record.MilestoneDays} ngày
                        </div>
                    )}
                    {record.SavedMoney && (
                        <div className="achievement-requirement-tag">
                            💰 {record.SavedMoney.toLocaleString()} VND
                        </div>
                    )}
                    {!record.MilestoneDays && !record.SavedMoney && (
                        <div className="achievement-requirement-tag">
                            ⭐ Đặc biệt
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'IsActive',
            key: 'isActive',
            render: (isActive) => (
                <Badge
                    status={isActive ? 'success' : 'error'}
                    text={isActive ? 'Hoạt động' : 'Không hoạt động'}
                />
            ),
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewDetail(record)}
                            className="achievement-action-btn view"
                        />
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                            className="achievement-action-btn edit"
                        />
                    </Tooltip>
                    <Tooltip title="Xóa">
                        <Button
                            type="text"
                            icon={<DeleteOutlined />}
                            onClick={() => confirmDelete(record)}
                            className="achievement-action-btn delete"
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const renderCreateForm = () => (
        <Form
            form={createForm}
            layout="vertical"
            onFinish={handleCreateAchievement}
        >
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item
                        name="name"
                        label="Tên thành tích"
                        rules={[{ required: true, message: 'Vui lòng nhập tên thành tích' }]}
                    >
                        <Input placeholder="Nhập tên thành tích" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        name="category"
                        label="Danh mục"
                        rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
                    >
                        <Select
                            placeholder="Chọn danh mục"
                            onChange={(value) => {
                                setSelectedCategoryCreate(value);
                                // Reset các trường điều kiện khi đổi danh mục
                                createForm.setFieldsValue({
                                    milestoneDays: undefined,
                                    savedMoney: undefined
                                });
                            }}
                        >
                            <Option value="milestone">Cột mốc thời gian</Option>
                            <Option value="savings">Tiết kiệm tiền</Option>
                        </Select>
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item
                name="description"
                label="Mô tả"
                rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
            >
                <Input.TextArea rows={3} placeholder="Nhập mô tả thành tích" />
            </Form.Item>

            <Form.Item
                name="iconUrl"
                label="URL Icon"
                rules={[{ required: true, message: 'Vui lòng nhập URL icon' }]}
            >
                <Input placeholder="Nhập URL icon thành tích" />
            </Form.Item>

            <Row gutter={16}>
                <Col span={8}>
                    <Form.Item
                        name="difficulty"
                        label="Độ khó"
                        rules={[{ required: true, message: 'Vui lòng chọn độ khó' }]}
                    >
                        <Select placeholder="Chọn độ khó">
                            {difficulties.map(diff => (
                                <Option key={diff} value={diff}>
                                    {getDifficultyText(diff)}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item
                        name="points"
                        label="Điểm thưởng"
                        rules={[{ required: true, message: 'Vui lòng nhập điểm thưởng' }]}
                    >
                        <InputNumber min={1} placeholder="Điểm thưởng" style={{ width: '100%' }} />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item
                        name="requiredPlan"
                        label="Gói yêu cầu"
                    >
                        <Select placeholder="Chọn gói (tùy chọn)" allowClear>
                            <Option value="basic">Basic</Option>
                            <Option value="premium">Premium</Option>
                            <Option value="vip">VIP</Option>
                        </Select>
                    </Form.Item>
                </Col>
            </Row>

            {/* Hiển thị trường điều kiện dựa trên danh mục */}
            {selectedCategoryCreate && (
                <Row gutter={16}>
                    {selectedCategoryCreate === 'milestone' && (
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
                    {selectedCategoryCreate === 'savings' && (
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
        </Form>
    );

    const renderEditForm = () => (
        <Form
            form={editForm}
            layout="vertical"
            onFinish={handleEditAchievement}
            className="space-y-4"
        >
            <Row gutter={16}>
                <Col span={8}>
                    <Form.Item
                        name="name"
                        label="Tên thành tích *"
                        rules={[{ required: true, message: 'Vui lòng nhập tên thành tích' }]}
                    >
                        <Input placeholder="Nhập tên thành tích" />
                    </Form.Item>
                </Col>
                <Col span={16}>
                    <Form.Item
                        name="description"
                        label="Mô tả *"
                        rules={[{ required: true, message: 'Vui lòng nhập mô tả thành tích' }]}
                    >
                        <Input placeholder="Nhập mô tả thành tích" />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col span={8}>
                    <Form.Item
                        name="category"
                        label="Danh mục *"
                        rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
                    >
                        <Select
                            placeholder="Chọn danh mục"
                            onChange={setSelectedCategoryEdit}
                            options={[
                                { value: 'milestone', label: 'Cột mốc thời gian' },
                                { value: 'savings', label: 'Tiết kiệm tiền' },
                                { value: 'progress', label: 'Tiến bộ' },
                                { value: 'social', label: 'Xã hội' },
                                { value: 'health', label: 'Sức khỏe' }
                            ]}
                        />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item
                        name="requiredPlan"
                        label="Gói yêu cầu"
                    >
                        <Select placeholder="Chọn gói (tùy chọn)" allowClear>
                            <Option value="basic">Basic</Option>
                            <Option value="premium">Premium</Option>
                            <Option value="vip">VIP</Option>
                        </Select>
                    </Form.Item>
                </Col>
            </Row>

            {/* Hiển thị trường điều kiện dựa trên danh mục */}
            {selectedCategoryEdit && (
                <Row gutter={16}>
                    {selectedCategoryEdit === 'milestone' && (
                        <Col span={8}>
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

                    {selectedCategoryEdit === 'savings' && (
                        <Col span={8}>
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
                    <Col span={8}>
                        <Form.Item
                            name="isActive"
                            label="Trạng thái"
                            valuePropName="checked"
                        >
                            <Switch checkedChildren="Hoạt động" unCheckedChildren="Tắt" />
                        </Form.Item>
                    </Col>
                </Row>
            )}
        </Form>
    );

    return (
        <div className="achievement-management">
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

            {/* Header */}
            <div className="achievement-header achievement-animate-slide-up">
                <h2>
                    <TrophyOutlined />
                    Quản lý Thành tích Huy hiệu
                </h2>
                <p>
                    Quản lý thành tích, huy hiệu và reset dữ liệu người dùng
                </p>
            </div>

            {/* Statistics Cards */}
            <div className="achievement-stats-grid achievement-animate-fade-in">
                <div className="achievement-stat-card primary">
                    <div className="achievement-stat-icon primary">
                        <TrophyOutlined />
                    </div>
                    <div className="achievement-stat-value">{stats.totalAchievements}</div>
                    <div className="achievement-stat-title">Tổng thành tích</div>
                </div>

                <div className="achievement-stat-card success">
                    <div className="achievement-stat-icon success">
                        <CheckCircleOutlined />
                    </div>
                    <div className="achievement-stat-value">{stats.activeAchievements}</div>
                    <div className="achievement-stat-title">Thành tích hoạt động</div>
                </div>

                <div className="achievement-stat-card warning">
                    <div className="achievement-stat-icon warning">
                        <UserOutlined />
                    </div>
                    <div className="achievement-stat-value">{stats.totalUsersWithAchievements}</div>
                    <div className="achievement-stat-title">Người dùng có thành tích</div>
                </div>

                <div className="achievement-stat-card info">
                    <div className="achievement-stat-icon info">
                        <StarOutlined />
                    </div>
                    <div className="achievement-stat-title">Danh mục phổ biến nhất</div>
                    <div className="achievement-requirements">
                        {stats.categoryStats?.map(cat => (
                            <div key={cat.category} className="achievement-requirement-tag">
                                {cat.category}: {cat.count}
                            </div>
                        )) || 'Không có dữ liệu'}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <Card className="achievement-controls achievement-animate-scale-in">
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} sm={12} lg={6}>
                        <Input
                            placeholder="Tìm kiếm thành tích..."
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                            className="achievement-search-input"
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={4}>
                        <Select
                            placeholder="Danh mục"
                            value={filterCategory}
                            onChange={setFilterCategory}
                            allowClear
                            style={{ width: '100%' }}
                            className="achievement-filter-select"
                        >
                            <Option value="milestone">Cột mốc thời gian</Option>
                            <Option value="savings">Tiết kiệm tiền</Option>
                        </Select>
                    </Col>
                    <Col xs={24} sm={12} lg={4}>
                        <Select
                            placeholder="Độ khó"
                            value={filterDifficulty}
                            onChange={setFilterDifficulty}
                            allowClear
                            style={{ width: '100%' }}
                            className="achievement-filter-select"
                        >
                            {difficulties.map(diff => (
                                <Option key={diff} value={diff.toString()}>
                                    {getDifficultyText(diff)}
                                </Option>
                            ))}
                        </Select>
                    </Col>
                    <Col xs={24} sm={12} lg={10}>
                        <Space wrap>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => setCreateModalVisible(true)}
                                className="achievement-btn achievement-btn-primary"
                            >
                                Tạo thành tích mới
                            </Button>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={loadAchievements}
                                loading={loading}
                                className="achievement-btn achievement-btn-secondary"
                            >
                                Làm mới
                            </Button>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={() => setResetModalVisible(true)}
                                className="achievement-btn achievement-btn-danger"
                            >
                                Reset huy hiệu
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {/* Achievement Table */}
            <Card className="achievement-table">
                <Table
                    columns={columns}
                    dataSource={filteredAchievements}
                    rowKey="AchievementID"
                    loading={loading}
                    pagination={{
                        total: filteredAchievements.length,
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} của ${total} thành tích`,
                    }}
                />
            </Card>

            {/* Create Modal */}
            <Modal
                title="Tạo thành tích mới"
                open={createModalVisible}
                onCancel={() => {
                    setCreateModalVisible(false);
                    setSelectedCategoryCreate('');
                    createForm.resetFields();
                }}
                footer={[
                    <Button key="cancel" onClick={() => {
                        setCreateModalVisible(false);
                        setSelectedCategoryCreate('');
                        createForm.resetFields();
                    }}>
                        Hủy
                    </Button>,
                    <Button key="create" type="primary" onClick={() => createForm.submit()}>
                        Tạo thành tích
                    </Button>
                ]}
                width={800}
            >
                {renderCreateForm()}
            </Modal>

            {/* Edit Modal */}
            <Modal
                title="Chỉnh sửa thành tích"
                open={editModalVisible}
                onCancel={() => {
                    setEditModalVisible(false);
                    setSelectedCategoryEdit('');
                    editForm.resetFields();
                }}
                footer={[
                    <Button key="cancel" onClick={() => {
                        setEditModalVisible(false);
                        setSelectedCategoryEdit('');
                        editForm.resetFields();
                    }}>
                        Hủy
                    </Button>,
                    <Button key="save" type="primary" onClick={() => editForm.submit()}>
                        Lưu thay đổi
                    </Button>
                ]}
                width={800}
            >
                {renderEditForm()}
            </Modal>

            {/* Detail Modal */}
            <Modal
                title="Chi tiết thành tích"
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setDetailModalVisible(false)}>
                        Đóng
                    </Button>
                ]}
                width={600}
            >
                {selectedAchievement && (
                    <div>
                        <Row gutter={[16, 16]} align="middle">
                            <Col span={6}>
                                <Avatar
                                    src={selectedAchievement.IconURL}
                                    icon={<TrophyOutlined />}
                                    size={80}
                                />
                            </Col>
                            <Col span={18}>
                                <Title level={3}>{selectedAchievement.Name}</Title>
                                <Paragraph>{selectedAchievement.Description}</Paragraph>
                                <Space wrap>
                                    <Tag icon={getCategoryIcon(selectedAchievement.Category)} color="blue">
                                        {getCategoryText(selectedAchievement.Category)}
                                    </Tag>
                                    <Tag color={getDifficultyColor(selectedAchievement.Difficulty)}>
                                        {getDifficultyText(selectedAchievement.Difficulty)}
                                    </Tag>
                                    <Tag color="gold">
                                        {selectedAchievement.Points} điểm
                                    </Tag>
                                </Space>
                            </Col>
                        </Row>

                        <Divider />

                        <Row gutter={[16, 16]}>
                            <Col span={12}>
                                <Text strong>Điều kiện:</Text>
                                <div style={{ marginTop: '8px' }}>
                                    {selectedAchievement.MilestoneDays && (
                                        <div>📅 {selectedAchievement.MilestoneDays} ngày không hút thuốc</div>
                                    )}
                                    {selectedAchievement.SavedMoney && (
                                        <div>💰 Tiết kiệm {selectedAchievement.SavedMoney.toLocaleString()} VND</div>
                                    )}
                                    {selectedAchievement.RequiredPlan && (
                                        <div>🎯 Gói: {selectedAchievement.RequiredPlan}</div>
                                    )}
                                    {!selectedAchievement.MilestoneDays && !selectedAchievement.SavedMoney && (
                                        <div>⭐ Thành tích đặc biệt</div>
                                    )}
                                </div>
                            </Col>
                            <Col span={12}>
                                <Text strong>Trạng thái:</Text>
                                <div style={{ marginTop: '8px' }}>
                                    <Badge
                                        status={selectedAchievement.IsActive ? 'success' : 'error'}
                                        text={selectedAchievement.IsActive ? 'Hoạt động' : 'Không hoạt động'}
                                    />
                                </div>
                            </Col>
                        </Row>
                    </div>
                )}
            </Modal>

            {/* Reset Modal */}
            <Modal
                title="Reset Huy hiệu & Thành tích"
                open={resetModalVisible}
                onCancel={() => {
                    setResetModalVisible(false);
                    setSelectedUser(null);
                }}
                footer={null}
                width={600}
            >
                <div>
                    <Paragraph>
                        Chọn phương thức reset huy hiệu và thành tích:
                    </Paragraph>

                    <Card style={{ marginBottom: '16px' }}>
                        <Title level={4}>Reset một người dùng cụ thể</Title>
                        <Select
                            style={{ width: '100%', marginBottom: '16px' }}
                            placeholder="Chọn người dùng"
                            value={selectedUser}
                            onChange={setSelectedUser}
                            showSearch
                            optionFilterProp="children"
                        >
                            {users.map(user => (
                                <Option key={user.UserID} value={user.UserID}>
                                    {user.FirstName} {user.LastName} ({user.Email})
                                </Option>
                            ))}
                        </Select>
                        <Button
                            type="primary"
                            danger
                            disabled={!selectedUser}
                            onClick={handleResetUserAchievements}
                            block
                        >
                            Reset huy hiệu người dùng này
                        </Button>
                    </Card>

                    <Card>
                        <Title level={4}>Reset tất cả người dùng</Title>
                        <Paragraph type="danger">
                            ⚠️ Thao tác này sẽ xóa TẤT CẢ huy hiệu của TẤT CẢ người dùng.
                            Hệ thống sẽ chỉ giữ lại những huy hiệu mà người dùng thực sự đủ điều kiện.
                        </Paragraph>
                        <Popconfirm
                            title="Bạn có chắc chắn muốn reset tất cả?"
                            description="Thao tác này không thể hoàn tác!"
                            onConfirm={handleResetAllAchievements}
                            okText="Có, reset tất cả"
                            cancelText="Hủy"
                            okType="danger"
                        >
                            <Button type="primary" danger block>
                                Reset TẤT CẢ huy hiệu
                            </Button>
                        </Popconfirm>
                    </Card>
                </div>
            </Modal>
        </div>
    );
};

export default AchievementManagement; 