import React, { useState, useEffect } from 'react';
import {
    Form,
    Input,
    Button,
    Card,
    Typography,
    message,
    DatePicker,
    InputNumber,
    Row,
    Col,
    Tag,
    Space,
    Alert,
    List,
    Checkbox
} from 'antd';
import {
    CalendarOutlined,
    ArrowLeftOutlined,
    SaveOutlined,
    HeartOutlined,
    CheckCircleOutlined,
    PlusOutlined,
    MinusOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import AccessGuard from '../components/common/AccessGuard';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// Create axios instance with defaults
const api = axios.create({
    baseURL: '', // Use relative path for proxy
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: false,
    timeout: 10000
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

const QuitPlanFormPage = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const location = useLocation();

    const [submitting, setSubmitting] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [membershipInfo, setMembershipInfo] = useState(null);
    const [membershipLoading, setMembershipLoading] = useState(true);
    const [selectedPhases, setSelectedPhases] = useState([]);

    useEffect(() => {
        // Get selected template from navigation state
        if (location.state && location.state.selectedTemplate) {
            setSelectedTemplate(location.state.selectedTemplate);

            // Initialize all phases as selected by default
            if (location.state.selectedTemplate.phases.length > 0) {
                const allPhases = location.state.selectedTemplate.phases.map((phase, index) => ({
                    ...phase,
                    id: index,
                    selected: true
                }));
                setSelectedPhases(allPhases);
                updateDetailedPlan(allPhases);
            }
        } else {
            // Redirect back if no template selected
            message.warning('Vui lòng chọn template trước');
            navigate('/quit-plan');
        }

        // Load membership info
        loadMembershipInfo();
    }, [location.state, form, navigate]);

    const loadMembershipInfo = async () => {
        try {
            setMembershipLoading(true);
            const token = localStorage.getItem('token');

            const response = await api.get('/api/user/status', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success && response.data.data.membership) {
                setMembershipInfo(response.data.data.membership);
            }
        } catch (error) {
            console.error('Error loading membership info:', error);
        } finally {
            setMembershipLoading(false);
        }
    };

    const handleBackToTemplate = () => {
        if (selectedTemplate) {
            navigate(`/quit-plan/template/${selectedTemplate.id}`, {
                state: { template: selectedTemplate }
            });
        } else {
            navigate('/quit-plan');
        }
    };

    const handleStartDateChange = (date) => {
        if (date && selectedTemplate && selectedTemplate.totalDays) {
            // Auto-calculate target date based on template duration
            let targetDate = dayjs(date).add(selectedTemplate.totalDays, 'day');

            // Check if target date exceeds membership end date
            if (membershipInfo && membershipInfo.endDate) {
                const membershipEndDate = dayjs(membershipInfo.endDate);
                if (targetDate.isAfter(membershipEndDate)) {
                    targetDate = membershipEndDate;
                    message.warning(`Ngày mục tiêu đã được điều chỉnh về ${membershipEndDate.format('DD/MM/YYYY')} do giới hạn thời hạn gói dịch vụ`);
                }
            }

            form.setFieldsValue({
                targetDate: targetDate
            });
        }
    };

    const handleSubmit = async (values) => {
        try {
            setSubmitting(true);

            // Format dates
            const formatDate = (dateValue) => {
                if (!dateValue) return null;
                if (dayjs.isDayjs(dateValue)) {
                    return dateValue.format('YYYY-MM-DD');
                }
                return dayjs(dateValue).format('YYYY-MM-DD');
            };

            const submitData = {
                startDate: formatDate(values.startDate),
                targetDate: formatDate(values.targetDate),
                reason: values.reason || '',
                motivationLevel: values.motivationLevel || 5,
                detailedPlan: values.detailedPlan || '',
                templateId: selectedTemplate.id
            };

            console.log('📤 Final submit data:', submitData);

            // Validation
            if (!submitData.startDate || !submitData.targetDate || !submitData.reason || !submitData.motivationLevel) {
                const missingFields = [];
                if (!submitData.startDate) missingFields.push('ngày bắt đầu');
                if (!submitData.targetDate) missingFields.push('ngày mục tiêu');
                if (!submitData.reason) missingFields.push('lý do');
                if (!submitData.motivationLevel) missingFields.push('mức độ động lực');

                message.error(`Vui lòng điền: ${missingFields.join(', ')}`);
                setSubmitting(false);
                return;
            }

            const response = await api.post('/api/quit-plan', submitData);
            console.log('✅ API response:', response);

            message.success('🎉 Kế hoạch cai thuốc đã được tạo thành công!');

            // Reset form and navigate back
            form.resetFields();
            navigate('/quit-plan', {
                state: {
                    justCreated: true,
                    message: 'Kế hoạch đã được tạo thành công!'
                }
            });

        } catch (error) {
            console.error('❌ Error submitting plan:', error);

            if (error.response?.status === 401) {
                message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                navigate('/login');
            } else if (error.response?.status === 400) {
                message.error(error.response.data?.message || 'Dữ liệu không hợp lệ');
            } else if (error.response?.status === 409) {
                message.error('Bạn đã có kế hoạch đang hoạt động. Vui lòng hoàn thành kế hoạch hiện tại trước khi tạo mới.');
            } else {
                message.error('Có lỗi xảy ra khi tạo kế hoạch. Vui lòng thử lại.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Update detailed plan based on selected phases
    const updateDetailedPlan = (phases) => {
        const selectedPhasesOnly = phases.filter(phase => phase.selected);
        const templateText = selectedPhasesOnly.map((phase, index) =>
            `${phase.phaseName}:\n${phase.phaseDescription}\n`
        ).join('\n');

        form.setFieldsValue({
            detailedPlan: templateText
        });
    };

    // Toggle phase selection
    const handlePhaseToggle = (phaseId) => {
        const updatedPhases = selectedPhases.map(phase =>
            phase.id === phaseId
                ? { ...phase, selected: !phase.selected }
                : phase
        );
        setSelectedPhases(updatedPhases);
        updateDetailedPlan(updatedPhases);
    };



    // Add all phases
    const handleSelectAllPhases = () => {
        const updatedPhases = selectedPhases.map(phase => ({ ...phase, selected: true }));
        setSelectedPhases(updatedPhases);
        updateDetailedPlan(updatedPhases);
    };

    // Remove all phases
    const handleDeselectAllPhases = () => {
        const updatedPhases = selectedPhases.map(phase => ({ ...phase, selected: false }));
        setSelectedPhases(updatedPhases);
        updateDetailedPlan(updatedPhases);
    };

    if (!selectedTemplate) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Alert
                    message="Chưa chọn template"
                    description="Vui lòng chọn template trước khi điền form."
                    type="warning"
                    showIcon
                    action={
                        <Button size="small" onClick={() => navigate('/quit-plan')}>
                            Về trang chọn template
                        </Button>
                    }
                />
            </div>
        );
    }

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
                                    onClick={handleBackToTemplate}
                                    style={{ marginRight: '16px' }}
                                >
                                    Quay lại xem template
                                </Button>
                                <div>
                                    <Title level={2} style={{ margin: 0 }}>
                                        📋 Tạo kế hoạch cai thuốc
                                    </Title>
                                    <Text type="secondary">Điền thông tin chi tiết cho kế hoạch của bạn</Text>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Row gutter={[24, 24]}>
                        {/* Form */}
                        <Col xs={24}>
                            <Card
                                title={
                                    <div className="flex items-center">
                                        <SaveOutlined className="mr-2" style={{ color: '#667eea' }} />
                                        <span>Thông tin kế hoạch</span>
                                    </div>
                                }
                                className="shadow-lg"
                            >
                                {/* Selected Template Info */}
                                <div style={{
                                    background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    marginBottom: '24px',
                                    border: '1px solid rgba(16, 185, 129, 0.2)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <Text style={{
                                            color: '#065f46',
                                            fontWeight: 600,
                                            display: 'block'
                                        }}>
                                            Template đã chọn: {selectedTemplate.name}
                                        </Text>
                                        <Text style={{
                                            color: '#047857',
                                            fontSize: '12px'
                                        }}>
                                            {selectedTemplate.description}
                                        </Text>
                                    </div>
                                    <Button
                                        size="small"
                                        onClick={handleBackToTemplate}
                                        style={{
                                            borderRadius: '8px',
                                            fontSize: '12px'
                                        }}
                                    >
                                        Xem lại template
                                    </Button>
                                </div>

                                {/* Membership Info Alert */}
                                {membershipInfo && membershipInfo.endDate && (
                                    <Alert
                                        message="Lưu ý về thời hạn gói dịch vụ"
                                        description={
                                            <div>
                                                <p>
                                                    Gói <strong>{membershipInfo.planName}</strong> của bạn có hiệu lực đến{' '}
                                                    <strong style={{ color: '#1890ff' }}>
                                                        {dayjs(membershipInfo.endDate).format('DD/MM/YYYY')}
                                                    </strong>.
                                                </p>
                                                <p style={{ margin: 0 }}>
                                                    Ngày mục tiêu cai thuốc phải nằm trong thời gian này để đảm bảo bạn được hỗ trợ đầy đủ.
                                                </p>
                                            </div>
                                        }
                                        type="info"
                                        showIcon
                                        style={{ marginBottom: '24px' }}
                                    />
                                )}

                                <Form
                                    form={form}
                                    layout="vertical"
                                    onFinish={handleSubmit}
                                    scrollToFirstError
                                >
                                    <Row gutter={16}>
                                        <Col xs={24} sm={12}>
                                            <Form.Item
                                                label={
                                                    <span style={{ fontWeight: 600, color: '#374151' }}>
                                                        <CalendarOutlined style={{ marginRight: '8px', color: '#667eea' }} />
                                                        Ngày bắt đầu cai thuốc
                                                    </span>
                                                }
                                                name="startDate"
                                                rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu' }]}
                                            >
                                                <DatePicker
                                                    style={{
                                                        width: '100%',
                                                        borderRadius: '8px',
                                                        height: '40px'
                                                    }}
                                                    placeholder="Chọn ngày bắt đầu"
                                                    format="DD/MM/YYYY"
                                                    onChange={handleStartDateChange}
                                                    disabledDate={(current) => {
                                                        return current && current < dayjs().startOf('day');
                                                    }}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} sm={12}>
                                            <Form.Item
                                                label={
                                                    <span style={{ fontWeight: 600, color: '#374151' }}>
                                                        <CalendarOutlined style={{ marginRight: '8px', color: '#10b981' }} />
                                                        Ngày mục tiêu hoàn thành
                                                    </span>
                                                }
                                                name="targetDate"
                                                rules={[{ required: true, message: 'Vui lòng chọn ngày mục tiêu' }]}
                                            >
                                                <DatePicker
                                                    style={{
                                                        width: '100%',
                                                        borderRadius: '8px',
                                                        height: '40px'
                                                    }}
                                                    placeholder="Chọn ngày mục tiêu"
                                                    format="DD/MM/YYYY"
                                                    disabledDate={(current) => {
                                                        const startDate = form.getFieldValue('startDate');

                                                        // Disable past dates
                                                        if (current && current < dayjs().startOf('day')) {
                                                            return true;
                                                        }

                                                        // Disable dates before start date
                                                        if (startDate && current && current <= dayjs(startDate).startOf('day')) {
                                                            return true;
                                                        }

                                                        // Disable dates after membership end date
                                                        if (membershipInfo && membershipInfo.endDate) {
                                                            const membershipEndDate = dayjs(membershipInfo.endDate);
                                                            if (current && current > membershipEndDate.endOf('day')) {
                                                                return true;
                                                            }
                                                        }

                                                        return false;
                                                    }}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Form.Item
                                        label={
                                            <span style={{ fontWeight: 600, color: '#374151' }}>
                                                <HeartOutlined style={{ marginRight: '8px', color: '#ef4444' }} />
                                                Lý do cai thuốc
                                            </span>
                                        }
                                        name="reason"
                                        rules={[{ required: true, message: 'Vui lòng nhập lý do cai thuốc' }]}
                                    >
                                        <TextArea
                                            rows={3}
                                            placeholder="Ví dụ: Vì sức khỏe gia đình, tiết kiệm chi phí, cải thiện sức khỏe..."
                                            style={{
                                                borderRadius: '8px',
                                                fontSize: '14px'
                                            }}
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        label={
                                            <span style={{ fontWeight: 600, color: '#374151' }}>
                                                Mức độ động lực (1-10)
                                            </span>
                                        }
                                        name="motivationLevel"
                                        rules={[
                                            { required: true, message: 'Vui lòng đánh giá mức độ động lực' },
                                            { type: 'number', min: 1, max: 10, message: 'Mức độ động lực phải từ 1 đến 10' }
                                        ]}
                                    >
                                        <InputNumber
                                            min={1}
                                            max={10}
                                            style={{ width: '100%', borderRadius: '8px', height: '40px' }}
                                            placeholder="Đánh giá mức độ quyết tâm của bạn (1: thấp, 10: rất cao)"
                                        />
                                    </Form.Item>

                                    {/* Interactive Template Section */}
                                    <Form.Item
                                        label={
                                            <div className="flex items-center justify-between" style={{ width: '100%' }}>
                                                <span style={{ fontWeight: 600, color: '#374151' }}>
                                                    📋 Kế hoạch chi tiết từ template
                                                </span>
                                                {selectedTemplate.phases.length > 0 && (
                                                    <Space>
                                                        <Button
                                                            size="small"
                                                            icon={<PlusOutlined />}
                                                            onClick={handleSelectAllPhases}
                                                            type="link"
                                                        >
                                                            Chọn tất cả
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            icon={<MinusOutlined />}
                                                            onClick={handleDeselectAllPhases}
                                                            type="link"
                                                            danger
                                                        >
                                                            Bỏ chọn
                                                        </Button>
                                                    </Space>
                                                )}
                                            </div>
                                        }
                                    >
                                        {selectedTemplate.phases.length > 0 ? (
                                            <div style={{
                                                border: '1px solid #d9d9d9',
                                                borderRadius: '8px',
                                                padding: '16px',
                                                background: '#fafafa'
                                            }}>
                                                <Alert
                                                    message="Cách sử dụng"
                                                    description="✅ Tích chọn các giai đoạn bạn muốn sử dụng trong kế hoạch cai thuốc của mình"
                                                    type="info"
                                                    showIcon
                                                    style={{ marginBottom: '16px' }}
                                                />

                                                <List
                                                    dataSource={selectedPhases}
                                                    renderItem={(phase) => (
                                                        <List.Item style={{ padding: '8px 0' }}>
                                                            <Card
                                                                size="small"
                                                                className={`w-full shadow-sm transition-all duration-200 ${phase.selected
                                                                    ? 'border-blue-500 bg-blue-50'
                                                                    : 'border-gray-200 bg-gray-50'
                                                                    }`}
                                                                style={{ cursor: 'pointer' }}
                                                                onClick={() => handlePhaseToggle(phase.id)}
                                                            >
                                                                <div className="flex items-start space-x-3">
                                                                    <div className="flex-shrink-0">
                                                                        <Checkbox
                                                                            checked={phase.selected}
                                                                            onChange={() => handlePhaseToggle(phase.id)}
                                                                        />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <Title level={5} className={`mb-2 ${phase.selected ? 'text-blue-700' : 'text-gray-500'}`}>
                                                                            {phase.phaseName}
                                                                        </Title>
                                                                        <Paragraph className={`mb-2 whitespace-pre-line text-sm ${phase.selected ? 'text-gray-700' : 'text-gray-400'}`}>
                                                                            {phase.phaseDescription}
                                                                        </Paragraph>
                                                                        <Tag color={phase.selected ? 'blue' : 'default'} className="font-medium">
                                                                            📅 {phase.durationDays} ngày
                                                                        </Tag>
                                                                    </div>
                                                                </div>
                                                            </Card>
                                                        </List.Item>
                                                    )}
                                                />


                                            </div>
                                        ) : (
                                            <div className="text-center py-8" style={{
                                                border: '1px dashed #d9d9d9',
                                                borderRadius: '8px',
                                                background: '#fafafa'
                                            }}>
                                                <div style={{
                                                    width: '80px',
                                                    height: '80px',
                                                    borderRadius: '50%',
                                                    background: `linear-gradient(135deg, ${selectedTemplate.color} 0%, ${selectedTemplate.color}CC 100%)`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    margin: '0 auto 16px',
                                                    fontSize: '32px'
                                                }}>
                                                    ✍️
                                                </div>
                                                <Title level={4} style={{ color: selectedTemplate.color }}>
                                                    Kế hoạch tự tạo
                                                </Title>
                                                <Text style={{ color: '#6b7280' }}>
                                                    Bạn sẽ tự thiết kế kế hoạch chi tiết khi điền thông tin khác trong form
                                                </Text>
                                            </div>
                                        )}
                                    </Form.Item>

                                    <Form.Item>
                                        <Space size="large" style={{ width: '100%', justifyContent: 'center' }}>
                                            <Button
                                                size="large"
                                                onClick={handleBackToTemplate}
                                                style={{
                                                    borderRadius: '12px',
                                                    height: '48px',
                                                    paddingInline: '24px'
                                                }}
                                            >
                                                Quay lại xem template
                                            </Button>
                                            <Button
                                                type="primary"
                                                size="large"
                                                htmlType="submit"
                                                loading={submitting}
                                                icon={<CheckCircleOutlined />}
                                                style={{
                                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                    border: 'none',
                                                    borderRadius: '12px',
                                                    fontSize: '16px',
                                                    fontWeight: 600,
                                                    height: '48px',
                                                    paddingInline: '32px'
                                                }}
                                            >
                                                Tạo kế hoạch cai thuốc
                                            </Button>
                                        </Space>
                                    </Form.Item>
                                </Form>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </div>
        </AccessGuard>
    );
};

export default QuitPlanFormPage; 