import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, message, Spin, Select, InputNumber, Alert } from 'antd';
import axios from 'axios';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Create axios instance with defaults
const api = axios.create({
    baseURL: 'http://localhost:4000', // Use direct server URL
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

            // Use the direct API endpoint without authentication
            const response = await api.post('/api/submit-answers', { answers });
            console.log('Submit response:', response);

            message.success('Câu trả lời của bạn đã được lưu thành công!');
            setSubmitting(false);
        } catch (error) {
            console.error('Error submitting survey:', error);
            message.error('Có lỗi xảy ra khi lưu câu trả lời. Vui lòng thử lại sau.');
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
                        style={{ width: '100%' }}
                    >
                        {Array.isArray(options) && options.map((option, idx) => (
                            <Option key={idx} value={option}>{option}</Option>
                        ))}
                    </Select>
                );

            case 'number':
                return (
                    <InputNumber
                        style={{ width: '100%' }}
                        placeholder="Nhập số"
                        min={0}
                    />
                );

            case 'text':
            default:
                return (
                    <TextArea
                        rows={3}
                        placeholder="Nhập câu trả lời của bạn ở đây"
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
            <div className="flex justify-center items-center min-h-screen">
                <Spin size="large" tip="Đang tải câu hỏi khảo sát..." />
            </div>
        );
    }

    if (error || !questions || questions.length === 0) {
        return (
            <div className="container mx-auto py-8 px-4">
                <Card className="shadow-lg rounded-lg">
                    <Title level={2} className="text-center mb-6">Khảo Sát Về Thói Quen Hút Thuốc</Title>

                    {error && (
                        <Alert
                            message="Lỗi"
                            description={error}
                            type="error"
                            showIcon
                            className="mb-4"
                        />
                    )}

                    <Text className="block mb-8 text-center">
                        Không thể tải câu hỏi khảo sát. Vui lòng thử lại sau.
                    </Text>

                    <div className="text-center">
                        <Button
                            type="primary"
                            onClick={handleRetry}
                        >
                            Tải Lại
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <Card className="shadow-lg rounded-lg">
                <Title level={2} className="text-center mb-6">Khảo Sát Về Thói Quen Hút Thuốc</Title>
                <Text className="block mb-8 text-center">
                    Vui lòng trả lời các câu hỏi dưới đây để chúng tôi có thể hiểu rõ hơn về thói quen hút thuốc của bạn và hỗ trợ bạn hiệu quả hơn trong hành trình cai thuốc.
                </Text>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={userAnswers}
                    className="max-w-4xl mx-auto"
                >
                    {questions.map((question, index) => (
                        <Form.Item
                            key={question.QuestionID}
                            label={
                                <div className="mb-2">
                                    <Text strong>{index + 1}. {question.QuestionText}</Text>
                                </div>
                            }
                            name={question.QuestionID.toString()}
                            rules={[{ required: true, message: 'Vui lòng trả lời câu hỏi này' }]}
                        >
                            {renderQuestionInput(question)}
                        </Form.Item>
                    ))}

                    <Form.Item className="mt-8 text-center">
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            loading={submitting}
                        >
                            Gửi Câu Trả Lời
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default SmokingSurveyPage; 