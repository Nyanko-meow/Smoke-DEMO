import React, { useState, useEffect } from 'react';
import {
    Layout,
    Card,
    Typography,
    Row,
    Col,
    Button,
    Avatar,
    Space,
    message,
    Statistic,
    Menu,
    Dropdown,
    Table,
    Tag,
    Badge,
    Descriptions,
    Rate,
    Modal,
    Form,
    Input,
    InputNumber,
    Spin,
    Alert,
    Progress,
    Timeline,
    Tabs,
    Empty
} from 'antd';
import {
    UserOutlined,
    LogoutOutlined,
    DashboardOutlined,
    TeamOutlined,
    TrophyOutlined,
    BarChartOutlined,
    CrownOutlined,
    SettingOutlined,
    EyeOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    EditOutlined,
    StarOutlined,
    CalendarOutlined,
    PhoneOutlined,
    MailOutlined,
    EnvironmentOutlined,
    GlobalOutlined,
    BookOutlined,
    SaveOutlined,
    CloseOutlined,
    DollarOutlined,
    FireOutlined,
    HeartOutlined,
    SmileOutlined,
    WarningOutlined,
    MessageOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MemberDetailsModal from '../components/MemberDetailsModal';
import MemberProgressTracking from '../components/MemberProgressTracking';
import { CoachChat } from '../components/chat';
import AppointmentCalendar from '../components/coach/AppointmentCalendar';
import CoachFeedbackView from '../components/coach/CoachFeedbackView';

const { Header, Content, Sider } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const CoachDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [coachProfile, setCoachProfile] = useState(null);
    const [members, setMembers] = useState([]);
    const [stats, setStats] = useState({
        totalMembers: 0,
        activeMembers: 0,
        completedPlans: 0,
        successRate: 0
    });
    const [collapsed, setCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [editForm] = Form.useForm();

    // Member details modal state
    const [memberDetailsVisible, setMemberDetailsVisible] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [memberDetailsLoading, setMemberDetailsLoading] = useState(false);
    const [memberDetails, setMemberDetails] = useState(null);

    // Progress tracking state
    const [selectedMemberForProgress, setSelectedMemberForProgress] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        checkAuthAndLoadProfile();

        // Check if should open appointments tab from navbar
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('tab') === 'appointments') {
            setActiveTab('appointments');
        }
    }, []);

    const checkAuthAndLoadProfile = async () => {
        try {
            const token = localStorage.getItem('coachToken');
            const userData = localStorage.getItem('coachUser');

            if (!token || !userData) {
                message.error('Vui lòng đăng nhập');
                navigate('/coach/login');
                return;
            }

            const user = JSON.parse(userData);
            if (user.role !== 'coach') {
                message.error('Bạn không có quyền truy cập trang này');
                navigate('/coach/login');
                return;
            }

            // Load all data
            await Promise.all([
                loadCoachProfile(token),
                loadMembers(token),
                loadStats(token)
            ]);

        } catch (error) {
            console.error('Auth check error:', error);
            message.error('Lỗi xác thực. Vui lòng đăng nhập lại');
            handleLogout();
        } finally {
            setLoading(false);
        }
    };

    const loadCoachProfile = async (token) => {
        try {
            const response = await axios.get('http://localhost:4000/api/coach/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                withCredentials: true
            });

            if (response.data.success) {
                setCoachProfile(response.data.data);
            }
        } catch (error) {
            console.error('Error loading coach profile:', error);
            if (error.response?.status === 401) {
                handleLogout();
            }
        }
    };

    const loadMembers = async (token) => {
        try {
            const response = await axios.get('http://localhost:4000/api/coach/members', {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                withCredentials: true
            });

            if (response.data.success) {
                setMembers(response.data.data);
            }
        } catch (error) {
            console.error('Error loading members:', error);
            message.error('Lỗi khi tải danh sách thành viên');
        }
    };

    const loadStats = async (token) => {
        try {
            const response = await axios.get('http://localhost:4000/api/coach/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                withCredentials: true
            });

            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            message.error('Lỗi khi tải thống kê');
        }
    };

    // Load member details
    const loadMemberDetails = async (memberId) => {
        try {
            setMemberDetailsLoading(true);
            const token = localStorage.getItem('coachToken');

            const response = await axios.get(`http://localhost:4000/api/coach/members/${memberId}/details`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                setMemberDetails(response.data.data);
            } else {
                message.error(response.data.message || 'Lỗi khi tải thông tin chi tiết');
            }
        } catch (error) {
            console.error('Error loading member details:', error);
            message.error('Lỗi khi tải thông tin chi tiết thành viên');
        } finally {
            setMemberDetailsLoading(false);
        }
    };

    // Handle view member details
    const handleViewMemberDetails = async (member) => {
        setSelectedMember(member);
        setMemberDetailsVisible(true);
        await loadMemberDetails(member.id);
    };

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('coachToken');
            if (token) {
                await axios.post('http://localhost:4000/api/coach/logout', {}, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    withCredentials: true
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('coachToken');
            localStorage.removeItem('coachUser');
            message.success('Đăng xuất thành công');
            navigate('/coach/login');
        }
    };

    const getCoachDisplayName = () => {
        if (!coachProfile) return 'Coach';
        return `${coachProfile.FirstName} ${coachProfile.LastName}`;
    };

    // Handle edit modal
    const handleEditProfile = () => {
        if (!coachProfile) return;

        // Fill form with current data
        editForm.setFieldsValue({
            firstName: coachProfile.FirstName,
            lastName: coachProfile.LastName,
            phoneNumber: coachProfile.PhoneNumber,
            address: coachProfile.Address,
            avatar: coachProfile.Avatar,
            // Professional fields
            specialization: coachProfile.professionalProfile?.Specialization,
            yearsOfExperience: coachProfile.professionalProfile?.YearsOfExperience,
            education: coachProfile.professionalProfile?.Education,
            certifications: coachProfile.professionalProfile?.Certifications,
            license: coachProfile.professionalProfile?.License,
            bio: coachProfile.professionalProfile?.Bio,
            methodology: coachProfile.professionalProfile?.Methodology,
            successStory: coachProfile.professionalProfile?.SuccessStory,
            languages: coachProfile.professionalProfile?.Languages,
            communicationStyle: coachProfile.professionalProfile?.CommunicationStyle,
            workingHours: coachProfile.professionalProfile?.WorkingHours,
            website: coachProfile.professionalProfile?.Website,
            linkedin: coachProfile.professionalProfile?.LinkedIn,
            hourlyRate: coachProfile.professionalProfile?.HourlyRate,
            consultationFee: coachProfile.professionalProfile?.ConsultationFee,
            servicesOffered: coachProfile.professionalProfile?.ServicesOffered
        });

        setEditModalVisible(true);
    };

    const handleSaveProfile = async (values) => {
        setEditLoading(true);
        try {
            const token = localStorage.getItem('coachToken');

            const response = await axios.put('http://localhost:4000/api/coach/profile', values, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                withCredentials: true
            });

            if (response.data.success) {
                message.success('Cập nhật thông tin thành công!');
                setEditModalVisible(false);
                editForm.resetFields();

                // Reload profile data
                await loadCoachProfile(token);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            message.error('Lỗi khi cập nhật thông tin: ' + (error.response?.data?.message || error.message));
        } finally {
            setEditLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setEditModalVisible(false);
        editForm.resetFields();
    };

    const userMenuItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: 'Thông tin cá nhân',
            onClick: () => setActiveTab('profile'),
        },
        {
            key: 'settings',
            icon: <SettingOutlined />,
            label: 'Cài đặt',
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

    const sidebarMenuItems = [
        {
            key: 'dashboard',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
        },
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: 'Thông tin cá nhân',
        },
        {
            key: 'members',
            icon: <TeamOutlined />,
            label: 'Thành viên',
        },
        {
            key: 'progress',
            icon: <BarChartOutlined />,
            label: 'Theo dõi tiến trình',
        },
        {
            key: 'chat',
            icon: <MessageOutlined />,
            label: 'Chat',
        },
        {
            key: 'appointments',
            icon: <CalendarOutlined />,
            label: 'Lịch hẹn',
        },
        {
            key: 'feedback',
            icon: <StarOutlined />,
            label: 'Đánh giá',
        },
    ];

    const memberColumns = [
        {
            title: 'Thành viên',
            dataIndex: 'fullName',
            key: 'fullName',
            render: (text, record) => (
                <div className="flex items-center">
                    <Avatar
                        src={record.avatar}
                        icon={<UserOutlined />}
                        className="mr-3"
                    />
                    <div>
                        <div className="font-medium">{text}</div>
                        <div className="text-gray-500 text-sm">{record.email}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive) => (
                <Badge
                    status={isActive ? 'success' : 'default'}
                    text={isActive ? 'Hoạt động' : 'Không hoạt động'}
                />
            ),
        },
        {
            title: 'Gói dịch vụ',
            dataIndex: 'membership',
            key: 'membership',
            render: (membership) => (
                membership ? (
                    <Tag color="blue">{membership.planName}</Tag>
                ) : (
                    <Tag color="default">Chưa đăng ký</Tag>
                )
            ),
        },
        {
            title: 'Tiến trình',
            dataIndex: 'progress',
            key: 'progress',
            render: (progress) => (
                <div className="text-sm">
                    <div>Ngày không hút: {progress.daysSmokeFree}</div>
                    <div>Tiền tiết kiệm: {progress.moneySaved?.toLocaleString()}đ</div>
                </div>
            ),
        },
        {
            title: 'Thành tích',
            dataIndex: 'achievementCount',
            key: 'achievementCount',
            render: (count) => (
                <div className="text-center">
                    <TrophyOutlined className="text-yellow-500 mr-1" />
                    {count}
                </div>
            ),
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_, record) => (
                <Button
                    type="primary"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewMemberDetails(record)}
                >
                    Xem chi tiết
                </Button>
            ),
        },
    ];

    const renderDashboard = () => (
        <>
            {/* Statistics Cards */}
            <Row gutter={[24, 24]} className="mb-6">
                <Col xs={24} sm={12} lg={6}>
                    <Card className="text-center shadow-md hover:shadow-lg transition-shadow">
                        <Statistic
                            title="Tổng thành viên"
                            value={stats.totalMembers}
                            prefix={<TeamOutlined className="text-blue-500" />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="text-center shadow-md hover:shadow-lg transition-shadow">
                        <Statistic
                            title="Đang hỗ trợ"
                            value={stats.activeMembers}
                            prefix={<CheckCircleOutlined className="text-green-500" />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="text-center shadow-md hover:shadow-lg transition-shadow">
                        <Statistic
                            title="Hoàn thành"
                            value={stats.completedPlans}
                            prefix={<TrophyOutlined className="text-yellow-500" />}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="text-center shadow-md hover:shadow-lg transition-shadow">
                        <Statistic
                            title="Tỷ lệ thành công"
                            value={stats.successRate}
                            suffix="%"
                            prefix={<BarChartOutlined className="text-purple-500" />}
                            valueStyle={{ color: '#722ed1' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Welcome Card */}
            <Row gutter={[24, 24]}>
                <Col span={24}>
                    <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg">
                        <div className="text-center">
                            <CrownOutlined className="text-4xl mb-4" />
                            <Title level={2} className="text-white mb-4">
                                Chào mừng đến với Coach Portal!
                            </Title>
                            <Paragraph className="text-blue-100 text-lg mb-6">
                                Hệ thống quản lý dành riêng cho huấn luyện viên. Tại đây bạn có thể:
                            </Paragraph>
                            <Row gutter={[16, 16]} justify="center">
                                <Col xs={24} sm={12} md={6}>
                                    <div className="text-center">
                                        <TeamOutlined className="text-2xl mb-2" />
                                        <div>Quản lý thành viên</div>
                                    </div>
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <div className="text-center">
                                        <BarChartOutlined className="text-2xl mb-2" />
                                        <div>Theo dõi tiến trình</div>
                                    </div>
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <div className="text-center">
                                        <TrophyOutlined className="text-2xl mb-2" />
                                        <div>Ghi nhận thành tích</div>
                                    </div>
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <div className="text-center">
                                        <UserOutlined className="text-2xl mb-2" />
                                        <div>Hỗ trợ cá nhân</div>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    </Card>
                </Col>
            </Row>
        </>
    );

    const renderProfile = () => (
        <>
            {coachProfile && (
                <Row gutter={[24, 24]}>
                    {/* Header with Avatar and Basic Info */}
                    <Col span={24}>
                        <Card className="shadow-md">
                            <div className="flex items-center mb-6">
                                <Avatar
                                    size={120}
                                    src={coachProfile.Avatar}
                                    icon={<UserOutlined />}
                                    className="mr-6"
                                    style={{ border: '4px solid #1890ff' }}
                                />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Title level={2} className="mb-2">{getCoachDisplayName()}</Title>
                                            <Text className="text-lg text-gray-600">
                                                {coachProfile.professionalProfile?.Specialization || 'Huấn luyện viên chuyên nghiệp'}
                                            </Text>
                                            {coachProfile.professionalProfile?.IsVerified && (
                                                <div className="mt-2">
                                                    <Tag color="green" icon={<CheckCircleOutlined />}>
                                                        Đã xác minh chuyên môn
                                                    </Tag>
                                                </div>
                                            )}
                                        </div>
                                        <Button
                                            type="primary"
                                            icon={<EditOutlined />}
                                            onClick={handleEditProfile}
                                        >
                                            Chỉnh sửa
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Professional Stats */}
                            {coachProfile.professionalProfile && (
                                <Row gutter={[16, 16]} className="mb-6">
                                    <Col xs={12} sm={6}>
                                        <Statistic
                                            title="Kinh nghiệm"
                                            value={coachProfile.professionalProfile.YearsOfExperience}
                                            suffix="năm"
                                            prefix={<CalendarOutlined />}
                                        />
                                    </Col>
                                    <Col xs={12} sm={6}>
                                        <Statistic
                                            title="Clients hỗ trợ"
                                            value={coachProfile.professionalProfile.TotalClientsServed}
                                            prefix={<TeamOutlined />}
                                        />
                                    </Col>
                                    <Col xs={12} sm={6}>
                                        <Statistic
                                            title="Tỷ lệ thành công"
                                            value={coachProfile.professionalProfile.SuccessRate}
                                            suffix="%"
                                            prefix={<TrophyOutlined />}
                                        />
                                    </Col>
                                    <Col xs={12} sm={6}>
                                        <div className="text-center">
                                            <div className="text-gray-500 text-sm mb-1">Đánh giá</div>
                                            <div className="flex items-center justify-center">
                                                <Rate
                                                    disabled
                                                    defaultValue={coachProfile.professionalProfile.AverageRating}
                                                    allowHalf
                                                />
                                                <span className="ml-2 text-lg font-medium">
                                                    {coachProfile.professionalProfile.AverageRating}/5.0
                                                </span>
                                            </div>
                                            <div className="text-gray-500 text-xs">
                                                ({coachProfile.reviewsCount} đánh giá)
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            )}
                        </Card>
                    </Col>

                    {/* Basic Information */}
                    <Col xs={24} lg={12}>
                        <Card title={
                            <div className="flex items-center">
                                <UserOutlined className="mr-2" />
                                <span>Thông tin cơ bản</span>
                            </div>
                        } className="shadow-md h-full">
                            <Descriptions column={1} size="small">
                                <Descriptions.Item
                                    label={<span><MailOutlined className="mr-2" />Email</span>}
                                >
                                    {coachProfile.Email}
                                </Descriptions.Item>
                                <Descriptions.Item
                                    label={<span><PhoneOutlined className="mr-2" />Số điện thoại</span>}
                                >
                                    {coachProfile.PhoneNumber || 'Chưa cập nhật'}
                                </Descriptions.Item>
                                <Descriptions.Item
                                    label={<span><EnvironmentOutlined className="mr-2" />Địa chỉ</span>}
                                >
                                    {coachProfile.Address || 'Chưa cập nhật'}
                                </Descriptions.Item>
                                <Descriptions.Item
                                    label={<span><CalendarOutlined className="mr-2" />Ngày tham gia</span>}
                                >
                                    {new Date(coachProfile.CreatedAt).toLocaleDateString('vi-VN')}
                                </Descriptions.Item>
                                <Descriptions.Item
                                    label={<span><ClockCircleOutlined className="mr-2" />Lần đăng nhập cuối</span>}
                                >
                                    {coachProfile.LastLoginAt ?
                                        new Date(coachProfile.LastLoginAt).toLocaleString('vi-VN') :
                                        'Chưa có thông tin'
                                    }
                                </Descriptions.Item>
                                {coachProfile.professionalProfile && (
                                    <>
                                        <Descriptions.Item
                                            label={<span><GlobalOutlined className="mr-2" />Ngôn ngữ</span>}
                                        >
                                            {coachProfile.professionalProfile.Languages}
                                        </Descriptions.Item>
                                        <Descriptions.Item
                                            label={<span><ClockCircleOutlined className="mr-2" />Giờ làm việc</span>}
                                        >
                                            {coachProfile.professionalProfile.WorkingHours}
                                        </Descriptions.Item>
                                    </>
                                )}
                            </Descriptions>
                        </Card>
                    </Col>

                    {/* Professional Information */}
                    {coachProfile.professionalProfile && (
                        <Col xs={24} lg={12}>
                            <Card title={
                                <div className="flex items-center">
                                    <BookOutlined className="mr-2" />
                                    <span>Thông tin chuyên môn</span>
                                </div>
                            } className="shadow-md h-full">
                                <Descriptions column={1} size="small">
                                    <Descriptions.Item label="Chuyên môn">
                                        {coachProfile.professionalProfile.Specialization}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Giấy phép hành nghề">
                                        <Text code>{coachProfile.professionalProfile.License}</Text>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Website">
                                        <a href={coachProfile.professionalProfile.Website} target="_blank" rel="noopener noreferrer">
                                            {coachProfile.professionalProfile.Website}
                                        </a>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="LinkedIn">
                                        <a href={coachProfile.professionalProfile.LinkedIn} target="_blank" rel="noopener noreferrer">
                                            {coachProfile.professionalProfile.LinkedIn}
                                        </a>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Phí tư vấn">
                                        {coachProfile.professionalProfile.ConsultationFee?.toLocaleString()}đ
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Giá theo giờ">
                                        {coachProfile.professionalProfile.HourlyRate?.toLocaleString()}đ
                                    </Descriptions.Item>
                                </Descriptions>
                            </Card>
                        </Col>
                    )}

                    {/* Biography Section */}
                    {coachProfile.professionalProfile?.Bio && (
                        <Col span={24}>
                            <Card title={
                                <div className="flex items-center">
                                    <UserOutlined className="mr-2" />
                                    <span>Giới thiệu về tôi</span>
                                </div>
                            } className="shadow-md">
                                <Paragraph style={{ fontSize: '16px', lineHeight: '1.6' }}>
                                    {coachProfile.professionalProfile.Bio}
                                </Paragraph>
                            </Card>
                        </Col>
                    )}

                    {/* Methodology Section */}
                    {coachProfile.professionalProfile?.Methodology && (
                        <Col span={24}>
                            <Card title={
                                <div className="flex items-center">
                                    <BookOutlined className="mr-2" />
                                    <span>Phương pháp huấn luyện</span>
                                </div>
                            } className="shadow-md">
                                <Paragraph style={{ fontSize: '16px', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                                    {coachProfile.professionalProfile.Methodology}
                                </Paragraph>
                            </Card>
                        </Col>
                    )}

                    {/* Success Story Section */}
                    {coachProfile.professionalProfile?.SuccessStory && (
                        <Col span={24}>
                            <Card title={
                                <div className="flex items-center">
                                    <TrophyOutlined className="mr-2" />
                                    <span>Câu chuyện thành công</span>
                                </div>
                            } className="shadow-md">
                                <Alert
                                    message="Chia sẻ từ Coach"
                                    description={
                                        <Paragraph style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: 0 }}>
                                            {coachProfile.professionalProfile.SuccessStory}
                                        </Paragraph>
                                    }
                                    type="success"
                                    showIcon
                                />
                            </Card>
                        </Col>
                    )}

                    {/* Services Offered */}
                    {coachProfile.professionalProfile?.ServicesOffered && (
                        <Col span={24}>
                            <Card title={
                                <div className="flex items-center">
                                    <SettingOutlined className="mr-2" />
                                    <span>Dịch vụ cung cấp</span>
                                </div>
                            } className="shadow-md">
                                <Paragraph style={{ fontSize: '16px', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                                    {coachProfile.professionalProfile.ServicesOffered}
                                </Paragraph>
                            </Card>
                        </Col>
                    )}

                    {/* Education & Certifications */}
                    {coachProfile.professionalProfile && (
                        <Col span={24}>
                            <Card title={
                                <div className="flex items-center">
                                    <BookOutlined className="mr-2" />
                                    <span>Học vấn & Chứng chỉ</span>
                                </div>
                            } className="shadow-md">
                                <Row gutter={[24, 24]}>
                                    <Col xs={24} md={12}>
                                        <Title level={5}>🎓 Học vấn</Title>
                                        <Paragraph style={{ whiteSpace: 'pre-line' }}>
                                            {coachProfile.professionalProfile.Education}
                                        </Paragraph>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Title level={5}>📜 Chứng chỉ chuyên môn</Title>
                                        <Paragraph style={{ whiteSpace: 'pre-line' }}>
                                            {coachProfile.professionalProfile.Certifications}
                                        </Paragraph>
                                    </Col>
                                </Row>
                            </Card>
                        </Col>
                    )}

                    {/* Client Reviews */}
                    {coachProfile.reviews && coachProfile.reviews.length > 0 && (
                        <Col span={24}>
                            <Card title={
                                <div className="flex items-center">
                                    <StarOutlined className="mr-2" />
                                    <span>Đánh giá từ khách hàng</span>
                                    <Badge count={coachProfile.reviewsCount} className="ml-2" />
                                </div>
                            } className="shadow-md">
                                <Row gutter={[16, 16]}>
                                    {coachProfile.reviews.slice(0, 6).map((review, index) => (
                                        <Col xs={24} md={12} lg={8} key={index}>
                                            <Card size="small" className="h-full">
                                                <div className="mb-2">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <Text strong>{review.ClientName}</Text>
                                                        <Rate disabled defaultValue={review.Rating} />
                                                    </div>
                                                    <Text className="text-sm text-gray-500">
                                                        {new Date(review.CreatedAt).toLocaleDateString('vi-VN')}
                                                    </Text>
                                                </div>
                                                <Title level={5} style={{ fontSize: '14px', marginBottom: '8px' }}>
                                                    {review.ReviewTitle}
                                                </Title>
                                                <Paragraph
                                                    ellipsis={{ rows: 3, expandable: true, symbol: 'Xem thêm' }}
                                                    style={{ fontSize: '13px', marginBottom: 0 }}
                                                >
                                                    {review.ReviewContent}
                                                </Paragraph>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                                {coachProfile.reviews.length > 6 && (
                                    <div className="text-center mt-4">
                                        <Button type="link">Xem tất cả đánh giá ({coachProfile.reviewsCount})</Button>
                                    </div>
                                )}
                            </Card>
                        </Col>
                    )}
                </Row>
            )}
        </>
    );

    const renderMembers = () => (
        <Card title="Danh sách thành viên" className="shadow-md">
            <Table
                columns={memberColumns}
                dataSource={members}
                rowKey="id"
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} thành viên`,
                }}
                scroll={{ x: 800 }}
            />
        </Card>
    );

    const renderProgressTracking = () => {
        if (selectedMemberForProgress) {
            return (
                <MemberProgressTracking
                    memberId={selectedMemberForProgress}
                    onBack={() => setSelectedMemberForProgress(null)}
                />
            );
        }

        return (
            <Card title="Theo dõi tiến trình thành viên" className="shadow-md">
                <div className="mb-4">
                    <Text className="text-gray-600">
                        Chọn một thành viên để xem tiến trình chi tiết của họ
                    </Text>
                </div>

                {members.length > 0 ? (
                    <Table
                        columns={[
                            {
                                title: 'Thành viên',
                                dataIndex: 'fullName',
                                key: 'fullName',
                                render: (text, record) => (
                                    <div className="flex items-center">
                                        <Avatar
                                            src={record.avatar}
                                            icon={<UserOutlined />}
                                            className="mr-3"
                                        />
                                        <div>
                                            <div className="font-medium">{text}</div>
                                            <div className="text-gray-500 text-sm">{record.email}</div>
                                        </div>
                                    </div>
                                ),
                            },
                            {
                                title: 'Trạng thái',
                                dataIndex: 'isActive',
                                key: 'isActive',
                                render: (isActive) => (
                                    <Badge
                                        status={isActive ? 'success' : 'default'}
                                        text={isActive ? 'Hoạt động' : 'Không hoạt động'}
                                    />
                                ),
                            },
                            {
                                title: 'Hành động',
                                key: 'actions',
                                render: (_, record) => (
                                    <Button
                                        type="primary"
                                        icon={<BarChartOutlined />}
                                        onClick={() => setSelectedMemberForProgress(record.id)}
                                    >
                                        Xem tiến trình
                                    </Button>
                                ),
                            },
                        ]}
                        dataSource={members}
                        rowKey="id"
                        pagination={{
                            pageSize: 8,
                            showSizeChanger: false,
                            showQuickJumper: true,
                        }}
                        scroll={{ x: 600 }}
                    />
                ) : (
                    <Empty
                        description="Chưa có thành viên nào"
                        className="py-10"
                    />
                )}
            </Card>
        );
    };

    const renderAppointments = () => {
        return <AppointmentCalendar />;
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return renderDashboard();
            case 'profile':
                return renderProfile();
            case 'members':
                return renderMembers();
            case 'progress':
                return renderProgressTracking();
            case 'chat':
                return <CoachChat />;
            case 'appointments':
                return renderAppointments();
            case 'feedback':
                return <CoachFeedbackView />;
            default:
                return renderDashboard();
        }
    };

    const getPageTitle = () => {
        switch (activeTab) {
            case 'dashboard':
                return 'Dashboard';
            case 'profile':
                return 'Thông tin cá nhân';
            case 'members':
                return 'Quản lý thành viên';
            case 'progress':
                return 'Theo dõi tiến trình';
            case 'chat':
                return 'Chat';
            case 'appointments':
                return 'Lịch hẹn tư vấn';
            case 'feedback':
                return 'Đánh giá từ thành viên';
            default:
                return 'Dashboard';
        }
    };

    const getPageDescription = () => {
        switch (activeTab) {
            case 'dashboard':
                return `Chào mừng bạn trở lại, ${getCoachDisplayName()}! Đây là trang quản lý dành cho huấn luyện viên.`;
            case 'profile':
                return 'Xem và chỉnh sửa thông tin cá nhân, hồ sơ chuyên môn của bạn.';
            case 'members':
                return 'Quản lý và theo dõi tất cả thành viên trong hệ thống.';
            case 'progress':
                return 'Theo dõi tiến trình cai thuốc của các thành viên.';
            case 'chat':
                return 'Chat với các thành viên trong hệ thống.';
            case 'appointments':
                return 'Quản lý lịch hẹn tư vấn với các thành viên. Tạo, xem và theo dõi các cuộc hẹn.';
            case 'feedback':
                return 'Xem và quản lý tất cả đánh giá từ các thành viên đã tư vấn. Theo dõi thống kê và cải thiện chất lượng dịch vụ.';
            default:
                return `Chào mừng bạn trở lại, ${getCoachDisplayName()}! Đây là trang quản lý dành cho huấn luyện viên.`;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Layout className="min-h-screen">
                {/* Header */}
                <Header style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 24px'
                }}>
                    <div className="flex items-center">
                        <div className="flex items-center justify-center w-10 h-10 bg-white bg-opacity-20 rounded-lg mr-3">
                            <CrownOutlined className="text-white text-lg" />
                        </div>
                        <Title level={3} className="mb-0 text-white">
                            Coach Portal
                        </Title>
                    </div>

                    <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                        <div style={{
                            cursor: 'pointer',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            background: 'rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            transition: 'all 0.3s ease'
                        }}>
                            <Space>
                                <span className="text-white font-medium">{getCoachDisplayName()}</span>
                                <Avatar
                                    src={coachProfile?.Avatar}
                                    icon={!coachProfile?.Avatar && <UserOutlined />}
                                    style={{
                                        background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
                                        border: '2px solid rgba(255,255,255,0.3)'
                                    }}
                                />
                            </Space>
                        </div>
                    </Dropdown>
                </Header>

                <Layout>
                    {/* Sidebar */}
                    <Sider
                        collapsible
                        collapsed={collapsed}
                        onCollapse={setCollapsed}
                        className="bg-white shadow-lg"
                        width={250}
                    >
                        <div className="p-4">
                            {!collapsed && (
                                <div className="text-center mb-6">
                                    <Avatar
                                        size={64}
                                        src={coachProfile?.Avatar}
                                        icon={!coachProfile?.Avatar && <UserOutlined />}
                                        className="bg-gradient-to-r from-blue-500 to-purple-600"
                                    />
                                    <div className="mt-2">
                                        <Text strong className="text-gray-700">
                                            {getCoachDisplayName()}
                                        </Text>
                                        <br />
                                        <Text className="text-gray-500 text-sm">
                                            Huấn luyện viên
                                        </Text>
                                    </div>
                                </div>
                            )}
                        </div>

                        <Menu
                            mode="inline"
                            selectedKeys={[activeTab]}
                            items={sidebarMenuItems}
                            className="border-r-0"
                            onClick={({ key }) => setActiveTab(key)}
                        />
                    </Sider>

                    {/* Content */}
                    <Content className="p-6 bg-gray-50">
                        <div className="mb-6">
                            <Title level={2} className="text-gray-800">
                                {getPageTitle()}
                            </Title>
                            <Paragraph className="text-gray-600">
                                {getPageDescription()}
                            </Paragraph>
                        </div>

                        {renderContent()}
                    </Content>
                </Layout>
            </Layout>

            {/* Edit Profile Modal */}
            <Modal
                title={
                    <div className="flex items-center">
                        <EditOutlined className="mr-2" />
                        <span>Chỉnh sửa thông tin cá nhân</span>
                    </div>
                }
                open={editModalVisible}
                onCancel={handleCancelEdit}
                footer={null}
                width={800}
                style={{ top: 20 }}
            >
                <Form
                    form={editForm}
                    layout="vertical"
                    onFinish={handleSaveProfile}
                    className="mt-4"
                >
                    <div className="mb-6">
                        <Title level={4}>Thông tin cơ bản</Title>
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
                            <Col xs={24} sm={12}>
                                <Form.Item
                                    label="Số điện thoại"
                                    name="phoneNumber"
                                >
                                    <Input placeholder="Nhập số điện thoại" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item
                                    label="URL Avatar"
                                    name="avatar"
                                >
                                    <Input placeholder="Nhập URL avatar" />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    label="Địa chỉ"
                                    name="address"
                                >
                                    <Input placeholder="Nhập địa chỉ" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </div>

                    <div className="mb-6">
                        <Title level={4}>Thông tin chuyên môn</Title>
                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={12}>
                                <Form.Item
                                    label="Chuyên môn"
                                    name="specialization"
                                >
                                    <Input placeholder="Ví dụ: Addiction Recovery & Behavioral Therapy" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item
                                    label="Số năm kinh nghiệm"
                                    name="yearsOfExperience"
                                >
                                    <InputNumber min={0} placeholder="Ví dụ: 8" style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item
                                    label="Giấy phép hành nghề"
                                    name="license"
                                >
                                    <Input placeholder="Ví dụ: GP-2024-VN-001234" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item
                                    label="Ngôn ngữ"
                                    name="languages"
                                >
                                    <Input placeholder="Ví dụ: Tiếng Việt (bản ngữ), English (thành thạo)" />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    label="Học vấn"
                                    name="education"
                                >
                                    <TextArea rows={3} placeholder="Mô tả về học vấn và bằng cấp" />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    label="Chứng chỉ chuyên môn"
                                    name="certifications"
                                >
                                    <TextArea rows={3} placeholder="Liệt kê các chứng chỉ chuyên môn" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </div>

                    <div className="mb-6">
                        <Title level={4}>Giới thiệu & Phương pháp</Title>
                        <Row gutter={[16, 16]}>
                            <Col span={24}>
                                <Form.Item
                                    label="Giới thiệu bản thân"
                                    name="bio"
                                >
                                    <TextArea rows={4} placeholder="Viết giới thiệu về bản thân và triết lý làm việc" />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    label="Phương pháp làm việc"
                                    name="methodology"
                                >
                                    <TextArea rows={4} placeholder="Mô tả phương pháp và kỹ thuật áp dụng" />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    label="Câu chuyện thành công"
                                    name="successStory"
                                >
                                    <TextArea rows={4} placeholder="Chia sẻ một câu chuyện thành công điển hình" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </div>

                    <div className="mb-6">
                        <Title level={4}>Thông tin liên hệ & Dịch vụ</Title>
                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={12}>
                                <Form.Item
                                    label="Website"
                                    name="website"
                                >
                                    <Input placeholder="https://your-website.com" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item
                                    label="LinkedIn"
                                    name="linkedin"
                                >
                                    <Input placeholder="https://linkedin.com/in/your-profile" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item
                                    label="Phí tư vấn (VNĐ)"
                                    name="consultationFee"
                                >
                                    <InputNumber
                                        min={0}
                                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                        placeholder="200000"
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item
                                    label="Giá theo giờ (VNĐ)"
                                    name="hourlyRate"
                                >
                                    <InputNumber
                                        min={0}
                                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                        placeholder="750000"
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    label="Giờ làm việc"
                                    name="workingHours"
                                >
                                    <Input placeholder="Ví dụ: Thứ 2-6: 8:00-17:00, Thứ 7: 9:00-15:00" />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    label="Dịch vụ cung cấp"
                                    name="servicesOffered"
                                >
                                    <TextArea rows={3} placeholder="Liệt kê các dịch vụ bạn cung cấp" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button onClick={handleCancelEdit} icon={<CloseOutlined />}>
                            Hủy
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={editLoading}
                            icon={<SaveOutlined />}
                        >
                            Lưu thay đổi
                        </Button>
                    </div>
                </Form>
            </Modal>

            {/* Member Details Modal */}
            <MemberDetailsModal
                visible={memberDetailsVisible}
                onClose={() => {
                    setMemberDetailsVisible(false);
                    setSelectedMember(null);
                    setMemberDetails(null);
                }}
                memberDetails={memberDetails}
                loading={memberDetailsLoading}
                selectedMember={selectedMember}
            />
        </>
    );
};

export default CoachDashboard; 