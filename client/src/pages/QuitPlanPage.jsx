import React, { useState, useEffect } from 'react';
import {
    Form,
    Input,
    Button,
    Card,
    Typography,
    message,
    Spin,
    DatePicker,
    InputNumber,
    Alert,
    Space,
    Divider,
    Row,
    Col,
    List,
    Tag,
    Tabs,
    Progress,
    Statistic,
    notification,
    Badge,
    Steps,
    Checkbox
} from 'antd';
import {
    CalendarOutlined,
    HeartOutlined,
    BulbOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    PlusOutlined,
    BookOutlined,
    TrophyOutlined,
    DollarOutlined,
    FireOutlined,
    SmileOutlined,
    SaveOutlined,
    LineChartOutlined,
    FormOutlined,
    CopyOutlined,
    EyeOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { useNavigate, useLocation } from 'react-router-dom';
// Remove date-fns as it conflicts with dayjs
import AccessGuard from '../components/common/AccessGuard';


const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Step } = Steps;

// Create axios instance with defaults
const api = axios.create({
    baseURL: 'http://localhost:4000',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: false, // Change to false to avoid CORS issues
    timeout: 10000 // 10 second timeout
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log('API Request:', config.method?.toUpperCase(), config.url);
        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
    (response) => {
        console.log('API Response:', response.status, response.config.url);
        return response;
    },
    (error) => {
        console.error('API Error:', {
            url: error.config?.url,
            status: error.response?.status,
            message: error.message,
            data: error.response?.data
        });
        return Promise.reject(error);
    }
);

const QuitPlanPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [existingPlans, setExistingPlans] = useState([]);
    const [planTemplate, setPlanTemplate] = useState([]);
    const [paymentInfo, setPaymentInfo] = useState(null);
    const [activeTab, setActiveTab] = useState('plan');
    const [justCreatedPlan, setJustCreatedPlan] = useState(false);

    // New states for improved workflow
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    // All template options
    const allTemplateOptions = [
        {
            id: 'premium',
            name: 'Kế hoạch Premium - 8 tuần',
            description: 'Kế hoạch chuyên nghiệp được thiết kế bởi chuyên gia, phù hợp với hầu hết mọi người',
            icon: '🏆',
            color: '#52c41a',
            duration: '8 tuần (56 ngày)',
            totalDays: 56,
            planDuration: 60, // Days in Premium plan
            phases: [
                {
                    phaseName: "Tuần 1-2: Detox và chuẩn bị",
                    phaseDescription: "• Thực hiện detox cơ thể với chế độ ăn uống lành mạnh\n• Bắt đầu chương trình tập luyện thể chất\n• Thiết lập hệ thống hỗ trợ từ gia đình và bạn bè\n• Học các kỹ thuật thư giãn: thiền, yoga\n• Ghi chép chi tiết về triggers và cách đối phó",
                    durationDays: 14
                },
                {
                    phaseName: "Tuần 3-4: Xây dựng thói quen mới",
                    phaseDescription: "• Phát triển hobby mới để thay thế thời gian hút thuốc\n• Tham gia các nhóm hỗ trợ trực tuyến/offline\n• Áp dụng kỹ thuật CBT (Cognitive Behavioral Therapy)\n• Theo dõi cải thiện sức khỏe: huyết áp, nhịp tim\n• Lập kế hoạch tài chính từ tiền tiết kiệm",
                    durationDays: 14
                },
                {
                    phaseName: "Tuần 5-6: Đối phó với khó khăn",
                    phaseDescription: "• Nhận diện và xử lý các tình huống nguy hiểm\n• Phát triển kỹ năng quản lý stress nâng cao\n• Tạo động lực dài hạn với mục tiêu cụ thể\n• Đánh giá tiến bộ và điều chỉnh kế hoạch\n• Chuẩn bị tâm lý cho giai đoạn duy trì",
                    durationDays: 14
                },
                {
                    phaseName: "Tuần 7-8: Duy trì và phát triển",
                    phaseDescription: "• Ổn định lối sống không thuốc lá\n• Mở rộng mạng lưới hỗ trợ xã hội\n• Theo dõi và cải thiện sức khỏe tinh thần\n• Lập kế hoạch phòng ngừa tái phát\n• Chia sẻ kinh nghiệm để giúp người khác",
                    durationDays: 14
                }
            ]
        },
        {
            id: 'premium-intensive',
            name: 'Kế hoạch Premium Chuyên sâu - 8 tuần',
            description: 'Kế hoạch tích cực dành cho những người có ý chí mạnh mẽ và quyết tâm cao',
            icon: '🚀',
            color: '#ff7a45',
            duration: '8 tuần (56 ngày)',
            totalDays: 56,
            planDuration: 60, // Days in Premium plan
            phases: [
                {
                    phaseName: "Tuần 1-2: Cắt bỏ hoàn toàn và detox mạnh",
                    phaseDescription: "• Ngừng thuốc lá ngay lập tức, không giảm dần\n• Chế độ detox nghiêm ngặt: nước chanh, trà xanh, rau xanh\n• Tập thể dục cường độ cao 2 lần/ngày\n• Thiền và yoga mỗi sáng tối\n• Ghi nhật ký chi tiết mọi cảm xúc và triệu chứng\n• Loại bỏ hoàn toàn caffeine và đồ ngọt",
                    durationDays: 14
                },
                {
                    phaseName: "Tuần 3-4: Tái cấu trúc lối sống hoàn toàn",
                    phaseDescription: "• Thay đổi toàn bộ thói quen hàng ngày\n• Học 2 kỹ năng mới: nhạc cụ, ngoại ngữ, nghề thủ công\n• Tham gia cộng đồng thể thao/câu lạc bộ sức khỏe\n• Áp dụng cold therapy và breathing exercises\n• Đọc 1 cuốn sách về tâm lý học mỗi tuần\n• Lập kế hoạch kinh doanh từ tiền tiết kiệm",
                    durationDays: 14
                },
                {
                    phaseName: "Tuần 5-6: Thử thách bản thân và vượt giới hạn",
                    phaseDescription: "• Tham gia các thử thách thể chất: chạy marathon mini, leo núi\n• Học các kỹ thuật quản lý stress của doanh nhân\n• Trở thành mentor cho người mới bắt đầu cai thuốc\n• Thực hành mindfulness meditation 30 phút/ngày\n• Tạo ra sản phẩm sáng tạo: blog, video, podcast về hành trình\n• Xây dựng network với cộng đồng healthy lifestyle",
                    durationDays: 14
                },
                {
                    phaseName: "Tuần 7-8: Trở thành champion và lan tỏa",
                    phaseDescription: "• Hoàn thiện bản thân với lối sống hoàn toàn mới\n• Tổ chức events/workshop chia sẻ kinh nghiệm\n• Xây dựng kế hoạch dài hạn 5-10 năm tới\n• Trở thành inspiration cho cộng đồng\n• Phát triển dự án kinh doanh/charity liên quan đến sức khỏe\n• Lập kế hoạch maintenance và continuous improvement",
                    durationDays: 14
                }
            ]
        },
        {
            id: 'basic',
            name: 'Kế hoạch Cơ bản - 2 tuần',
            description: 'Kế hoạch đơn giản 15 ngày, phù hợp với gói Basic',
            icon: '📝',
            color: '#1890ff',
            duration: '2 tuần (15 ngày)',
            totalDays: 15,
            planDuration: 15, // Days in Basic plan
            phases: [
                {
                    phaseName: "Tuần 1 (Ngày 1-7): Chuẩn bị và bắt đầu",
                    phaseDescription: "• Đặt ngày quit smoking cụ thể\n• Loại bỏ thuốc lá và dụng cụ hút thuốc\n• Thông báo với gia đình và bạn bè\n• Chuẩn bị tinh thần cho thử thách\n• Tìm hiểu về tác hại của thuốc lá",
                    durationDays: 7
                },
                {
                    phaseName: "Tuần 2 (Ngày 8-15): Vượt qua và duy trì",
                    phaseDescription: "• Sử dụng kỹ thuật thở sâu khi thèm thuốc\n• Uống nhiều nước và ăn trái cây\n• Tránh xa những nơi thường hút thuốc\n• Tập thể dục nhẹ nhàng\n• Tìm hoạt động thay thế\n• Củng cố thói quen tích cực\n• Đánh giá tiến bộ ban đầu",
                    durationDays: 8
                }
            ]
        },
        {
            id: 'basic-gentle',
            name: 'Kế hoạch Cơ bản Nhẹ nhàng - 2 tuần',
            description: 'Kế hoạch từ từ và dễ dàng hơn, phù hợp cho người mới bắt đầu',
            icon: '🌱',
            color: '#52c41a',
            duration: '2 tuần (15 ngày)',
            totalDays: 15,
            planDuration: 15, // Days in Basic plan
            phases: [
                {
                    phaseName: "Tuần 1 (Ngày 1-7): Làm quen và giảm dần",
                    phaseDescription: "• Ghi chép thói quen hút thuốc hiện tại\n• Giảm 50% lượng thuốc hút mỗi ngày\n• Uống nước khi muốn hút thuốc\n• Nhai kẹo cao su không đường\n• Tập thở sâu 5 phút mỗi ngày\n• Đi bộ nhẹ nhàng 15 phút sau bữa ăn",
                    durationDays: 7
                },
                {
                    phaseName: "Tuần 2 (Ngày 8-15): Ngừng hoàn toàn và thay thế",
                    phaseDescription: "• Ngừng hút thuốc hoàn toàn\n• Thay thế bằng trà thảo mộc\n• Nghe nhạc thư giãn khi căng thẳng\n• Gặp gỡ bạn bè không hút thuốc\n• Ăn hoa quả khi thèm thuốc\n• Tự thưởng bản thân khi hoàn thành mục tiêu\n• Chia sẻ với người thân về tiến bộ",
                    durationDays: 8
                }
            ]
        },
        {
            id: 'custom',
            name: 'Tự tạo kế hoạch',
            description: 'Tạo kế hoạch hoàn toàn theo ý của bạn',
            icon: '✍️',
            color: '#722ed1',
            duration: 'Tùy chỉnh',
            totalDays: null, // No restriction for custom plans
            planDuration: null,
            phases: []
        }
    ];

    // Filter templates based on user's purchased plan
    const getAvailableTemplates = () => {
        console.log('🔍 Filtering templates based on payment info:', paymentInfo);

        // Always show all templates for user to see
        // But add indication if template requires membership
        let availableTemplates = [...allTemplateOptions];

        if (!paymentInfo) {
            // No payment - show all templates but mark which ones require membership
            console.log('🔍 No payment found - showing all templates with membership indicators');
        } else {
            const userPlanName = paymentInfo.PlanName;
            console.log('🔍 User plan name:', userPlanName);

            if (userPlanName) {
                if (userPlanName.toLowerCase().includes('basic') || userPlanName.toLowerCase().includes('cơ bản')) {
                    console.log('🔍 Basic plan detected - user can access basic templates');
                } else if (userPlanName.toLowerCase().includes('premium') || userPlanName.toLowerCase().includes('cao cấp')) {
                    console.log('🔍 Premium plan detected - user can access all templates');
                }
            }
        }

        console.log('✅ Available templates:', availableTemplates.map(t => t.id));
        return availableTemplates;
    };

    // Check if user can access a specific template
    const canAccessTemplate = (template) => {
        console.log('🔍 Checking access for template:', template.id, {
            paymentInfo,
            planName: paymentInfo?.PlanName,
            templateId: template.id
        });

        if (template.id === 'custom') {
            console.log('✅ Custom template - access granted');
            return true; // Everyone can access custom template
        }

        // Temporary fix: Check user role from localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userRole = user.role || 'guest';
        
        console.log('👤 User role:', userRole);

        // If user is not guest (meaning they have some membership), allow access
        if (userRole !== 'guest') {
            console.log('✅ User has membership role - access granted');
            return true;
        }

        if (!paymentInfo) {
            console.log('❌ No payment info - access denied');
            return false; // No payment - can't access premium templates
        }

        const userPlanName = paymentInfo.PlanName;
        if (!userPlanName) {
            console.log('❌ No plan name - access denied');
            return false;
        }

        console.log('🔍 Checking plan name:', userPlanName);

        if (userPlanName.toLowerCase().includes('basic') || userPlanName.toLowerCase().includes('cơ bản')) {
            // Basic plan can access basic templates
            const hasAccess = template.id === 'basic' || template.id === 'basic-gentle';
            console.log('📦 Basic plan - access:', hasAccess, 'for template:', template.id);
            return hasAccess;
        } else if (userPlanName.toLowerCase().includes('premium') || userPlanName.toLowerCase().includes('cao cấp')) {
            // Premium plan can access all templates
            console.log('💎 Premium plan - full access granted');
            return true;
        }

        console.log('❌ Unknown plan type - access denied');
        return false;
    };

    useEffect(() => {
        if (currentStep === 0) {
            // Reset selected template when templates change
            setSelectedTemplate(null);
        }
    }, [paymentInfo]);

    // Check for success message from navigation state
    useEffect(() => {
        if (location.state?.justCreated) {
            setJustCreatedPlan(true);
            message.success(location.state.message || 'Kế hoạch đã được tạo thành công!');

            // Clear the state after showing the message
            window.history.replaceState({}, document.title);

            // Auto-hide the notification after 10 seconds
            setTimeout(() => {
                setJustCreatedPlan(false);
            }, 10000);
        }
    }, [location.state]);

    // Load data
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);

                // Get existing quit plans and templates
                const response = await api.get('/api/quit-plan');
                console.log('✅ Quit plan response:', response.data);

                setExistingPlans(response.data.data || []);
                setPlanTemplate(response.data.planTemplate || []);
                setPaymentInfo(response.data.paymentInfo || null);

                // If user has existing plans, populate the form with the latest active plan
                const activePlans = response.data.data.filter(plan => plan.Status === 'active');
                if (activePlans.length > 0) {
                    const latestPlan = activePlans[0];
                    form.setFieldsValue({
                        startDate: latestPlan.StartDate ? dayjs(latestPlan.StartDate) : null,
                        targetDate: latestPlan.TargetDate ? dayjs(latestPlan.TargetDate) : null,
                        reason: latestPlan.Reason,
                        motivationLevel: latestPlan.MotivationLevel,
                        detailedPlan: latestPlan.DetailedPlan
                    });
                } else if (response.data.planTemplate && response.data.planTemplate.length > 0) {
                    // Auto-fill detailed plan with template if no existing plans
                    const templateText = response.data.planTemplate.map((phase, index) =>
                        `${phase.PhaseName || phase.phaseName}:\n${phase.PhaseDescription || phase.phaseDescription}\n`
                    ).join('\n');

                    form.setFieldsValue({
                        detailedPlan: templateText
                    });
                }

            } catch (error) {
                console.error('❌ Error loading quit plan data:', error);
                message.error('Lỗi khi tải dữ liệu kế hoạch cai thuốc');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [form]);

    // New workflow functions
    const handleTemplateSelect = (template) => {
        console.log('🎯 Template selected:', template);
        
        // Check if user can access this template
        if (!canAccessTemplate(template)) {
            // Show message about needing membership
            message.warning({
                content: (
                    <div>
                        <div>🔒 Template này yêu cầu gói membership!</div>
                        <div style={{ fontSize: '12px', marginTop: '4px' }}>
                            {template.id.includes('premium') ? 
                                'Cần gói Premium để sử dụng template này' : 
                                'Cần gói Basic hoặc Premium để sử dụng template này'
                            }
                        </div>
                    </div>
                ),
                duration: 4
            });
            // Navigate to membership page
            setTimeout(() => {
                navigate('/membership');
            }, 1000);
            return;
        }

        // Navigate to template detail page if user has access
        navigate(`/quit-plan/template/${template.id}`, {
            state: { template: template }
        });
    };

    const getStatusColor = (status) => {
        const colors = { 'active': 'green', 'completed': 'blue', 'paused': 'orange', 'cancelled': 'red' };
        return colors[status] || 'default';
    };

    const getStatusText = (status) => {
        const texts = { 'active': 'Đang hoạt động', 'completed': 'Hoàn thành', 'paused': 'Tạm dừng', 'cancelled': 'Đã hủy' };
        return texts[status] || status;
    };

    const calculateDaysToTarget = (targetDate) => {
        const today = dayjs();
        const target = dayjs(targetDate);
        return target.diff(today, 'day');
    };

    const handleRetry = () => {
        setLoading(true);
        window.location.reload();
    };

    const ProgressLogs = ({ existingPlans, setActiveTab }) => {
        const [logs, setLogs] = useState([]);
        const [logsLoading, setLogsLoading] = useState(true);
        const [logForm] = Form.useForm();
        const [logSubmitting, setLogSubmitting] = useState(false);

        // Only show logs for members with active plans
        const activePlans = existingPlans.filter(plan => plan.Status === 'active');

        const loadProgressData = async () => {
            if (activePlans.length === 0) {
                setLogsLoading(false);
                return;
            }

            try {
                // Gọi API progress range để lấy data trong 30 ngày gần đây
                const endDate = dayjs().format('YYYY-MM-DD');
                const startDate = dayjs().subtract(30, 'day').format('YYYY-MM-DD');

                const response = await api.get(`/api/progress/range?startDate=${startDate}&endDate=${endDate}`);
                console.log('✅ Progress logs response:', response.data);

                if (response.data.success) {
                    setLogs(response.data.data || []);
                } else {
                    console.log('⚠️ No progress data available');
                    setLogs([]);
                }
            } catch (error) {
                console.error('❌ Error loading progress data:', error);
                setLogs([]);
            } finally {
                setLogsLoading(false);
            }
        };

        useEffect(() => {
            loadProgressData();
        }, [activePlans.length]);

        const handleProgressSubmit = async (values) => {
            try {
                setLogSubmitting(true);
                console.log('📝 Submitting progress log:', values);

                const submitData = {
                    date: dayjs().format('YYYY-MM-DD'), // Thêm ngày hiện tại
                    cigarettesSmoked: values.cigarettesSmoked || 0,
                    cravingLevel: values.cravingLevel || 1,
                    emotionNotes: values.emotionNotes || ''
                    // Xóa bỏ các trường không cần thiết
                };

                const response = await api.post('/api/progress', submitData);
                console.log('✅ Progress submitted:', response.data);

                if (response.data.success) {
                    message.success('🎉 Đã ghi lại tiến trình hôm nay!');
                    logForm.resetFields();
                    loadProgressData(); // Reload progress data
                } else {
                    message.error(response.data.message || 'Lỗi khi ghi lại tiến trình');
                }

            } catch (error) {
                console.error('❌ Error submitting progress:', error);
                if (error.response?.status === 409) {
                    message.warning('Bạn đã ghi lại tiến trình hôm nay rồi. Hãy quay lại vào ngày mai!');
                } else {
                    message.error('Lỗi khi ghi lại tiến trình. Vui lòng thử lại.');
                }
            } finally {
                setLogSubmitting(false);
            }
        };

        // Show message if no active plans
        if (activePlans.length === 0) {
            return (
                <div className="text-center py-12">
                    <div className="mb-4">
                        <ExclamationCircleOutlined style={{ fontSize: '48px', color: '#faad14' }} />
                    </div>
                    <Title level={3}>Chưa có kế hoạch nào đang hoạt động</Title>
                    <Paragraph className="text-gray-600 mb-6">
                        Bạn cần tạo một kế hoạch cai thuốc trước khi có thể ghi lại tiến trình hàng ngày.
                    </Paragraph>
                    <Button
                        type="primary"
                        size="large"
                        icon={<PlusOutlined />}
                        onClick={() => setActiveTab('plan')}
                    >
                        Tạo kế hoạch ngay
                    </Button>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <Card
                    title={
                        <div className="flex items-center">
                            <BookOutlined className="mr-2 text-blue-500" />
                            <span>Ghi lại tiến trình hôm nay</span>
                        </div>
                    }
                    className="shadow-md"
                >
                    <Form
                        form={logForm}
                        layout="vertical"
                        onFinish={handleProgressSubmit}
                        className="max-w-2xl"
                    >
                        <Row gutter={16}>
                            <Col xs={24} sm={12}>
                                <Form.Item
                                    label="Số điếu hút hôm nay"
                                    name="cigarettesSmoked"
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập số điếu hút' },
                                        { type: 'number', min: 0, message: 'Số điếu không được âm' }
                                    ]}
                                >
                                    <InputNumber
                                        min={0}
                                        style={{ width: '100%' }}
                                        placeholder="Nhập số điếu hút hôm nay"
                                        addonAfter="điếu"
                                    />
                                </Form.Item>
                            </Col>

                            <Col xs={24} sm={12}>
                                <Form.Item
                                    label="Mức độ thèm thuốc (1-10)"
                                    name="cravingLevel"
                                    rules={[
                                        { required: true, message: 'Vui lòng đánh giá mức độ thèm thuốc' },
                                        { type: 'number', min: 1, max: 10, message: 'Mức độ phải từ 1-10' }
                                    ]}
                                >
                                    <InputNumber
                                        min={1}
                                        max={10}
                                        style={{ width: '100%' }}
                                        placeholder="1 = rất thấp, 10 = rất cao"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            label="Ghi chú cảm xúc"
                            name="emotionNotes"
                        >
                            <TextArea
                                rows={3}
                                placeholder="Mô tả cảm xúc, tâm trạng hôm nay..."
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={logSubmitting}
                                icon={<SaveOutlined />}
                                size="large"
                            >
                                Lưu tiến trình hôm nay
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>

                {/* Progress History */}
                <Card
                    title={
                        <div className="flex items-center">
                            <LineChartOutlined className="mr-2 text-green-500" />
                            <span>Lịch sử tiến trình</span>
                        </div>
                    }
                    className="shadow-md"
                    loading={logsLoading}
                >
                    {logs.length > 0 ? (
                        <List
                            dataSource={logs}
                            renderItem={(log) => (
                                <List.Item style={{ padding: 0, marginBottom: '16px' }}>
                                    <Card
                                        className="w-full"
                                        style={{
                                            borderRadius: '12px',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                            border: '1px solid #f0f0f0'
                                        }}
                                        bodyStyle={{ padding: '20px' }}
                                    >
                                        {/* Header với ngày */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            marginBottom: '16px',
                                            paddingBottom: '12px',
                                            borderBottom: '1px solid #f0f0f0'
                                        }}>
                                            <CalendarOutlined style={{
                                                fontSize: '16px',
                                                color: '#1890ff',
                                                marginRight: '8px'
                                            }} />
                                            <Title level={5} style={{
                                                margin: 0,
                                                color: '#1890ff',
                                                fontSize: '16px',
                                                fontWeight: '600'
                                            }}>
                                                {dayjs(log.Date).format('DD/MM/YYYY')}
                                            </Title>
                                        </div>

                                        {/* Thống kê chính */}
                                        <Row gutter={[12, 12]} style={{ marginBottom: '16px' }}>
                                            <Col span={6}>
                                                <div style={{
                                                    textAlign: 'center',
                                                    padding: '10px',
                                                    backgroundColor: log.CigarettesSmoked === 0 ? '#f6ffed' : '#fff2e8',
                                                    borderRadius: '8px',
                                                    border: `1px solid ${log.CigarettesSmoked === 0 ? '#b7eb8f' : '#ffb38a'}`
                                                }}>
                                                    <div style={{
                                                        fontSize: '20px',
                                                        fontWeight: 'bold',
                                                        color: log.CigarettesSmoked === 0 ? '#52c41a' : '#fa541c',
                                                        marginBottom: '4px'
                                                    }}>
                                                        {log.CigarettesSmoked}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '11px',
                                                        color: '#666',
                                                        fontWeight: '500'
                                                    }}>
                                                        🚬 Điếu hút
                                                    </div>
                                                </div>
                                            </Col>

                                            <Col span={6}>
                                                {(() => {
                                                    const baseline = 10; // 10 điếu/ngày baseline
                                                    const cigarettesAvoided = Math.max(0, baseline - log.CigarettesSmoked);
                                                    return (
                                                        <div style={{
                                                            textAlign: 'center',
                                                            padding: '10px',
                                                            backgroundColor: cigarettesAvoided >= 8 ? '#f6ffed' : cigarettesAvoided >= 5 ? '#fff7e6' : '#fff1f0',
                                                            borderRadius: '8px',
                                                            border: `1px solid ${cigarettesAvoided >= 8 ? '#b7eb8f' : cigarettesAvoided >= 5 ? '#ffd591' : '#ffadd2'}`
                                                        }}>
                                                            <div style={{
                                                                fontSize: '20px',
                                                                fontWeight: 'bold',
                                                                color: cigarettesAvoided >= 8 ? '#52c41a' : cigarettesAvoided >= 5 ? '#fa8c16' : '#f5222d',
                                                                marginBottom: '4px'
                                                            }}>
                                                                {cigarettesAvoided}
                                                            </div>
                                                            <div style={{
                                                                fontSize: '11px',
                                                                color: '#666',
                                                                fontWeight: '500'
                                                            }}>
                                                                ✋ Tránh được
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </Col>

                                            <Col span={6}>
                                                <div style={{
                                                    textAlign: 'center',
                                                    padding: '10px',
                                                    backgroundColor: log.CravingLevel <= 3 ? '#f6ffed' : log.CravingLevel <= 7 ? '#fff7e6' : '#fff1f0',
                                                    borderRadius: '8px',
                                                    border: `1px solid ${log.CravingLevel <= 3 ? '#b7eb8f' : log.CravingLevel <= 7 ? '#ffd591' : '#ffadd2'}`
                                                }}>
                                                    <div style={{
                                                        fontSize: '18px',
                                                        fontWeight: 'bold',
                                                        color: log.CravingLevel <= 3 ? '#52c41a' : log.CravingLevel <= 7 ? '#fa8c16' : '#f5222d',
                                                        marginBottom: '4px'
                                                    }}>
                                                        {log.CravingLevel}/10
                                                    </div>
                                                    <div style={{
                                                        fontSize: '11px',
                                                        color: '#666',
                                                        fontWeight: '500'
                                                    }}>
                                                        💭 Mức thèm
                                                    </div>
                                                </div>
                                            </Col>

                                            <Col span={6}>
                                                <div style={{
                                                    textAlign: 'center',
                                                    padding: '10px',
                                                    backgroundColor: '#f6ffed',
                                                    borderRadius: '8px',
                                                    border: '1px solid #b7eb8f'
                                                }}>
                                                    <div style={{
                                                        fontSize: '14px',
                                                        fontWeight: 'bold',
                                                        color: '#52c41a',
                                                        marginBottom: '4px'
                                                    }}>
                                                        {log.MoneySaved ? new Intl.NumberFormat('vi-VN').format(log.MoneySaved) + ' VNĐ' : '0 VNĐ'}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '11px',
                                                        color: '#666',
                                                        fontWeight: '500'
                                                    }}>
                                                        💰 Tiết kiệm
                                                    </div>
                                                </div>
                                            </Col>
                                        </Row>

                                        {/* Ghi chú cảm xúc */}
                                        {log.EmotionNotes && (
                                            <div style={{
                                                padding: '12px',
                                                backgroundColor: '#f8f9ff',
                                                borderRadius: '8px',
                                                border: '1px solid #d6e4ff'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'flex-start'
                                                }}>
                                                    <HeartOutlined style={{
                                                        color: '#1890ff',
                                                        marginRight: '8px',
                                                        marginTop: '2px',
                                                        fontSize: '14px'
                                                    }} />
                                                    <div>
                                                        <Text strong style={{ color: '#1890ff', fontSize: '13px' }}>
                                                            Cảm xúc hôm nay:
                                                        </Text>
                                                        <div style={{
                                                            marginTop: '4px',
                                                            color: '#333',
                                                            lineHeight: '1.5'
                                                        }}>
                                                            {log.EmotionNotes}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Badge trạng thái */}
                                        {log.CigarettesSmoked === 0 && (
                                            <div style={{
                                                marginTop: '12px',
                                                textAlign: 'center'
                                            }}>
                                                <Tag
                                                    color="success"
                                                    style={{
                                                        padding: '4px 12px',
                                                        borderRadius: '16px',
                                                        fontSize: '12px',
                                                        fontWeight: '600'
                                                    }}
                                                >
                                                    🎉 Ngày không thuốc lá!
                                                </Tag>
                                            </div>
                                        )}
                                    </Card>
                                </List.Item>
                            )}
                        />
                    ) : (
                        <div className="text-center py-8">
                            <BookOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                            <Title level={4} className="text-gray-400">
                                Chưa có dữ liệu tiến trình
                            </Title>
                            <Text className="text-gray-500">
                                Hãy bắt đầu ghi lại tiến trình hàng ngày để theo dõi quá trình cai thuốc.
                            </Text>
                        </div>
                    )}
                </Card>
            </div>
        );
    };

    // Responsive styles for current plan display
    const currentPlanStyles = {
        container: {
            background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
            borderRadius: '20px',
            padding: window.innerWidth <= 768 ? '16px' : '24px',
            border: '2px solid #10b981',
            marginBottom: '24px',
            boxShadow: '0 8px 32px rgba(16, 185, 129, 0.2)'
        },
        header: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            flexWrap: window.innerWidth <= 480 ? 'wrap' : 'nowrap',
            gap: window.innerWidth <= 480 ? '12px' : '0'
        },
        progressCard: {
            background: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '12px',
            padding: window.innerWidth <= 768 ? '12px' : '16px',
            marginBottom: '20px'
        },
        statCard: {
            background: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '12px',
            padding: window.innerWidth <= 768 ? '8px' : '12px',
            textAlign: 'center'
        },
        actionButtons: {
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap'
        },
        primaryButton: {
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 600,
            flex: window.innerWidth <= 768 ? '1 1 100%' : '1',
            minWidth: window.innerWidth <= 768 ? 'auto' : '150px'
        }
    };

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
        return (
            <AccessGuard>
                <div style={{
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '24px'
                }}>
                    <div className="container mx-auto" style={{ maxWidth: '1200px' }}>
                        <Card
                            title={
                                <div className="text-center">
                                    <Title level={2} style={{ margin: 0, color: '#667eea' }}>
                                        🎯 Kế hoạch cai thuốc
                                    </Title>
                                    <Text style={{ color: '#6b7280' }}>
                                        Chọn kế hoạch phù hợp để bắt đầu hành trình cai thuốc của bạn
                                    </Text>
                                </div>
                            }
                            className="shadow-lg rounded-lg"
                            bodyStyle={{ padding: '32px' }}
                        >
                            <Tabs
                                activeKey={activeTab}
                                onChange={(key) => {
                                    setActiveTab(key);
                                    if (key !== 'plan') {
                                        setJustCreatedPlan(false);
                                    }
                                }}
                                type="card"
                                size="large"
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
                                <TabPane
                                    tab={
                                        <span>
                                            <FormOutlined />
                                            Tạo kế hoạch
                                            {justCreatedPlan && (
                                                <Badge dot style={{ marginLeft: 8 }} />
                                            )}
                                        </span>
                                    }
                                    key="plan"
                                >
                                    <Row gutter={[24, 24]}>
                                        {/* Template Selection */}
                                        <Col span={24}>
                                            <div style={{
                                                background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                                                borderRadius: '16px',
                                                padding: '24px',
                                                border: '1px solid rgba(245, 158, 11, 0.2)',
                                                marginBottom: '24px'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                                                    <div style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '50%',
                                                        background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        marginRight: '12px'
                                                    }}>
                                                        🎯
                                                    </div>
                                                    <Title level={4} style={{
                                                        margin: 0,
                                                        color: '#d97706',
                                                        fontWeight: 600
                                                    }}>
                                                        Chọn mẫu kế hoạch phù hợp
                                                    </Title>
                                                </div>
                                                <Text style={{ color: '#92400e', fontSize: '14px' }}>
                                                    Chọn một trong các mẫu kế hoạch được thiết kế sẵn hoặc tự tạo kế hoạch riêng theo nhu cầu của bạn.
                                                    Mỗi gói membership sẽ có các mẫu kế hoạch khác nhau.
                                                </Text>
                                            </div>

                                            <Row gutter={[16, 16]} data-template-section>
                                                {getAvailableTemplates().map((template, index) => (
                                                    <Col xs={24} sm={12} lg={8} key={template.id}>
                                                        <div
                                                            style={{
                                                                background: 'rgba(255, 255, 255, 0.95)',
                                                                borderRadius: '16px',
                                                                padding: '24px',
                                                                cursor: 'pointer',
                                                                border: `2px solid ${selectedTemplate?.id === template.id ? template.color : 'transparent'}`,
                                                                boxShadow: selectedTemplate?.id === template.id
                                                                    ? `0 8px 32px ${template.color}30`
                                                                    : '0 4px 16px rgba(0, 0, 0, 0.1)',
                                                                transition: 'all 0.3s ease',
                                                                textAlign: 'center',
                                                                position: 'relative',
                                                                opacity: canAccessTemplate(template) ? 1 : 0.75
                                                            }}
                                                            onClick={() => handleTemplateSelect(template)}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.transform = 'translateY(-4px)';
                                                                e.currentTarget.style.boxShadow = `0 12px 40px ${template.color}40`;
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.transform = 'translateY(0)';
                                                                e.currentTarget.style.boxShadow = selectedTemplate?.id === template.id
                                                                    ? `0 8px 32px ${template.color}30`
                                                                    : '0 4px 16px rgba(0, 0, 0, 0.1)';
                                                            }}
                                                        >
                                                            {/* Membership indicator */}
                                                            {!canAccessTemplate(template) && (
                                                                <div style={{
                                                                    position: 'absolute',
                                                                    top: '12px',
                                                                    right: '12px',
                                                                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                                                    color: 'white',
                                                                    padding: '4px 8px',
                                                                    borderRadius: '20px',
                                                                    fontSize: '10px',
                                                                    fontWeight: 600,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px',
                                                                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
                                                                }}>
                                                                    🔒
                                                                    {template.id.includes('premium') ? 'PREMIUM' : 'MEMBERSHIP'}
                                                                </div>
                                                            )}
                                                            <div style={{
                                                                width: '60px',
                                                                height: '60px',
                                                                borderRadius: '50%',
                                                                background: `linear-gradient(135deg, ${template.color} 0%, ${template.color}CC 100%)`,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                margin: '0 auto 16px',
                                                                fontSize: '24px',
                                                                boxShadow: `0 8px 24px ${template.color}30`
                                                            }}>
                                                                {template.icon}
                                                            </div>

                                                            <Title level={4} style={{
                                                                marginBottom: '12px',
                                                                color: template.color,
                                                                fontWeight: 600
                                                            }}>
                                                                {template.name}
                                                            </Title>

                                                            <Text style={{
                                                                color: '#6b7280',
                                                                fontSize: '14px',
                                                                lineHeight: '1.5',
                                                                display: 'block',
                                                                marginBottom: '16px'
                                                            }}>
                                                                {template.description}
                                                            </Text>

                                                            <div style={{
                                                                background: `${template.color}15`,
                                                                color: template.color,
                                                                padding: '8px 16px',
                                                                borderRadius: '20px',
                                                                fontSize: '12px',
                                                                fontWeight: 600,
                                                                marginBottom: '16px',
                                                                display: 'inline-block'
                                                            }}>
                                                                {template.duration}
                                                            </div>

                                                            {template.phases.length > 0 && (
                                                                <div style={{ marginBottom: '16px' }}>
                                                                    <Text style={{
                                                                        fontSize: '12px',
                                                                        color: '#9ca3af',
                                                                        fontWeight: 500
                                                                    }}>
                                                                        {template.phases.length} giai đoạn chi tiết
                                                                    </Text>
                                                                </div>
                                                            )}

                                                            <Button
                                                                type="primary"
                                                                style={{
                                                                    background: canAccessTemplate(template) 
                                                                        ? `linear-gradient(135deg, ${template.color} 0%, ${template.color}CC 100%)`
                                                                        : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                                                    border: 'none',
                                                                    borderRadius: '12px',
                                                                    fontSize: '14px',
                                                                    fontWeight: 600,
                                                                    height: '40px',
                                                                    paddingInline: '24px'
                                                                }}
                                                            >
                                                                {canAccessTemplate(template) 
                                                                    ? 'Chọn kế hoạch này' 
                                                                    : '🔒 Cần Membership'
                                                                }
                                                            </Button>
                                                        </div>
                                                    </Col>
                                                ))}
                                            </Row>
                                        </Col>

                                        {/* Show active plan at top if exists */}
                                        {existingPlans.length > 0 && existingPlans.some(plan => plan.Status === 'active') && (
                                            <Col span={24}>
                                                {(() => {
                                                    const activePlan = existingPlans.find(plan => plan.Status === 'active');
                                                    const daysToTarget = calculateDaysToTarget(activePlan.TargetDate);
                                                    const totalDays = dayjs(activePlan.TargetDate).diff(dayjs(activePlan.StartDate), 'day');
                                                    const passedDays = dayjs().diff(dayjs(activePlan.StartDate), 'day');
                                                    const progress = Math.max(0, Math.min(100, (passedDays / totalDays) * 100));

                                                    return (
                                                        <div style={currentPlanStyles.container}>
                                                            {/* Header */}
                                                            <div style={currentPlanStyles.header}>
                                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                                    <div style={{
                                                                        width: window.innerWidth <= 480 ? '40px' : '48px',
                                                                        height: window.innerWidth <= 480 ? '40px' : '48px',
                                                                        borderRadius: '50%',
                                                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        marginRight: '16px',
                                                                        fontSize: window.innerWidth <= 480 ? '16px' : '20px'
                                                                    }}>
                                                                        🎯
                                                                    </div>
                                                                    <div>
                                                                        <Title level={window.innerWidth <= 480 ? 4 : 3} style={{
                                                                            margin: 0,
                                                                            color: '#047857',
                                                                            fontWeight: 700
                                                                        }}>
                                                                            Kế hoạch cai thuốc hiện tại
                                                                        </Title>
                                                                        <Text style={{
                                                                            color: '#059669',
                                                                            fontSize: window.innerWidth <= 480 ? '12px' : '14px',
                                                                            fontWeight: 500
                                                                        }}>
                                                                            Đang hoạt động - Theo dõi tiến trình hàng ngày
                                                                        </Text>
                                                                    </div>
                                                                </div>
                                                                <Tag
                                                                    color="success"
                                                                    style={{
                                                                        padding: window.innerWidth <= 480 ? '4px 8px' : '6px 16px',
                                                                        borderRadius: '20px',
                                                                        fontSize: window.innerWidth <= 480 ? '11px' : '13px',
                                                                        fontWeight: 600,
                                                                        border: 'none'
                                                                    }}
                                                                >
                                                                    🟢 ĐANG HOẠT ĐỘNG
                                                                </Tag>
                                                            </div>

                                                            {/* Progress Bar */}
                                                            <div style={currentPlanStyles.progressCard}>
                                                                <div style={{
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    marginBottom: '8px'
                                                                }}>
                                                                    <Text style={{ fontSize: '14px', fontWeight: 600, color: '#047857' }}>
                                                                        Tiến độ hoàn thành
                                                                    </Text>
                                                                    <Text style={{ fontSize: '14px', fontWeight: 600, color: '#047857' }}>
                                                                        {Math.round(progress)}%
                                                                    </Text>
                                                                </div>
                                                                <div style={{
                                                                    height: '8px',
                                                                    background: '#e5e7eb',
                                                                    borderRadius: '4px',
                                                                    overflow: 'hidden'
                                                                }}>
                                                                    <div style={{
                                                                        height: '100%',
                                                                        width: `${progress}%`,
                                                                        background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                                                                        borderRadius: '4px',
                                                                        transition: 'width 0.3s ease'
                                                                    }} />
                                                                </div>
                                                                <div style={{
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    marginTop: '8px'
                                                                }}>
                                                                    <Text style={{ fontSize: '12px', color: '#6b7280' }}>
                                                                        Bắt đầu: {dayjs(activePlan.StartDate).format('DD/MM/YYYY')}
                                                                    </Text>
                                                                    <Text style={{ fontSize: '12px', color: '#6b7280' }}>
                                                                        Mục tiêu: {dayjs(activePlan.TargetDate).format('DD/MM/YYYY')}
                                                                    </Text>
                                                                </div>
                                                            </div>

                                                            {/* Key Info */}
                                                            <Row gutter={[16, 12]} style={{ marginBottom: '20px' }}>
                                                                <Col xs={24} sm={8}>
                                                                    <div style={currentPlanStyles.statCard}>
                                                                        <div style={{
                                                                            fontSize: window.innerWidth <= 480 ? '18px' : '20px',
                                                                            fontWeight: 700,
                                                                            color: daysToTarget > 0 ? '#10b981' : '#ef4444',
                                                                            marginBottom: '4px'
                                                                        }}>
                                                                            {daysToTarget > 0 ? daysToTarget : 0}
                                                                        </div>
                                                                        <Text style={{ fontSize: '12px', color: '#6b7280' }}>
                                                                            Ngày còn lại
                                                                        </Text>
                                                                    </div>
                                                                </Col>
                                                                <Col xs={24} sm={8}>
                                                                    <div style={currentPlanStyles.statCard}>
                                                                        <div style={{
                                                                            fontSize: window.innerWidth <= 480 ? '18px' : '20px',
                                                                            fontWeight: 700,
                                                                            color: '#10b981',
                                                                            marginBottom: '4px'
                                                                        }}>
                                                                            {Math.max(0, passedDays)}
                                                                        </div>
                                                                        <Text style={{ fontSize: '12px', color: '#6b7280' }}>
                                                                            Ngày đã trải qua
                                                                        </Text>
                                                                    </div>
                                                                </Col>
                                                                <Col xs={24} sm={8}>
                                                                    <div style={currentPlanStyles.statCard}>
                                                                        <div style={{
                                                                            fontSize: window.innerWidth <= 480 ? '18px' : '20px',
                                                                            fontWeight: 700,
                                                                            color: '#f59e0b',
                                                                            marginBottom: '4px'
                                                                        }}>
                                                                            {activePlan.MotivationLevel}/10
                                                                        </div>
                                                                        <Text style={{ fontSize: '12px', color: '#6b7280' }}>
                                                                            Mức động lực
                                                                        </Text>
                                                                    </div>
                                                                </Col>
                                                            </Row>

                                                            {/* Action Buttons */}
                                                            <div style={currentPlanStyles.actionButtons}>
                                                                <Button
                                                                    type="primary"
                                                                    size="large"
                                                                    icon={<CheckCircleOutlined />}
                                                                    onClick={() => setActiveTab('progress')}
                                                                    style={currentPlanStyles.primaryButton}
                                                                >
                                                                    Ghi tiến trình hôm nay
                                                                </Button>
                                                                <Button
                                                                    size="large"
                                                                    icon={<EyeOutlined />}
                                                                    style={{
                                                                        borderRadius: '12px',
                                                                        fontWeight: 600,
                                                                        flex: window.innerWidth <= 768 ? '1' : 'auto'
                                                                    }}
                                                                    onClick={() => {
                                                                        // Scroll to plan details
                                                                        const planSection = document.querySelector('[data-plan-details]');
                                                                        if (planSection) {
                                                                            planSection.scrollIntoView({ behavior: 'smooth' });
                                                                        }
                                                                    }}
                                                                >
                                                                    Xem chi tiết
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </Col>
                                        )}

                                        {/* Show message when no existing plans */}
                                        {existingPlans.length === 0 && (
                                            <Col span={24}>
                                                <div style={{
                                                    background: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)',
                                                    borderRadius: '16px',
                                                    padding: '32px',
                                                    border: '1px solid rgba(245, 158, 11, 0.2)',
                                                    textAlign: 'center'
                                                }}>
                                                    <div style={{
                                                        width: '80px',
                                                        height: '80px',
                                                        borderRadius: '50%',
                                                        background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        margin: '0 auto 20px',
                                                        fontSize: '32px'
                                                    }}>
                                                        🎯
                                                    </div>
                                                    <Title level={3} style={{
                                                        margin: '0 0 12px 0',
                                                        color: '#d97706'
                                                    }}>
                                                        Bạn chưa có kế hoạch cai thuốc nào
                                                    </Title>
                                                    <Text style={{
                                                        color: '#92400e',
                                                        fontSize: '16px',
                                                        lineHeight: '1.6',
                                                        display: 'block',
                                                        marginBottom: '24px'
                                                    }}>
                                                        Hãy chọn một mẫu kế hoạch phù hợp ở trên để bắt đầu hành trình cai thuốc của bạn.
                                                        Mỗi kế hoạch được thiết kế khoa học để giúp bạn thành công.
                                                    </Text>
                                                    <Button
                                                        type="primary"
                                                        size="large"
                                                        icon={<PlusOutlined />}
                                                        style={{
                                                            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                                                            border: 'none',
                                                            borderRadius: '12px',
                                                            fontSize: '16px',
                                                            fontWeight: 600,
                                                            height: '48px',
                                                            paddingInline: '32px'
                                                        }}
                                                        onClick={() => {
                                                            document.querySelector('.ant-tabs-content').scrollTo({
                                                                top: 0,
                                                                behavior: 'smooth'
                                                            });
                                                        }}
                                                    >
                                                        Chọn kế hoạch ngay
                                                    </Button>
                                                </div>
                                            </Col>
                                        )}

                                        {/* Notification for newly created plans */}
                                        {justCreatedPlan && existingPlans.length > 0 && (
                                            <Col span={24}>
                                                <Alert
                                                    message="🎉 Kế hoạch đã được tạo thành công!"
                                                    description="Kế hoạch cai thuốc của bạn đã được lưu. Bạn có thể xem chi tiết bên dưới và bắt đầu theo dõi tiến trình hàng ngày."
                                                    type="success"
                                                    showIcon
                                                    style={{
                                                        marginBottom: '24px',
                                                        borderRadius: '12px',
                                                        border: '1px solid #10b981'
                                                    }}
                                                    action={
                                                        <Button
                                                            size="small"
                                                            type="primary"
                                                            onClick={() => setActiveTab('progress')}
                                                            style={{
                                                                background: '#10b981',
                                                                borderColor: '#10b981'
                                                            }}
                                                        >
                                                            Bắt đầu ghi tiến trình
                                                        </Button>
                                                    }
                                                />
                                            </Col>
                                        )}

                                        {/* Existing Plans Display - Hiển thị kế hoạch đã tạo */}
                                        {existingPlans.length > 0 && (
                                            <Col span={24}>
                                                <div style={{
                                                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)',
                                                    borderRadius: '16px',
                                                    padding: '24px',
                                                    border: '1px solid rgba(59, 130, 246, 0.2)',
                                                    marginBottom: '24px'
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
                                                            📚
                                                        </div>
                                                        <Title level={4} style={{
                                                            margin: 0,
                                                            color: '#1d4ed8',
                                                            fontWeight: 600
                                                        }}>
                                                            {existingPlans.some(plan => plan.Status === 'active') ? 
                                                                'Kế hoạch cai thuốc chi tiết' : 
                                                                'Lịch sử kế hoạch cai thuốc'
                                                            }
                                                        </Title>
                                                    </div>
                                                    <Text style={{ color: '#1e40af', fontSize: '14px' }}>
                                                        {existingPlans.some(plan => plan.Status === 'active') ? 
                                                            'Chi tiết kế hoạch cai thuốc hiện tại và lịch sử của bạn.' :
                                                            'Đây là những kế hoạch cai thuốc mà bạn đã tạo trước đây. Bạn có thể xem chi tiết và tạo kế hoạch mới.'
                                                        }
                                                    </Text>
                                                </div>

                                                <List
                                                    dataSource={existingPlans}
                                                    data-plan-details
                                                    renderItem={(plan) => {
                                                        const daysToTarget = calculateDaysToTarget(plan.TargetDate);
                                                        const isActive = plan.Status === 'active';
                                                        return (
                                                            <List.Item style={{ padding: 0, marginBottom: '16px' }}>
                                                                <Card
                                                                    className="w-full"
                                                                    style={{
                                                                        borderRadius: '12px',
                                                                        boxShadow: isActive ? '0 4px 16px rgba(16, 185, 129, 0.2)' : '0 2px 8px rgba(0,0,0,0.1)',
                                                                        border: isActive ? '2px solid #10b981' : '1px solid #f0f0f0'
                                                                    }}
                                                                    bodyStyle={{ padding: '20px' }}
                                                                >
                                                                    {/* Header với status và ngày tạo */}
                                                                    <div style={{
                                                                        display: 'flex',
                                                                        justifyContent: 'space-between',
                                                                        alignItems: 'center',
                                                                        marginBottom: '16px',
                                                                        paddingBottom: '12px',
                                                                        borderBottom: '1px solid #f0f0f0'
                                                                    }}>
                                                                        <Tag
                                                                            color={getStatusColor(plan.Status)}
                                                                            style={{
                                                                                padding: '4px 12px',
                                                                                borderRadius: '16px',
                                                                                fontSize: '12px',
                                                                                fontWeight: 600
                                                                            }}
                                                                        >
                                                                            {getStatusText(plan.Status)}
                                                                        </Tag>
                                                                        <Text style={{ fontSize: '12px', color: '#6b7280' }}>
                                                                            Tạo ngày: {dayjs(plan.CreatedAt).format('DD/MM/YYYY')}
                                                                        </Text>
                                                                    </div>

                                                                    {/* Thông tin chi tiết */}
                                                                    <Row gutter={[16, 12]}>
                                                                        <Col xs={24} sm={12}>
                                                                            <div style={{ marginBottom: '12px' }}>
                                                                                <CalendarOutlined style={{ marginRight: '8px', color: '#3b82f6' }} />
                                                                                <Text strong>Ngày bắt đầu:</Text>
                                                                                <div style={{ marginLeft: '24px', marginTop: '4px' }}>
                                                                                    <Text style={{ fontSize: '14px' }}>{dayjs(plan.StartDate).format('DD/MM/YYYY')}</Text>
                                                                                </div>
                                                                            </div>
                                                                        </Col>

                                                                        <Col xs={24} sm={12}>
                                                                            <div style={{ marginBottom: '12px' }}>
                                                                                <CalendarOutlined style={{ marginRight: '8px', color: '#10b981' }} />
                                                                                <Text strong>Ngày mục tiêu:</Text>
                                                                                <div style={{ marginLeft: '24px', marginTop: '4px' }}>
                                                                                    <Text style={{ fontSize: '14px' }}>{dayjs(plan.TargetDate).format('DD/MM/YYYY')}</Text>
                                                                                    {isActive && (
                                                                                        <div style={{ marginTop: '2px' }}>
                                                                                            <Text style={{
                                                                                                fontSize: '12px',
                                                                                                color: daysToTarget > 0 ? '#10b981' : '#ef4444',
                                                                                                fontWeight: 500
                                                                                            }}>
                                                                                                {daysToTarget > 0 ? `Còn ${daysToTarget} ngày` : 'Đã qua hạn'}
                                                                                            </Text>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </Col>

                                                                        <Col xs={24} sm={12}>
                                                                            <div style={{ marginBottom: '12px' }}>
                                                                                <HeartOutlined style={{ marginRight: '8px', color: '#ef4444' }} />
                                                                                <Text strong>Mức động lực:</Text>
                                                                                <div style={{ marginLeft: '24px', marginTop: '4px' }}>
                                                                                    <Text style={{ fontSize: '14px', fontWeight: 600 }}>
                                                                                        {plan.MotivationLevel}/10
                                                                                    </Text>
                                                                                </div>
                                                                            </div>
                                                                        </Col>

                                                                        <Col span={24}>
                                                                            <div style={{ marginBottom: '16px' }}>
                                                                                <BulbOutlined style={{ marginRight: '8px', color: '#f59e0b' }} />
                                                                                <Text strong>Lý do cai thuốc:</Text>
                                                                                <Paragraph
                                                                                    style={{
                                                                                        marginLeft: '24px',
                                                                                        marginTop: '8px',
                                                                                        marginBottom: '0',
                                                                                        fontSize: '14px',
                                                                                        lineHeight: '1.6'
                                                                                    }}
                                                                                    ellipsis={{ rows: 3, expandable: true, symbol: 'Xem thêm' }}
                                                                                >
                                                                                    {plan.Reason}
                                                                                </Paragraph>
                                                                            </div>
                                                                        </Col>

                                                                        {/* Hiển thị kế hoạch chi tiết - luôn hiển thị */}
                                                                        <Col span={24}>
                                                                            <div style={{
                                                                                background: '#f8fafc',
                                                                                padding: '16px',
                                                                                borderRadius: '8px',
                                                                                border: '1px solid #e2e8f0'
                                                                            }}>
                                                                                <div style={{ marginBottom: '12px' }}>
                                                                                    <BookOutlined style={{ marginRight: '8px', color: '#6366f1' }} />
                                                                                    <Text strong>Kế hoạch chi tiết:</Text>
                                                                                </div>

                                                                                {!plan.DetailedPlan ? (
                                                                                    /* Tạo template mặc định dựa vào membership */
                                                                                    (() => {
                                                                                        // Xác định template mặc định dựa vào paymentInfo
                                                                                        let defaultTemplate = null;

                                                                                        if (paymentInfo && paymentInfo.PlanName) {
                                                                                            const planName = paymentInfo.PlanName.toLowerCase();
                                                                                            if (planName.includes('premium') || planName.includes('cao cấp')) {
                                                                                                defaultTemplate = allTemplateOptions.find(t => t.id === 'premium');
                                                                                            } else if (planName.includes('basic') || planName.includes('cơ bản')) {
                                                                                                defaultTemplate = allTemplateOptions.find(t => t.id === 'basic');
                                                                                            }
                                                                                        }

                                                                                        // Fallback: dùng basic template
                                                                                        if (!defaultTemplate) {
                                                                                            defaultTemplate = allTemplateOptions.find(t => t.id === 'basic');
                                                                                        }

                                                                                        if (defaultTemplate && defaultTemplate.phases.length > 0) {
                                                                                            return (
                                                                                                <div style={{ marginLeft: '24px' }}>
                                                                                                    {/* Info về template được áp dụng */}
                                                                                                    <div style={{
                                                                                                        marginBottom: '16px',
                                                                                                        padding: '12px',
                                                                                                        background: `${defaultTemplate.color}10`,
                                                                                                        borderRadius: '8px',
                                                                                                        border: `1px solid ${defaultTemplate.color}30`
                                                                                                    }}>
                                                                                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                                                                                            <span style={{ fontSize: '16px', marginRight: '8px' }}>
                                                                                                                📋
                                                                                                            </span>
                                                                                                            <Text strong style={{ color: defaultTemplate.color, fontSize: '14px' }}>
                                                                                                                Kế hoạch mặc định: {defaultTemplate.name}
                                                                                                            </Text>
                                                                                                        </div>
                                                                                                        <Text style={{ fontSize: '12px', color: '#6b7280' }}>
                                                                                                            Được áp dụng tự động dựa vào gói dịch vụ của bạn
                                                                                                        </Text>
                                                                                                    </div>

                                                                                                    {/* Các phases của template */}
                                                                                                    {defaultTemplate.phases.map((phase, index) => (
                                                                                                        <div key={index} style={{
                                                                                                            marginBottom: '16px',
                                                                                                            padding: '12px',
                                                                                                            background: 'white',
                                                                                                            borderRadius: '8px',
                                                                                                            border: '1px solid #e2e8f0'
                                                                                                        }}>
                                                                                                            <div style={{
                                                                                                                display: 'flex',
                                                                                                                alignItems: 'flex-start',
                                                                                                                marginBottom: '8px'
                                                                                                            }}>
                                                                                                                <Checkbox
                                                                                                                    checked={true}
                                                                                                                    disabled
                                                                                                                    style={{ marginRight: '8px', marginTop: '2px' }}
                                                                                                                />
                                                                                                                <Text strong style={{
                                                                                                                    color: defaultTemplate.color,
                                                                                                                    fontSize: '14px'
                                                                                                                }}>
                                                                                                                    {phase.phaseName}
                                                                                                                </Text>
                                                                                                            </div>
                                                                                                            <div style={{
                                                                                                                marginLeft: '28px',
                                                                                                                fontSize: '13px',
                                                                                                                lineHeight: '1.6',
                                                                                                                color: '#4b5563'
                                                                                                            }}>
                                                                                                                {phase.phaseDescription.split('•').map((item, idx) => {
                                                                                                                    if (idx === 0 && item.trim() === '') return null;
                                                                                                                    return (
                                                                                                                        <div key={idx} style={{
                                                                                                                            marginBottom: '4px',
                                                                                                                            display: 'flex',
                                                                                                                            alignItems: 'flex-start'
                                                                                                                        }}>
                                                                                                                            <span style={{
                                                                                                                                marginRight: '6px',
                                                                                                                                color: '#10b981',
                                                                                                                                fontWeight: 'bold'
                                                                                                                            }}>•</span>
                                                                                                                            <span>{item.trim()}</span>
                                                                                                                        </div>
                                                                                                                    );
                                                                                                                })}
                                                                                                            </div>

                                                                                                            {/* Duration badge */}
                                                                                                            <div style={{
                                                                                                                marginTop: '8px',
                                                                                                                marginLeft: '28px',
                                                                                                                display: 'flex',
                                                                                                                justifyContent: 'flex-end'
                                                                                                            }}>
                                                                                                                <Tag
                                                                                                                    color="blue"
                                                                                                                    style={{
                                                                                                                        fontSize: '11px',
                                                                                                                        padding: '2px 8px',
                                                                                                                        borderRadius: '12px'
                                                                                                                    }}
                                                                                                                >
                                                                                                                    📅 {phase.durationDays} ngày
                                                                                                                </Tag>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    ))}
                                                                                                </div>
                                                                                            );
                                                                                        } else {
                                                                                            // Fallback nếu không có template nào
                                                                                            return (
                                                                                                <div style={{
                                                                                                    textAlign: 'center',
                                                                                                    padding: '20px',
                                                                                                    color: '#6b7280'
                                                                                                }}>
                                                                                                    <BookOutlined style={{ fontSize: '24px', marginBottom: '8px', color: '#d1d5db' }} />
                                                                                                    <Text style={{ display: 'block', fontSize: '14px', marginBottom: '8px' }}>
                                                                                                        Kế hoạch này chưa có chi tiết cụ thể
                                                                                                    </Text>
                                                                                                    <Text style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '16px' }}>
                                                                                                        Tạo kế hoạch mới với template để có hướng dẫn chi tiết
                                                                                                    </Text>
                                                                                                    <Button
                                                                                                        type="primary"
                                                                                                        size="small"
                                                                                                        onClick={() => {
                                                                                                            document.querySelector('[data-template-section]')?.scrollIntoView({
                                                                                                                behavior: 'smooth',
                                                                                                                block: 'start'
                                                                                                            });
                                                                                                        }}
                                                                                                        style={{
                                                                                                            background: '#6366f1',
                                                                                                            borderColor: '#6366f1'
                                                                                                        }}
                                                                                                    >
                                                                                                        Tạo kế hoạch mới với template
                                                                                                    </Button>
                                                                                                </div>
                                                                                            );
                                                                                        }
                                                                                    })()
                                                                                ) : (
                                                                                    /* Hiển thị template gốc dựa vào nội dung DetailedPlan */
                                                                                    (() => {
                                                                                        // Xác định template nào đã được sử dụng dựa vào nội dung
                                                                                        let matchedTemplate = null;

                                                                                        // Kiểm tra xem có TEMPLATE_ID trong DetailedPlan không
                                                                                        const templateIdMatch = plan.DetailedPlan.match(/\[TEMPLATE_ID:([^\]]+)\]/);
                                                                                        if (templateIdMatch) {
                                                                                            const templateId = templateIdMatch[1];
                                                                                            matchedTemplate = allTemplateOptions.find(t => t.id === templateId);
                                                                                        }

                                                                                        // Nếu không tìm thấy TEMPLATE_ID, thử match bằng phase names (logic cũ)
                                                                                        if (!matchedTemplate) {
                                                                                            for (const template of allTemplateOptions) {
                                                                                                if (template.phases && template.phases.length > 0) {
                                                                                                    // Kiểm tra xem có phase nào match không
                                                                                                    const hasMatchingPhases = template.phases.some(phase =>
                                                                                                        plan.DetailedPlan.includes(phase.phaseName) ||
                                                                                                        plan.DetailedPlan.includes(phase.phaseName.split(':')[0])
                                                                                                    );

                                                                                                    if (hasMatchingPhases) {
                                                                                                        matchedTemplate = template;
                                                                                                        break;
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        }

                                                                                        if (matchedTemplate && matchedTemplate.phases.length > 0) {
                                                                                            // Hiển thị template gốc
                                                                                            return (
                                                                                                <div style={{ marginLeft: '24px' }}>
                                                                                                    {/* Template info */}
                                                                                                    <div style={{
                                                                                                        marginBottom: '16px',
                                                                                                        padding: '12px',
                                                                                                        background: `${matchedTemplate.color}10`,
                                                                                                        borderRadius: '8px',
                                                                                                        border: `1px solid ${matchedTemplate.color}30`
                                                                                                    }}>
                                                                                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                                                                                            <span style={{ fontSize: '20px', marginRight: '8px' }}>
                                                                                                                {matchedTemplate.icon}
                                                                                                            </span>
                                                                                                            <Text strong style={{ color: matchedTemplate.color }}>
                                                                                                                {matchedTemplate.name}
                                                                                                            </Text>
                                                                                                        </div>
                                                                                                        <Text style={{ fontSize: '12px', color: '#6b7280' }}>
                                                                                                            {matchedTemplate.description}
                                                                                                        </Text>
                                                                                                    </div>

                                                                                                    {/* Các phases của template */}
                                                                                                    {matchedTemplate.phases.map((phase, index) => (
                                                                                                        <div key={index} style={{
                                                                                                            marginBottom: '16px',
                                                                                                            padding: '12px',
                                                                                                            background: 'white',
                                                                                                            borderRadius: '8px',
                                                                                                            border: '1px solid #e2e8f0'
                                                                                                        }}>
                                                                                                            <div style={{
                                                                                                                display: 'flex',
                                                                                                                alignItems: 'flex-start',
                                                                                                                marginBottom: '8px'
                                                                                                            }}>
                                                                                                                <Checkbox
                                                                                                                    checked={true}
                                                                                                                    disabled
                                                                                                                    style={{ marginRight: '8px', marginTop: '2px' }}
                                                                                                                />
                                                                                                                <Text strong style={{
                                                                                                                    color: matchedTemplate.color,
                                                                                                                    fontSize: '14px'
                                                                                                                }}>
                                                                                                                    {phase.phaseName}
                                                                                                                </Text>
                                                                                                            </div>
                                                                                                            <div style={{
                                                                                                                marginLeft: '28px',
                                                                                                                fontSize: '13px',
                                                                                                                lineHeight: '1.6',
                                                                                                                color: '#4b5563'
                                                                                                            }}>
                                                                                                                {phase.phaseDescription.split('•').map((item, idx) => {
                                                                                                                    if (idx === 0 && item.trim() === '') return null;
                                                                                                                    return (
                                                                                                                        <div key={idx} style={{
                                                                                                                            marginBottom: '4px',
                                                                                                                            display: 'flex',
                                                                                                                            alignItems: 'flex-start'
                                                                                                                        }}>
                                                                                                                            <span style={{
                                                                                                                                marginRight: '6px',
                                                                                                                                color: '#10b981',
                                                                                                                                fontWeight: 'bold'
                                                                                                                            }}>•</span>
                                                                                                                            <span>{item.trim()}</span>
                                                                                                                        </div>
                                                                                                                    );
                                                                                                                })}
                                                                                                            </div>

                                                                                                            {/* Duration badge */}
                                                                                                            <div style={{
                                                                                                                marginTop: '8px',
                                                                                                                marginLeft: '28px',
                                                                                                                display: 'flex',
                                                                                                                justifyContent: 'flex-end'
                                                                                                            }}>
                                                                                                                <Tag
                                                                                                                    color="blue"
                                                                                                                    style={{
                                                                                                                        fontSize: '11px',
                                                                                                                        padding: '2px 8px',
                                                                                                                        borderRadius: '12px'
                                                                                                                    }}
                                                                                                                >
                                                                                                                    📅 {phase.durationDays} ngày
                                                                                                                </Tag>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    ))}
                                                                                                </div>
                                                                                            );
                                                                                        } else {
                                                                                            // Fallback: hiển thị text thô nếu không match được template
                                                                                            return (
                                                                                                <Paragraph
                                                                                                    style={{
                                                                                                        marginLeft: '24px',
                                                                                                        marginBottom: '0',
                                                                                                        fontSize: '13px',
                                                                                                        lineHeight: '1.6',
                                                                                                        whiteSpace: 'pre-line'
                                                                                                    }}
                                                                                                    ellipsis={{ rows: 5, expandable: true, symbol: 'Xem toàn bộ kế hoạch' }}
                                                                                                >
                                                                                                    {plan.DetailedPlan}
                                                                                                </Paragraph>
                                                                                            );
                                                                                        }
                                                                                    })()
                                                                                )}
                                                                            </div>
                                                                        </Col>
                                                                    </Row>
                                                                </Card>
                                                            </List.Item>
                                                        );
                                                    }}
                                                />
                                            </Col>
                                        )}
                                    </Row>
                                </TabPane>
                                <TabPane
                                    tab={
                                        <span>
                                            <BookOutlined />
                                            Tiến trình
                                            <Badge
                                                status="processing"
                                                style={{ marginLeft: 8 }}
                                            />
                                        </span>
                                    }
                                    key="progress"
                                >
                                    <ProgressLogs existingPlans={existingPlans} setActiveTab={setActiveTab} />
                                </TabPane>

                            </Tabs>
                        </Card>

                        {/* Thông tin hướng dẫn */}
                        <Card className="shadow-lg rounded-lg mt-6">
                            <Title level={4}>
                                <CheckCircleOutlined className="mr-2 text-green-500" />
                                Lưu ý quan trọng
                            </Title>
                            <Row gutter={[16, 16]}>
                                <Col xs={24} md={8}>
                                    <Card size="small" className="h-full bg-blue-50">
                                        <Title level={5}>Kế hoạch theo gói</Title>
                                        <Text>
                                            Mỗi gói dịch vụ có kế hoạch mẫu chuyên nghiệp được thiết kế riêng để tối ưu hóa hiệu quả cai thuốc.
                                        </Text>
                                    </Card>
                                </Col>

                                <Col xs={24} md={8}>
                                    <Card size="small" className="h-full bg-green-50">
                                        <Title level={5}>Tính năng Coach</Title>
                                        <Text>
                                            Các coach sẽ có thể can thiệp và chỉnh sửa kế hoạch chi tiết để hỗ trợ bạn tốt hơn.
                                        </Text>
                                    </Card>
                                </Col>

                                <Col xs={24} md={8}>
                                    <Card size="small" className="h-full bg-yellow-50">
                                        <Title level={5}>Theo dõi tiến trình</Title>
                                        <Text>
                                            Hãy thường xuyên cập nhật tiến trình và điều chỉnh kế hoạch phù hợp với tình hình thực tế.
                                        </Text>
                                    </Card>
                                </Col>
                            </Row>
                        </Card>
                    </div>
                </div>
            </AccessGuard>
        );
    };

    return renderContent();
};

export default QuitPlanPage; 