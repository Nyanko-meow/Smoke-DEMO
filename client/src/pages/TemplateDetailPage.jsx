import React, { useState, useEffect } from 'react';
import {
    Card,
    Typography,
    Button,
    Row,
    Col,
    List,
    Tag,
    Space,
    Progress,
    Alert,
    Spin
} from 'antd';
import {
    CalendarOutlined,
    CheckCircleOutlined,
    ArrowLeftOutlined,
    FormOutlined,
    ClockCircleOutlined,
    TrophyOutlined
} from '@ant-design/icons';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import AccessGuard from '../components/common/AccessGuard';

const { Title, Text, Paragraph } = Typography;

const TemplateDetailPage = () => {
    const navigate = useNavigate();
    const { templateId } = useParams();
    const location = useLocation();

    // Get template data from navigation state or local storage
    const [templateData, setTemplateData] = useState(null);
    const [loading, setLoading] = useState(true);

    // All template options (same as in QuitPlanPage)
    const allTemplateOptions = [
        {
            id: 'premium',
            name: 'Kế hoạch Premium - 8 tuần',
            description: 'Kế hoạch chuyên nghiệp được thiết kế bởi chuyên gia, phù hợp với hầu hết mọi người',
            icon: '🏆',
            color: '#52c41a',
            duration: '8 tuần (56 ngày)',
            totalDays: 56,
            planDuration: 60,
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
            planDuration: 60,
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
            planDuration: 15,
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
            planDuration: 15,
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
            totalDays: null,
            planDuration: null,
            phases: []
        }
    ];

    useEffect(() => {
        // Try to get template data from navigation state first
        if (location.state && location.state.template) {
            setTemplateData(location.state.template);
            setLoading(false);
        } else {
            // Fallback: find template by ID
            const template = allTemplateOptions.find(t => t.id === templateId);
            if (template) {
                setTemplateData(template);
            }
            setLoading(false);
        }
    }, [templateId, location.state]);

    const handleBackToSelection = () => {
        navigate('/quit-plan');
    };

    const handleProceedToForm = () => {
        if (templateData) {
            navigate('/quit-plan/form', {
                state: { selectedTemplate: templateData }
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Spin size="large" />
            </div>
        );
    }

    if (!templateData) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Alert
                    message="Không tìm thấy template"
                    description="Template bạn đang tìm không tồn tại."
                    type="error"
                    showIcon
                    action={
                        <Button size="small" onClick={handleBackToSelection}>
                            Quay lại chọn template
                        </Button>
                    }
                />
            </div>
        );
    }

    // Calculate total timeline
    const totalDays = templateData.phases.reduce((sum, phase) => sum + (phase.durationDays || 0), 0);

    return (
        <AccessGuard>
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '24px'
            }}>
                <div className="container mx-auto" style={{ maxWidth: '1200px' }}>
                    {/* Header */}
                    <Card className="shadow-lg rounded-lg mb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <Button
                                    icon={<ArrowLeftOutlined />}
                                    onClick={handleBackToSelection}
                                    style={{ marginRight: '16px' }}
                                >
                                    Quay lại
                                </Button>
                                <div>
                                    <Title level={2} style={{ margin: 0, color: templateData.color }}>
                                        {templateData.icon} {templateData.name}
                                    </Title>
                                    <Text type="secondary">{templateData.description}</Text>
                                </div>
                            </div>
                            <Button
                                type="primary"
                                size="large"
                                icon={<FormOutlined />}
                                onClick={handleProceedToForm}
                                style={{
                                    background: `linear-gradient(135deg, ${templateData.color} 0%, ${templateData.color}CC 100%)`,
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    height: '48px',
                                    paddingInline: '32px'
                                }}
                            >
                                Bắt đầu tạo kế hoạch
                            </Button>
                        </div>
                    </Card>

                    <Row gutter={[32, 32]}>
                        {/* Template Overview */}
                        <Col xs={24} lg={8}>
                            <Card
                                title={
                                    <div className="flex items-center">
                                        <TrophyOutlined className="mr-2" style={{ color: templateData.color }} />
                                        <span>Tổng quan kế hoạch</span>
                                    </div>
                                }
                                className="shadow-lg h-full"
                            >
                                <div className="space-y-6">
                                    <div className="text-center p-6 rounded-lg" style={{ background: `${templateData.color}15` }}>
                                        <div style={{
                                            width: '80px',
                                            height: '80px',
                                            borderRadius: '50%',
                                            background: `linear-gradient(135deg, ${templateData.color} 0%, ${templateData.color}CC 100%)`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto 20px',
                                            fontSize: '36px',
                                            boxShadow: `0 8px 24px ${templateData.color}30`
                                        }}>
                                            {templateData.icon}
                                        </div>
                                        <Title level={4} style={{ color: templateData.color, margin: 0 }}>
                                            {templateData.name}
                                        </Title>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '20px' }}>
                                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                                            <div className="text-2xl font-bold text-blue-600">
                                                {templateData.phases.length}
                                            </div>
                                            <div className="text-sm text-gray-600">Giai đoạn</div>
                                        </div>
                                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                                            <div className="text-2xl font-bold text-green-600">
                                                {totalDays || templateData.duration}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {totalDays ? 'Ngày' : 'Thời gian'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-5 bg-yellow-50 rounded-lg border-l-4 border-yellow-400" style={{ marginBottom: '20px' }}>
                                        <Title level={5} style={{ color: '#d97706', margin: 0, marginBottom: 12 }}>
                                            💡 Lưu ý quan trọng
                                        </Title>
                                        <Text style={{ color: '#92400e', fontSize: '14px' }}>
                                            {templateData.id === 'custom'
                                                ? 'Bạn sẽ tự thiết kế kế hoạch cai thuốc theo ý muốn. Hãy chuẩn bị sẵn những ý tưởng và mục tiêu cụ thể.'
                                                : 'Kế hoạch này được thiết kế bởi chuyên gia. Bạn có thể tùy chỉnh nội dung khi điền form.'
                                            }
                                        </Text>
                                    </div>

                                    {templateData.phases.length > 0 && (
                                        <div className="mt-8" style={{ paddingTop: '20px' }}>
                                            <Title level={5} style={{ marginBottom: '16px' }}>📊 Tiến độ thực hiện</Title>
                                            <div style={{ width: '100%', overflow: 'hidden' }}>
                                                <Progress
                                                    percent={0}
                                                    status="normal"
                                                    strokeColor={templateData.color}
                                                    trailColor="#f0f0f0"
                                                    strokeWidth={8}
                                                    format={() => '0%'}
                                                    style={{ width: '100%' }}
                                                />
                                                <Text style={{
                                                    color: '#6b7280',
                                                    fontSize: '12px',
                                                    display: 'block',
                                                    textAlign: 'center',
                                                    marginTop: '8px'
                                                }}>
                                                    Chưa bắt đầu
                                                </Text>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </Col>

                        {/* Template Phases Detail */}
                        <Col xs={24} lg={16}>
                            <Card
                                title={
                                    <div className="flex items-center">
                                        <CalendarOutlined className="mr-2" style={{ color: templateData.color }} />
                                        <span>Chi tiết các giai đoạn</span>
                                    </div>
                                }
                                className="shadow-lg"
                            >
                                {templateData.phases.length > 0 ? (
                                    <>
                                        <Alert
                                            message="Kế hoạch chi tiết từng giai đoạn"
                                            description="Dưới đây là lộ trình chi tiết được thiết kế để giúp bạn cai thuốc hiệu quả. Bạn có thể tùy chỉnh nội dung khi tạo kế hoạch."
                                            type="info"
                                            showIcon
                                            style={{ marginBottom: 24 }}
                                        />

                                        <List
                                            dataSource={templateData.phases}
                                            renderItem={(phase, index) => (
                                                <List.Item style={{ padding: 0, marginBottom: 32 }}>
                                                    <Card
                                                        size="small"
                                                        className="w-full shadow-sm"
                                                        style={{
                                                            borderLeft: `4px solid ${templateData.color}`,
                                                            borderRadius: '12px',
                                                            marginBottom: '8px'
                                                        }}
                                                    >
                                                        <div className="flex items-start space-x-4" style={{ padding: '8px 0' }}>
                                                            <div className="flex-shrink-0">
                                                                <div
                                                                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                                                                    style={{
                                                                        background: `linear-gradient(135deg, ${templateData.color} 0%, ${templateData.color}CC 100%)`,
                                                                        boxShadow: `0 4px 12px ${templateData.color}30`
                                                                    }}
                                                                >
                                                                    {index + 1}
                                                                </div>
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <Title level={4} style={{ margin: 0, color: templateData.color }}>
                                                                        {phase.phaseName}
                                                                    </Title>
                                                                    <Space>
                                                                        <Tag
                                                                            color={templateData.color}
                                                                            icon={<ClockCircleOutlined />}
                                                                            style={{ fontSize: '12px', fontWeight: 600 }}
                                                                        >
                                                                            {phase.durationDays} ngày
                                                                        </Tag>
                                                                    </Space>
                                                                </div>
                                                                <Paragraph
                                                                    style={{
                                                                        marginBottom: 0,
                                                                        whiteSpace: 'pre-line',
                                                                        color: '#374151',
                                                                        lineHeight: '1.6'
                                                                    }}
                                                                >
                                                                    {phase.phaseDescription}
                                                                </Paragraph>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                </List.Item>
                                            )}
                                        />
                                    </>
                                ) : (
                                    <div className="text-center py-12">
                                        <div style={{
                                            width: '120px',
                                            height: '120px',
                                            borderRadius: '50%',
                                            background: `linear-gradient(135deg, ${templateData.color} 0%, ${templateData.color}CC 100%)`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto 24px',
                                            fontSize: '48px'
                                        }}>
                                            ✍️
                                        </div>
                                        <Title level={3} style={{ color: templateData.color }}>
                                            Kế hoạch tự tạo
                                        </Title>
                                        <Paragraph style={{ fontSize: '16px', color: '#6b7280', maxWidth: '500px', margin: '0 auto' }}>
                                            Bạn sẽ tự thiết kế kế hoạch cai thuốc theo ý muốn của mình.
                                            Đây là cơ hội để bạn tạo ra một kế hoạch hoàn toàn phù hợp với
                                            hoàn cảnh và mục tiêu cá nhân.
                                        </Paragraph>
                                        <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                                            <Title level={5} style={{ color: '#7c3aed', margin: 0, marginBottom: 8 }}>
                                                💪 Lời khuyên
                                            </Title>
                                            <Text style={{ color: '#5b21b6' }}>
                                                Hãy nghĩ về những thách thức cá nhân và cách bạn muốn vượt qua chúng.
                                                Đặt ra các mục tiêu cụ thể và có thể đo lường được.
                                            </Text>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </Col>
                    </Row>

                    {/* Action Buttons */}
                    <Card className="shadow-lg rounded-lg mt-8" style={{ marginTop: '32px' }}>
                        <div className="flex items-center justify-between">
                            <div>
                                <Title level={4} style={{ margin: 0 }}>
                                    Sẵn sàng bắt đầu?
                                </Title>
                                <Text type="secondary">
                                    Bấm "Bắt đầu tạo kế hoạch" để chuyển sang bước điền thông tin chi tiết.
                                </Text>
                            </div>
                            <Space size="large">
                                <Button
                                    size="large"
                                    onClick={handleBackToSelection}
                                    style={{
                                        borderRadius: '12px',
                                        height: '48px',
                                        paddingInline: '24px'
                                    }}
                                >
                                    Chọn template khác
                                </Button>
                                <Button
                                    type="primary"
                                    size="large"
                                    icon={<FormOutlined />}
                                    onClick={handleProceedToForm}
                                    style={{
                                        background: `linear-gradient(135deg, ${templateData.color} 0%, ${templateData.color}CC 100%)`,
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        height: '48px',
                                        paddingInline: '32px'
                                    }}
                                >
                                    Bắt đầu tạo kế hoạch
                                </Button>
                            </Space>
                        </div>
                    </Card>
                </div>
            </div>
        </AccessGuard>
    );
};

export default TemplateDetailPage; 