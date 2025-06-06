import React, { useState, useEffect } from 'react';
import {
    Card,
    Typography,
    Button,
    Form,
    Input,
    InputNumber,
    Select,
    message,
    Spin,
    Progress,
    Row,
    Col,
    Tag,
    Alert,
    Space
} from 'antd';
import {
    FileTextOutlined,
    EditOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    SaveOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const MySurvey = () => {
    const [form] = Form.useForm();
    const [questions, setQuestions] = useState([]);
    const [userAnswers, setUserAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [completionRate, setCompletionRate] = useState(0);

    useEffect(() => {
        fetchSurveyData();
    }, []);

    const fetchSurveyData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');

            // Fetch questions
            const questionsResponse = await axios.get('/api/survey-questions', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Fetch user's answers
            const answersResponse = await axios.get('/api/survey-questions/my-answers', {
                headers: { Authorization: `Bearer ${token}` }
            });

            setQuestions(questionsResponse.data);

            // Format answers into an object for easy form initialization
            const answersObj = {};
            if (answersResponse.data && Array.isArray(answersResponse.data)) {
                answersResponse.data.forEach(answer => {
                    answersObj[answer.QuestionID] = answer.AnswerText;
                });
            }

            setUserAnswers(answersObj);
            form.setFieldsValue(answersObj);

            // Calculate completion rate
            const totalQuestions = questionsResponse.data.length;
            const answeredQuestions = Object.keys(answersObj).length;
            setCompletionRate(Math.round((answeredQuestions / totalQuestions) * 100));

        } catch (error) {
            console.error('Error fetching survey data:', error);
            message.error('Không thể tải dữ liệu khảo sát');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values) => {
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');

            // Convert form values to answers array
            const answers = Object.entries(values).map(([questionId, answerText]) => ({
                questionId: parseInt(questionId),
                answerText: answerText?.toString() || ''
            }));

            await axios.post('/api/survey-questions/answers', {
                answers: answers
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            message.success('Cập nhật khảo sát thành công!');
            setEditMode(false);

            // Refresh data
            fetchSurveyData();

        } catch (error) {
            console.error('Error submitting survey:', error);
            message.error('Không thể cập nhật khảo sát');
        } finally {
            setSubmitting(false);
        }
    };

    const renderQuestionInput = (question) => {
        const { QuestionType, Options } = question;

        switch (QuestionType) {
            case 'number':
                return (
                    <InputNumber
                        style={{ width: '100%' }}
                        placeholder="Nhập số..."
                        disabled={!editMode}
                    />
                );

            case 'select':
                let options = [];
                try {
                    options = Options ? JSON.parse(Options) : [];
                } catch (e) {
                    options = [];
                }

                return (
                    <Select
                        placeholder="Chọn một tùy chọn..."
                        disabled={!editMode}
                        style={{ width: '100%' }}
                    >
                        {options.map((option, index) => (
                            <Option key={index} value={option}>
                                {option}
                            </Option>
                        ))}
                    </Select>
                );

            case 'text':
            default:
                return (
                    <TextArea
                        rows={3}
                        placeholder="Nhập câu trả lời của bạn..."
                        disabled={!editMode}
                    />
                );
        }
    };

    const getCategoryColor = (category) => {
        const colors = {
            'background': 'blue',
            'habit': 'green',
            'motivation': 'orange',
            'preference': 'purple'
        };
        return colors[category] || 'default';
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="my-survey">
            <Card>
                <div className="mb-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <Title level={3} className="!mb-0">
                                <FileTextOutlined className="mr-2" />
                                Khảo sát của tôi
                            </Title>
                            <Paragraph className="text-gray-600 mt-2">
                                Thông tin khảo sát giúp chúng tôi hiểu rõ hơn về bạn và cung cấp hỗ trợ tốt nhất.
                            </Paragraph>
                        </div>
                        <div className="text-right">
                            {!editMode ? (
                                <Button
                                    type="primary"
                                    icon={<EditOutlined />}
                                    onClick={() => setEditMode(true)}
                                >
                                    Chỉnh sửa
                                </Button>
                            ) : (
                                <Space>
                                    <Button
                                        onClick={() => {
                                            setEditMode(false);
                                            form.setFieldsValue(userAnswers);
                                        }}
                                    >
                                        Hủy
                                    </Button>
                                    <Button
                                        type="primary"
                                        icon={<SaveOutlined />}
                                        onClick={() => form.submit()}
                                        loading={submitting}
                                    >
                                        Lưu thay đổi
                                    </Button>
                                </Space>
                            )}
                        </div>
                    </div>

                    <Row gutter={16} className="mb-6">
                        <Col span={12}>
                            <Card size="small">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {Object.keys(userAnswers).length}/{questions.length}
                                    </div>
                                    <div className="text-gray-600">Câu đã trả lời</div>
                                </div>
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card size="small">
                                <div className="text-center">
                                    <Progress
                                        type="circle"
                                        percent={completionRate}
                                        size={60}
                                        strokeColor={{
                                            '0%': '#108ee9',
                                            '100%': '#87d068',
                                        }}
                                    />
                                    <div className="text-gray-600 mt-2">Hoàn thành</div>
                                </div>
                            </Card>
                        </Col>
                    </Row>

                    {completionRate < 100 && (
                        <Alert
                            message="Khảo sát chưa hoàn tất"
                            description="Hãy hoàn thành tất cả câu hỏi để chúng tôi có thể hỗ trợ bạn tốt hơn."
                            type="warning"
                            showIcon
                            className="mb-6"
                        />
                    )}
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={userAnswers}
                >
                    {questions.map((question, index) => {
                        const hasAnswer = userAnswers[question.QuestionID];

                        return (
                            <Card
                                key={question.QuestionID}
                                size="small"
                                className="mb-4"
                                style={{
                                    border: editMode ? '2px solid #1890ff' : undefined,
                                    backgroundColor: hasAnswer ? '#f6ffed' : '#fff'
                                }}
                            >
                                <Form.Item
                                    label={
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Space>
                                                    <Text strong>
                                                        {index + 1}. {question.QuestionText}
                                                    </Text>
                                                    {hasAnswer && (
                                                        <CheckCircleOutlined className="text-green-500" />
                                                    )}
                                                </Space>
                                                <div className="mt-1">
                                                    {question.Category && (
                                                        <Tag color={getCategoryColor(question.Category)} size="small">
                                                            {question.Category}
                                                        </Tag>
                                                    )}
                                                    {question.QuestionType && (
                                                        <Tag size="small">
                                                            {question.QuestionType}
                                                        </Tag>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    }
                                    name={question.QuestionID.toString()}
                                    rules={editMode ? [
                                        { required: true, message: 'Vui lòng trả lời câu hỏi này' }
                                    ] : []}
                                >
                                    {renderQuestionInput(question)}
                                </Form.Item>
                            </Card>
                        );
                    })}

                    {editMode && (
                        <div className="text-center mt-6">
                            <Button
                                type="primary"
                                htmlType="submit"
                                size="large"
                                loading={submitting}
                                icon={<SaveOutlined />}
                            >
                                Lưu tất cả thay đổi
                            </Button>
                        </div>
                    )}
                </Form>

                {!editMode && Object.keys(userAnswers).length > 0 && (
                    <div className="mt-6 p-4 bg-gray-50 rounded">
                        <Text type="secondary">
                            <ClockCircleOutlined className="mr-1" />
                            Bạn có thể chỉnh sửa câu trả lời bất kỳ lúc nào bằng cách nhấn nút "Chỉnh sửa".
                        </Text>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default MySurvey; 