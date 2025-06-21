import React, { useState, useEffect } from 'react';
import {
    Card,
    Row,
    Col,
    Typography,
    Table,
    Tag,
    Statistic,
    Progress,
    Button,
    Space,
    Badge,
    Empty,
    Tabs,
    List,
    Timeline,
    Modal,
    Form,
    Input,
    Slider,
    DatePicker,
    message,
    Alert,
    Divider
} from 'antd';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title as ChartTitle,
    Tooltip as ChartTooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import {
    TrophyOutlined,
    BarChartOutlined,
    CalendarOutlined,
    DollarOutlined,
    FireOutlined,
    CheckCircleOutlined,
    PlusOutlined,
    EditOutlined,
    HeartOutlined,
    SmileOutlined,
    ThunderboltOutlined,
    BookOutlined,
    DashboardOutlined,
    UserOutlined,
    WarningOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import AccessGuard from '../common/AccessGuard';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ChartTitle,
    ChartTooltip,
    Legend,
    Filler
);

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const ProgressTracking = () => {
    const [loading, setLoading] = useState(true);
    const [progressData, setProgressData] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [quitPlan, setQuitPlan] = useState(null);
    const [smokingStatus, setSmokingStatus] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [addForm] = Form.useForm();

    // Add membership status state
    const [membershipStatus, setMembershipStatus] = useState(null);
    const [membershipLoading, setMembershipLoading] = useState(true);

    useEffect(() => {
        // Check membership status first before loading any data
        checkMembershipStatus();
    }, []);

    const checkMembershipStatus = async () => {
        try {
            setMembershipLoading(true);
            const token = localStorage.getItem('memberToken') || localStorage.getItem('token');

            const response = await axios.get('http://localhost:4000/api/membership/current', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success && response.data.data) {
                const membership = response.data.data;

                // Check if membership is active and not expired
                const isActive = membership.Status === 'active' &&
                    new Date(membership.EndDate) > new Date();

                setMembershipStatus({
                    isActive,
                    status: membership.Status,
                    endDate: membership.EndDate,
                    planName: membership.Name
                });

                // Only load progress data if membership is active
                if (isActive) {
                    loadProgressData();
                    loadAchievements();
                    loadQuitPlan();
                    loadSmokingStatus();
                }
            } else {
                // No active membership
                setMembershipStatus({
                    isActive: false,
                    status: null,
                    endDate: null,
                    planName: null
                });
            }
        } catch (error) {
            console.error('Error checking membership status:', error);
            setMembershipStatus({
                isActive: false,
                status: null,
                endDate: null,
                planName: null
            });
        } finally {
            setMembershipLoading(false);
            setLoading(false);
        }
    };

    const loadProgressData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('memberToken') || localStorage.getItem('token');

            // Load progress summary data
            const summaryResponse = await axios.get('http://localhost:4000/api/progress/summary', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Load progress range data (last 30 days)
            const rangeResponse = await axios.get('http://localhost:4000/api/progress/range', {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                params: {
                    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    endDate: new Date().toISOString().split('T')[0]
                }
            });

            // Load streak information
            const streakResponse = await axios.get('http://localhost:4000/api/progress/streak', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (summaryResponse.data.success) {
                // Set summary data for stats display
                const summaryData = summaryResponse.data.data;
                setSmokingStatus({
                    totalDaysTracked: summaryData.TotalDaysTracked || 0,
                    smokeFreeDays: summaryData.SmokeFreeDays || 0,
                    totalMoneySaved: summaryData.TotalMoneySaved || 0,
                    averageCravingLevel: summaryData.AverageCravingLevel || 0,
                    currentStreak: streakResponse.data.success ? streakResponse.data.data.currentStreak || 0 : 0,
                    longestStreak: streakResponse.data.success ? streakResponse.data.data.longestStreak || 0 : 0,
                    cigarettesNotSmoked: summaryData.CigarettesNotSmoked || 0,
                    smokeFreePercentage: summaryData.SmokeFreePercentage || 0
                });
            }

            if (rangeResponse.data.success) {
                // Set progress data for charts and daily tracking
                setProgressData(rangeResponse.data.data || []);
            }

        } catch (error) {
            console.error('Error loading progress data:', error);

            // Only show warning if it's a specific permission error
            if (error.response?.status === 403) {
                message.warning('Bạn cần có gói dịch vụ được xác nhận để xem tiến trình chi tiết. Hiển thị dữ liệu trống...');
            } else {
                message.warning('Không thể kết nối server. Dữ liệu sẽ hiển thị 0 cho đến khi bạn ghi nhận tiến trình đầu tiên...');
            }

            // Show empty/zero data instead of demo data when no real progress exists
            setProgressData([]);

            // Set empty smoking status - no fake demo data
            setSmokingStatus({
                totalDaysTracked: 0,
                smokeFreeDays: 0,
                totalMoneySaved: 0,
                averageCravingLevel: 0,
                currentStreak: 0,
                longestStreak: 0,
                cigarettesNotSmoked: 0,
                smokeFreePercentage: 0
            });
        } finally {
            setLoading(false);
        }
    };

    const loadAchievements = async () => {
        try {
            const token = localStorage.getItem('memberToken') || localStorage.getItem('token');

            const response = await axios.get('http://localhost:4000/api/achievements/user', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                setAchievements(response.data.data || []);
            }
        } catch (error) {
            console.error('Error loading achievements:', error);
            // Show empty achievements instead of mock data
            setAchievements([]);
        }
    };

    const loadQuitPlan = async () => {
        try {
            const token = localStorage.getItem('memberToken') || localStorage.getItem('token');

            const response = await axios.get('http://localhost:4000/api/plans/current', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success && response.data.data) {
                setQuitPlan(response.data.data);
            }
        } catch (error) {
            console.error('Error loading quit plan:', error);
            // Set null as fallback
            setQuitPlan(null);
        }
    };

    const loadSmokingStatus = async () => {
        try {
            const token = localStorage.getItem('memberToken') || localStorage.getItem('token');

            // Try multiple endpoints to get smoking status
            let response;
            try {
                response = await axios.get('http://localhost:4000/api/users/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.data.success) {
                    setSmokingStatus(response.data.data.smokingStatus);
                    return;
                }
            } catch (profileError) {
                console.log('Profile endpoint failed, trying smoking-status endpoint...');
            }

            // Fallback to smoking-status endpoint
            try {
                response = await axios.get('http://localhost:4000/api/users/smoking-status', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.data.success) {
                    setSmokingStatus(response.data.data);
                }
            } catch (smokingError) {
                console.log('Smoking status endpoint failed');
                setSmokingStatus(null);
            }
        } catch (error) {
            console.error('Error loading smoking status:', error);
            setSmokingStatus(null);
        }
    };

    const handleAddProgress = async (values) => {
        try {
            const token = localStorage.getItem('memberToken') || localStorage.getItem('token');

            const progressEntry = {
                date: values.date.format('YYYY-MM-DD'),
                cigarettesSmoked: values.cigarettesSmoked || 0,
                cravingLevel: values.cravingLevel || 1,
                emotionNotes: values.emotionNotes || ''
            };

            const response = await axios.post('http://localhost:4000/api/progress', progressEntry, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                message.success('Đã thêm dữ liệu tiến trình thành công!');

                // Show achievement notifications if any
                if (response.data.achievements?.newAchievements?.length > 0) {
                    response.data.achievements.newAchievements.forEach(achievement => {
                        message.success(`🏆 Chúc mừng! Bạn đã đạt thành tích: ${achievement.Name}`, 5);
                    });
                }

                setIsAddModalVisible(false);
                addForm.resetFields();
                loadProgressData();
                loadAchievements(); // Reload achievements as new progress might trigger new ones
            } else {
                message.error(response.data.message || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Error adding progress:', error);

            if (error.response?.status === 403) {
                message.error('Bạn cần có gói dịch vụ được xác nhận để ghi nhận tiến trình');
                return;
            }

            message.warning('Không thể kết nối server. Dữ liệu sẽ được lưu tạm thời...');

            // Add to local state when server is not available
            const newEntry = {
                Date: values.date.format('YYYY-MM-DD'),
                CigarettesSmoked: values.cigarettesSmoked || 0,
                CravingLevel: values.cravingLevel || 1,
                EmotionNotes: values.emotionNotes || '',
                MoneySaved: calculateMoneySaved(values.cigarettesSmoked || 0),
                DaysSmokeFree: calculateDaysSmokeFree(values.cigarettesSmoked || 0),
                CreatedAt: new Date().toISOString()
            };

            setProgressData(prev => [newEntry, ...prev]);
            setIsAddModalVisible(false);
            addForm.resetFields();
        }
    };

    const calculateMoneySaved = (cigarettesSmoked) => {
        // Use standard values based on Vietnamese market
        // Standard: 1 pack = 20 cigarettes = 30,000 VNĐ → 1 cigarette = 1,500 VNĐ
        // Baseline: Average person smokes at least half pack per day = 10 cigarettes
        const standardCigarettePrice = smokingStatus?.CigarettePrice || smokingStatus?.cigarettePrice || 1500;
        const baselineCigarettesPerDay = smokingStatus?.CigarettesPerDay || smokingStatus?.cigarettesPerDay || 10;

        const dailyBudget = baselineCigarettesPerDay * standardCigarettePrice;
        const actualSpent = cigarettesSmoked * standardCigarettePrice;
        return Math.max(0, dailyBudget - actualSpent);
    };

    const calculateDaysSmokeFree = (cigarettesSmoked) => {
        if (cigarettesSmoked === 0) {
            // Count consecutive smoke-free days
            let consecutiveDays = 1;
            for (let i = 0; i < progressData.length; i++) {
                if (progressData[i].CigarettesSmoked === 0) {
                    consecutiveDays++;
                } else {
                    break;
                }
            }
            return consecutiveDays;
        }
        return 0;
    };

    const getProgressStats = () => {
        // Use smokingStatus data if available (from API summary)
        if (smokingStatus) {
            return {
                totalDays: smokingStatus.totalDaysTracked || 0,
                smokFreeDays: smokingStatus.smokeFreeDays || 0,
                totalMoneySaved: smokingStatus.totalMoneySaved || 0,
                averageCraving: smokingStatus.averageCravingLevel || 0,
                currentStreak: smokingStatus.currentStreak || 0,
                longestStreak: smokingStatus.longestStreak || 0,
                cigarettesNotSmoked: smokingStatus.cigarettesNotSmoked || 0,
                smokeFreePercentage: smokingStatus.smokeFreePercentage || 0
            };
        }

        // Fallback to calculating from progressData if smokingStatus is not available
        if (!progressData.length) {
            return {
                totalDays: 0,
                smokFreeDays: 0,
                totalMoneySaved: 0,
                averageCraving: 0,
                currentStreak: 0,
                longestStreak: 0,
                cigarettesNotSmoked: 0,
                smokeFreePercentage: 0
            };
        }

        const totalDays = progressData.length;
        const smokFreeDays = progressData.filter(p => p.CigarettesSmoked === 0).length;
        const totalMoneySaved = progressData.reduce((sum, p) => sum + (p.MoneySaved || 0), 0);
        const averageCraving = progressData.reduce((sum, p) => sum + (p.CravingLevel || 0), 0) / totalDays;

        // Calculate current streak
        let currentStreak = 0;
        for (const progress of progressData) {
            if (progress.CigarettesSmoked === 0) {
                currentStreak++;
            } else {
                break;
            }
        }

        return {
            totalDays,
            smokFreeDays,
            totalMoneySaved,
            averageCraving: Math.round(averageCraving * 10) / 10,
            currentStreak,
            longestStreak: currentStreak, // Simple approximation
            cigarettesNotSmoked: 0, // Would need baseline data to calculate
            smokeFreePercentage: totalDays > 0 ? (smokFreeDays / totalDays * 100) : 0
        };
    };

    const createChartData = (dataKey, label, color) => {
        const labels = progressData.slice(0, 30).reverse().map(item =>
            dayjs(item.Date).format('DD/MM')
        );
        const values = progressData.slice(0, 30).reverse().map(item => item[dataKey] || 0);

        return {
            labels,
            datasets: [
                {
                    label,
                    data: values,
                    borderColor: color,
                    backgroundColor: color + '20',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                }
            ]
        };
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                mode: 'index',
                intersect: false,
            },
        },
        scales: {
            x: {
                display: true,
                title: {
                    display: true,
                    text: 'Ngày'
                }
            },
            y: {
                display: true,
                title: {
                    display: true,
                    text: 'Giá trị'
                },
                beginAtZero: true
            }
        },
        interaction: {
            intersect: false,
            mode: 'index',
        },
    };

    const progressColumns = [
        {
            title: 'Ngày',
            dataIndex: 'Date',
            key: 'Date',
            render: (date) => dayjs(date).format('DD/MM/YYYY'),
        },
        {
            title: 'Thuốc hút',
            dataIndex: 'CigarettesSmoked',
            key: 'CigarettesSmoked',
            render: (count) => (
                <Tag color={count === 0 ? 'green' : count <= 2 ? 'orange' : 'red'}>
                    {count || 0} điếu
                </Tag>
            ),
        },
        {
            title: 'Mức thèm',
            dataIndex: 'CravingLevel',
            key: 'CravingLevel',
            render: (level) => (
                <div>
                    <Progress
                        percent={(level || 0) * 10}
                        size="small"
                        status={level <= 3 ? 'success' : level <= 6 ? 'normal' : 'exception'}
                        format={() => `${level || 0}/10`}
                    />
                </div>
            ),
        },
        {
            title: 'Tiền tiết kiệm',
            dataIndex: 'MoneySaved',
            key: 'MoneySaved',
            render: (amount) => `${(amount || 0).toLocaleString('vi-VN')} ₫`,
        },
        {
            title: 'Ghi chú',
            dataIndex: 'EmotionNotes',
            key: 'EmotionNotes',
            render: (notes) => notes || '-',
        },
    ];

    const stats = getProgressStats();

    // If membership is not active, show membership required message
    if (membershipLoading) {
        return (
            <div className="p-6">
                <Card loading={true}>
                    <div className="text-center py-8">
                        <Text>Đang kiểm tra trạng thái membership...</Text>
                    </div>
                </Card>
            </div>
        );
    }

    if (!membershipStatus?.isActive) {
        return (
            <div className="p-6">
                <Alert
                    message="🚫 Không thể xem tiến trình"
                    description={
                        <div>
                            <p>Gói membership của bạn đã hết hạn hoặc bị hủy. Tiến trình theo dõi không còn khả dụng.</p>
                            {membershipStatus?.status === 'expired' && (
                                <p className="mt-2">
                                    <strong>Trạng thái:</strong> Đã hết hạn vào {dayjs(membershipStatus.endDate).format('DD/MM/YYYY')}
                                </p>
                            )}
                            {membershipStatus?.status === 'cancelled' && (
                                <p className="mt-2">
                                    <strong>Trạng thái:</strong> Gói đã bị hủy
                                </p>
                            )}
                            <p className="mt-2">
                                Vui lòng mua gói mới để tiếp tục theo dõi tiến trình cai thuốc.
                            </p>
                        </div>
                    }
                    type="warning"
                    showIcon
                    className="mb-6"
                />

                <Card>
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <div className="text-center">
                                <Text type="secondary">Không có dữ liệu tiến trình</Text>
                                <br />
                                <Text type="secondary" className="text-sm">
                                    Dữ liệu sẽ được ẩn khi membership không còn active
                                </Text>
                            </div>
                        }
                    />
                </Card>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <Text>Đang tải dữ liệu...</Text>
                </div>
            </div>
        );
    }

    return (
        <AccessGuard feature="Theo dõi tiến trình cai thuốc">
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '32px 16px'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    {/* No Data Notice */}
                    {(!progressData || progressData.length === 0) && (
                        <div style={{
                            background: 'rgba(59, 130, 246, 0.15)',
                            borderRadius: '16px',
                            padding: '20px',
                            marginBottom: '24px',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                            backdropFilter: 'blur(20px)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
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
                                    <div>
                                        <Text style={{
                                            color: 'white',
                                            fontWeight: 600,
                                            display: 'block'
                                        }}>
                                            Chưa có dữ liệu tiến trình
                                        </Text>
                                        <Text style={{
                                            color: 'rgba(255, 255, 255, 0.8)',
                                            fontSize: '12px'
                                        }}>
                                            Bạn chưa ghi nhận tiến trình cai thuốc nào. Hãy bắt đầu bằng cách thêm dữ liệu hôm nay!
                                        </Text>
                                    </div>
                                </div>
                                <Button
                                    type="primary"
                                    onClick={() => setIsAddModalVisible(true)}
                                    style={{
                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: 600
                                    }}
                                >
                                    Thêm ngay
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Header */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '20px',
                        padding: '32px',
                        marginBottom: '32px',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: '16px',
                                    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
                                }}>
                                    <BarChartOutlined style={{ fontSize: '24px', color: 'white' }} />
                                </div>
                                <div>
                                    <Title level={2} style={{
                                        margin: 0,
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        backgroundClip: 'text',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        fontWeight: 700
                                    }}>
                                        Tiến trình cai thuốc của tôi
                                    </Title>
                                    <Text style={{
                                        color: '#6b7280',
                                        fontSize: '16px',
                                        fontWeight: 500
                                    }}>
                                        Theo dõi và quản lý hành trình cai thuốc
                                    </Text>
                                </div>
                            </div>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => setIsAddModalVisible(true)}
                                size="large"
                                style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    height: '48px',
                                    paddingInline: '24px',
                                    fontSize: '16px',
                                    fontWeight: 600
                                }}
                            >
                                Thêm dữ liệu hôm nay
                            </Button>
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
                        <Col xs={24} sm={12} md={6}>
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.95)',
                                borderRadius: '16px',
                                padding: '24px',
                                textAlign: 'center',
                                backdropFilter: 'blur(20px)',
                                boxShadow: '0 8px 32px rgba(239, 68, 68, 0.2)',
                                border: '1px solid rgba(239, 68, 68, 0.1)',
                                transition: 'transform 0.3s ease'
                            }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 16px',
                                    boxShadow: '0 8px 24px rgba(239, 68, 68, 0.3)'
                                }}>
                                    <HeartOutlined style={{ fontSize: '24px', color: 'white' }} />
                                </div>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: '#dc2626', marginBottom: '8px' }}>
                                    {stats.cigarettesNotSmoked}
                                </div>
                                <Text style={{ color: '#374151', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                                    Điếu thuốc tránh được
                                </Text>
                                <Text style={{ fontSize: '12px', color: '#6b7280' }}>
                                    {stats.totalDays > 0 ? `Trong ${stats.totalDays} ngày theo dõi` : 'Chưa có dữ liệu theo dõi'}
                                </Text>
                            </div>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.95)',
                                borderRadius: '16px',
                                padding: '24px',
                                textAlign: 'center',
                                backdropFilter: 'blur(20px)',
                                boxShadow: '0 8px 32px rgba(59, 130, 246, 0.2)',
                                border: '1px solid rgba(59, 130, 246, 0.1)',
                                transition: 'transform 0.3s ease'
                            }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 16px',
                                    boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)'
                                }}>
                                    <CalendarOutlined style={{ fontSize: '24px', color: 'white' }} />
                                </div>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: '#1d4ed8', marginBottom: '8px' }}>
                                    {stats.totalDays}
                                </div>
                                <Text style={{ color: '#374151', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                                    Tổng ngày theo dõi
                                </Text>
                                <Text style={{ fontSize: '12px', color: '#6b7280' }}>
                                    Ngày smoke-free: {stats.smokFreeDays}
                                </Text>
                            </div>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.95)',
                                borderRadius: '16px',
                                padding: '24px',
                                textAlign: 'center',
                                backdropFilter: 'blur(20px)',
                                boxShadow: '0 8px 32px rgba(16, 185, 129, 0.2)',
                                border: '1px solid rgba(16, 185, 129, 0.1)',
                                transition: 'transform 0.3s ease'
                            }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 16px',
                                    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)'
                                }}>
                                    <DollarOutlined style={{ fontSize: '24px', color: 'white' }} />
                                </div>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: '#059669', marginBottom: '8px' }}>
                                    {Math.round(stats.totalMoneySaved / 1000)}K
                                </div>
                                <Text style={{ color: '#374151', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                                    Tiền tiết kiệm
                                </Text>
                                <Text style={{ fontSize: '12px', color: '#6b7280' }}>
                                    {stats.totalDays > 0 ?
                                        `TB ${Math.round(stats.totalMoneySaved / stats.totalDays).toLocaleString()} ₫/ngày` :
                                        'Chưa có dữ liệu'
                                    }
                                </Text>
                            </div>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.95)',
                                borderRadius: '16px',
                                padding: '24px',
                                textAlign: 'center',
                                backdropFilter: 'blur(20px)',
                                boxShadow: '0 8px 32px rgba(139, 92, 246, 0.2)',
                                border: '1px solid rgba(139, 92, 246, 0.1)',
                                transition: 'transform 0.3s ease'
                            }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    background: stats.averageCraving <= 3
                                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                        : stats.averageCraving <= 6
                                            ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                                            : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 16px',
                                    boxShadow: stats.averageCraving <= 3
                                        ? '0 8px 24px rgba(16, 185, 129, 0.3)'
                                        : stats.averageCraving <= 6
                                            ? '0 8px 24px rgba(251, 191, 36, 0.3)'
                                            : '0 8px 24px rgba(239, 68, 68, 0.3)'
                                }}>
                                    <span style={{ fontSize: '20px', color: 'white', fontWeight: 700 }}>
                                        {stats.averageCraving}/10
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: '28px',
                                    fontWeight: 700,
                                    color: stats.averageCraving <= 3 ? '#059669' :
                                        stats.averageCraving <= 6 ? '#f59e0b' : '#dc2626',
                                    marginBottom: '8px'
                                }}>
                                    {stats.averageCraving}
                                </div>
                                <Text style={{ color: '#374151', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                                    Mức thèm trung bình
                                </Text>
                                <Text style={{ fontSize: '12px', color: '#6b7280' }}>
                                    Chuỗi hiện tại: {stats.currentStreak} ngày
                                </Text>
                            </div>
                        </Col>
                    </Row>

                    {/* Main Content */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '20px',
                        padding: '32px',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                        <Tabs
                            activeKey={activeTab}
                            onChange={setActiveTab}
                            style={{
                                '& .ant-tabs-card .ant-tabs-content': {
                                    marginTop: '16px'
                                },
                                '& .ant-tabs-card > .ant-tabs-nav .ant-tabs-tab': {
                                    borderRadius: '12px 12px 0 0',
                                    border: '1px solid rgba(0, 0, 0, 0.1)',
                                    background: 'rgba(255, 255, 255, 0.5)'
                                },
                                '& .ant-tabs-card > .ant-tabs-nav .ant-tabs-tab-active': {
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    borderColor: 'transparent',
                                    color: 'white'
                                }
                            }}
                        >
                            {/* Overview Tab */}
                            <Tabs.TabPane tab="Tổng quan" key="overview">
                                <Row gutter={[24, 24]}>
                                    {/* Current Status */}
                                    <Col xs={24} md={12}>
                                        <div style={{
                                            background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
                                            borderRadius: '16px',
                                            padding: '24px',
                                            height: '100%',
                                            border: '1px solid rgba(239, 68, 68, 0.2)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                                                <HeartOutlined style={{
                                                    fontSize: '20px',
                                                    color: '#dc2626',
                                                    marginRight: '8px'
                                                }} />
                                                <Title level={4} style={{
                                                    margin: 0,
                                                    color: '#dc2626',
                                                    fontWeight: 600
                                                }}>
                                                    Tình trạng hiện tại
                                                </Title>
                                            </div>

                                            <Row gutter={[16, 16]}>
                                                <Col span={12}>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{
                                                            width: '60px',
                                                            height: '60px',
                                                            borderRadius: '50%',
                                                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            margin: '0 auto 8px',
                                                            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)'
                                                        }}>
                                                            <span style={{
                                                                fontSize: '20px',
                                                                color: 'white',
                                                                fontWeight: 700
                                                            }}>
                                                                {stats.currentStreak}
                                                            </span>
                                                        </div>
                                                        <Text style={{ color: '#374151', fontWeight: 600, fontSize: '12px' }}>
                                                            Ngày không hút
                                                        </Text>
                                                    </div>
                                                </Col>
                                                <Col span={12}>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{
                                                            width: '60px',
                                                            height: '60px',
                                                            borderRadius: '50%',
                                                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            margin: '0 auto 8px',
                                                            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)'
                                                        }}>
                                                            <span style={{
                                                                fontSize: '16px',
                                                                color: 'white',
                                                                fontWeight: 700
                                                            }}>
                                                                {stats.averageCraving}/10
                                                            </span>
                                                        </div>
                                                        <Text style={{ color: '#374151', fontWeight: 600, fontSize: '12px' }}>
                                                            Mức thèm TB
                                                        </Text>
                                                    </div>
                                                </Col>
                                            </Row>

                                            {quitPlan && (
                                                <div style={{
                                                    background: 'rgba(255, 255, 255, 0.8)',
                                                    borderRadius: '12px',
                                                    padding: '16px',
                                                    marginTop: '20px'
                                                }}>
                                                    <Text style={{ fontWeight: 600, color: '#374151', display: 'block', marginBottom: '12px' }}>
                                                        Kế hoạch cai thuốc:
                                                    </Text>
                                                    <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                                                        <div style={{ marginBottom: '4px' }}>📅 Bắt đầu: {dayjs(quitPlan.StartDate).format('DD/MM/YYYY')}</div>
                                                        <div style={{ marginBottom: '4px' }}>🎯 Mục tiêu: {dayjs(quitPlan.TargetDate).format('DD/MM/YYYY')}</div>
                                                        <div>💪 Động lực: {quitPlan.MotivationLevel}/10</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </Col>

                                    {/* Achievements */}
                                    <Col xs={24} md={12}>
                                        <div style={{
                                            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                                            borderRadius: '16px',
                                            padding: '24px',
                                            height: '100%',
                                            border: '1px solid rgba(245, 158, 11, 0.2)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                                                <TrophyOutlined style={{
                                                    fontSize: '20px',
                                                    color: '#f59e0b',
                                                    marginRight: '8px'
                                                }} />
                                                <Title level={4} style={{
                                                    margin: 0,
                                                    color: '#f59e0b',
                                                    fontWeight: 600
                                                }}>
                                                    Thành tích gần đây
                                                </Title>
                                            </div>

                                            {achievements.length > 0 ? (
                                                <div>
                                                    {achievements.slice(0, 3).map((achievement, index) => (
                                                        <div key={index} style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            background: 'rgba(255, 255, 255, 0.6)',
                                                            borderRadius: '8px',
                                                            padding: '12px',
                                                            marginBottom: '8px'
                                                        }}>
                                                            <div style={{
                                                                width: '32px',
                                                                height: '32px',
                                                                borderRadius: '50%',
                                                                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                marginRight: '12px'
                                                            }}>
                                                                <TrophyOutlined style={{ fontSize: '16px', color: 'white' }} />
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 600, fontSize: '14px', color: '#374151' }}>
                                                                    {achievement.Name}
                                                                </div>
                                                                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                                                    {dayjs(achievement.EarnedAt).format('DD/MM/YYYY')}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <Empty
                                                    description="Chưa có thành tích nào"
                                                    style={{ padding: '20px' }}
                                                />
                                            )}
                                        </div>
                                    </Col>
                                </Row>
                            </Tabs.TabPane>

                            {/* Charts Tab */}
                            <Tabs.TabPane tab="Biểu đồ" key="charts">
                                {progressData.length > 0 ? (
                                    <Row gutter={[16, 16]}>
                                        <Col span={24}>
                                            <Card title="Số lượng thuốc hút theo ngày (30 ngày gần nhất)" style={{ marginBottom: 16 }}>
                                                <div style={{ height: '300px' }}>
                                                    <Line
                                                        data={createChartData('CigarettesSmoked', 'Số điếu thuốc', '#ff4d4f')}
                                                        options={chartOptions}
                                                    />
                                                </div>
                                            </Card>
                                        </Col>
                                        <Col span={24}>
                                            <Card title="Mức độ thèm thuốc theo ngày">
                                                <div style={{ height: '300px' }}>
                                                    <Line
                                                        data={createChartData('CravingLevel', 'Mức độ thèm (1-10)', '#faad14')}
                                                        options={{
                                                            ...chartOptions,
                                                            scales: {
                                                                ...chartOptions.scales,
                                                                y: {
                                                                    ...chartOptions.scales.y,
                                                                    max: 10
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </Card>
                                        </Col>
                                    </Row>
                                ) : (
                                    <Empty
                                        description="Chưa có dữ liệu để hiển thị biểu đồ"
                                        style={{ padding: '40px' }}
                                    />
                                )}
                            </Tabs.TabPane>

                            {/* Progress Log Tab */}
                            <Tabs.TabPane tab="Nhật ký tiến trình" key="progress">
                                <Card title="Dữ liệu theo dõi hàng ngày">
                                    {progressData.length > 0 ? (
                                        <Table
                                            columns={progressColumns}
                                            dataSource={progressData}
                                            rowKey={(record, index) => `progress-${index}`}
                                            pagination={{
                                                pageSize: 10,
                                                showSizeChanger: true,
                                                showQuickJumper: true,
                                                showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} bản ghi`,
                                            }}
                                            scroll={{ x: 800 }}
                                        />
                                    ) : (
                                        <Empty
                                            description="Chưa có dữ liệu theo dõi"
                                            style={{ padding: '40px' }}
                                        />
                                    )}
                                </Card>
                            </Tabs.TabPane>

                            {/* Achievements Tab */}
                            <Tabs.TabPane tab="Thành tích" key="achievements">
                                <Card title="Danh sách thành tích đã đạt được">
                                    {achievements.length > 0 ? (
                                        <List
                                            grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
                                            dataSource={achievements}
                                            renderItem={achievement => (
                                                <List.Item>
                                                    <Card
                                                        hoverable
                                                        style={{ textAlign: 'center' }}
                                                    >
                                                        <div style={{ fontSize: '32px', marginBottom: 8 }}>
                                                            🏆
                                                        </div>
                                                        <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                                                            {achievement.Name}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#666', marginBottom: 8 }}>
                                                            {achievement.Description}
                                                        </div>
                                                        <Tag color="gold">
                                                            {dayjs(achievement.EarnedAt).format('DD/MM/YYYY')}
                                                        </Tag>
                                                    </Card>
                                                </List.Item>
                                            )}
                                        />
                                    ) : (
                                        <Empty
                                            description="Chưa có thành tích nào"
                                            style={{ padding: '40px' }}
                                        />
                                    )}
                                </Card>
                            </Tabs.TabPane>
                        </Tabs>
                    </div>
                </div>

                {/* Add Progress Modal */}
                <Modal
                    title="Thêm dữ liệu tiến trình hôm nay"
                    open={isAddModalVisible}
                    onCancel={() => setIsAddModalVisible(false)}
                    footer={null}
                    width={600}
                >
                    <Form
                        form={addForm}
                        layout="vertical"
                        onFinish={handleAddProgress}
                        initialValues={{
                            date: dayjs(),
                            cigarettesSmoked: 0,
                            cravingLevel: 1
                        }}
                    >
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="date"
                                    label="Ngày"
                                    rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
                                >
                                    <DatePicker style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="cigarettesSmoked"
                                    label="Số điếu thuốc đã hút"
                                >
                                    <Slider
                                        min={0}
                                        max={50}
                                        marks={{
                                            0: '0',
                                            10: '10',
                                            20: '20',
                                            50: '50+'
                                        }}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            name="cravingLevel"
                            label="Mức độ thèm thuốc (1-10)"
                        >
                            <Slider
                                min={1}
                                max={10}
                                marks={{
                                    1: '1',
                                    3: '3',
                                    5: '5',
                                    7: '7',
                                    10: '10'
                                }}
                            />
                        </Form.Item>

                        <Form.Item
                            name="emotionNotes"
                            label="Cảm xúc hôm nay"
                        >
                            <TextArea
                                placeholder="Ví dụ: Hôm nay tôi cảm thấy khó khăn vì stress công việc..."
                                rows={3}
                            />
                        </Form.Item>

                        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                            <Space>
                                <Button onClick={() => setIsAddModalVisible(false)}>
                                    Hủy
                                </Button>
                                <Button type="primary" htmlType="submit">
                                    Lưu tiến trình
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </AccessGuard>
    );
};

export default ProgressTracking; 