import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, message, Spin, Select, InputNumber, Alert } from 'antd';
import axios from 'axios';
import { FormOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Create axios instance with defaults
const api = axios.create({
    baseURL: '', // Use relative path for proxy
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: false
});

const SmokingSurveyPage = () => {
    const [form] = Form.useForm();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [userAnswers, setUserAnswers] = useState({});
    const [error, setError] = useState(null);

    // Fetch questions and user's previous answers if any
    useEffect(() => {
        const fetchSurveyData = async () => {
            try {
                setLoading(true);
                setError(null);

                console.log('Fetching survey questions...');

                // Try the direct endpoint first
                try {
                    const questionsResponse = await api.get('/api/questions');
                    console.log('API response from direct endpoint:', questionsResponse);

                    if (questionsResponse.data && Array.isArray(questionsResponse.data) && questionsResponse.data.length > 0) {
                        setQuestions(questionsResponse.data);
                        console.log('Questions loaded successfully from direct endpoint:', questionsResponse.data.length);
                        setLoading(false);
                        return;
                    }
                } catch (directError) {
                    console.warn('Direct endpoint failed, trying public endpoint:', directError);
                }

                // Use public endpoint without auth
                const questionsResponse = await api.get('/api/survey-questions/public');
                console.log('API response from public endpoint:', questionsResponse);

                if (questionsResponse.data && Array.isArray(questionsResponse.data) && questionsResponse.data.length > 0) {
                    setQuestions(questionsResponse.data);
                    console.log('Questions loaded successfully from public endpoint:', questionsResponse.data.length);
                } else {
                    console.warn('API returned empty or invalid data:', questionsResponse.data);
                    setError('Không tìm thấy câu hỏi khảo sát. Vui lòng thử lại sau.');
                }

                try {
                    // Try to get user's previous answers
                    const answersResponse = await api.get('/api/survey-questions/my-answers');

                    // Format answers into an object for easy form initialization
                    const answersObj = {};
                    if (answersResponse.data && Array.isArray(answersResponse.data)) {
                        answersResponse.data.forEach(answer => {
                            answersObj[answer.QuestionID] = answer.AnswerText;
                        });

                        setUserAnswers(answersObj);
                        form.setFieldsValue(answersObj);
                        console.log('Previous answers loaded');
                    }
                } catch (error) {
                    // If no previous answers, just continue
                    console.log('No previous answers found or not logged in');
                }

                setLoading(false);
            } catch (error) {
                console.error('Error fetching survey data:', error);
                const errorMsg = error.response ?
                    `Lỗi ${error.response.status}: ${error.response.data?.message || 'Không thể kết nối đến máy chủ'}` :
                    'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';

                setError(errorMsg);
                message.error('Không thể tải câu hỏi khảo sát. Vui lòng thử lại sau.');
                setLoading(false);
            }
        };

        fetchSurveyData();
    }, [form]);

    const handleSubmit = async (values) => {
        try {
            setSubmitting(true);

            // Format answers for submission
            const answers = Object.keys(values).map(questionId => ({
                questionId: parseInt(questionId),
                answerText: values[questionId]?.toString() || '' // Convert to string for consistency
            }));

            console.log('Submitting answers:', answers);

            // Get the token from localStorage to authenticate the request
            const token = localStorage.getItem('token');
            if (!token) {
                message.error('Bạn cần đăng nhập để gửi khảo sát');
                return;
            }

            // Use the authenticated endpoint that uses the correct user ID
            const response = await axios.post('/api/survey-questions/answers',
                { answers },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log('Submit response:', response);

            message.success('Câu trả lời của bạn đã được lưu thành công!');
            setSubmitting(false);
        } catch (error) {
            console.error('Error submitting survey:', error);
            if (error.response?.status === 401) {
                message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            } else {
                message.error('Có lỗi xảy ra khi lưu câu trả lời. Vui lòng thử lại sau.');
            }
            setSubmitting(false);
        }
    };

    // Render appropriate input based on question type
    const renderQuestionInput = (question) => {
        const questionType = question.QuestionType || 'text';

        switch (questionType.toLowerCase()) {
            case 'select':
                // Parse options from JSON string if needed
                let options = [];
                try {
                    if (question.Options) {
                        options = typeof question.Options === 'string'
                            ? JSON.parse(question.Options)
                            : question.Options;
                    }
                } catch (e) {
                    console.error('Error parsing options:', e);
                    options = [];
                }

                return (
                    <Select
                        placeholder="Chọn câu trả lời của bạn"
                        style={{
                            width: '100%',
                            borderRadius: '12px',
                            fontSize: '16px',
                            minHeight: '48px'
                        }}
                        size="large"
                    >
                        {Array.isArray(options) && options.map((option, idx) => (
                            <Option key={idx} value={option}>{option}</Option>
                        ))}
                    </Select>
                );

            case 'number':
                return (
                    <InputNumber
                        style={{
                            width: '100%',
                            borderRadius: '12px',
                            fontSize: '16px',
                            minHeight: '48px'
                        }}
                        size="large"
                        placeholder="Nhập số"
                        min={0}
                    />
                );

            case 'text':
            default:
                return (
                    <TextArea
                        rows={4}
                        placeholder="Nhập câu trả lời của bạn ở đây"
                        style={{
                            borderRadius: '12px',
                            fontSize: '16px',
                            lineHeight: '1.6',
                            resize: 'vertical'
                        }}
                        size="large"
                    />
                );
        }
    };

    const handleRetry = () => {
        setLoading(true);
        setError(null);
        window.location.reload();
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '32px 16px'
            }}>
                <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '20px',
                    padding: '48px 32px',
                    textAlign: 'center',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px',
                        boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
                        animation: 'spin 1s linear infinite'
                    }}>
                        <Spin indicator={false} />
                    </div>
                    <Text style={{
                        fontSize: '16px',
                        color: '#6b7280',
                        fontWeight: 500
                    }}>
                        Đang tải câu hỏi khảo sát...
                    </Text>
                </div>
            </div>
        );
    }

    if (error || !questions || questions.length === 0) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '32px 16px'
            }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '20px',
                        padding: '48px 32px',
                        textAlign: 'center',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px',
                            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.3)'
                        }}>
                            <FormOutlined style={{ fontSize: '32px', color: 'white' }} />
                        </div>

                        <Title level={2} style={{
                            margin: '0 0 16px 0',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontWeight: 700
                        }}>
                            Khảo Sát Về Thói Quen Hút Thuốc
                        </Title>

                        {error && (
                            <div style={{
                                background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
                                borderRadius: '12px',
                                padding: '16px',
                                marginBottom: '24px',
                                border: '1px solid rgba(239, 68, 68, 0.2)'
                            }}>
                                <Text style={{
                                    color: '#dc2626',
                                    fontWeight: 600,
                                    display: 'block',
                                    marginBottom: '4px'
                                }}>
                                    Lỗi
                                </Text>
                                <Text style={{ color: '#7f1d1d', fontSize: '14px' }}>
                                    {error}
                                </Text>
                            </div>
                        )}

                        <Text style={{
                            color: '#6b7280',
                            fontSize: '16px',
                            display: 'block',
                            marginBottom: '32px'
                        }}>
                            Không thể tải câu hỏi khảo sát. Vui lòng thử lại sau.
                        </Text>

                        <Button
                            type="primary"
                            size="large"
                            onClick={handleRetry}
                            style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                border: 'none',
                                borderRadius: '12px',
                                height: '48px',
                                paddingInline: '32px',
                                fontSize: '16px',
                                fontWeight: 600
                            }}
                        >
                            Tải Lại
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '32px 16px'
        }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                {/* Header Section */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '20px',
                    padding: '48px 32px',
                    marginBottom: '32px',
                    textAlign: 'center',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px',
                        boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
                    }}>
                        <FormOutlined style={{ fontSize: '32px', color: 'white' }} />
                    </div>

                    <Title level={2} style={{
                        margin: '0 0 16px 0',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontWeight: 700,
                        fontSize: '32px'
                    }}>
                        Khảo Sát Về Thói Quen Hút Thuốc
                    </Title>

                    <Text style={{
                        color: '#6b7280',
                        fontSize: '18px',
                        fontWeight: 500,
                        lineHeight: '1.6'
                    }}>
                        Vui lòng trả lời các câu hỏi dưới đây để chúng tôi có thể hiểu rõ hơn về thói quen hút thuốc của bạn và hỗ trợ bạn hiệu quả hơn trong hành trình cai thuốc.
                    </Text>
                </div>

                {/* Survey Form */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '20px',
                    padding: '32px',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                        initialValues={userAnswers}
                    >
                        {questions.map((question, index) => (
                            <div key={question.QuestionID} style={{
                                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                                borderRadius: '16px',
                                padding: '24px',
                                marginBottom: '24px',
                                border: '1px solid rgba(0, 0, 0, 0.05)'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    marginBottom: '16px'
                                }}>
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: '12px',
                                        fontSize: '14px',
                                        color: 'white',
                                        fontWeight: 600,
                                        flexShrink: 0
                                    }}>
                                        {index + 1}
                                    </div>
                                    <Text strong style={{
                                        color: '#374151',
                                        fontSize: '16px',
                                        lineHeight: '1.5',
                                        fontWeight: 600
                                    }}>
                                        {question.QuestionText}
                                    </Text>
                                </div>

                                <Form.Item
                                    name={question.QuestionID.toString()}
                                    rules={[{ required: true, message: 'Vui lòng trả lời câu hỏi này' }]}
                                    style={{ marginBottom: 0 }}
                                >
                                    <div style={{ paddingLeft: '44px' }}>
                                        {renderQuestionInput(question)}
                                    </div>
                                </Form.Item>
                            </div>
                        ))}

                        <div style={{ textAlign: 'center', marginTop: '32px' }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                size="large"
                                loading={submitting}
                                style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    height: '56px',
                                    paddingInline: '48px',
                                    fontSize: '18px',
                                    fontWeight: 600,
                                    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.3)';
                                }}
                            >
                                Gửi Câu Trả Lời
                            </Button>
                        </div>
                    </Form>
                </div>
            </div>
        </div>
    );
};

export default SmokingSurveyPage; 