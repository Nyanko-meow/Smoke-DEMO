import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    Layout,
    Card,
    Row,
    Col,
    Statistic,
    Typography,
    message,
    Table,
    Tag,
    Progress,
    Avatar,
    Space,
    Button,
    Dropdown,
    Menu,
    Form,
    Input,
    Modal,
    InputNumber,
    Divider,
    Switch,
    Select,
    Tooltip,
    Badge,
    Descriptions,
    Rate,
    Spin,
    Popconfirm
} from 'antd';
import {
    UserOutlined,
    TeamOutlined,
    ShoppingCartOutlined,
    TrophyOutlined,
    DollarOutlined,
    StarOutlined,
    LogoutOutlined,
    SettingOutlined,
    BarChartOutlined,
    SafetyOutlined,
    HomeOutlined,
    DashboardOutlined,
    FileTextOutlined,
    UsergroupAddOutlined,
    CrownOutlined,
    MessageOutlined,
    CheckCircleOutlined,
    EditOutlined,
    DeleteOutlined,
    PlusOutlined,
    EyeOutlined,
    LinkOutlined,
    DisconnectOutlined,
    PoweroffOutlined,
    ContactsOutlined,
    MailOutlined,
    PhoneOutlined,
    EnvironmentOutlined,
    CalendarOutlined,
    BookOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    CreditCardOutlined,
    ExclamationCircleOutlined,
    CommentOutlined,
    LineChartOutlined,
    PieChartOutlined,
    RiseOutlined,
    FallOutlined,
    DownloadOutlined,
    FilterOutlined,
    BellOutlined,
    FormOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import CommunityModeration from './CommunityModeration';
import UserActivityTracking from './UserActivityTracking';
import FeedbackManagement from '../components/admin/FeedbackManagement';
import AchievementManagement from '../components/admin/AchievementManagement';
import AchievementManagementSimple from '../components/admin/AchievementManagementSimple';
import CancellationManagement from '../components/admin/CancellationManagement';
import AdminNotifications from '../components/admin/AdminNotifications';
import SurveyManagement from '../components/admin/SurveyManagement';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

const AdminDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState('dashboard');
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalPlans: 0,
        successfulQuitters: 0,
        totalRevenue: 0,
        averageRating: 0,
        totalFeedback: 0
    });
    const [recentData, setRecentData] = useState({
        recentUsers: [],
        recentPayments: [],
        topRatedCoaches: []
    });
    const [adminProfile, setAdminProfile] = useState(null);

    // Profile management states
    const [detailedProfile, setDetailedProfile] = useState(null);
    const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
    const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);
    const [editProfileForm] = Form.useForm();
    const [changePasswordForm] = Form.useForm();

    const navigate = useNavigate();

    useEffect(() => {
        checkAuthAndLoadData();
    }, []);

    useEffect(() => {
        if (selectedTab === 'profile' && !detailedProfile) {
            loadAdminProfile();
        }
    }, [selectedTab]);

    const checkAuthAndLoadData = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const userData = localStorage.getItem('adminUser');

            if (!token || !userData) {
                message.error('Vui lòng đăng nhập');
                navigate('/admin/login');
                return;
            }

            const user = JSON.parse(userData);
            if (user.role !== 'admin') {
                message.error('Bạn không có quyền truy cập trang này');
                navigate('/admin/login');
                return;
            }

            setAdminProfile(user);
            await loadDashboardData(token);

        } catch (error) {
            console.error('Auth check error:', error);
            message.error('Lỗi xác thực. Vui lòng đăng nhập lại');
            handleLogout();
        } finally {
            setLoading(false);
        }
    };

    const loadDashboardData = async (token) => {
        try {
            const response = await axios.get('http://localhost:4000/api/admin/dashboard-stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                withCredentials: true
            });

            if (response.data.success) {
                setStats(response.data.stats);
                setRecentData(response.data.recentData);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            message.error('Lỗi khi tải dữ liệu dashboard');
        }
    };

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            if (token) {
                await axios.post('http://localhost:4000/api/admin/logout', {}, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    withCredentials: true
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            message.success('Đăng xuất thành công');
            navigate('/admin/login');
        }
    };

    // Profile management functions
    const loadAdminProfile = async () => {
        try {
            setProfileLoading(true);
            const token = localStorage.getItem('adminToken');

            if (!token) {
                message.error('Không tìm thấy token xác thực');
                return;
            }

            const response = await axios.get('http://localhost:4000/api/admin/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                withCredentials: true
            });

            if (response.data.success) {
                setDetailedProfile(response.data.data);
                console.log('✅ Profile loaded successfully:', response.data.data);
            } else {
                message.error('Không thể tải thông tin admin: ' + response.data.message);
                console.error('❌ Profile API failed:', response.data);
            }

        } catch (error) {
            console.error('❌ Error loading admin profile:', error);

            if (error.response?.status === 401) {
                message.error('Phiên đăng nhập đã hết hạn');
                // Optionally redirect to login
            } else if (error.response?.status === 500) {
                message.error('Lỗi server khi tải thông tin admin');
                console.error('Server error details:', error.response.data);
            } else {
                message.error('Lỗi khi tải thông tin admin: ' + (error.message || 'Unknown error'));
            }
        } finally {
            setProfileLoading(false);
        }
    };

    const handleEditProfile = () => {
        if (detailedProfile) {
            editProfileForm.setFieldsValue({
                firstName: detailedProfile.FirstName,
                lastName: detailedProfile.LastName,
                phoneNumber: detailedProfile.PhoneNumber,
                address: detailedProfile.Address,
                avatar: detailedProfile.Avatar
            });
            setEditProfileModalVisible(true);
        }
    };

    const handleUpdateProfile = async (values) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.put('http://localhost:4000/api/admin/profile', values, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                withCredentials: true
            });

            if (response.data.success) {
                message.success('Cập nhật thông tin thành công');
                setEditProfileModalVisible(false);
                editProfileForm.resetFields();

                // Update local storage
                const updatedUser = {
                    ...adminProfile,
                    firstName: values.firstName,
                    lastName: values.lastName
                };
                setAdminProfile(updatedUser);
                localStorage.setItem('adminUser', JSON.stringify(updatedUser));

                // Reload profile data
                await loadAdminProfile();
            }
        } catch (error) {
            console.error('Update profile error:', error);
            message.error(error.response?.data?.message || 'Lỗi khi cập nhật thông tin');
        }
    };

    const handleChangePassword = async (values) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.put('http://localhost:4000/api/admin/change-password', values, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                withCredentials: true
            });

            if (response.data.success) {
                message.success('Đổi mật khẩu thành công');
                setChangePasswordModalVisible(false);
                changePasswordForm.resetFields();
            }
        } catch (error) {
            console.error('Change password error:', error);
            message.error(error.response?.data?.message || 'Lỗi khi đổi mật khẩu');
        }
    };

    const handleCancelEditProfile = () => {
        setEditProfileModalVisible(false);
        editProfileForm.resetFields();
    };

    const handleCancelChangePassword = () => {
        setChangePasswordModalVisible(false);
        changePasswordForm.resetFields();
    };

    const userMenuItems = [
        {
            key: 'home',
            icon: <HomeOutlined />,
            label: 'Về trang chủ',
            onClick: () => navigate('/'),
        },
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: 'Thông tin cá nhân',
            onClick: () => setSelectedTab('profile'),
        },
        {
            type: 'divider',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Đăng xuất',
            onClick: handleLogout,
        },
    ];

    // Sidebar menu items for content management
    const sidebarMenuItems = [
        {
            key: 'dashboard',
            icon: <DashboardOutlined />,
            label: 'Tổng quan',
        },
        {
            key: 'user-activity',
            icon: <BarChartOutlined />,
            label: 'Theo dõi hoạt động',
        },
        {
            key: 'reports',
            icon: <LineChartOutlined />,
            label: 'Báo cáo thống kê',
        },
        {
            key: 'plans',
            icon: <CrownOutlined />,
            label: 'Quản lý Plans',
        },
        {
            key: 'coaches',
            icon: <UsergroupAddOutlined />,
            label: 'Quản lý Coach',
        },
        {
            key: 'blogs',
            icon: <FileTextOutlined />,
            label: 'Quản lý Blog',
        },
        {
            key: 'community',
            icon: <MessageOutlined />,
            label: 'Kiểm duyệt Community',
        },
        {
            key: 'feedbacks',
            icon: <CommentOutlined />,
            label: 'Quản lý Phản hồi',
        },
        {
            key: 'payments',
            icon: <CreditCardOutlined />,
            label: 'Xác nhận Thanh toán',
        },
        {
            key: 'cancellations',
            icon: <CloseCircleOutlined />,
            label: 'Quản lý yêu cầu hủy gói',
        },
        {
            key: 'achievements',
            icon: <TrophyOutlined />,
            label: 'Quản lý Thành tích',
        },
        {
            key: 'surveys',
            icon: <FormOutlined />,
            label: 'Quản lý Khảo sát',
        },
    ];

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('vi-VN');
    };

    const recentUsersColumns = [
        {
            title: 'Họ tên',
            dataIndex: 'fullName',
            key: 'fullName',
            render: (text, record) => (
                <Space>
                    <Avatar
                        src={record.Avatar}
                        icon={<UserOutlined />}
                        size="small"
                    />
                    {`${record.FirstName} ${record.LastName}`}
                </Space>
            ),
        },
        {
            title: 'Email',
            dataIndex: 'Email',
            key: 'email',
        },
        {
            title: 'Vai trò',
            dataIndex: 'Role',
            key: 'role',
            render: (role) => {
                const colorMap = {
                    'admin': 'red',
                    'coach': 'blue',
                    'member': 'green',
                    'guest': 'gray'
                };
                return <Tag color={colorMap[role]}>{role.toUpperCase()}</Tag>;
            },
        },
        {
            title: 'Ngày tham gia',
            dataIndex: 'CreatedAt',
            key: 'createdAt',
            render: (date) => formatDate(date),
        },
    ];

    const recentPaymentsColumns = [
        {
            title: 'Người dùng',
            dataIndex: 'userInfo',
            key: 'user',
            render: (text, record) => (
                `${record.FirstName} ${record.LastName}`
            ),
        },
        {
            title: 'Gói',
            dataIndex: 'PlanName',
            key: 'plan',
        },
        {
            title: 'Số tiền',
            dataIndex: 'Amount',
            key: 'amount',
            render: (amount) => (
                <span className="font-medium text-green-600">
                    {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                    }).format(amount)}
                </span>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'Status',
            key: 'status',
            render: (status) => {
                const colorMap = {
                    'confirmed': 'green',
                    'pending': 'orange',
                    'rejected': 'red'
                };
                return <Tag color={colorMap[status]}>{status.toUpperCase()}</Tag>;
            },
        },
        {
            title: 'Ngày',
            dataIndex: 'PaymentDate',
            key: 'date',
            render: (date) => formatDate(date),
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    // Render content based on selected tab
    const renderContent = () => {
        switch (selectedTab) {
            case 'dashboard':
                return (
                    <>
                        {/* Statistics Cards */}
                        <Row gutter={[24, 24]} className="mb-6">
                            <Col xs={24} sm={12} lg={6}>
                                <Card className="shadow-md hover:shadow-lg transition-shadow">
                                    <Statistic
                                        title="Tổng số người dùng"
                                        value={stats.totalUsers}
                                        prefix={<TeamOutlined />}
                                        valueStyle={{ color: '#1890ff' }}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} lg={6}>
                                <Card className="shadow-md hover:shadow-lg transition-shadow">
                                    <Statistic
                                        title="Số gói đã bán"
                                        value={stats.totalPlans}
                                        prefix={<ShoppingCartOutlined />}
                                        valueStyle={{ color: '#52c41a' }}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} lg={6}>
                                <Card className="shadow-md hover:shadow-lg transition-shadow">
                                    <Statistic
                                        title="Người bỏ thuốc thành công"
                                        value={stats.successfulQuitters}
                                        prefix={<TrophyOutlined />}
                                        valueStyle={{ color: '#faad14' }}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} lg={6}>
                                <Card className="shadow-md hover:shadow-lg transition-shadow">
                                    <Statistic
                                        title="Doanh thu tổng"
                                        value={stats.totalRevenue}
                                        formatter={(value) => formatCurrency(value)}
                                        prefix={<DollarOutlined />}
                                        valueStyle={{ color: '#f5222d' }}
                                    />
                                </Card>
                            </Col>
                        </Row>

                        {/* Rating Statistics */}
                        <Row gutter={[24, 24]} className="mb-6">
                            <Col xs={24} lg={12}>
                                <Card
                                    title={
                                        <div className="flex items-center">
                                            <StarOutlined className="mr-2" />
                                            <span>Thống kê đánh giá</span>
                                        </div>
                                    }
                                    className="shadow-md"
                                >
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Statistic
                                                title="Đánh giá trung bình"
                                                value={stats.averageRating}
                                                precision={1}
                                                suffix="/ 5.0"
                                                valueStyle={{ color: '#faad14' }}
                                            />
                                        </Col>
                                        <Col span={12}>
                                            <Statistic
                                                title="Tổng số đánh giá"
                                                value={stats.totalFeedback}
                                                valueStyle={{ color: '#1890ff' }}
                                            />
                                        </Col>
                                    </Row>
                                    <div className="mt-4">
                                        <Progress
                                            percent={Math.round((stats.averageRating / 5) * 100)}
                                            showInfo={false}
                                            strokeColor="#faad14"
                                        />
                                        <Text className="text-gray-500 text-sm">
                                            Chất lượng dịch vụ tổng thể
                                        </Text>
                                    </div>
                                </Card>
                            </Col>

                            <Col xs={24} lg={12}>
                                <Card
                                    title={
                                        <div className="flex items-center">
                                            <BarChartOutlined className="mr-2" />
                                            <span>Coach được đánh giá cao</span>
                                        </div>
                                    }
                                    className="shadow-md"
                                >
                                    {recentData.topRatedCoaches?.map((coach, index) => (
                                        <div key={coach.CoachID} className="flex items-center justify-between mb-3">
                                            <div className="flex items-center">
                                                <Avatar
                                                    src={coach.Avatar}
                                                    icon={<UserOutlined />}
                                                    size="small"
                                                />
                                                <span className="ml-2">{coach.CoachName}</span>
                                            </div>
                                            <div>
                                                <StarOutlined className="text-yellow-500 mr-1" />
                                                <span>{coach.AverageRating?.toFixed(1) || 0}</span>
                                                <Text className="text-gray-500 ml-2 text-sm">
                                                    ({coach.TotalReviews} đánh giá)
                                                </Text>
                                            </div>
                                        </div>
                                    ))}
                                </Card>
                            </Col>
                        </Row>

                        {/* Recent Data Tables */}
                        <Row gutter={[24, 24]}>
                            <Col xs={24} xl={12}>
                                <Card
                                    title="Người dùng mới gần đây"
                                    className="shadow-md"
                                >
                                    <Table
                                        dataSource={recentData.recentUsers}
                                        columns={recentUsersColumns}
                                        rowKey="UserID"
                                        pagination={false}
                                        size="small"
                                    />
                                </Card>
                            </Col>

                            <Col xs={24} xl={12}>
                                <Card
                                    title="Giao dịch gần đây"
                                    className="shadow-md"
                                >
                                    <Table
                                        dataSource={recentData.recentPayments}
                                        columns={recentPaymentsColumns}
                                        rowKey="PaymentID"
                                        pagination={false}
                                        size="small"
                                    />
                                </Card>
                            </Col>
                        </Row>
                    </>
                );
            case 'profile':
                return (
                    <Spin spinning={profileLoading}>
                        {detailedProfile ? (
                            <Row gutter={[24, 24]}>
                                {/* Profile Header */}
                                <Col span={24}>
                                    <Card className="shadow-md">
                                        <div className="flex items-center mb-6">
                                            <Avatar
                                                size={120}
                                                src={detailedProfile.Avatar}
                                                icon={<UserOutlined />}
                                                className="mr-6"
                                                style={{ border: '4px solid #1890ff' }}
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <Title level={2} className="mb-2">
                                                            {detailedProfile.FirstName} {detailedProfile.LastName}
                                                        </Title>
                                                        <Text className="text-lg text-gray-600">
                                                            Quản trị viên hệ thống
                                                        </Text>
                                                        <div className="mt-2">
                                                            <Tag color="red" icon={<SafetyOutlined />}>
                                                                Admin
                                                            </Tag>
                                                            {detailedProfile.IsActive && (
                                                                <Tag color="green" icon={<CheckCircleOutlined />}>
                                                                    Đang hoạt động
                                                                </Tag>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Space>
                                                        <Button
                                                            type="primary"
                                                            icon={<EditOutlined />}
                                                            onClick={handleEditProfile}
                                                        >
                                                            Chỉnh sửa thông tin
                                                        </Button>
                                                        <Button
                                                            icon={<SettingOutlined />}
                                                            onClick={() => setChangePasswordModalVisible(true)}
                                                        >
                                                            Đổi mật khẩu
                                                        </Button>
                                                    </Space>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Admin Statistics */}
                                        {detailedProfile.statistics && (
                                            <Row gutter={[16, 16]} className="mb-6">
                                                <Col xs={12} sm={8} lg={4}>
                                                    <Statistic
                                                        title="Thành viên quản lý"
                                                        value={detailedProfile.statistics.TotalMembersManaged}
                                                        prefix={<TeamOutlined />}
                                                    />
                                                </Col>
                                                <Col xs={12} sm={8} lg={4}>
                                                    <Statistic
                                                        title="Coaches quản lý"
                                                        value={detailedProfile.statistics.TotalCoachesManaged}
                                                        prefix={<UsergroupAddOutlined />}
                                                    />
                                                </Col>
                                                <Col xs={12} sm={8} lg={4}>
                                                    <Statistic
                                                        title="Bài viết quản lý"
                                                        value={detailedProfile.statistics.TotalBlogPostsManaged}
                                                        prefix={<FileTextOutlined />}
                                                    />
                                                </Col>
                                                <Col xs={12} sm={8} lg={4}>
                                                    <Statistic
                                                        title="Thanh toán xử lý"
                                                        value={detailedProfile.statistics.TotalPaymentsProcessed}
                                                        prefix={<CreditCardOutlined />}
                                                    />
                                                </Col>
                                                <Col xs={12} sm={8} lg={4}>
                                                    <Statistic
                                                        title="Doanh thu quản lý"
                                                        value={detailedProfile.statistics.TotalRevenueManaged || 0}
                                                        formatter={(value) => `${value?.toLocaleString() || 0} VNĐ`}
                                                        prefix={<DollarOutlined />}
                                                    />
                                                </Col>
                                                <Col xs={12} sm={8} lg={4}>
                                                    <Statistic
                                                        title="Tổng đăng nhập"
                                                        value={detailedProfile.statistics.TotalLogins}
                                                        prefix={<ClockCircleOutlined />}
                                                    />
                                                </Col>
                                            </Row>
                                        )}
                                    </Card>
                                </Col>

                                {/* Basic Information */}
                                <Col xs={24} lg={12}>
                                    <Card
                                        title={
                                            <div className="flex items-center">
                                                <UserOutlined className="mr-2" />
                                                <span>Thông tin cơ bản</span>
                                            </div>
                                        }
                                        className="shadow-md h-full"
                                    >
                                        <Descriptions column={1} size="small">
                                            <Descriptions.Item
                                                label={<span><MailOutlined className="mr-2" />Email</span>}
                                            >
                                                {detailedProfile.Email}
                                            </Descriptions.Item>
                                            <Descriptions.Item
                                                label={<span><PhoneOutlined className="mr-2" />Số điện thoại</span>}
                                            >
                                                {detailedProfile.PhoneNumber || 'Chưa cập nhật'}
                                            </Descriptions.Item>
                                            <Descriptions.Item
                                                label={<span><EnvironmentOutlined className="mr-2" />Địa chỉ</span>}
                                            >
                                                {detailedProfile.Address || 'Chưa cập nhật'}
                                            </Descriptions.Item>
                                            <Descriptions.Item
                                                label={<span><SafetyOutlined className="mr-2" />Vai trò</span>}
                                            >
                                                <Tag color="red">{detailedProfile.Role.toUpperCase()}</Tag>
                                            </Descriptions.Item>
                                            <Descriptions.Item
                                                label={<span><CalendarOutlined className="mr-2" />Ngày tạo tài khoản</span>}
                                            >
                                                {new Date(detailedProfile.CreatedAt).toLocaleDateString('vi-VN')}
                                            </Descriptions.Item>
                                            <Descriptions.Item
                                                label={<span><ClockCircleOutlined className="mr-2" />Lần đăng nhập cuối</span>}
                                            >
                                                {detailedProfile.LastLoginAt ?
                                                    new Date(detailedProfile.LastLoginAt).toLocaleString('vi-VN') :
                                                    'Chưa có thông tin'
                                                }
                                            </Descriptions.Item>
                                        </Descriptions>
                                    </Card>
                                </Col>

                                {/* Account Security */}
                                <Col xs={24} lg={12}>
                                    <Card
                                        title={
                                            <div className="flex items-center">
                                                <SafetyOutlined className="mr-2" />
                                                <span>Bảo mật tài khoản</span>
                                            </div>
                                        }
                                        className="shadow-md h-full"
                                    >
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                                <div>
                                                    <Text strong>Trạng thái tài khoản</Text>
                                                    <br />
                                                    <Text type="secondary">Tài khoản admin đang hoạt động</Text>
                                                </div>
                                                <Tag color={detailedProfile.IsActive ? 'green' : 'red'}>
                                                    {detailedProfile.IsActive ? 'Hoạt động' : 'Tạm khóa'}
                                                </Tag>
                                            </div>

                                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                                <div>
                                                    <Text strong>Xác thực email</Text>
                                                    <br />
                                                    <Text type="secondary">Trạng thái xác thực email</Text>
                                                </div>
                                                <Tag color={detailedProfile.EmailVerified ? 'green' : 'orange'}>
                                                    {detailedProfile.EmailVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                                                </Tag>
                                            </div>

                                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                                <div>
                                                    <Text strong>Mật khẩu</Text>
                                                    <br />
                                                    <Text type="secondary">Đổi mật khẩu để bảo mật tài khoản</Text>
                                                </div>
                                                <Button
                                                    icon={<SettingOutlined />}
                                                    onClick={() => setChangePasswordModalVisible(true)}
                                                >
                                                    Đổi mật khẩu
                                                </Button>
                                            </div>

                                            {detailedProfile.UpdatedAt && (
                                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                                    <div>
                                                        <Text strong>Cập nhật cuối</Text>
                                                        <br />
                                                        <Text type="secondary">
                                                            {new Date(detailedProfile.UpdatedAt).toLocaleString('vi-VN')}
                                                        </Text>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                </Col>
                            </Row>
                        ) : (
                            <div className="text-center py-8">
                                <Text>Đang tải thông tin cá nhân...</Text>
                            </div>
                        )}
                    </Spin>
                );
            case 'user-activity':
                return <UserActivityTracking />;
            case 'notifications':
                return <AdminNotifications />;
            case 'reports':
                return <ReportsManagement />;
            case 'plans':
                return <PlansManagement />;
            case 'coaches':
                return <CoachManagement />;
            case 'blogs':
                return <BlogManagement />;
            case 'community':
                return <CommunityModeration />;
            case 'feedbacks':
                return <FeedbackManagement />;
            case 'payments':
                return <PaymentsManagement />;
            case 'achievements':
                return <AchievementManagementSimple />;
            case 'cancellations':
                return <CancellationManagement />;
            case 'surveys':
                return <SurveyManagement />;
            default:
                return null;
        }
    };

    // Blog Management Component
    const BlogManagement = () => {
        const [blogPosts, setBlogPosts] = useState([]);
        const [loading, setLoading] = useState(false);
        const [createModalVisible, setCreateModalVisible] = useState(false);
        const [editModalVisible, setEditModalVisible] = useState(false);
        const [selectedPost, setSelectedPost] = useState(null);
        const [previewModalVisible, setPreviewModalVisible] = useState(false);
        const [createForm] = Form.useForm();
        const [editForm] = Form.useForm();

        // Load blog posts
        const loadBlogPosts = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('adminToken');
                const response = await axios.get('http://localhost:4000/api/admin/blog-posts', {
                    headers: { 'Authorization': `Bearer ${token}` },
                    withCredentials: true
                });

                if (response.data.success) {
                    setBlogPosts(response.data.data);
                }
            } catch (error) {
                console.error('Error loading blog posts:', error);
                message.error('Lỗi khi tải danh sách blog');
            } finally {
                setLoading(false);
            }
        };

        useEffect(() => {
            loadBlogPosts();
        }, []);

        // Create new blog post
        const handleCreatePost = async (values) => {
            try {
                const token = localStorage.getItem('adminToken');
                const response = await axios.post('http://localhost:4000/api/admin/blog-posts', {
                    title: values.title,
                    content: values.content,
                    metaDescription: values.metaDescription,
                    thumbnailURL: values.thumbnailURL
                }, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    withCredentials: true
                });

                if (response.data.success) {
                    message.success('Tạo bài viết thành công!');
                    setCreateModalVisible(false);
                    createForm.resetFields();
                    loadBlogPosts();
                }
            } catch (error) {
                console.error('Error creating blog post:', error);
                message.error('Lỗi khi tạo bài viết');
            }
        };

        // Update blog post
        const handleUpdatePost = async (values) => {
            try {
                const token = localStorage.getItem('adminToken');
                const response = await axios.put(`http://localhost:4000/api/admin/blog-posts/${selectedPost.PostID}`, {
                    title: values.title,
                    content: values.content,
                    metaDescription: values.metaDescription,
                    thumbnailURL: values.thumbnailURL,
                    status: values.status
                }, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    withCredentials: true
                });

                if (response.data.success) {
                    message.success('Cập nhật bài viết thành công!');
                    setEditModalVisible(false);
                    editForm.resetFields();
                    loadBlogPosts();
                }
            } catch (error) {
                console.error('Error updating blog post:', error);
                message.error('Lỗi khi cập nhật bài viết');
            }
        };

        // Delete blog post
        const handleDeletePost = async (postId) => {
            try {
                const token = localStorage.getItem('adminToken');
                const response = await axios.delete(`http://localhost:4000/api/admin/blog-posts/${postId}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    withCredentials: true
                });

                if (response.data.success) {
                    message.success('Xóa bài viết thành công!');
                    loadBlogPosts();
                }
            } catch (error) {
                console.error('Error deleting blog post:', error);
                message.error('Lỗi khi xóa bài viết');
            }
        };

        // Approve/Reject blog post
        const handleBlogPostStatus = async (postId, status) => {
            try {
                const token = localStorage.getItem('adminToken');
                const response = await axios.patch(`http://localhost:4000/api/admin/blog-posts/${postId}/status`, {
                    status: status
                }, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    withCredentials: true
                });

                if (response.data.success) {
                    const statusText = status === 'published' ? 'phê duyệt' : status === 'rejected' ? 'từ chối' : 'cập nhật';
                    message.success(`Bài viết đã được ${statusText} thành công!`);
                    loadBlogPosts();
                }
            } catch (error) {
                console.error('Error updating blog post status:', error);
                message.error('Lỗi khi cập nhật trạng thái bài viết');
            }
        };

        // Show edit modal
        const handleShowEditModal = (post) => {
            setSelectedPost(post);
            editForm.setFieldsValue({
                title: post.Title,
                content: post.Content,
                metaDescription: post.MetaDescription,
                thumbnailURL: post.ThumbnailURL,
                status: post.Status
            });
            setEditModalVisible(true);
        };

        // Show preview modal
        const handleShowPreview = (post) => {
            setSelectedPost(post);
            setPreviewModalVisible(true);
        };

        // Table columns
        const columns = [
            {
                title: 'Tiêu đề',
                dataIndex: 'Title',
                key: 'title',
                render: (text, record) => (
                    <div className="flex items-center space-x-2">
                        {record.ThumbnailURL && (
                            <img
                                src={record.ThumbnailURL}
                                alt={text}
                                className="w-12 h-12 object-cover rounded"
                                onError={(e) => {
                                    e.target.src = '/api/images/default-blog.svg';
                                }}
                            />
                        )}
                        <div>
                            <div className="font-medium text-gray-900">{text}</div>
                            <div className="text-sm text-gray-500">
                                {record.MetaDescription}
                            </div>
                        </div>
                    </div>
                )
            },
            {
                title: 'Tác giả',
                key: 'author',
                render: (record) => (
                    <div>
                        <div className="font-medium">
                            {record.AuthorFirstName} {record.AuthorLastName}
                        </div>
                        <div className="text-sm text-gray-500">
                            ID: {record.AuthorID}
                        </div>
                    </div>
                )
            },
            {
                title: 'Trạng thái',
                dataIndex: 'Status',
                key: 'status',
                render: (status) => {
                    const statusConfig = {
                        'published': { color: 'green', text: 'Đã xuất bản' },
                        'Pending': { color: 'orange', text: 'Chờ duyệt' },
                        'draft': { color: 'gray', text: 'Nháp' }
                    };
                    const config = statusConfig[status] || { color: 'gray', text: status };
                    return <Tag color={config.color}>{config.text}</Tag>;
                }
            },
            {
                title: 'Lượt xem',
                dataIndex: 'Views',
                key: 'views',
                render: (views) => (
                    <div className="flex items-center">
                        <EyeOutlined className="mr-1" />
                        {views || 0}
                    </div>
                )
            },
            {
                title: 'Ngày tạo',
                dataIndex: 'CreatedAt',
                key: 'createdAt',
                render: (date) => new Date(date).toLocaleDateString('vi-VN')
            },
            {
                title: 'Thao tác',
                key: 'actions',
                render: (record) => (
                    <Space wrap>
                        <Tooltip title="Xem trước">
                            <Button
                                type="primary"
                                icon={<EyeOutlined />}
                                size="small"
                                onClick={() => handleShowPreview(record)}
                            />
                        </Tooltip>

                        {/* Show approve/reject buttons only for pending posts */}
                        {record.Status === 'Pending' && (
                            <>
                                <Tooltip title="Phê duyệt">
                                    <Button
                                        type="primary"
                                        style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                                        icon={<CheckCircleOutlined />}
                                        size="small"
                                        onClick={() => {
                                            Modal.confirm({
                                                title: 'Phê duyệt bài viết',
                                                content: `Bạn có chắc chắn muốn phê duyệt bài viết "${record.Title}"?`,
                                                onOk: () => handleBlogPostStatus(record.PostID, 'published')
                                            });
                                        }}
                                    />
                                </Tooltip>
                                <Tooltip title="Từ chối">
                                    <Button
                                        danger
                                        icon={<CloseCircleOutlined />}
                                        size="small"
                                        onClick={() => {
                                            Modal.confirm({
                                                title: 'Từ chối bài viết',
                                                content: `Bạn có chắc chắn muốn từ chối bài viết "${record.Title}"?`,
                                                onOk: () => handleBlogPostStatus(record.PostID, 'rejected')
                                            });
                                        }}
                                    />
                                </Tooltip>
                            </>
                        )}

                        <Tooltip title="Chỉnh sửa">
                            <Button
                                icon={<EditOutlined />}
                                size="small"
                                onClick={() => handleShowEditModal(record)}
                            />
                        </Tooltip>
                        <Tooltip title="Xóa">
                            <Button
                                danger
                                icon={<DeleteOutlined />}
                                size="small"
                                onClick={() => {
                                    Modal.confirm({
                                        title: 'Xác nhận xóa',
                                        content: 'Bạn có chắc chắn muốn xóa bài viết này?',
                                        onOk: () => handleDeletePost(record.PostID)
                                    });
                                }}
                            />
                        </Tooltip>
                    </Space>
                )
            }
        ];

        return (
            <div className="space-y-6">
                <Card title="Quản lý Blog" className="shadow-md">
                    <div className="mb-4 flex justify-between items-center">
                        <Title level={4} className="mb-0">Danh sách bài viết</Title>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setCreateModalVisible(true)}
                        >
                            Tạo bài viết mới
                        </Button>
                    </div>

                    <Table
                        columns={columns}
                        dataSource={blogPosts}
                        rowKey="PostID"
                        loading={loading}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) =>
                                `${range[0]}-${range[1]} của ${total} bài viết`
                        }}
                    />
                </Card>

                {/* Create Post Modal */}
                <Modal
                    title="Tạo bài viết mới"
                    open={createModalVisible}
                    onCancel={() => {
                        setCreateModalVisible(false);
                        createForm.resetFields();
                    }}
                    footer={null}
                    width={800}
                >
                    <Form
                        form={createForm}
                        layout="vertical"
                        onFinish={handleCreatePost}
                    >
                        <Form.Item
                            name="title"
                            label="Tiêu đề"
                            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
                        >
                            <Input placeholder="Nhập tiêu đề bài viết" />
                        </Form.Item>

                        <Form.Item
                            name="metaDescription"
                            label="Mô tả ngắn"
                            rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}
                        >
                            <Input.TextArea
                                rows={2}
                                placeholder="Mô tả ngắn cho bài viết (hiển thị trong danh sách)"
                            />
                        </Form.Item>

                        <Form.Item
                            name="thumbnailURL"
                            label="URL hình ảnh"
                        >
                            <Input placeholder="https://example.com/image.jpg hoặc /api/images/blog/image.jpg" />
                        </Form.Item>

                        <Form.Item
                            name="content"
                            label="Nội dung"
                            rules={[{ required: true, message: 'Vui lòng nhập nội dung!' }]}
                        >
                            <Input.TextArea
                                rows={10}
                                placeholder="Nhập nội dung bài viết (hỗ trợ Markdown)"
                            />
                        </Form.Item>

                        <Form.Item>
                            <Space>
                                <Button type="primary" htmlType="submit">
                                    Tạo bài viết
                                </Button>
                                <Button onClick={() => {
                                    setCreateModalVisible(false);
                                    createForm.resetFields();
                                }}>
                                    Hủy
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Modal>

                {/* Edit Post Modal */}
                <Modal
                    title="Chỉnh sửa bài viết"
                    open={editModalVisible}
                    onCancel={() => {
                        setEditModalVisible(false);
                        editForm.resetFields();
                    }}
                    footer={null}
                    width={800}
                >
                    <Form
                        form={editForm}
                        layout="vertical"
                        onFinish={handleUpdatePost}
                    >
                        <Form.Item
                            name="title"
                            label="Tiêu đề"
                            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
                        >
                            <Input placeholder="Nhập tiêu đề bài viết" />
                        </Form.Item>

                        <Form.Item
                            name="metaDescription"
                            label="Mô tả ngắn"
                            rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}
                        >
                            <Input.TextArea
                                rows={2}
                                placeholder="Mô tả ngắn cho bài viết"
                            />
                        </Form.Item>

                        <Form.Item
                            name="thumbnailURL"
                            label="URL hình ảnh"
                        >
                            <Input placeholder="https://example.com/image.jpg hoặc /api/images/blog/image.jpg" />
                        </Form.Item>

                        <Form.Item
                            name="status"
                            label="Trạng thái"
                            rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
                        >
                            <Select>
                                <Select.Option value="published">Đã xuất bản</Select.Option>
                                <Select.Option value="Pending">Chờ duyệt</Select.Option>
                                <Select.Option value="draft">Nháp</Select.Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="content"
                            label="Nội dung"
                            rules={[{ required: true, message: 'Vui lòng nhập nội dung!' }]}
                        >
                            <Input.TextArea
                                rows={10}
                                placeholder="Nhập nội dung bài viết (hỗ trợ Markdown)"
                            />
                        </Form.Item>

                        <Form.Item>
                            <Space>
                                <Button type="primary" htmlType="submit">
                                    Cập nhật
                                </Button>
                                <Button onClick={() => {
                                    setEditModalVisible(false);
                                    editForm.resetFields();
                                }}>
                                    Hủy
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Modal>

                {/* Preview Modal */}
                <Modal
                    title="Xem trước bài viết"
                    open={previewModalVisible}
                    onCancel={() => setPreviewModalVisible(false)}
                    footer={[
                        <Button key="close" onClick={() => setPreviewModalVisible(false)}>
                            Đóng
                        </Button>
                    ]}
                    width={800}
                >
                    {selectedPost && (
                        <div className="space-y-4">
                            <div>
                                <Title level={3}>{selectedPost.Title}</Title>
                                <Text type="secondary">
                                    Tác giả: {selectedPost.AuthorFirstName} {selectedPost.AuthorLastName} |
                                    Ngày: {new Date(selectedPost.CreatedAt).toLocaleDateString('vi-VN')} |
                                    Lượt xem: {selectedPost.Views || 0}
                                </Text>
                            </div>

                            {selectedPost.ThumbnailURL && (
                                <img
                                    src={selectedPost.ThumbnailURL}
                                    alt={selectedPost.Title}
                                    className="w-full max-h-64 object-cover rounded"
                                    onError={(e) => {
                                        e.target.src = '/api/images/default-blog.svg';
                                    }}
                                />
                            )}

                            <div>
                                <Text strong>Mô tả: </Text>
                                <Text>{selectedPost.MetaDescription}</Text>
                            </div>

                            <Divider />

                            <div className="prose max-w-none">
                                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                                    {selectedPost.Content}
                                </pre>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        );
    };

    // Coach Management Component with optimizations
    const CoachManagement = React.memo(() => {
        const [coaches, setCoaches] = useState([]);
        const [members, setMembers] = useState([]);
        const [loading, setLoading] = useState(false);
        const [assignModalVisible, setAssignModalVisible] = useState(false);
        const [selectedCoach, setSelectedCoach] = useState(null);
        const [assignForm] = Form.useForm();
        const { Option } = Select;

        // Add states for coach details modal
        const [coachDetailsVisible, setCoachDetailsVisible] = useState(false);
        const [selectedCoachDetails, setSelectedCoachDetails] = useState(null);
        const [coachDetailsLoading, setCoachDetailsLoading] = useState(false);

        // Add render counter for debugging
        const renderCount = useRef(0);
        renderCount.current += 1;

        // Optimized loadData function with deduplication
        const loadData = useCallback(async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('adminToken');

                console.log(`CoachManagement render #${renderCount.current} - Loading data...`);

                const [coachesResponse, membersResponse] = await Promise.all([
                    axios.get('http://localhost:4000/api/admin/coaches', {
                        headers: { 'Authorization': `Bearer ${token}` },
                        withCredentials: true
                    }),
                    axios.get('http://localhost:4000/api/admin/members', {
                        headers: { 'Authorization': `Bearer ${token}` },
                        withCredentials: true
                    })
                ]);

                if (coachesResponse.data.success) {
                    setCoaches(coachesResponse.data.data);
                }

                if (membersResponse.data.success) {
                    const membersData = membersResponse.data.data;

                    // Log for debugging
                    console.log('Raw members data from API:', membersData);

                    // Deduplicate by UserID to ensure unique members
                    const uniqueMembers = membersData.reduce((acc, member) => {
                        const isDuplicate = acc.some(existing => existing.UserID === member.UserID);
                        if (!isDuplicate) {
                            acc.push(member);
                        } else {
                            console.warn('Duplicate member found and removed:', member);
                        }
                        return acc;
                    }, []);

                    console.log('Unique members after deduplication:', uniqueMembers);
                    setMembers(uniqueMembers);
                }
            } catch (error) {
                console.error('Error loading data:', error);
                message.error('Lỗi khi tải dữ liệu');
            } finally {
                setLoading(false);
            }
        }, []);

        useEffect(() => {
            loadData();
        }, [loadData]);

        // Memoize the members data to prevent unnecessary re-renders
        const memoizedMembers = useMemo(() => {
            console.log('Memoizing members, current count:', members.length);
            // Double-check for unique members by UserID
            const uniqueMembers = members.reduce((acc, member) => {
                const existing = acc.find(m => m.UserID === member.UserID);
                if (!existing) {
                    acc.push(member);
                }
                return acc;
            }, []);
            console.log('Final unique members count:', uniqueMembers.length);
            return uniqueMembers;
        }, [members]);

        // Memoize available members for assignment
        const availableMembers = useMemo(() => {
            return memoizedMembers.filter(member => !member.CoachID);
        }, [memoizedMembers]);

        // Toggle coach active status
        const handleToggleCoachStatus = async (coachId, currentStatus) => {
            try {
                const token = localStorage.getItem('adminToken');
                const response = await axios.patch(`http://localhost:4000/api/admin/coaches/${coachId}/toggle-status`, {}, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    withCredentials: true
                });

                if (response.data.success) {
                    message.success(response.data.message);
                    loadData(); // Reload data
                }
            } catch (error) {
                console.error('Error toggling coach status:', error);
                message.error('Lỗi khi thay đổi trạng thái coach');
            }
        };

        // Show assign member modal
        const handleShowAssignModal = (coach) => {
            setSelectedCoach(coach);
            setAssignModalVisible(true);
            assignForm.resetFields();
        };

        // Assign member to coach
        const handleAssignMember = async (values) => {
            try {
                setLoading(true);
                const token = localStorage.getItem('adminToken');
                const response = await axios.post('http://localhost:4000/api/admin/assign-coach', {
                    memberID: values.memberID,
                    coachID: selectedCoach.UserID,
                    reason: values.reason
                }, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    withCredentials: true
                });

                if (response.data.success) {
                    message.success(response.data.message);
                    setAssignModalVisible(false);
                    assignForm.resetFields();
                    loadData(); // Reload data
                }
            } catch (error) {
                console.error('Error assigning member:', error);
                if (error.response?.data?.message) {
                    message.error(error.response.data.message);
                } else {
                    message.error('Lỗi khi phân công member');
                }
            } finally {
                setLoading(false);
            }
        };

        // Remove coach assignment
        const handleRemoveAssignment = async (memberID) => {
            try {
                const token = localStorage.getItem('adminToken');
                const response = await axios.delete(`http://localhost:4000/api/admin/assign-coach/${memberID}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    withCredentials: true
                });

                if (response.data.success) {
                    message.success(response.data.message);
                    loadData(); // Reload data
                }
            } catch (error) {
                console.error('Error removing assignment:', error);
                message.error('Lỗi khi hủy phân công');
            }
        };

        // Handle view coach details
        const handleViewCoachDetails = async (coach) => {
            try {
                setSelectedCoachDetails(coach);
                setCoachDetailsVisible(true);
                setCoachDetailsLoading(true);

                // Load additional coach details if needed
                const token = localStorage.getItem('adminToken');
                const response = await axios.get(`http://localhost:4000/api/admin/coaches/${coach.UserID}/details`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    withCredentials: true
                });

                if (response.data.success) {
                    setSelectedCoachDetails(response.data.data);
                }
            } catch (error) {
                console.error('Error loading coach details:', error);
                // Still show basic details from the list
            } finally {
                setCoachDetailsLoading(false);
            }
        };

        const coachColumns = [
            {
                title: 'Coach',
                key: 'coach',
                width: 250,
                render: (_, record) => (
                    <div className="flex items-center">
                        <Avatar
                            src={record.Avatar}
                            icon={<UserOutlined />}
                            size="large"
                            className="mr-3"
                        />
                        <div>
                            <div className="font-semibold text-base">
                                {`${record.FirstName} ${record.LastName}`}
                            </div>
                            <div className="text-gray-500 text-sm">{record.Email}</div>
                            {record.Specialization && (
                                <Tag color="blue" className="mt-1">{record.Specialization}</Tag>
                            )}
                        </div>
                    </div>
                )
            },
            {
                title: 'Thống kê',
                key: 'stats',
                width: 200,
                render: (_, record) => (
                    <div className="space-y-1">
                        <div className="flex items-center">
                            <TeamOutlined className="mr-1 text-blue-500" />
                            <span className="text-sm">{record.TotalPlans || 0} kế hoạch</span>
                        </div>
                        <div className="flex items-center">
                            <StarOutlined className="mr-1 text-yellow-500" />
                            <span className="text-sm">
                                {record.AverageRating ? record.AverageRating.toFixed(1) : 'N/A'}
                                ({record.TotalReviews || 0} đánh giá)
                            </span>
                        </div>
                        {record.SuccessRate && (
                            <div className="flex items-center">
                                <TrophyOutlined className="mr-1 text-green-500" />
                                <span className="text-sm">{record.SuccessRate}% thành công</span>
                            </div>
                        )}
                    </div>
                )
            },
            {
                title: 'Trạng thái',
                key: 'status',
                width: 120,
                render: (_, record) => (
                    <div className="space-y-2">
                        <Badge
                            status={record.IsActive ? 'success' : 'error'}
                            text={record.IsActive ? 'Hoạt động' : 'Không hoạt động'}
                        />
                        <div>
                            <Switch
                                checked={record.IsActive}
                                onChange={() => handleToggleCoachStatus(record.UserID, record.IsActive)}
                                size="small"
                            />
                        </div>
                    </div>
                )
            },
            {
                title: 'Thao tác',
                key: 'actions',
                width: 180,
                render: (_, record) => (
                    <Space direction="vertical" size="small">
                        <Button
                            type="primary"
                            icon={<LinkOutlined />}
                            size="small"
                            onClick={() => handleShowAssignModal(record)}
                            disabled={!record.IsActive}
                        >
                            Phân công member
                        </Button>
                        <Button
                            icon={<EyeOutlined />}
                            size="small"
                            onClick={() => handleViewCoachDetails(record)}
                        >
                            Xem chi tiết
                        </Button>
                    </Space>
                )
            }
        ];

        const memberColumns = [
            {
                title: 'Thành viên',
                key: 'member',
                render: (_, record) => (
                    <div className="flex items-center">
                        <Avatar
                            src={record.Avatar}
                            icon={<UserOutlined />}
                            size="default"
                            className="mr-3"
                        />
                        <div>
                            <div className="font-medium">
                                {`${record.FirstName} ${record.LastName}`}
                            </div>
                            <div className="text-gray-500 text-sm">{record.Email}</div>
                        </div>
                    </div>
                )
            },
            {
                title: 'Coach được phân công',
                key: 'assignedCoach',
                render: (_, record) => (
                    record.CoachID ? (
                        <div className="flex items-center justify-between">
                            <Tag color="green">{record.CoachName}</Tag>
                            <Button
                                danger
                                size="small"
                                icon={<DisconnectOutlined />}
                                onClick={() => {
                                    Modal.confirm({
                                        title: 'Xác nhận hủy phân công',
                                        content: 'Bạn có chắc muốn hủy phân công coach này?',
                                        onOk: () => handleRemoveAssignment(record.UserID)
                                    });
                                }}
                            >
                                Hủy
                            </Button>
                        </div>
                    ) : (
                        <Tag color="orange">Chưa có coach</Tag>
                    )
                )
            },
            {
                title: 'Ngày tham gia',
                dataIndex: 'CreatedAt',
                key: 'joinDate',
                render: (date) => new Date(date).toLocaleDateString('vi-VN')
            }
        ];

        return (
            <div className="space-y-6">
                {/* Coaches Management */}
                <Card
                    title={
                        <div className="flex items-center">
                            <UsergroupAddOutlined className="mr-2 text-blue-500" />
                            <span className="text-lg font-semibold">Danh sách Coach</span>
                        </div>
                    }
                    className="shadow-lg"
                >
                    <Table
                        dataSource={coaches}
                        columns={coachColumns}
                        rowKey="UserID"
                        loading={loading}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} coaches`,
                        }}
                        scroll={{ x: 800 }}
                    />
                </Card>

                {/* Members Assignment */}
                <Card
                    title={
                        <div className="flex items-center">
                            <TeamOutlined className="mr-2 text-green-500" />
                            <span className="text-lg font-semibold">Phân công thành viên</span>
                        </div>
                    }
                    className="shadow-lg"
                >
                    <Table
                        dataSource={memoizedMembers}
                        columns={memberColumns}
                        rowKey="UserID"
                        loading={loading}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} members`,
                        }}
                    />
                </Card>

                {/* Assign Member Modal */}
                <Modal
                    title={`Phân công member cho ${selectedCoach?.FirstName} ${selectedCoach?.LastName}`}
                    open={assignModalVisible}
                    onCancel={() => setAssignModalVisible(false)}
                    footer={null}
                    width={500}
                >
                    <Form
                        form={assignForm}
                        layout="vertical"
                        onFinish={handleAssignMember}
                        className="mt-4"
                    >
                        <Form.Item
                            name="memberID"
                            label="Chọn thành viên"
                            rules={[{ required: true, message: 'Vui lòng chọn thành viên!' }]}
                        >
                            <Select
                                placeholder="Chọn thành viên để phân công"
                                showSearch
                                filterOption={(input, option) =>
                                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                }
                            >
                                {availableMembers.map(member => (
                                    <Option key={member.UserID} value={member.UserID}>
                                        {`${member.FirstName} ${member.LastName} (${member.Email})`}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="reason"
                            label="Lý do phân công"
                        >
                            <Input.TextArea
                                placeholder="Nhập lý do phân công (tùy chọn)"
                                rows={3}
                            />
                        </Form.Item>

                        <Form.Item className="mb-0 text-right">
                            <Space>
                                <Button onClick={() => setAssignModalVisible(false)}>
                                    Hủy
                                </Button>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                >
                                    Phân công
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Modal>

                {/* Coach Details Modal */}
                <Modal
                    title={
                        <div className="flex items-center">
                            <UserOutlined className="mr-2 text-blue-500" />
                            <span>Chi tiết Coach: {selectedCoachDetails?.FirstName} {selectedCoachDetails?.LastName}</span>
                        </div>
                    }
                    open={coachDetailsVisible}
                    onCancel={() => {
                        setCoachDetailsVisible(false);
                        setSelectedCoachDetails(null);
                    }}
                    footer={null}
                    width={800}
                    className="coach-details-modal"
                >
                    {selectedCoachDetails && (
                        <div className="space-y-6">
                            {/* Basic Information */}
                            <Card
                                title={
                                    <div className="flex items-center">
                                        <ContactsOutlined className="mr-2" />
                                        <span>Thông tin cơ bản</span>
                                    </div>
                                }
                                size="small"
                            >
                                <Row gutter={[16, 16]}>
                                    <Col span={8}>
                                        <div className="text-center">
                                            <Avatar
                                                size={80}
                                                src={selectedCoachDetails.Avatar}
                                                icon={<UserOutlined />}
                                                className="mb-3"
                                                style={{ border: '3px solid #1890ff' }}
                                            />
                                            <div className="font-semibold text-lg">
                                                {selectedCoachDetails.FirstName} {selectedCoachDetails.LastName}
                                            </div>
                                            <Badge
                                                status={selectedCoachDetails.IsActive ? 'success' : 'error'}
                                                text={selectedCoachDetails.IsActive ? 'Hoạt động' : 'Không hoạt động'}
                                                className="mt-2"
                                            />
                                        </div>
                                    </Col>
                                    <Col span={16}>
                                        <Descriptions column={1} size="small">
                                            <Descriptions.Item
                                                label={<span><MailOutlined className="mr-1" />Email</span>}
                                            >
                                                {selectedCoachDetails.Email}
                                            </Descriptions.Item>
                                            <Descriptions.Item
                                                label={<span><PhoneOutlined className="mr-1" />Số điện thoại</span>}
                                            >
                                                {selectedCoachDetails.PhoneNumber || 'Chưa cập nhật'}
                                            </Descriptions.Item>
                                            <Descriptions.Item
                                                label={<span><EnvironmentOutlined className="mr-1" />Địa chỉ</span>}
                                            >
                                                {selectedCoachDetails.Address || 'Chưa cập nhật'}
                                            </Descriptions.Item>
                                            <Descriptions.Item
                                                label={<span><CalendarOutlined className="mr-1" />Ngày tham gia</span>}
                                            >
                                                {new Date(selectedCoachDetails.CreatedAt).toLocaleDateString('vi-VN')}
                                            </Descriptions.Item>
                                        </Descriptions>
                                    </Col>
                                </Row>
                            </Card>

                            {/* Professional Information */}
                            <Card
                                title={
                                    <div className="flex items-center">
                                        <BookOutlined className="mr-2" />
                                        <span>Thông tin chuyên môn</span>
                                    </div>
                                }
                                size="small"
                            >
                                <Row gutter={[16, 16]}>
                                    <Col span={12}>
                                        <Descriptions column={1} size="small">
                                            <Descriptions.Item label="Chuyên môn">
                                                {selectedCoachDetails.Specialization || 'Chưa cập nhật'}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Kinh nghiệm">
                                                {selectedCoachDetails.Experience || 'Chưa cập nhật'}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Số năm kinh nghiệm">
                                                {selectedCoachDetails.YearsOfExperience || 'Chưa cập nhật'} năm
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Học vấn">
                                                {selectedCoachDetails.Education || 'Chưa cập nhật'}
                                            </Descriptions.Item>
                                        </Descriptions>
                                    </Col>
                                    <Col span={12}>
                                        <Descriptions column={1} size="small">
                                            <Descriptions.Item label="Chứng chỉ">
                                                {selectedCoachDetails.Certifications || 'Chưa cập nhật'}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Ngôn ngữ">
                                                {selectedCoachDetails.Languages || 'Chưa cập nhật'}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Giờ làm việc">
                                                {selectedCoachDetails.WorkingHours || 'Chưa cập nhật'}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Tỷ lệ thành công">
                                                {selectedCoachDetails.SuccessRate ? `${selectedCoachDetails.SuccessRate}%` : 'Chưa có dữ liệu'}
                                            </Descriptions.Item>
                                        </Descriptions>
                                    </Col>
                                </Row>

                                {/* Bio */}
                                {selectedCoachDetails.Bio && (
                                    <div className="mt-4">
                                        <div className="font-semibold text-gray-700 mb-2">Giới thiệu:</div>
                                        <div className="text-gray-600 p-3 bg-gray-50 rounded">
                                            {selectedCoachDetails.Bio}
                                        </div>
                                    </div>
                                )}
                            </Card>

                            {/* Recent Feedback */}
                            {selectedCoachDetails.recentFeedback && selectedCoachDetails.recentFeedback.length > 0 && (
                                <Card
                                    title={
                                        <div className="flex items-center">
                                            <StarOutlined className="mr-2" />
                                            <span>Đánh giá gần đây</span>
                                        </div>
                                    }
                                    size="small"
                                >
                                    <div className="space-y-3">
                                        {selectedCoachDetails.recentFeedback.map((feedback, index) => (
                                            <div key={index} className="border-l-4 border-blue-200 pl-4 py-2">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center">
                                                        <Avatar
                                                            size="small"
                                                            src={feedback.MemberAvatar}
                                                            icon={<UserOutlined />}
                                                            className="mr-2"
                                                        />
                                                        <span className="font-medium">
                                                            {feedback.IsAnonymous
                                                                ? 'Ẩn danh'
                                                                : `${feedback.MemberFirstName} ${feedback.MemberLastName}`
                                                            }
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Rate value={feedback.Rating} disabled size="small" className="mr-2" />
                                                        <span className="text-sm text-gray-500">
                                                            {new Date(feedback.CreatedAt).toLocaleDateString('vi-VN')}
                                                        </span>
                                                    </div>
                                                </div>
                                                {feedback.Comment && (
                                                    <div className="text-gray-600 text-sm italic">
                                                        "{feedback.Comment}"
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}

                            {/* Assigned Members */}
                            {selectedCoachDetails.assignedMembers && selectedCoachDetails.assignedMembers.length > 0 && (
                                <Card
                                    title={
                                        <div className="flex items-center">
                                            <TeamOutlined className="mr-2" />
                                            <span>Thành viên được phân công ({selectedCoachDetails.assignedMembers.length})</span>
                                        </div>
                                    }
                                    size="small"
                                >
                                    <div className="grid grid-cols-2 gap-3">
                                        {selectedCoachDetails.assignedMembers.map((member, index) => (
                                            <div key={index} className="flex items-center p-3 bg-gray-50 rounded">
                                                <Avatar
                                                    src={member.Avatar}
                                                    icon={<UserOutlined />}
                                                    size="default"
                                                    className="mr-3"
                                                />
                                                <div className="flex-1">
                                                    <div className="font-medium">
                                                        {member.FirstName} {member.LastName}
                                                    </div>
                                                    <div className="text-sm text-gray-500">{member.Email}</div>
                                                    <div className="flex items-center mt-1">
                                                        <Tag
                                                            color={member.PlanStatus === 'active' ? 'green' : 'orange'}
                                                            size="small"
                                                        >
                                                            {member.PlanStatus}
                                                        </Tag>
                                                        <span className="text-xs text-gray-400 ml-2">
                                                            Từ {new Date(member.AssignedAt).toLocaleDateString('vi-VN')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}

                            {/* Statistics */}
                            <Card
                                title={
                                    <div className="flex items-center">
                                        <BarChartOutlined className="mr-2" />
                                        <span>Thống kê hoạt động</span>
                                    </div>
                                }
                                size="small"
                            >
                                <Row gutter={[16, 16]} className="text-center">
                                    <Col span={6}>
                                        <Statistic
                                            title="Tổng kế hoạch"
                                            value={selectedCoachDetails.TotalPlans || 0}
                                            prefix={<TeamOutlined />}
                                            valueStyle={{ color: '#1890ff' }}
                                        />
                                    </Col>
                                    <Col span={6}>
                                        <Statistic
                                            title="Tổng khách hàng"
                                            value={selectedCoachDetails.TotalClients || 0}
                                            prefix={<UserOutlined />}
                                            valueStyle={{ color: '#52c41a' }}
                                        />
                                    </Col>
                                    <Col span={6}>
                                        <Statistic
                                            title="Đánh giá trung bình"
                                            value={selectedCoachDetails.AverageRating ? selectedCoachDetails.AverageRating.toFixed(1) : '0.0'}
                                            suffix="/ 5.0"
                                            prefix={<StarOutlined />}
                                            valueStyle={{ color: '#faad14' }}
                                        />
                                    </Col>
                                    <Col span={6}>
                                        <Statistic
                                            title="Tổng đánh giá"
                                            value={selectedCoachDetails.TotalReviews || 0}
                                            prefix={<MessageOutlined />}
                                            valueStyle={{ color: '#722ed1' }}
                                        />
                                    </Col>
                                </Row>

                                {/* Additional detailed statistics */}
                                <Row gutter={[16, 16]} className="text-center mt-4">
                                    <Col span={6}>
                                        <Statistic
                                            title="Kế hoạch đang hoạt động"
                                            value={selectedCoachDetails.ActivePlans || 0}
                                            prefix={<CheckCircleOutlined />}
                                            valueStyle={{ color: '#52c41a' }}
                                        />
                                    </Col>
                                    <Col span={6}>
                                        <Statistic
                                            title="Kế hoạch hoàn thành"
                                            value={selectedCoachDetails.CompletedPlans || 0}
                                            prefix={<TrophyOutlined />}
                                            valueStyle={{ color: '#fa8c16' }}
                                        />
                                    </Col>
                                    <Col span={6}>
                                        <Statistic
                                            title="Tổng cuộc hẹn"
                                            value={selectedCoachDetails.TotalAppointments || 0}
                                            prefix={<CalendarOutlined />}
                                            valueStyle={{ color: '#1890ff' }}
                                        />
                                    </Col>
                                    <Col span={6}>
                                        <Statistic
                                            title="Cuộc hẹn hoàn thành"
                                            value={selectedCoachDetails.CompletedAppointments || 0}
                                            prefix={<ClockCircleOutlined />}
                                            valueStyle={{ color: '#52c41a' }}
                                        />
                                    </Col>
                                </Row>

                                {/* Additional Info */}
                                <Row gutter={[16, 16]} className="mt-4">
                                    <Col span={12}>
                                        <div className="text-center p-3 bg-blue-50 rounded">
                                            <div className="text-lg font-semibold text-blue-600">
                                                {selectedCoachDetails.HourlyRate ? `${selectedCoachDetails.HourlyRate.toLocaleString()} VNĐ` : 'Chưa đặt giá'}
                                            </div>
                                            <div className="text-sm text-gray-600">Giá tư vấn/giờ</div>
                                        </div>
                                    </Col>
                                    <Col span={12}>
                                        <div className="text-center p-3 bg-green-50 rounded">
                                            <div className="text-lg font-semibold text-green-600">
                                                {selectedCoachDetails.IsAvailable ? 'Có sẵn' : 'Bận'}
                                            </div>
                                            <div className="text-sm text-gray-600">Trạng thái tư vấn</div>
                                        </div>
                                    </Col>
                                </Row>
                            </Card>
                        </div>
                    )}

                    {coachDetailsLoading && (
                        <div className="text-center py-12">
                            <Spin size="large" />
                            <div className="mt-2 text-gray-600">Đang tải thông tin chi tiết...</div>
                        </div>
                    )}
                </Modal>
            </div>
        );
    });

    // Plans Management Component
    const PlansManagement = () => {
        const [plans, setPlans] = useState([]);
        const [loading, setLoading] = useState(false);
        const [modalVisible, setModalVisible] = useState(false);
        const [editingPlan, setEditingPlan] = useState(null);
        const [form] = Form.useForm();

        // Load plans from API
        const loadPlans = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('adminToken');
                const response = await axios.get('http://localhost:4000/api/admin/plans', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    withCredentials: true
                });

                if (response.data.success) {
                    setPlans(response.data.data);
                }
            } catch (error) {
                console.error('Error loading plans:', error);
                message.error('Lỗi khi tải danh sách plans');
            } finally {
                setLoading(false);
            }
        };

        // Load plans on component mount
        useEffect(() => {
            loadPlans();
        }, []);

        const handleCreatePlan = () => {
            setEditingPlan(null);
            form.resetFields();
            setModalVisible(true);
        };

        const handleEditPlan = (plan) => {
            setEditingPlan(plan);
            form.setFieldsValue(plan);
            setModalVisible(true);
        };

        const handleDeletePlan = (planId) => {
            Modal.confirm({
                title: 'Xác nhận xóa',
                content: 'Bạn có chắc chắn muốn xóa plan này không?',
                okText: 'Xóa',
                cancelText: 'Hủy',
                okType: 'danger',
                onOk: async () => {
                    try {
                        const token = localStorage.getItem('adminToken');
                        const response = await axios.delete(`http://localhost:4000/api/admin/plans/${planId}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            },
                            withCredentials: true
                        });

                        if (response.data.success) {
                            message.success('Xóa plan thành công');
                            loadPlans(); // Reload plans after deletion
                        }
                    } catch (error) {
                        console.error('Error deleting plan:', error);
                        if (error.response?.data?.message) {
                            message.error(error.response.data.message);
                        } else {
                            message.error('Lỗi khi xóa plan');
                        }
                    }
                }
            });
        };

        const handleSubmit = async (values) => {
            try {
                setLoading(true);
                const token = localStorage.getItem('adminToken');
                let response;

                if (editingPlan) {
                    // Update existing plan
                    response = await axios.put(`http://localhost:4000/api/admin/plans/${editingPlan.PlanID}`, values, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        withCredentials: true
                    });
                } else {
                    // Create new plan
                    response = await axios.post('http://localhost:4000/api/admin/plans', values, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        withCredentials: true
                    });
                }

                if (response.data.success) {
                    message.success(response.data.message);
                    setModalVisible(false);
                    form.resetFields();
                    loadPlans(); // Reload plans after create/update
                }
            } catch (error) {
                console.error('Error saving plan:', error);
                if (error.response?.data?.message) {
                    message.error(error.response.data.message);
                } else {
                    message.error('Lỗi khi lưu plan');
                }
            } finally {
                setLoading(false);
            }
        };

        const columns = [
            {
                title: 'Tên gói',
                dataIndex: 'Name',
                key: 'Name',
                width: 200,
            },
            {
                title: 'Mô tả',
                dataIndex: 'Description',
                key: 'Description',
                ellipsis: true,
                width: 300,
            },
            {
                title: 'Giá',
                dataIndex: 'Price',
                key: 'Price',
                width: 150,
                render: (price) => `${price?.toLocaleString()} VNĐ`
            },
            {
                title: 'Thời hạn',
                dataIndex: 'Duration',
                key: 'Duration',
                width: 120,
                render: (duration) => (
                    <Tag color="blue">{duration} ngày</Tag>
                )
            },
            {
                title: 'Ngày tạo',
                dataIndex: 'CreatedAt',
                key: 'CreatedAt',
                width: 150,
                render: (date) => new Date(date).toLocaleDateString('vi-VN')
            },
            {
                title: 'Thao tác',
                key: 'action',
                width: 150,
                render: (_, record) => (
                    <Space size="middle">
                        <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={() => handleEditPlan(record)}
                        >
                            Sửa
                        </Button>
                        <Button
                            type="link"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeletePlan(record.PlanID)}
                        >
                            Xóa
                        </Button>
                    </Space>
                )
            }
        ];

        return (
            <div>
                <Card
                    title={
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <CrownOutlined className="mr-2 text-yellow-500" />
                                <span className="text-lg font-semibold">Quản lý Plans</span>
                            </div>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={handleCreatePlan}
                                className="bg-green-500 border-green-500 hover:bg-green-600"
                                size="large"
                            >
                                Tạo Plan mới
                            </Button>
                        </div>
                    }
                    className="shadow-lg"
                >
                    <Table
                        dataSource={plans}
                        columns={columns}
                        rowKey="PlanID"
                        loading={loading}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total) => `Tổng ${total} plans`,
                        }}
                        scroll={{ x: 800 }}
                    />
                </Card>

                {/* Modal for Create/Edit Plan */}
                <Modal
                    title={editingPlan ? 'Chỉnh sửa Plan' : 'Tạo Plan mới'}
                    open={modalVisible}
                    onCancel={() => setModalVisible(false)}
                    footer={null}
                    width={600}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                        className="mt-4"
                    >
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="Name"
                                    label="Tên gói"
                                    rules={[{ required: true, message: 'Vui lòng nhập tên gói!' }]}
                                >
                                    <Input placeholder="Nhập tên gói" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="Price"
                                    label="Giá (VNĐ)"
                                    rules={[{ required: true, message: 'Vui lòng nhập giá!' }]}
                                >
                                    <InputNumber
                                        placeholder="Nhập giá"
                                        style={{ width: '100%' }}
                                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={value => value.replace(/VNĐ\s?|(,*)/g, '')}
                                        min={0}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="Duration"
                                    label="Thời hạn (ngày)"
                                    rules={[{ required: true, message: 'Vui lòng nhập thời hạn!' }]}
                                >
                                    <InputNumber
                                        placeholder="Nhập số ngày"
                                        style={{ width: '100%' }}
                                        min={1}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                {/* Placeholder column for balance */}
                            </Col>
                        </Row>

                        <Form.Item
                            name="Description"
                            label="Mô tả"
                            rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}
                        >
                            <Input.TextArea
                                rows={3}
                                placeholder="Nhập mô tả gói"
                            />
                        </Form.Item>

                        <Form.Item
                            name="Features"
                            label="Tính năng"
                            rules={[{ required: true, message: 'Vui lòng nhập tính năng!' }]}
                        >
                            <Input.TextArea
                                rows={4}
                                placeholder="Nhập các tính năng (ngăn cách bằng dấu phẩy)"
                            />
                        </Form.Item>

                        <Form.Item className="mb-0 text-right">
                            <Space>
                                <Button onClick={() => setModalVisible(false)}>
                                    Hủy
                                </Button>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                >
                                    {editingPlan ? 'Cập nhật' : 'Tạo mới'}
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        );
    };

    // Payments Management Component with optimizations
    const PaymentsManagement = React.memo(() => {
        const [pendingPayments, setPendingPayments] = useState([]);
        const [confirmationHistory, setConfirmationHistory] = useState([]);
        const [loading, setLoading] = useState(false);
        const [selectedPayment, setSelectedPayment] = useState(null);
        const [modalVisible, setModalVisible] = useState(false);
        const [confirmLoading, setConfirmLoading] = useState(false);
        const [rejectModalVisible, setRejectModalVisible] = useState(false);
        const [rejectReason, setRejectReason] = useState('');
        const [activeTab, setActiveTab] = useState('pending');

        // Add render counter for debugging
        const renderCount = useRef(0);
        renderCount.current += 1;

        useEffect(() => {
            loadPendingPayments();
            loadConfirmationHistory();
        }, []);

        const loadPendingPayments = useCallback(async () => {
            setLoading(true);
            try {
                console.log(`PaymentsManagement render #${renderCount.current} - Loading pending payments...`);

                const token = localStorage.getItem('adminToken');
                const response = await axios.get('http://localhost:4000/api/admin/pending-payments', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    withCredentials: true
                });

                if (response.data.success) {
                    const paymentsData = response.data.data;

                    // Log for debugging
                    console.log('Raw pending payments data from API:', paymentsData);

                    // Deduplicate by PaymentID to ensure unique payments
                    const uniquePayments = paymentsData.reduce((acc, payment) => {
                        const isDuplicate = acc.some(existing => existing.PaymentID === payment.PaymentID);
                        if (!isDuplicate) {
                            acc.push(payment);
                        } else {
                            console.warn('Duplicate pending payment found and removed:', payment);
                        }
                        return acc;
                    }, []);

                    console.log('Unique pending payments after deduplication:', uniquePayments);
                    setPendingPayments(uniquePayments);
                }
            } catch (error) {
                console.error('Error loading pending payments:', error);
                message.error('Lỗi khi tải danh sách thanh toán chờ xác nhận');
            } finally {
                setLoading(false);
            }
        }, []);

        const loadConfirmationHistory = useCallback(async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const response = await axios.get('http://localhost:4000/api/admin/payment-confirmations', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    withCredentials: true
                });

                if (response.data.success) {
                    const historyData = response.data.data;

                    // Deduplicate confirmation history as well
                    const uniqueHistory = historyData.reduce((acc, payment) => {
                        const isDuplicate = acc.some(existing => existing.PaymentID === payment.PaymentID);
                        if (!isDuplicate) {
                            acc.push(payment);
                        } else {
                            console.warn('Duplicate payment confirmation found and removed:', payment);
                        }
                        return acc;
                    }, []);

                    setConfirmationHistory(uniqueHistory);
                }
            } catch (error) {
                console.error('Error loading confirmation history:', error);
            }
        }, []);

        // Memoize the payments data to prevent unnecessary re-renders
        const memoizedPendingPayments = useMemo(() => {
            console.log('Memoizing pending payments, current count:', pendingPayments.length);
            // Double-check for unique payments by PaymentID
            const uniquePayments = pendingPayments.reduce((acc, payment) => {
                const existing = acc.find(p => p.PaymentID === payment.PaymentID);
                if (!existing) {
                    acc.push(payment);
                }
                return acc;
            }, []);
            console.log('Final unique pending payments count:', uniquePayments.length);
            return uniquePayments;
        }, [pendingPayments]);

        const memoizedConfirmationHistory = useMemo(() => {
            console.log('Memoizing confirmation history, current count:', confirmationHistory.length);
            // Double-check for unique history by PaymentID
            const uniqueHistory = confirmationHistory.reduce((acc, payment) => {
                const existing = acc.find(p => p.PaymentID === payment.PaymentID);
                if (!existing) {
                    acc.push(payment);
                }
                return acc;
            }, []);
            console.log('Final unique confirmation history count:', uniqueHistory.length);
            return uniqueHistory;
        }, [confirmationHistory]);

        const handleConfirmPayment = async (paymentId, notes = '') => {
            setConfirmLoading(true);
            try {
                const token = localStorage.getItem('adminToken');
                const response = await axios.post(
                    `http://localhost:4000/api/admin/confirm-payment/${paymentId}`,
                    { notes },
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        withCredentials: true
                    }
                );

                if (response.data.success) {
                    message.success('Xác nhận thanh toán thành công');
                    loadPendingPayments();
                    loadConfirmationHistory();
                    setModalVisible(false);
                    setSelectedPayment(null);
                }
            } catch (error) {
                console.error('Error confirming payment:', error);
                message.error('Lỗi khi xác nhận thanh toán');
            } finally {
                setConfirmLoading(false);
            }
        };

        const handleRejectPayment = async (paymentId, reason) => {
            setConfirmLoading(true);
            try {
                const token = localStorage.getItem('adminToken');
                const response = await axios.post(
                    `http://localhost:4000/api/admin/reject-payment/${paymentId}`,
                    { notes: reason },
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        withCredentials: true
                    }
                );

                if (response.data.success) {
                    message.success('Đã từ chối thanh toán');
                    loadPendingPayments();
                    setRejectModalVisible(false);
                    setSelectedPayment(null);
                    setRejectReason('');
                }
            } catch (error) {
                console.error('Error rejecting payment:', error);
                message.error('Lỗi khi từ chối thanh toán');
            } finally {
                setConfirmLoading(false);
            }
        };

        const handleConfirmCancellation = async (cancellationId) => {
            setConfirmLoading(true);
            try {
                const token = localStorage.getItem('adminToken');
                const response = await axios.post(
                    `http://localhost:4000/api/admin/confirm-cancellation/${cancellationId}`,
                    {},
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        withCredentials: true
                    }
                );

                if (response.data.success) {
                    message.success('Đã xác nhận hủy gói thành công');
                    loadPendingPayments();
                    loadConfirmationHistory();
                }
            } catch (error) {
                console.error('Error confirming cancellation:', error);
                message.error('Lỗi khi xác nhận hủy gói');
            } finally {
                setConfirmLoading(false);
            }
        };

        const pendingPaymentsColumns = [
            {
                title: 'Khách hàng',
                key: 'customer',
                render: (record) => (
                    <div>
                        <div className="font-medium">{`${record.FirstName} ${record.LastName}`}</div>
                        <div className="text-sm text-gray-500">{record.Email}</div>
                        {record.PhoneNumber && (
                            <div className="text-sm text-gray-500">{record.PhoneNumber}</div>
                        )}
                    </div>
                ),
            },
            {
                title: 'Gói dịch vụ',
                key: 'plan',
                render: (record) => (
                    <div>
                        <div className="font-medium">{record.PlanName}</div>
                        <div className="text-sm text-gray-500">{record.PlanDescription}</div>
                        <div className="text-sm text-blue-600">{record.Duration} ngày</div>
                    </div>
                ),
            },
            {
                title: 'Thông tin thanh toán',
                key: 'payment',
                render: (record) => (
                    <div>
                        <div className="font-medium text-green-600">
                            {new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND'
                            }).format(record.Amount)}
                        </div>
                        <div className="text-sm text-gray-500">
                            Phương thức: {record.PaymentMethod}
                        </div>
                        <div className="text-sm text-gray-500">
                            Mã GD: {record.TransactionID}
                        </div>
                    </div>
                ),
            },
            {
                title: 'Trạng thái gói',
                key: 'membershipStatus',
                render: (record) => {
                    const membershipStatus = record.MembershipStatus;
                    let color = 'default';
                    let text = 'Chưa xác định';

                    if (membershipStatus) {
                        switch (membershipStatus.toLowerCase()) {
                            case 'active':
                                color = 'green';
                                text = 'ĐANG HOẠT ĐỘNG';
                                break;
                            case 'expired':
                                color = 'red';
                                text = 'HẾT HẠN';
                                break;
                            case 'cancelled':
                                color = 'volcano';
                                text = 'ĐÃ HỦY';
                                break;
                            case 'pending':
                                color = 'gold';
                                text = 'CHỜ KÍCH HOẠT';
                                break;
                            case 'pending_cancellation':
                                color = 'orange';
                                text = 'CHỜ XÁC NHẬN HỦY';
                                break;
                            default:
                                color = 'default';
                                text = membershipStatus.toUpperCase();
                        }
                    }

                    return (
                        <Tag color={color}>
                            {text}
                        </Tag>
                    );
                },
            },
            {
                title: 'Ngày tạo',
                dataIndex: 'PaymentDate',
                key: 'date',
                render: (date) => new Date(date).toLocaleString('vi-VN'),
            },
            {
                title: 'Trạng thái thanh toán',
                dataIndex: 'Status',
                key: 'status',
                render: (status) => (
                    <Tag color="orange">
                        <ClockCircleOutlined /> CHỜ XÁC NHẬN
                    </Tag>
                ),
            },
            {
                title: 'Thao tác',
                key: 'actions',
                render: (record) => (
                    <Space size="small">
                        <Button
                            type="primary"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => {
                                setSelectedPayment(record);
                                setModalVisible(true);
                            }}
                        >
                            Xem chi tiết
                        </Button>

                        {record.RequestType === 'payment' ? (
                            // For payment requests
                            <>
                                <Popconfirm
                                    title="Xác nhận thanh toán này?"
                                    description="Bạn có chắc chắn muốn xác nhận thanh toán này?"
                                    onConfirm={() => handleConfirmPayment(record.PaymentID)}
                                    okText="Xác nhận"
                                    cancelText="Hủy"
                                >
                                    <Button
                                        type="primary"
                                        size="small"
                                        icon={<CheckCircleOutlined />}
                                    >
                                        Xác nhận thanh toán
                                    </Button>
                                </Popconfirm>
                                <Button
                                    danger
                                    size="small"
                                    icon={<CloseCircleOutlined />}
                                    onClick={() => {
                                        setSelectedPayment(record);
                                        setRejectModalVisible(true);
                                    }}
                                >
                                    Từ chối
                                </Button>
                            </>
                        ) : null}
                    </Space>
                ),
            },
        ];

        const historyColumns = [
            {
                title: 'Khách hàng',
                dataIndex: 'CustomerName',
                key: 'customer',
                render: (name, record) => (
                    <div>
                        <div className="font-medium">{name}</div>
                        <div className="text-sm text-gray-500">{record.CustomerEmail}</div>
                    </div>
                ),
            },
            {
                title: 'Gói dịch vụ',
                dataIndex: 'PlanName',
                key: 'plan',
            },
            {
                title: 'Số tiền',
                dataIndex: 'Amount',
                key: 'amount',
                render: (amount) => (
                    <span className="font-medium text-green-600">
                        {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                        }).format(amount)}
                    </span>
                ),
            },
            {
                title: 'Trạng thái gói',
                key: 'membershipStatus',
                render: (record) => {
                    const membershipStatus = record.MembershipStatus;
                    let color = 'default';
                    let text = 'Chưa xác định';

                    if (membershipStatus) {
                        switch (membershipStatus.toLowerCase()) {
                            case 'active':
                                color = 'green';
                                text = 'ĐANG HOẠT ĐỘNG';
                                break;
                            case 'expired':
                                color = 'red';
                                text = 'HẾT HẠN';
                                break;
                            case 'cancelled':
                                color = 'volcano';
                                text = 'ĐÃ HỦY';
                                break;
                            case 'pending':
                                color = 'gold';
                                text = 'CHỜ KÍCH HOẠT';
                                break;
                            case 'pending_cancellation':
                                color = 'orange';
                                text = 'CHỜ XÁC NHẬN HỦY';
                                break;
                            default:
                                color = 'default';
                                text = membershipStatus.toUpperCase();
                        }
                    }

                    return (
                        <Tag color={color}>
                            {text}
                        </Tag>
                    );
                },
            },
            {
                title: 'Admin xác nhận',
                dataIndex: 'AdminName',
                key: 'admin',
            },
            {
                title: 'Ngày xác nhận',
                dataIndex: 'ConfirmationDate',
                key: 'confirmationDate',
                render: (date) => new Date(date).toLocaleString('vi-VN'),
            },
            {
                title: 'Mã xác nhận',
                dataIndex: 'ConfirmationCode',
                key: 'confirmationCode',
            },
        ];

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <Title level={2} className="mb-2">
                        <CreditCardOutlined className="mr-2" />
                        Quản lý Thanh toán
                    </Title>
                    <Button
                        icon={<BarChartOutlined />}
                        onClick={() => {
                            loadPendingPayments();
                            loadConfirmationHistory();
                        }}
                    >
                        Làm mới
                    </Button>
                </div>

                <Card>
                    <div className="mb-4">
                        <Button.Group>
                            <Button
                                type={activeTab === 'pending' ? 'primary' : 'default'}
                                onClick={() => setActiveTab('pending')}
                            >
                                <ClockCircleOutlined />
                                Chờ xác nhận ({memoizedPendingPayments.length})
                            </Button>
                            <Button
                                type={activeTab === 'history' ? 'primary' : 'default'}
                                onClick={() => setActiveTab('history')}
                            >
                                <CheckCircleOutlined />
                                Lịch sử xác nhận ({memoizedConfirmationHistory.length})
                            </Button>
                        </Button.Group>
                    </div>

                    {activeTab === 'pending' ? (
                        <Table
                            columns={pendingPaymentsColumns}
                            dataSource={memoizedPendingPayments}
                            rowKey="PaymentID"
                            loading={loading}
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                showTotal: (total) => `Tổng ${total} thanh toán`,
                            }}
                        />
                    ) : (
                        <Table
                            columns={historyColumns}
                            dataSource={memoizedConfirmationHistory}
                            rowKey="PaymentID"
                            loading={loading}
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                showTotal: (total) => `Tổng ${total} xác nhận`,
                            }}
                        />
                    )}
                </Card>

                {/* Payment Detail Modal */}
                <Modal
                    title="Chi tiết thanh toán"
                    open={modalVisible}
                    onCancel={() => {
                        setModalVisible(false);
                        setSelectedPayment(null);
                    }}
                    footer={selectedPayment ? [
                        <Button key="cancel" onClick={() => setModalVisible(false)}>
                            Đóng
                        </Button>,
                        ...(selectedPayment.RequestType === 'payment' ? [
                            // For payment requests
                            <Button
                                key="reject"
                                danger
                                onClick={() => {
                                    setModalVisible(false);
                                    setRejectModalVisible(true);
                                }}
                            >
                                Từ chối thanh toán
                            </Button>,
                            <Button
                                key="confirm"
                                type="primary"
                                loading={confirmLoading}
                                onClick={() => handleConfirmPayment(selectedPayment?.PaymentID)}
                            >
                                Xác nhận thanh toán
                            </Button>
                        ] : [
                            // For cancellation requests
                            <Button
                                key="reject"
                                danger
                                onClick={() => {
                                    setModalVisible(false);
                                    setRejectModalVisible(true);
                                }}
                            >
                                Từ chối hủy gói
                            </Button>,
                            <Button
                                key="confirm"
                                type="primary"
                                loading={confirmLoading}
                                onClick={() => handleConfirmCancellation(selectedPayment?.PaymentID)}
                                style={{ backgroundColor: '#52c41a' }}
                            >
                                Xác nhận hủy gói
                            </Button>
                        ])
                    ] : []}
                    width={800}
                >
                    {selectedPayment && (
                        <div className="space-y-4">
                            <Descriptions title="Thông tin khách hàng" bordered>
                                <Descriptions.Item label="Họ tên" span={2}>
                                    {`${selectedPayment.FirstName} ${selectedPayment.LastName}`}
                                </Descriptions.Item>
                                <Descriptions.Item label="Email" span={1}>
                                    {selectedPayment.Email}
                                </Descriptions.Item>
                                <Descriptions.Item label="Số điện thoại" span={3}>
                                    {selectedPayment.PhoneNumber || 'Chưa cập nhật'}
                                </Descriptions.Item>
                            </Descriptions>

                            <Descriptions title="Thông tin gói dịch vụ" bordered>
                                <Descriptions.Item label="Tên gói" span={2}>
                                    {selectedPayment.PlanName}
                                </Descriptions.Item>
                                <Descriptions.Item label="Thời hạn" span={1}>
                                    {selectedPayment.Duration} ngày
                                </Descriptions.Item>
                                <Descriptions.Item label="Mô tả" span={3}>
                                    {selectedPayment.PlanDescription}
                                </Descriptions.Item>
                                <Descriptions.Item label="Trạng thái gói" span={3}>
                                    {(() => {
                                        const membershipStatus = selectedPayment.MembershipStatus;
                                        let color = 'default';
                                        let text = 'Chưa xác định';

                                        if (membershipStatus) {
                                            switch (membershipStatus.toLowerCase()) {
                                                case 'active':
                                                    color = 'green';
                                                    text = 'ĐANG HOẠT ĐỘNG';
                                                    break;
                                                case 'expired':
                                                    color = 'red';
                                                    text = 'HẾT HẠN';
                                                    break;
                                                case 'cancelled':
                                                    color = 'volcano';
                                                    text = 'ĐÃ HỦY';
                                                    break;
                                                case 'pending':
                                                    color = 'gold';
                                                    text = 'CHỜ KÍCH HOẠT';
                                                    break;
                                                case 'pending_cancellation':
                                                    color = 'orange';
                                                    text = 'CHỜ XÁC NHẬN HỦY';
                                                    break;
                                                default:
                                                    color = 'default';
                                                    text = membershipStatus.toUpperCase();
                                            }
                                        }

                                        return (
                                            <Tag color={color}>
                                                {text}
                                            </Tag>
                                        );
                                    })()}
                                </Descriptions.Item>
                            </Descriptions>

                            <Descriptions title="Thông tin thanh toán" bordered>
                                <Descriptions.Item label="Số tiền" span={1}>
                                    <span className="font-medium text-green-600">
                                        {new Intl.NumberFormat('vi-VN', {
                                            style: 'currency',
                                            currency: 'VND'
                                        }).format(selectedPayment.Amount)}
                                    </span>
                                </Descriptions.Item>
                                <Descriptions.Item label="Phương thức" span={1}>
                                    {selectedPayment.PaymentMethod}
                                </Descriptions.Item>
                                <Descriptions.Item label="Mã giao dịch" span={1}>
                                    {selectedPayment.TransactionID}
                                </Descriptions.Item>
                                <Descriptions.Item label="Ngày tạo" span={1}>
                                    {new Date(selectedPayment.PaymentDate).toLocaleString('vi-VN')}
                                </Descriptions.Item>
                                <Descriptions.Item label="Trạng thái" span={2}>
                                    <Tag color="orange">
                                        <ClockCircleOutlined /> CHỜ XÁC NHẬN
                                    </Tag>
                                </Descriptions.Item>
                            </Descriptions>

                            {/* Bank Account Information for Cancellation Requests */}
                            {/* {selectedPayment.RequestType === 'cancellation' && (
                                <Descriptions title="Thông tin hoàn tiền" bordered>
                                    <Descriptions.Item label="Lý do hủy" span={3}>
                                        {selectedPayment.CancellationReason || 'Không có lý do cụ thể'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Số tài khoản" span={1}>
                                        <Text copyable>{selectedPayment.BankAccountNumber}</Text>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Tên ngân hàng" span={1}>
                                        {selectedPayment.BankName}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Chủ tài khoản" span={1}>
                                        {selectedPayment.AccountHolderName}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Số tiền hoàn" span={1}>
                                        <span className="font-medium text-red-600">
                                            {new Intl.NumberFormat('vi-VN', {
                                                style: 'currency',
                                                currency: 'VND'
                                            }).format(selectedPayment.RequestedRefundAmount || selectedPayment.Amount)}
                                        </span>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Loại yêu cầu" span={2}>
                                        <Tag color="red">YÊU CẦU HỦY GÓI VÀ HOÀN TIỀN</Tag>
                                    </Descriptions.Item>
                                </Descriptions>
                            )} */}
                        </div>
                    )}
                </Modal>

                {/* Reject Modal */}
                <Modal
                    title="Từ chối thanh toán"
                    open={rejectModalVisible}
                    onCancel={() => {
                        setRejectModalVisible(false);
                        setSelectedPayment(null);
                        setRejectReason('');
                    }}
                    footer={[
                        <Button key="cancel" onClick={() => {
                            setRejectModalVisible(false);
                            setRejectReason('');
                        }}>
                            Hủy
                        </Button>,
                        <Button
                            key="reject"
                            danger
                            loading={confirmLoading}
                            onClick={() => handleRejectPayment(selectedPayment?.PaymentID, rejectReason)}
                        >
                            Từ chối thanh toán
                        </Button>,
                    ]}
                >
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2 text-orange-600">
                            <ExclamationCircleOutlined />
                            <span>Bạn có chắc chắn muốn từ chối thanh toán này?</span>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Lý do từ chối (tùy chọn):
                            </label>
                            <Input.TextArea
                                rows={3}
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Nhập lý do từ chối thanh toán..."
                            />
                        </div>
                    </div>
                </Modal>
            </div>
        );
    });

    // Reports Management Component
    const ReportsManagement = () => {
        const [reportsData, setReportsData] = useState({
            revenue: {
                total: 0,
                monthly: [],
                dailyAverage: 0,
                growth: 0
            },
            registrations: {
                total: 0,
                monthly: [],
                dailyAverage: 0,
                growth: 0
            },
            coachingSessions: {
                total: 0,
                completed: 0,
                scheduled: 0,
                monthly: [],
                growth: 0
            }
        });
        const [loading, setLoading] = useState(false);
        const [dateRange, setDateRange] = useState('month'); // month, quarter, year
        const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
        const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

        useEffect(() => {
            loadReportsData();
        }, [dateRange, selectedMonth, selectedYear]);

        const loadReportsData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('adminToken');

                console.log('🔄 Loading reports data from API...', {
                    range: dateRange,
                    month: selectedMonth,
                    year: selectedYear
                });

                const response = await axios.get('http://localhost:4000/api/admin/reports', {
                    headers: { 'Authorization': `Bearer ${token}` },
                    params: {
                        range: dateRange,
                        month: selectedMonth,
                        year: selectedYear
                    },
                    withCredentials: true
                });

                if (response.data.success) {
                    console.log('✅ Reports data loaded successfully:', response.data.data);
                    setReportsData(response.data.data);
                } else {
                    console.error('❌ API returned error:', response.data.message);
                    message.error(response.data.message || 'Lỗi khi tải dữ liệu báo cáo');
                }

            } catch (error) {
                console.error('❌ Error loading reports data:', error);

                // If API fails, use fallback data to still show some interface
                const fallbackData = {
                    revenue: {
                        total: 0,
                        monthly: [],
                        dailyAverage: 0,
                        growth: 0
                    },
                    registrations: {
                        total: 0,
                        monthly: [],
                        dailyAverage: 0,
                        growth: 0
                    },
                    coachingSessions: {
                        total: 0,
                        completed: 0,
                        scheduled: 0,
                        monthly: [],
                        growth: 0
                    }
                };

                setReportsData(fallbackData);

                if (error.response?.status === 401) {
                    message.error('Phiên đăng nhập đã hết hạn');
                } else if (error.response?.status === 500) {
                    message.error('Lỗi server khi tải báo cáo');
                } else {
                    message.error('Lỗi khi tải dữ liệu báo cáo: ' + (error.message || 'Unknown error'));
                }
            } finally {
                setLoading(false);
            }
        };

        const exportToExcel = async () => {
            try {
                setLoading(true);
                message.loading('Đang xuất báo cáo Excel...', 0);

                const token = localStorage.getItem('adminToken');

                console.log('📊 Starting Excel export...', {
                    range: dateRange,
                    month: selectedMonth,
                    year: selectedYear
                });

                try {
                    // Try server-side export first
                    const response = await axios.get('http://localhost:4000/api/admin/reports/export', {
                        headers: { 'Authorization': `Bearer ${token}` },
                        params: {
                            range: dateRange,
                            month: selectedMonth,
                            year: selectedYear
                        },
                        responseType: 'blob', // Important for file download
                        withCredentials: true,
                        timeout: 30000 // 30 second timeout
                    });

                    // Destroy loading message
                    message.destroy();

                    // Create download link
                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement('a');
                    link.href = url;

                    // Generate filename
                    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:\-T]/g, '');
                    const fileName = `BaoCao_SmokeKing_${dateRange}_${selectedYear}${dateRange === 'month' ? `_${selectedMonth}` : ''}_${timestamp}.xlsx`;

                    link.setAttribute('download', fileName);
                    document.body.appendChild(link);
                    link.click();

                    // Cleanup
                    link.remove();
                    window.URL.revokeObjectURL(url);

                    message.success('Xuất báo cáo Excel thành công!');
                    console.log('✅ Excel export completed successfully');

                } catch (serverError) {
                    console.warn('⚠️ Server export failed, trying client-side export...', serverError);
                    message.destroy();

                    // Fallback to client-side export
                    await exportToExcelClientSide();
                }

            } catch (error) {
                console.error('❌ Error exporting Excel:', error);
                message.destroy(); // Destroy loading message

                if (error.response?.status === 401) {
                    message.error('Phiên đăng nhập đã hết hạn');
                } else if (error.response?.status === 500) {
                    message.error('Lỗi server khi xuất báo cáo Excel');
                } else {
                    message.error('Lỗi khi xuất báo cáo Excel: ' + (error.message || 'Unknown error'));
                }
            } finally {
                setLoading(false);
            }
        };

        // Client-side Excel export as backup
        const exportToExcelClientSide = async () => {
            try {
                message.loading('Đang xuất báo cáo (client-side)...', 0);

                // Create workbook
                const workbook = XLSX.utils.book_new();

                // Summary data
                const summaryData = [
                    ['BÁO CÁO THỐNG KÊ SMOKINGKING'],
                    [`Thời gian: ${dateRange === 'month' ? `Tháng ${selectedMonth}/${selectedYear}` : `Năm ${selectedYear}`}`],
                    [`Ngày xuất: ${new Date().toLocaleString('vi-VN')}`],
                    [''],
                    ['CHỈ SỐ TỔNG QUAN'],
                    ['Chỉ số', 'Giá trị hiện tại', 'Tăng trưởng (%)', 'Ghi chú'],
                    ['Tổng doanh thu', (reportsData.revenue.total || 0).toLocaleString('vi-VN') + ' VNĐ', reportsData.revenue.growth || 0, 'So với kỳ trước'],
                    ['Đăng ký mới', reportsData.registrations.total || 0, reportsData.registrations.growth || 0, 'Thành viên mới'],
                    ['Buổi coaching', reportsData.coachingSessions.total || 0, reportsData.coachingSessions.growth || 0, 'Tổng số buổi'],
                    ['Buổi hoàn thành', reportsData.coachingSessions.completed || 0, '', 'Coaching đã hoàn thành'],
                    ['Buổi đã lên lịch', reportsData.coachingSessions.scheduled || 0, '', 'Coaching sắp diễn ra'],
                    [''],
                    ['THÔNG TIN CHI TIẾT'],
                    ['Doanh thu trung bình/ngày', Math.round(reportsData.revenue.dailyAverage || 0).toLocaleString('vi-VN') + ' VNĐ'],
                    ['Đăng ký trung bình/ngày', Math.round(reportsData.registrations.dailyAverage || 0) + ' người'],
                    ['Tỷ lệ hoàn thành coaching',
                        reportsData.coachingSessions.total > 0
                            ? Math.round((reportsData.coachingSessions.completed / reportsData.coachingSessions.total) * 100) + '%'
                            : '0%'
                    ]
                ];

                const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
                XLSX.utils.book_append_sheet(workbook, summarySheet, 'Tổng quan');

                // Revenue data
                if (reportsData.revenue.monthly && reportsData.revenue.monthly.length > 0) {
                    const revenueData = [
                        ['DOANH THU THEO THỜI GIAN'],
                        [''],
                        ['Tháng', 'Doanh thu (VNĐ)', 'Ghi chú'],
                        ...reportsData.revenue.monthly.map(item => [
                            `Tháng ${item.month}`,
                            (item.amount || 0).toLocaleString('vi-VN'),
                            ''
                        ])
                    ];

                    const revenueSheet = XLSX.utils.aoa_to_sheet(revenueData);
                    XLSX.utils.book_append_sheet(workbook, revenueSheet, 'Doanh thu');
                }

                // Registrations data
                if (reportsData.registrations.monthly && reportsData.registrations.monthly.length > 0) {
                    const registrationsData = [
                        ['ĐĂNG KÝ MỚI THEO THỜI GIAN'],
                        [''],
                        ['Tháng', 'Số lượng đăng ký', 'Ghi chú'],
                        ...reportsData.registrations.monthly.map(item => [
                            `Tháng ${item.month}`,
                            item.count || 0,
                            ''
                        ])
                    ];

                    const registrationsSheet = XLSX.utils.aoa_to_sheet(registrationsData);
                    XLSX.utils.book_append_sheet(workbook, registrationsSheet, 'Đăng ký');
                }

                // Coaching sessions data
                if (reportsData.coachingSessions.monthly && reportsData.coachingSessions.monthly.length > 0) {
                    const coachingData = [
                        ['BUỔI COACHING THEO THỜI GIAN'],
                        [''],
                        ['Tháng', 'Số buổi', 'Ghi chú'],
                        ...reportsData.coachingSessions.monthly.map(item => [
                            `Tháng ${item.month}`,
                            item.sessions || 0,
                            ''
                        ])
                    ];

                    const coachingSheet = XLSX.utils.aoa_to_sheet(coachingData);
                    XLSX.utils.book_append_sheet(workbook, coachingSheet, 'Coaching');
                }

                // Generate Excel file
                const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

                // Generate filename
                const timestamp = new Date().toISOString().slice(0, 19).replace(/[:\-T]/g, '');
                const fileName = `BaoCao_SmokeKing_${dateRange}_${selectedYear}${dateRange === 'month' ? `_${selectedMonth}` : ''}_${timestamp}.xlsx`;

                // Save file
                saveAs(blob, fileName);

                message.destroy();
                message.success('Xuất báo cáo Excel thành công! (Client-side)');
                console.log('✅ Client-side Excel export completed successfully');

            } catch (clientError) {
                console.error('❌ Client-side export error:', clientError);
                message.destroy();
                message.error('Lỗi khi xuất báo cáo Excel (client-side): ' + clientError.message);
            }
        };

        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(amount);
        };

        const getGrowthIcon = (growth) => {
            if (growth === null || growth === undefined || isNaN(growth)) {
                return <span className="text-gray-400">-</span>;
            }
            if (growth > 0) return <RiseOutlined className="text-green-500" />;
            if (growth < 0) return <FallOutlined className="text-red-500" />;
            return <span className="text-gray-500">-</span>;
        };

        const getGrowthColor = (growth) => {
            if (growth === null || growth === undefined || isNaN(growth)) {
                return '#d9d9d9';
            }
            if (growth > 0) return '#52c41a';
            if (growth < 0) return '#f5222d';
            return '#d9d9d9';
        };

        return (
            <div className="space-y-6">
                {/* Header */}
                <Card className="shadow-md">
                    <div className="flex justify-between items-center">
                        <div>
                            <Title level={2} className="mb-2">
                                <LineChartOutlined className="mr-3 text-blue-500" />
                                Báo cáo thống kê
                            </Title>
                            <Text className="text-gray-600">
                                Theo dõi hiệu suất hoạt động kinh doanh
                            </Text>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Select
                                value={dateRange}
                                onChange={setDateRange}
                                style={{ width: 120 }}
                                options={[
                                    { value: 'month', label: 'Tháng' },
                                    { value: 'quarter', label: 'Quý' },
                                    { value: 'year', label: 'Năm' }
                                ]}
                            />
                            <Select
                                value={selectedMonth}
                                onChange={setSelectedMonth}
                                style={{ width: 100 }}
                                disabled={dateRange !== 'month'}
                                options={Array.from({ length: 12 }, (_, i) => ({
                                    value: i + 1,
                                    label: `Tháng ${i + 1}`
                                }))}
                            />
                            <Select
                                value={selectedYear}
                                onChange={setSelectedYear}
                                style={{ width: 100 }}
                                options={Array.from({ length: 5 }, (_, i) => ({
                                    value: new Date().getFullYear() - i,
                                    label: (new Date().getFullYear() - i).toString()
                                }))}
                            />
                            <Button
                                type="primary"
                                icon={<DownloadOutlined />}
                                onClick={exportToExcel}
                                loading={loading}
                                style={{ marginRight: 8 }}
                            >
                                Xuất Excel
                            </Button>
                            <Dropdown
                                menu={{
                                    items: [
                                        {
                                            key: 'server',
                                            label: 'Xuất từ Server',
                                            icon: <DownloadOutlined />,
                                            onClick: exportToExcel
                                        },
                                        {
                                            key: 'client',
                                            label: 'Xuất từ Client',
                                            icon: <DownloadOutlined />,
                                            onClick: exportToExcelClientSide
                                        }
                                    ]
                                }}
                                trigger={['click']}
                                disabled={loading}
                            >
                                <Button icon={<FilterOutlined />}>
                                    Tùy chọn xuất
                                </Button>
                            </Dropdown>
                        </div>
                    </div>
                </Card>

                {/* Key Metrics */}
                <Row gutter={[24, 24]}>
                    <Col xs={24} sm={8}>
                        <Card className="shadow-md text-center">
                            <div className="mb-4">
                                <DollarOutlined className="text-4xl text-green-500" />
                            </div>
                            <Statistic
                                title="Tổng doanh thu"
                                value={reportsData.revenue.total}
                                formatter={(value) => formatCurrency(value)}
                                valueStyle={{ color: '#52c41a', fontSize: '24px' }}
                            />
                            <div className="mt-2 flex items-center justify-center">
                                {getGrowthIcon(reportsData.revenue.growth)}
                                <span
                                    className="ml-1 font-medium"
                                    style={{ color: getGrowthColor(reportsData.revenue.growth) }}
                                >
                                    {reportsData.revenue.growth !== null &&
                                        reportsData.revenue.growth !== undefined &&
                                        !isNaN(reportsData.revenue.growth)
                                        ? `${Math.abs(reportsData.revenue.growth).toFixed(1)}%`
                                        : 'N/A'
                                    }
                                </span>
                                <span className="ml-1 text-gray-500 text-sm">so với kỳ trước</span>
                            </div>
                            <div className="mt-2 text-sm text-gray-500">
                                Trung bình: {formatCurrency(reportsData.revenue.dailyAverage)}/ngày
                            </div>
                        </Card>
                    </Col>

                    <Col xs={24} sm={8}>
                        <Card className="shadow-md text-center">
                            <div className="mb-4">
                                <UserOutlined className="text-4xl text-blue-500" />
                            </div>
                            <Statistic
                                title="Lượt đăng ký mới"
                                value={reportsData.registrations.total}
                                valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                            />
                            <div className="mt-2 flex items-center justify-center">
                                {getGrowthIcon(reportsData.registrations.growth)}
                                <span
                                    className="ml-1 font-medium"
                                    style={{ color: getGrowthColor(reportsData.registrations.growth) }}
                                >
                                    {reportsData.registrations.growth !== null &&
                                        reportsData.registrations.growth !== undefined &&
                                        !isNaN(reportsData.registrations.growth)
                                        ? `${Math.abs(reportsData.registrations.growth).toFixed(1)}%`
                                        : 'N/A'
                                    }
                                </span>
                                <span className="ml-1 text-gray-500 text-sm">so với kỳ trước</span>
                            </div>
                            <div className="mt-2 text-sm text-gray-500">
                                Trung bình: {reportsData.registrations.dailyAverage.toFixed(1)} người/ngày
                            </div>
                        </Card>
                    </Col>

                    <Col xs={24} sm={8}>
                        <Card className="shadow-md text-center">
                            <div className="mb-4">
                                <CalendarOutlined className="text-4xl text-purple-500" />
                            </div>
                            <Statistic
                                title="Buổi coaching"
                                value={reportsData.coachingSessions.total}
                                valueStyle={{ color: '#722ed1', fontSize: '24px' }}
                            />
                            <div className="mt-2 flex items-center justify-center">
                                {getGrowthIcon(reportsData.coachingSessions.growth)}
                                <span
                                    className="ml-1 font-medium"
                                    style={{ color: getGrowthColor(reportsData.coachingSessions.growth) }}
                                >
                                    {reportsData.coachingSessions.growth !== null &&
                                        reportsData.coachingSessions.growth !== undefined &&
                                        !isNaN(reportsData.coachingSessions.growth)
                                        ? `${Math.abs(reportsData.coachingSessions.growth).toFixed(1)}%`
                                        : 'N/A'
                                    }
                                </span>
                                <span className="ml-1 text-gray-500 text-sm">so với kỳ trước</span>
                            </div>
                            <div className="mt-2 flex justify-center space-x-4 text-sm">
                                <div>
                                    <span className="text-green-600 font-medium">
                                        {reportsData.coachingSessions.completed}
                                    </span>
                                    <span className="text-gray-500 ml-1">hoàn thành</span>
                                </div>
                                <div>
                                    <span className="text-orange-600 font-medium">
                                        {reportsData.coachingSessions.scheduled}
                                    </span>
                                    <span className="text-gray-500 ml-1">đã lên lịch</span>
                                </div>
                            </div>
                        </Card>
                    </Col>
                </Row>

                {/* Detailed Charts */}
                <Row gutter={[24, 24]}>
                    <Col xs={24} lg={12}>
                        <Card
                            title={
                                <div className="flex items-center">
                                    <BarChartOutlined className="mr-2 text-green-500" />
                                    <span>Doanh thu theo thời gian</span>
                                </div>
                            }
                            className="shadow-md"
                        >
                            <div className="h-64 flex items-center justify-center">
                                {reportsData.revenue.monthly && reportsData.revenue.monthly.length > 0 ? (
                                    <div className="w-full">
                                        <div className="grid grid-cols-6 gap-4">
                                            {reportsData.revenue.monthly.slice(0, 6).map((item, index) => (
                                                <div key={index} className="text-center">
                                                    <div
                                                        className="bg-green-500 rounded-t"
                                                        style={{
                                                            height: `${(item.amount / Math.max(...reportsData.revenue.monthly.map(r => r.amount))) * 100}px`,
                                                            minHeight: '10px'
                                                        }}
                                                    ></div>
                                                    <div className="text-xs text-gray-600 mt-2">
                                                        {item.period}
                                                    </div>
                                                    <div className="text-xs text-green-600 font-medium">
                                                        {formatCurrency(item.amount)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500">
                                        <BarChartOutlined className="text-4xl mb-2" />
                                        <div>Chưa có dữ liệu doanh thu</div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </Col>

                    <Col xs={24} lg={12}>
                        <Card
                            title={
                                <div className="flex items-center">
                                    <LineChartOutlined className="mr-2 text-blue-500" />
                                    <span>Đăng ký mới theo thời gian</span>
                                </div>
                            }
                            className="shadow-md"
                        >
                            <div className="h-64 flex items-center justify-center">
                                {reportsData.registrations.monthly && reportsData.registrations.monthly.length > 0 ? (
                                    <div className="w-full">
                                        <div className="grid grid-cols-6 gap-4">
                                            {reportsData.registrations.monthly.slice(0, 6).map((item, index) => (
                                                <div key={index} className="text-center">
                                                    <div
                                                        className="bg-blue-500 rounded-t"
                                                        style={{
                                                            height: `${(item.count / Math.max(...reportsData.registrations.monthly.map(r => r.count))) * 100}px`,
                                                            minHeight: '10px'
                                                        }}
                                                    ></div>
                                                    <div className="text-xs text-gray-600 mt-2">
                                                        {item.period}
                                                    </div>
                                                    <div className="text-xs text-blue-600 font-medium">
                                                        {item.count} người
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500">
                                        <LineChartOutlined className="text-4xl mb-2" />
                                        <div>Chưa có dữ liệu đăng ký</div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </Col>
                </Row>

                {/* Coaching Sessions Breakdown */}
                <Card
                    title={
                        <div className="flex items-center">
                            <PieChartOutlined className="mr-2 text-purple-500" />
                            <span>Chi tiết buổi coaching</span>
                        </div>
                    }
                    className="shadow-md"
                >
                    <Row gutter={[24, 24]}>
                        <Col xs={24} lg={16}>
                            <div className="h-64 flex items-center justify-center">
                                {reportsData.coachingSessions.monthly && reportsData.coachingSessions.monthly.length > 0 ? (
                                    <div className="w-full">
                                        <div className="grid grid-cols-6 gap-4">
                                            {reportsData.coachingSessions.monthly.slice(0, 6).map((item, index) => (
                                                <div key={index} className="text-center">
                                                    <div
                                                        className="bg-purple-500 rounded-t"
                                                        style={{
                                                            height: `${(item.sessions / Math.max(...reportsData.coachingSessions.monthly.map(r => r.sessions))) * 100}px`,
                                                            minHeight: '10px'
                                                        }}
                                                    ></div>
                                                    <div className="text-xs text-gray-600 mt-2">
                                                        {item.period}
                                                    </div>
                                                    <div className="text-xs text-purple-600 font-medium">
                                                        {item.sessions} buổi
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500">
                                        <PieChartOutlined className="text-4xl mb-2" />
                                        <div>Chưa có dữ liệu coaching</div>
                                    </div>
                                )}
                            </div>
                        </Col>
                        <Col xs={24} lg={8}>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                                    <div>
                                        <div className="text-lg font-semibold text-green-600">
                                            {reportsData.coachingSessions.completed}
                                        </div>
                                        <div className="text-sm text-gray-600">Buổi đã hoàn thành</div>
                                    </div>
                                    <CheckCircleOutlined className="text-2xl text-green-500" />
                                </div>
                                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                                    <div>
                                        <div className="text-lg font-semibold text-orange-600">
                                            {reportsData.coachingSessions.scheduled}
                                        </div>
                                        <div className="text-sm text-gray-600">Buổi đã lên lịch</div>
                                    </div>
                                    <CalendarOutlined className="text-2xl text-orange-500" />
                                </div>
                                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                                    <div>
                                        <div className="text-lg font-semibold text-blue-600">
                                            {((reportsData.coachingSessions.completed / reportsData.coachingSessions.total) * 100).toFixed(1)}%
                                        </div>
                                        <div className="text-sm text-gray-600">Tỷ lệ hoàn thành</div>
                                    </div>
                                    <TrophyOutlined className="text-2xl text-blue-500" />
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Card>

                {/* Summary Table */}
                <Card
                    title={
                        <div className="flex items-center">
                            <FileTextOutlined className="mr-2 text-gray-600" />
                            <span>Tóm tắt báo cáo</span>
                        </div>
                    }
                    className="shadow-md"
                >
                    <Table
                        dataSource={[
                            {
                                key: 'revenue',
                                metric: 'Doanh thu',
                                current: formatCurrency(reportsData.revenue.total),
                                growth: reportsData.revenue.growth,
                                status: reportsData.revenue.growth >= 0 ? 'success' : 'error'
                            },
                            {
                                key: 'registrations',
                                metric: 'Đăng ký mới',
                                current: `${reportsData.registrations.total} người`,
                                growth: reportsData.registrations.growth,
                                status: reportsData.registrations.growth >= 0 ? 'success' : 'error'
                            },
                            {
                                key: 'sessions',
                                metric: 'Buổi coaching',
                                current: `${reportsData.coachingSessions.total} buổi`,
                                growth: reportsData.coachingSessions.growth,
                                status: reportsData.coachingSessions.growth >= 0 ? 'success' : 'error'
                            }
                        ]}
                        columns={[
                            {
                                title: 'Chỉ số',
                                dataIndex: 'metric',
                                key: 'metric',
                                render: (text) => <Text strong>{text}</Text>
                            },
                            {
                                title: 'Giá trị hiện tại',
                                dataIndex: 'current',
                                key: 'current',
                                render: (text) => <Text className="text-lg">{text}</Text>
                            },
                            {
                                title: 'Tăng trưởng',
                                dataIndex: 'growth',
                                key: 'growth',
                                render: (growth, record) => {
                                    // Handle null, undefined, or NaN values
                                    if (growth === null || growth === undefined || isNaN(growth)) {
                                        return (
                                            <div className="flex items-center">
                                                <span className="text-gray-400">-</span>
                                                <span className="ml-2 text-gray-400 text-sm">
                                                    Chưa có dữ liệu
                                                </span>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="flex items-center">
                                            {getGrowthIcon(growth)}
                                            <span
                                                className="ml-2 font-medium"
                                                style={{ color: getGrowthColor(growth) }}
                                            >
                                                {Math.abs(growth).toFixed(1)}%
                                            </span>
                                        </div>
                                    );
                                }
                            },
                            {
                                title: 'Trạng thái',
                                dataIndex: 'status',
                                key: 'status',
                                render: (status, record) => (
                                    <Badge
                                        status={status}
                                        text={record.growth >= 0 ? 'Tăng trưởng' : 'Giảm'}
                                    />
                                )
                            }
                        ]}
                        pagination={false}
                        size="small"
                    />
                </Card>

                {loading && (
                    <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                            <Spin size="large" />
                            <div className="mt-4 text-gray-600">Đang tải dữ liệu báo cáo...</div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <Layout className="min-h-screen">
            {/* Header */}
            <Header
                className="shadow-lg"
                style={{
                    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 32px',
                    height: '85px',
                    minHeight: '85px',
                    overflow: 'visible'
                }}
            >
                <div className="flex items-center admin-logo-container">
                    <div
                        className="mr-4 flex items-center justify-center w-12 h-12 rounded-xl cursor-pointer admin-logo-icon"
                        onClick={() => navigate('/')}
                    >
                        <SafetyOutlined className="text-white text-2xl" />
                    </div>
                    <div
                        className="cursor-pointer admin-logo-text"
                        onClick={() => navigate('/')}
                    >
                        <Title
                            level={2}
                            style={{
                                fontSize: '32px',
                                margin: 0,
                                fontWeight: '800',
                                letterSpacing: '1px',
                                color: '#ffffff',
                                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                                lineHeight: '1.2'
                            }}
                        >
                            🔥 SmokeKing Admin
                        </Title>
                        <Text
                            style={{
                                fontSize: '13px',
                                fontWeight: '600',
                                color: 'rgba(255,255,255,0.9)',
                                textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                                lineHeight: '1.3',
                                margin: 0,
                                display: 'block'
                            }}
                        >
                            ⚡ Hệ thống quản trị • Click để về trang chủ
                        </Text>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <Button
                        type="text"
                        icon={<HomeOutlined />}
                        onClick={() => navigate('/')}
                        className="text-white border-white border-opacity-30 hover:bg-white hover:bg-opacity-10"
                        style={{
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '8px',
                            height: '40px',
                            color: 'white'
                        }}
                    >
                        Trang chủ
                    </Button>

                    <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                        <div className="cursor-pointer flex items-center px-4 py-2 rounded-xl bg-white bg-opacity-10 hover:bg-opacity-20 transition-all duration-300 border border-white border-opacity-20">
                            <Space>
                                <Text className="text-white font-semibold text-base">
                                    {adminProfile ? `${adminProfile.firstName} ${adminProfile.lastName}` : 'Admin Root'}
                                </Text>
                                <Avatar
                                    icon={<UserOutlined />}
                                    className="bg-white bg-opacity-30 border-2 border-white border-opacity-40"
                                    size="large"
                                />
                            </Space>
                        </div>
                    </Dropdown>
                </div>
            </Header>

            <Layout>
                {/* Sidebar */}
                <Sider
                    width={280}
                    style={{
                        background: '#fff',
                        boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
                        height: 'calc(100vh - 85px)',
                        position: 'sticky',
                        top: '85px',
                        left: 0,
                        zIndex: 999
                    }}
                >
                    <div className="p-6">
                        <Title level={4} className="mb-4 text-gray-700">
                            Quản lý nội dung
                        </Title>
                        <Menu
                            mode="vertical"
                            selectedKeys={[selectedTab]}
                            onClick={({ key }) => setSelectedTab(key)}
                            className="border-none"
                            items={sidebarMenuItems.map(item => ({
                                ...item,
                                className: 'mb-2 rounded-lg',
                                style: {
                                    marginBottom: '8px',
                                    borderRadius: '8px',
                                    height: '48px',
                                    lineHeight: '48px'
                                }
                            }))}
                        />
                    </div>
                </Sider>

                {/* Content */}
                <Content
                    style={{
                        padding: '32px',
                        background: '#f5f5f5',
                        minHeight: 'calc(100vh - 85px)'
                    }}
                >
                    {renderContent()}
                </Content>
            </Layout>

            {/* Edit Profile Modal */}
            <Modal
                title={
                    <div className="flex items-center">
                        <EditOutlined className="mr-2" />
                        <span>Chỉnh sửa thông tin cá nhân</span>
                    </div>
                }
                open={editProfileModalVisible}
                onCancel={handleCancelEditProfile}
                footer={null}
                width={600}
                style={{ top: 20 }}
            >
                <Form
                    form={editProfileForm}
                    layout="vertical"
                    onFinish={handleUpdateProfile}
                    className="mt-4"
                >
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="Họ"
                                name="firstName"
                                rules={[{ required: true, message: 'Vui lòng nhập họ' }]}
                            >
                                <Input placeholder="Nhập họ" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="Tên"
                                name="lastName"
                                rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
                            >
                                <Input placeholder="Nhập tên" />
                            </Form.Item>
                        </Col>
                        <Col xs={24}>
                            <Form.Item
                                label="Số điện thoại"
                                name="phoneNumber"
                            >
                                <Input placeholder="Nhập số điện thoại" />
                            </Form.Item>
                        </Col>
                        <Col xs={24}>
                            <Form.Item
                                label="Địa chỉ"
                                name="address"
                            >
                                <Input.TextArea
                                    rows={3}
                                    placeholder="Nhập địa chỉ"
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24}>
                            <Form.Item
                                label="Avatar URL"
                                name="avatar"
                            >
                                <Input placeholder="Nhập URL avatar" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <div className="flex justify-end space-x-2 mt-6">
                        <Button onClick={handleCancelEditProfile}>
                            Hủy
                        </Button>
                        <Button type="primary" htmlType="submit">
                            Cập nhật
                        </Button>
                    </div>
                </Form>
            </Modal>

            {/* Change Password Modal */}
            <Modal
                title={
                    <div className="flex items-center">
                        <SettingOutlined className="mr-2" />
                        <span>Đổi mật khẩu</span>
                    </div>
                }
                open={changePasswordModalVisible}
                onCancel={handleCancelChangePassword}
                footer={null}
                width={500}
                style={{ top: 20 }}
            >
                <Form
                    form={changePasswordForm}
                    layout="vertical"
                    onFinish={handleChangePassword}
                    className="mt-4"
                >
                    <Form.Item
                        label="Mật khẩu hiện tại"
                        name="currentPassword"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
                    >
                        <Input.Password placeholder="Nhập mật khẩu hiện tại" />
                    </Form.Item>

                    <Form.Item
                        label="Mật khẩu mới"
                        name="newPassword"
                        rules={[
                            { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                            { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
                        ]}
                    >
                        <Input.Password placeholder="Nhập mật khẩu mới" />
                    </Form.Item>

                    <Form.Item
                        label="Xác nhận mật khẩu mới"
                        name="confirmPassword"
                        dependencies={['newPassword']}
                        rules={[
                            { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('newPassword') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password placeholder="Xác nhận mật khẩu mới" />
                    </Form.Item>

                    <div className="flex justify-end space-x-2 mt-6">
                        <Button onClick={handleCancelChangePassword}>
                            Hủy
                        </Button>
                        <Button type="primary" htmlType="submit">
                            Đổi mật khẩu
                        </Button>
                    </div>
                </Form>
            </Modal>
        </Layout>
    );
};

export default AdminDashboard; 