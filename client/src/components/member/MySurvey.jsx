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
    SaveOutlined,
    LoadingOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import AccessGuard from '../common/AccessGuard';

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
            const questionsResponse = await axios.get('/api/smoking-addiction-survey/questions', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Fetch user's answers
            const answersResponse = await axios.get('/api/smoking-addiction-survey/my-answers', {
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

            await axios.post('/api/smoking-addiction-survey/answers', {
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
                        style={{
                            width: '100%',
                            height: '48px',
                            borderRadius: '12px',
                            border: editMode ? '2px solid #667eea' : '1px solid #d9d9d9'
                        }}
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
                        style={{
                            width: '100%'
                        }}
                        className="modern-select"
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
                        style={{
                            borderRadius: '12px',
                            border: editMode ? '2px solid #667eea' : '1px solid #d9d9d9',
                            fontSize: '15px'
                        }}
                    />
                );
        }
    };

    const getCategoryColor = (category) => {
        const colors = {
            'background': 'blue',
            'habit': 'green',
            'motivation': 'orange',
            'preference': 'purple',
            'general': 'geekblue'
        };
        return colors[category] || 'default';
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '20px',
                    padding: '48px',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        margin: '0 auto 20px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: 'spin 2s linear infinite'
                    }}>
                        <LoadingOutlined style={{ fontSize: '24px', color: 'white' }} />
                    </div>
                    <Title level={4} style={{
                        margin: 0,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Đang tải khảo sát...
                    </Title>
                </div>
            </div>
        );
    }

    return (
        <AccessGuard feature="Khảo sát cá nhân">
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '24px'
            }}>
                {/* Header Section */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '20px',
                    padding: '32px',
                    marginBottom: '24px',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '24px'
                    }}>
                        <div style={{ flex: 1 }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: '16px'
                            }}>
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: '16px',
                                    boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)'
                                }}>
                                    <FileTextOutlined style={{ fontSize: '24px', color: 'white' }} />
                                </div>
                                <Title level={2} style={{
                                    margin: 0,
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    fontWeight: 700
                                }}>
                                    Khảo sát của tôi
                                </Title>
                            </div>
                            <Paragraph style={{
                                margin: 0,
                                color: '#6b7280',
                                fontSize: '16px',
                                fontWeight: 500,
                                lineHeight: '1.6'
                            }}>
                                Thông tin khảo sát giúp chúng tôi hiểu rõ hơn về bạn và cung cấp hỗ trợ tốt nhất.
                            </Paragraph>
                        </div>
                        <div>
                            {!editMode ? (
                                <Button
                                    type="primary"
                                    icon={<EditOutlined />}
                                    onClick={() => setEditMode(true)}
                                    size="large"
                                    style={{
                                        height: '48px',
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        border: 'none',
                                        boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
                                        fontWeight: 600
                                    }}
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
                                        size="large"
                                        style={{
                                            height: '48px',
                                            borderRadius: '12px',
                                            borderColor: '#d9d9d9',
                                            fontWeight: 600
                                        }}
                                    >
                                        Hủy
                                    </Button>
                                    <Button
                                        type="primary"
                                        icon={<SaveOutlined />}
                                        onClick={() => form.submit()}
                                        loading={submitting}
                                        size="large"
                                        style={{
                                            height: '48px',
                                            borderRadius: '12px',
                                            background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                                            border: 'none',
                                            boxShadow: '0 4px 16px rgba(82, 196, 26, 0.4)',
                                            fontWeight: 600
                                        }}
                                    >
                                        Lưu thay đổi
                                    </Button>
                                </Space>
                            )}
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    <Row gutter={[12, 12]}>
                        <Col xs={24} sm={8} md={8}>
                            <div style={{
                                background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                                borderRadius: '12px',
                                padding: '16px',
                                textAlign: 'center',
                                color: 'white',
                                boxShadow: '0 2px 12px rgba(24, 144, 255, 0.25)',
                                minHeight: '80px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center'
                            }}>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
                                    {Object.keys(userAnswers).length}/{questions.length}
                                </div>
                                <div style={{ fontSize: '13px', opacity: 0.9 }}>Câu đã trả lời</div>
                            </div>
                        </Col>
                        <Col xs={24} sm={8} md={8}>
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.9)',
                                borderRadius: '12px',
                                padding: '16px',
                                textAlign: 'center',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                                minHeight: '80px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Progress
                                    type="circle"
                                    percent={completionRate}
                                    size={50}
                                    strokeColor={{
                                        '0%': '#667eea',
                                        '100%': '#52c41a',
                                    }}
                                    style={{ marginBottom: '4px' }}
                                />
                                <div style={{ color: '#6b7280', fontSize: '13px', fontWeight: 500 }}>
                                    Hoàn thành
                                </div>
                            </div>
                        </Col>
                        <Col xs={24} sm={8} md={8}>
                            <div style={{
                                background: completionRate === 100
                                    ? 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)'
                                    : 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)',
                                borderRadius: '12px',
                                padding: '16px',
                                textAlign: 'center',
                                color: 'white',
                                boxShadow: completionRate === 100
                                    ? '0 2px 12px rgba(82, 196, 26, 0.25)'
                                    : '0 2px 12px rgba(250, 173, 20, 0.25)',
                                minHeight: '80px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center'
                            }}>
                                <div style={{ fontSize: '18px', marginBottom: '4px' }}>
                                    {completionRate === 100 ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                                </div>
                                <div style={{ fontSize: '13px', opacity: 0.9 }}>
                                    {completionRate === 100 ? 'Đã hoàn thành' : 'Chưa hoàn thành'}
                                </div>
                            </div>
                        </Col>
                    </Row>

                    {/* Warning Alert */}
                    {completionRate < 100 && (
                        <Alert
                            message="Khảo sát chưa hoàn tất"
                            description="Hãy hoàn thành tất cả câu hỏi để chúng tôi có thể hỗ trợ bạn tốt hơn."
                            type="warning"
                            showIcon
                            style={{
                                marginTop: '20px',
                                borderRadius: '12px',
                                backgroundColor: '#fff7e6',
                                border: '1px solid #ffd591'
                            }}
                        />
                    )}
                </div>

                {/* Questions Form */}
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
                        {questions.map((question, index) => {
                            const hasAnswer = userAnswers[question.QuestionID];

                            return (
                                <div
                                    key={question.QuestionID}
                                    style={{
                                        background: hasAnswer
                                            ? 'linear-gradient(135deg, #f6ffed 0%, #f0f9ff 100%)'
                                            : 'rgba(255, 255, 255, 0.7)',
                                        borderRadius: '16px',
                                        padding: '24px',
                                        marginBottom: '20px',
                                        border: editMode && !hasAnswer
                                            ? '2px dashed #ff7875'
                                            : hasAnswer
                                                ? '2px solid #52c41a'
                                                : '1px solid rgba(217, 217, 217, 0.5)',
                                        backdropFilter: 'blur(10px)',
                                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    <Form.Item
                                        label={
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                justifyContent: 'space-between',
                                                width: '100%'
                                            }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        marginBottom: '8px'
                                                    }}>
                                                        <div style={{
                                                            width: '28px',
                                                            height: '28px',
                                                            borderRadius: '50%',
                                                            background: hasAnswer
                                                                ? 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)'
                                                                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            marginRight: '12px',
                                                            color: 'white',
                                                            fontSize: '14px',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            {hasAnswer ? <CheckCircleOutlined /> : index + 1}
                                                        </div>
                                                        <Text style={{
                                                            fontSize: '16px',
                                                            fontWeight: 600,
                                                            color: '#1f2937'
                                                        }}>
                                                            {question.QuestionText}
                                                        </Text>
                                                    </div>
                                                    <div style={{ marginLeft: '40px' }}>
                                                        <Space size={8}>
                                                            {question.Category && (
                                                                <Tag
                                                                    color={getCategoryColor(question.Category)}
                                                                    style={{
                                                                        borderRadius: '8px',
                                                                        fontWeight: 500,
                                                                        textTransform: 'capitalize'
                                                                    }}
                                                                >
                                                                    {question.Category}
                                                                </Tag>
                                                            )}
                                                            {question.QuestionType && (
                                                                <Tag
                                                                    color="blue"
                                                                    style={{
                                                                        borderRadius: '8px',
                                                                        fontWeight: 500,
                                                                        textTransform: 'uppercase'
                                                                    }}
                                                                >
                                                                    {question.QuestionType}
                                                                </Tag>
                                                            )}
                                                        </Space>
                                                    </div>
                                                </div>
                                            </div>
                                        }
                                        name={question.QuestionID.toString()}
                                        rules={editMode ? [
                                            { required: true, message: 'Vui lòng trả lời câu hỏi này' }
                                        ] : []}
                                        style={{ marginBottom: 0 }}
                                    >
                                        {renderQuestionInput(question)}
                                    </Form.Item>
                                </div>
                            );
                        })}

                        {editMode && (
                            <div style={{ textAlign: 'center', marginTop: '32px' }}>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    size="large"
                                    loading={submitting}
                                    icon={<SaveOutlined />}
                                    style={{
                                        height: '56px',
                                        padding: '0 48px',
                                        borderRadius: '16px',
                                        background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                                        border: 'none',
                                        boxShadow: '0 8px 32px rgba(82, 196, 26, 0.4)',
                                        fontSize: '16px',
                                        fontWeight: 600
                                    }}
                                >
                                    Lưu tất cả thay đổi
                                </Button>
                            </div>
                        )}
                    </Form>

                    {!editMode && Object.keys(userAnswers).length > 0 && (
                        <div style={{
                            marginTop: '32px',
                            padding: '20px',
                            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                            borderRadius: '12px',
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            textAlign: 'center'
                        }}>
                            <Text style={{
                                color: '#64748b',
                                fontSize: '15px',
                                fontWeight: 500
                            }}>
                                <ClockCircleOutlined style={{ marginRight: '8px' }} />
                                Bạn có thể chỉnh sửa câu trả lời bất kỳ lúc nào bằng cách nhấn nút "Chỉnh sửa".
                            </Text>
                        </div>
                    )}
                </div>
            </div>
        </AccessGuard>
    );
};

export default MySurvey; 