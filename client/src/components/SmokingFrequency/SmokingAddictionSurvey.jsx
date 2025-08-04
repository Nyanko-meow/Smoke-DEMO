import React, { useState, useEffect } from 'react';
import {
    Card,
    Typography,
    Button,
    Form,
    InputNumber,
    Select,
    message,
    Spin,
    Row,
    Col,
    Alert,
    Space,
    Divider,
    Tag,
    Modal
} from 'antd';
import {
    SaveOutlined,
    CalculatorOutlined,
    SmileOutlined,
    MehOutlined,
    FrownOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import AccessGuard from '../common/AccessGuard';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// Dữ liệu khoảng giá gói thuốc
const CIGARETTE_PRICE_RANGES = [
    { 
        id: 'range1', 
        name: 'Thuốc lá rẻ', 
        minPrice: 15000, 
        maxPrice: 20000, 
        description: '15.000đ - 20.000đ/gói',
        defaultPrice: 17500
    },
    { 
        id: 'range2', 
        name: 'Thuốc lá bình dân', 
        minPrice: 21000, 
        maxPrice: 30000, 
        description: '21.000đ - 30.000đ/gói',
        defaultPrice: 25500
    },
    { 
        id: 'range3', 
        name: 'Thuốc lá trung cấp', 
        minPrice: 31000, 
        maxPrice: 40000, 
        description: '31.000đ - 40.000đ/gói',
        defaultPrice: 35500
    },
    { 
        id: 'range4', 
        name: 'Thuốc lá cao cấp', 
        minPrice: 41000, 
        maxPrice: 50000, 
        description: '41.000đ - 50.000đ/gói',
        defaultPrice: 45500
    },
    { 
        id: 'range5', 
        name: 'Thuốc lá nhập khẩu', 
        minPrice: 51000, 
        maxPrice: 70000, 
        description: '51.000đ - 70.000đ/gói',
        defaultPrice: 60500
    },
    { 
        id: 'range6', 
        name: 'Thuốc lá cao cấp nhập khẩu', 
        minPrice: 71000, 
        maxPrice: 120000, 
        description: '71.000đ - 120.000đ/gói',
        defaultPrice: 95500
    }
];

// Bộ câu hỏi đánh giá mức độ nghiện theo Fagerstrom Test for Nicotine Dependence (FTND)
const ADDICTION_ASSESSMENT_QUESTIONS = [
    {
        id: 'timeToFirstCigarette',
        question: 'Bạn hút điếu đầu tiên sau khi thức dậy bao lâu?',
        type: 'select',
        options: [
            { label: 'Trong vòng 5 phút', value: 'within_5_min', score: 3 },
            { label: '6-30 phút', value: '6_30_min', score: 2 },
            { label: '31-60 phút', value: '31_60_min', score: 1 },
            { label: 'Sau 60 phút', value: 'after_60_min', score: 0 }
        ]
    },
    {
        id: 'hardestToGiveUp',
        question: 'Điều thuốc nào bạn cảm thấy khó bỏ nhất?',
        type: 'select',
        options: [
            { label: 'Điếu đầu tiên vào buổi sáng', value: 'first_morning', score: 1 },
            { label: 'Bất kỳ điếu nào khác', value: 'any_other', score: 0 }
        ]
    },
    {
        id: 'cigarettesPerDay',
        question: 'Bạn hút bao nhiều điếu thuốc mỗi ngày?',
        type: 'select',
        options: [
            { label: '10 điếu hoặc ít hơn', value: '10_or_less', score: 0 },
            { label: '11-20 điếu', value: '11_20', score: 1 },
            { label: '21-30 điếu', value: '21_30', score: 2 },
            { label: '31 điếu trở lên', value: '31_or_more', score: 3 }
        ]
    },
    {
        id: 'morningSmokingPattern',
        question: 'Bạn có hút thuốc nhiều hơn vào buổi sáng không?',
        type: 'select',
        options: [
            { label: 'Có', value: 'yes', score: 1 },
            { label: 'Không', value: 'no', score: 0 }
        ]
    },
    {
        id: 'smokingWhenIll',
        question: 'Bạn có hút thuốc ngay cả khi bị ốm phải nằm giường không?',
        type: 'select',
        options: [
            { label: 'Có', value: 'yes', score: 1 },
            { label: 'Không', value: 'no', score: 0 }
        ]
    },
    {
        id: 'difficultToRefrain',
        question: 'Bạn có thấy khó khăn khi không hút thuốc ở những nơi cấm hút không?',
        type: 'select',
        options: [
            { label: 'Có', value: 'yes', score: 1 },
            { label: 'Không', value: 'no', score: 0 }
        ]
    }
];

const SmokingAddictionSurvey = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [surveyData, setSurveyData] = useState(null);
    const [showResults, setShowResults] = useState(false);
    const [selectedPriceRange, setSelectedPriceRange] = useState(null);
    const [customPrice, setCustomPrice] = useState(null);

    useEffect(() => {
        fetchExistingSurvey();
    }, []);

    const fetchExistingSurvey = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await axios.get('/api/smoking-addiction-survey', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data) {
                setSurveyData(response.data);
                form.setFieldsValue(response.data);
                
                // Set price range and custom price if available
                if (response.data.priceRangeId) {
                    const range = CIGARETTE_PRICE_RANGES.find(r => r.id === response.data.priceRangeId);
                    setSelectedPriceRange(range);
                }
                if (response.data.packagePrice) {
                    setCustomPrice(response.data.packagePrice);
                }
            }
        } catch (error) {
            // Nếu chưa có dữ liệu thì bỏ qua
            console.log('Chưa có dữ liệu khảo sát cũ');
        } finally {
            setLoading(false);
        }
    };

    // Tính toán Pack-Year theo công thức ChatGPT
    const calculatePackYear = (cigarettesPerDay, yearsSmoked) => {
        return (cigarettesPerDay / 20) * yearsSmoked;
    };

    // Tính điểm FTND từ câu trả lời
    const calculateFTNDScore = (answers) => {
        let totalScore = 0;
        
        ADDICTION_ASSESSMENT_QUESTIONS.forEach(question => {
            const answer = answers[question.id];
            if (answer) {
                const option = question.options.find(opt => opt.value === answer);
                if (option) {
                    totalScore += option.score;
                }
            }
        });
        
        return totalScore;
    };

    // Phân loại mức độ nghiện dựa trên điểm FTND
    const getAddictionLevelByFTND = (ftndScore) => {
        if (ftndScore <= 2) {
            return { level: 'Rất nhẹ', color: 'green', severity: 1 };
        } else if (ftndScore <= 4) {
            return { level: 'Nhẹ', color: 'blue', severity: 2 };
        } else if (ftndScore <= 6) {
            return { level: 'Trung bình', color: 'orange', severity: 3 };
        } else if (ftndScore <= 7) {
            return { level: 'Nặng', color: 'red', severity: 4 };
        } else {
            return { level: 'Rất nặng', color: 'darkred', severity: 5 };
        }
    };

    // Lấy số điếu/ngày từ câu trả lời
    const getCigarettesPerDayFromAnswer = (answer) => {
        switch (answer) {
            case '10_or_less': return 10;
            case '11_20': return 15;
            case '21_30': return 25;
            case '31_or_more': return 35;
            default: return 15; // default
        }
    };

    // Tính xác suất thành công (dựa trên nghiên cứu y học và điểm FTND)
    const calculateSuccessProbability = (cigarettesPerDay, yearsSmoked, packYear, age, motivation, ftndScore = 0) => {
        let baseSuccessRate = 30; // Tỷ lệ thành công cơ bản 30%

        // Điều chỉnh theo độ tuổi (người trẻ có tỷ lệ thành công cao hơn)
        if (age < 25) baseSuccessRate += 20;
        else if (age < 35) baseSuccessRate += 15;
        else if (age < 45) baseSuccessRate += 10;
        else if (age < 55) baseSuccessRate += 5;
        else if (age >= 65) baseSuccessRate -= 10;

        // Điều chỉnh theo điểm FTND (quan trọng nhất)
        if (ftndScore <= 2) baseSuccessRate += 25; // Rất nhẹ
        else if (ftndScore <= 4) baseSuccessRate += 15; // Nhẹ 
        else if (ftndScore <= 6) baseSuccessRate += 0; // Trung bình
        else if (ftndScore <= 7) baseSuccessRate -= 15; // Nặng
        else baseSuccessRate -= 25; // Rất nặng

        // Điều chỉnh theo pack-year
        if (packYear < 5) baseSuccessRate += 10;
        else if (packYear < 10) baseSuccessRate += 5;
        else if (packYear < 20) baseSuccessRate += 0;
        else if (packYear < 30) baseSuccessRate -= 5;
        else baseSuccessRate -= 10;

        // Điều chỉnh theo động lực
        const motivationBonus = {
            'very_high': 20,
            'high': 15,
            'medium': 5,
            'low': -10,
            'very_low': -20
        };
        baseSuccessRate += motivationBonus[motivation] || 0;

        // Đảm bảo tỷ lệ trong khoảng 5-95%
        return Math.max(5, Math.min(95, Math.round(baseSuccessRate)));
    };

    // Tính số tiền tiết kiệm được mỗi ngày/tháng/năm
    const calculateSavings = (cigarettesPerDay, packagePrice) => {
        const cigarettesPerPackage = 20;
        const packagesPerDay = cigarettesPerDay / cigarettesPerPackage;
        const dailySavings = packagesPerDay * packagePrice;
        
        return {
            daily: dailySavings,
            monthly: dailySavings * 30,
            yearly: dailySavings * 365
        };
    };

    const handleSubmit = async (values) => {
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            
            // Tính điểm FTND từ câu trả lời
            const ftndScore = calculateFTNDScore(values);
            
            // Lấy số điếu/ngày từ câu trả lời
            const cigarettesPerDay = getCigarettesPerDayFromAnswer(values.cigarettesPerDay);
            
            // Tính toán các chỉ số
            const packYear = calculatePackYear(cigarettesPerDay, values.yearsSmoked);
            const addictionLevel = getAddictionLevelByFTND(ftndScore);
            const successProbability = calculateSuccessProbability(
                cigarettesPerDay,
                values.yearsSmoked,
                packYear,
                values.age,
                values.motivation,
                ftndScore
            );
            
            const actualPrice = customPrice || selectedPriceRange?.defaultPrice || values.packagePrice;
            const selectedRange = selectedPriceRange || CIGARETTE_PRICE_RANGES.find(range => range.id === values.priceRangeId);
            const savings = calculateSavings(cigarettesPerDay, actualPrice);

            const surveyResults = {
                ...values,
                ftndScore,
                cigarettesPerDayCalculated: cigarettesPerDay,
                packYear: parseFloat(packYear.toFixed(2)),
                addictionLevel: addictionLevel.level,
                addictionSeverity: addictionLevel.severity,
                successProbability,
                priceRangeId: selectedRange?.id,
                packageName: selectedRange?.name,
                packagePrice: actualPrice,
                priceRange: selectedRange?.description,
                dailySavings: Math.round(savings.daily),
                monthlySavings: Math.round(savings.monthly),
                yearlySavings: Math.round(savings.yearly),
                submittedAt: new Date().toISOString()
            };

            await axios.post('/api/smoking-addiction-survey', surveyResults, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSurveyData(surveyResults);
            message.success('Khảo sát đã được lưu thành công!');
            setShowResults(true);

        } catch (error) {
            console.error('Error submitting survey:', error);
            message.error('Không thể lưu khảo sát. Vui lòng thử lại!');
        } finally {
            setSubmitting(false);
        }
    };

    const showResultsModal = () => {
        if (!surveyData) return;

        const addictionLevel = getAddictionLevelByFTND(surveyData.ftndScore || 0);
        const selectedRange = CIGARETTE_PRICE_RANGES.find(range => range.id === surveyData.priceRangeId);

        Modal.info({
            title: '🎯 Kết Quả Khảo Sát Mức Độ Nghiện Thuốc Lá',
            width: 800,
            content: (
                <div style={{ padding: '20px 0' }}>
                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <Card size="small">
                                <Title level={5}>📊 Điểm FTND</Title>
                                <Text strong style={{ fontSize: '24px', color: '#1890ff' }}>
                                    {surveyData.ftndScore || 0}/10
                                </Text>
                                <br />
                                <Text type="secondary">
                                    Fagerstrom Test for Nicotine Dependence
                                </Text>
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card size="small">
                                <Title level={5}>🧮 Chỉ Số Pack-Year</Title>
                                <Text strong style={{ fontSize: '20px', color: '#722ed1' }}>
                                    {surveyData.packYear}
                                </Text>
                                <br />
                                <Text type="secondary">
                                    Công thức: ({surveyData.cigarettesPerDayCalculated || 15} ÷ 20) × {surveyData.yearsSmoked} năm
                                </Text>
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card size="small">
                                <Title level={5}>🎯 Mức Độ Nghiện</Title>
                                <Tag color={addictionLevel.color} style={{ fontSize: '16px', padding: '8px 16px' }}>
                                    {surveyData.addictionLevel}
                                </Tag>
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card size="small">
                                <Title level={5}>📈 Xác Suất Thành Công</Title>
                                <Text strong style={{ fontSize: '24px', color: '#52c41a' }}>
                                    {surveyData.successProbability}%
                                </Text>
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card size="small">
                                <Title level={5}>💰 Tiết Kiệm/Tháng</Title>
                                <Text strong style={{ fontSize: '20px', color: '#fa8c16' }}>
                                    {surveyData.monthlySavings?.toLocaleString()}đ
                                </Text>
                            </Card>
                        </Col>
                    </Row>
                    
                    <Divider />
                    
                    <Card size="small" style={{ marginTop: 16 }}>
                        <Title level={5}>💵 Chi Tiết Tiết Kiệm</Title>
                        <Row gutter={16}>
                            <Col span={8}>
                                <Text>Mỗi ngày: <Text strong>{surveyData.dailySavings?.toLocaleString()}đ</Text></Text>
                            </Col>
                            <Col span={8}>
                                <Text>Mỗi tháng: <Text strong>{surveyData.monthlySavings?.toLocaleString()}đ</Text></Text>
                            </Col>
                            <Col span={8}>
                                <Text>Mỗi năm: <Text strong>{surveyData.yearlySavings?.toLocaleString()}đ</Text></Text>
                            </Col>
                        </Row>
                        <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
                            Dựa trên gói thuốc: {selectedRange?.name} ({surveyData.packagePrice?.toLocaleString()}đ/gói)
                        </Text>
                    </Card>
                </div>
            ),
            onOk() {
                setShowResults(false);
            },
        });
    };

    if (showResults && surveyData) {
        showResultsModal();
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <AccessGuard requiredMembership="Basic">
            <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
                <Card>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <Title level={2}>🚭 Khảo Sát Mức Độ Nghiện Thuốc Lá</Title>
                        <Paragraph type="secondary">
                            Đánh giá mức độ nghiện theo thang đo Fagerstrom và tính toán xác suất thành công cai thuốc
                        </Paragraph>
                    </div>

                    <Alert
                        message="Bộ câu hỏi đánh giá mức độ nghiện (FTND)"
                        description="Fagerstrom Test for Nicotine Dependence - thang đo chuẩn quốc tế để đánh giá mức độ nghiện nicotine và dự báo khả năng thành công khi cai thuốc."
                        type="info"
                        showIcon
                        style={{ marginBottom: '24px' }}
                    />

                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                        size="large"
                    >
                        {/* Các câu hỏi đánh giá mức độ nghiện FTND */}
                        {ADDICTION_ASSESSMENT_QUESTIONS.map((question, index) => (
                            <Row key={question.id} gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                                <Col xs={24}>
                                    <Card 
                                        size="small"
                                        style={{ 
                                            borderLeft: `4px solid #1890ff`,
                                            backgroundColor: '#fafafa'
                                        }}
                                    >
                                        <Form.Item
                                            name={question.id}
                                            rules={[{ required: true, message: 'Vui lòng chọn câu trả lời' }]}
                                            style={{ marginBottom: 0 }}
                                        >
                                            <div style={{ marginBottom: '12px' }}>
                                                <Text strong style={{ fontSize: '16px' }}>
                                                    {index + 1}. {question.question}
                                                </Text>
                                            </div>
                                            <Select
                                                placeholder="Chọn câu trả lời của bạn"
                                                style={{ width: '100%' }}
                                                size="large"
                                            >
                                                {question.options.map((option) => (
                                                    <Option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Card>
                                </Col>
                            </Row>
                        ))}

                        <Divider />
                        
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <Title level={4}>📋 Thông Tin Bổ Sung</Title>
                            <Text type="secondary">
                                Cung cấp thêm thông tin để tính toán chính xác xác suất thành công
                            </Text>
                        </div>
                        
                        {/* Thông tin bổ sung */}
                        <Row gutter={[16, 16]}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="yearsSmoked"
                                    label="Số năm đã hút thuốc"
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập số năm hút thuốc' },
                                        { type: 'number', min: 0.5, max: 70, message: 'Số năm phải từ 0.5-70' }
                                    ]}
                                >
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        placeholder="Ví dụ: 5"
                                        addonAfter="năm"
                                        step={0.5}
                                    />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="age"
                                    label="Tuổi của bạn"
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập tuổi' },
                                        { type: 'number', min: 15, max: 100, message: 'Tuổi phải từ 15-100' }
                                    ]}
                                >
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        placeholder="Ví dụ: 30"
                                        addonAfter="tuổi"
                                    />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="priceRangeId"
                                    label="Khoảng giá gói thuốc bạn thường mua"
                                    rules={[{ required: true, message: 'Vui lòng chọn khoảng giá' }]}
                                >
                                    <Select 
                                        placeholder="Chọn khoảng giá gói thuốc"
                                        onChange={(value) => {
                                            const range = CIGARETTE_PRICE_RANGES.find(r => r.id === value);
                                            setSelectedPriceRange(range);
                                            setCustomPrice(range?.defaultPrice);
                                            form.setFieldsValue({ customPrice: range?.defaultPrice });
                                        }}
                                    >
                                        {CIGARETTE_PRICE_RANGES.map((range) => (
                                            <Option key={range.id} value={range.id}>
                                                <div>
                                                    <Text strong>{range.name}</Text>
                                                    <br />
                                                    <Text type="secondary">{range.description}</Text>
                                                </div>
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>

                            {selectedPriceRange && (
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        name="customPrice"
                                        label={`Giá cụ thể (${selectedPriceRange.minPrice.toLocaleString()}đ - ${selectedPriceRange.maxPrice.toLocaleString()}đ)`}
                                        rules={[
                                            { required: true, message: 'Vui lòng nhập giá cụ thể' },
                                            { 
                                                type: 'number', 
                                                min: selectedPriceRange.minPrice, 
                                                max: selectedPriceRange.maxPrice, 
                                                message: `Giá phải từ ${selectedPriceRange.minPrice.toLocaleString()}đ đến ${selectedPriceRange.maxPrice.toLocaleString()}đ` 
                                            }
                                        ]}
                                    >
                                        <InputNumber
                                            style={{ width: '100%' }}
                                            placeholder={`Ví dụ: ${selectedPriceRange.defaultPrice.toLocaleString()}`}
                                            addonAfter="đ/gói"
                                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                            parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                                            onChange={(value) => setCustomPrice(value)}
                                        />
                                    </Form.Item>
                                </Col>
                            )}

                            <Col xs={24}>
                                <Form.Item
                                    name="motivation"
                                    label="Mức độ quyết tâm bỏ thuốc của bạn"
                                    rules={[{ required: true, message: 'Vui lòng chọn mức độ quyết tâm' }]}
                                >
                                    <Select placeholder="Đánh giá mức độ quyết tâm của bạn">
                                        <Option value="very_high">
                                            <Space>
                                                <SmileOutlined style={{ color: '#52c41a' }} />
                                                Rất cao - Tôi rất quyết tâm và đã chuẩn bị kỹ lưỡng
                                            </Space>
                                        </Option>
                                        <Option value="high">
                                            <Space>
                                                <SmileOutlined style={{ color: '#1890ff' }} />
                                                Cao - Tôi quyết tâm và sẵn sàng thay đổi
                                            </Space>
                                        </Option>
                                        <Option value="medium">
                                            <Space>
                                                <MehOutlined style={{ color: '#fa8c16' }} />
                                                Trung bình - Tôi muốn thử nhưng chưa chắc chắn
                                            </Space>
                                        </Option>
                                        <Option value="low">
                                            <Space>
                                                <FrownOutlined style={{ color: '#faad14' }} />
                                                Thấp - Tôi biết cần bỏ nhưng chưa sẵn sàng
                                            </Space>
                                        </Option>
                                        <Option value="very_low">
                                            <Space>
                                                <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                                                Rất thấp - Tôi chưa thực sự muốn bỏ
                                            </Space>
                                        </Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider />

                        <div style={{ textAlign: 'center' }}>
                            <Space size="large">
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    icon={<CalculatorOutlined />}
                                    loading={submitting}
                                    size="large"
                                >
                                    Tính Toán Kết Quả
                                </Button>
                                
                                {surveyData && (
                                    <Button
                                        icon={<SaveOutlined />}
                                        onClick={showResultsModal}
                                        size="large"
                                    >
                                        Xem Kết Quả Đã Lưu
                                    </Button>
                                )}
                            </Space>
                        </div>
                    </Form>
                </Card>
            </div>
        </AccessGuard>
    );
};

export default SmokingAddictionSurvey;