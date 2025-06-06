import React, { useState, useEffect } from 'react';
import {
    Card,
    Typography,
    Button,
    Spin,
    Alert,
    Space,
    Divider,
    Tag,
    Row,
    Col,
    Statistic,
    Empty
} from 'antd';
import {
    FileTextOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    UserOutlined,
    CalendarOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;

const MySurveyResults = () => {
    const [surveyData, setSurveyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchMySurveyResults();
    }, []);

    const fetchMySurveyResults = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Bạn cần đăng nhập để xem kết quả khảo sát');
                setLoading(false);
                return;
            }

            const response = await axios.get('http://localhost:4000/api/survey-questions/my-survey-details', {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSurveyData(response.data);
        } catch (error) {
            console.error('Error fetching survey results:', error);
            if (error.response?.status === 401) {
                setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            } else {
                setError('Không thể tải kết quả khảo sát. Vui lòng thử lại sau.');
            }
        } finally {
            setLoading(false);
        }
    };

    const getAnsweredQuestions = () => {
        if (!surveyData) return 0;
        return surveyData.answers.filter(answer => answer.AnswerText && answer.AnswerText.trim()).length;
    };

    const getTotalQuestions = () => {
        if (!surveyData) return 0;
        return surveyData.answers.length;
    };

    const getCompletionRate = () => {
        const total = getTotalQuestions();
        const answered = getAnsweredQuestions();
        return total > 0 ? Math.round((answered / total) * 100) : 0;
    };

    const getLatestSubmissionDate = () => {
        if (!surveyData) return null;

        const answeredQuestions = surveyData.answers.filter(answer =>
            answer.AnswerText && answer.SubmittedAt
        );

        if (answeredQuestions.length === 0) return null;

        const latestDate = answeredQuestions.reduce((latest, current) => {
            const currentDate = moment(current.SubmittedAt);
            const latestMoment = moment(latest);
            return currentDate.isAfter(latestMoment) ? current.SubmittedAt : latest;
        }, answeredQuestions[0].SubmittedAt);

        return moment(latestDate);
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" tip="Đang tải kết quả khảo sát..." />
            </div>
        );
    }

    if (error) {
        return (
            <Card>
                <Alert
                    message="Lỗi"
                    description={error}
                    type="error"
                    showIcon
                    action={
                        <Button size="small" onClick={fetchMySurveyResults}>
                            Thử lại
                        </Button>
                    }
                />
            </Card>
        );
    }

    if (!surveyData) {
        return (
            <Card>
                <Empty description="Không có dữ liệu khảo sát" />
            </Card>
        );
    }

    const { user, answers } = surveyData;
    const completionRate = getCompletionRate();
    const latestSubmission = getLatestSubmissionDate();

    return (
        <div>
            {/* Header Section */}
            <Card style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                    <FileTextOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '12px' }} />
                    <Title level={3} style={{ margin: 0 }}>
                        Kết Quả Khảo Sát Của Tôi
                    </Title>
                </div>

                <Row gutter={24}>
                    <Col span={6}>
                        <Statistic
                            title="Tỷ lệ hoàn thành"
                            value={completionRate}
                            suffix="%"
                            valueStyle={{
                                color: completionRate >= 80 ? '#3f8600' :
                                    completionRate >= 50 ? '#orange' : '#cf1322'
                            }}
                        />
                    </Col>
                    <Col span={6}>
                        <Statistic
                            title="Câu đã trả lời"
                            value={getAnsweredQuestions()}
                            suffix={`/ ${getTotalQuestions()}`}
                        />
                    </Col>
                    <Col span={6}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                                Trạng thái
                            </div>
                            <Tag color={completionRate === 100 ? 'green' : 'orange'} icon={
                                completionRate === 100 ? <CheckCircleOutlined /> : <ClockCircleOutlined />
                            }>
                                {completionRate === 100 ? 'Hoàn thành' : 'Chưa hoàn thành'}
                            </Tag>
                        </div>
                    </Col>
                    <Col span={6}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                                Cập nhật lần cuối
                            </div>
                            <Text>
                                {latestSubmission ? latestSubmission.format('DD/MM/YYYY HH:mm') : 'Chưa có dữ liệu'}
                            </Text>
                        </div>
                    </Col>
                </Row>
            </Card>

            {/* User Info Section */}
            <Card style={{ marginBottom: '24px' }}>
                <Title level={4}>
                    <UserOutlined style={{ marginRight: '8px' }} />
                    Thông Tin Người Dùng
                </Title>
                <Row gutter={16}>
                    <Col span={12}>
                        <Text strong>Họ tên: </Text>
                        <Text>{user.FirstName} {user.LastName}</Text>
                    </Col>
                    <Col span={12}>
                        <Text strong>Email: </Text>
                        <Text>{user.Email}</Text>
                    </Col>
                    <Col span={12} style={{ marginTop: '8px' }}>
                        <Text strong>Vai trò: </Text>
                        <Tag color="blue">{user.Role}</Tag>
                    </Col>
                    <Col span={12} style={{ marginTop: '8px' }}>
                        <Text strong>Ngày tham gia: </Text>
                        <Text>{moment(user.CreatedAt).format('DD/MM/YYYY')}</Text>
                    </Col>
                </Row>
            </Card>

            {/* Survey Results Section */}
            <Card>
                <Title level={4}>
                    <FileTextOutlined style={{ marginRight: '8px' }} />
                    Chi Tiết Khảo Sát
                </Title>

                <Space direction="vertical" style={{ width: '100%' }} size="large">
                    {answers.map((answer, index) => (
                        <Card
                            key={answer.QuestionID}
                            size="small"
                            style={{
                                border: answer.AnswerText ? '1px solid #d9d9d9' : '1px solid #ffccc7',
                                backgroundColor: answer.AnswerText ? '#ffffff' : '#fff2f0'
                            }}
                        >
                            <div style={{ marginBottom: '12px' }}>
                                <Text strong style={{ fontSize: '16px' }}>
                                    {index + 1}. {answer.QuestionText}
                                </Text>
                                <div style={{ float: 'right' }}>
                                    {answer.AnswerText ? (
                                        <Tag color="green" icon={<CheckCircleOutlined />}>
                                            Đã trả lời
                                        </Tag>
                                    ) : (
                                        <Tag color="red" icon={<ClockCircleOutlined />}>
                                            Chưa trả lời
                                        </Tag>
                                    )}
                                </div>
                            </div>

                            {answer.AnswerText ? (
                                <div>
                                    <div style={{
                                        backgroundColor: '#f6ffed',
                                        padding: '12px',
                                        borderRadius: '6px',
                                        border: '1px solid #b7eb8f'
                                    }}>
                                        <Text style={{ fontSize: '15px' }}>
                                            {answer.AnswerText}
                                        </Text>
                                    </div>
                                    {answer.SubmittedAt && (
                                        <div style={{ marginTop: '8px', textAlign: 'right' }}>
                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                <CalendarOutlined style={{ marginRight: '4px' }} />
                                                Trả lời lúc: {moment(answer.SubmittedAt).format('DD/MM/YYYY HH:mm')}
                                            </Text>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{
                                    backgroundColor: '#fff2f0',
                                    padding: '12px',
                                    borderRadius: '6px',
                                    border: '1px dashed #ffccc7',
                                    textAlign: 'center'
                                }}>
                                    <Text type="secondary" style={{ fontStyle: 'italic' }}>
                                        Bạn chưa trả lời câu hỏi này
                                    </Text>
                                </div>
                            )}
                        </Card>
                    ))}
                </Space>

                <Divider />

                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <Space>
                        <Button
                            type="primary"
                            onClick={() => {
                                // Get the parent tabs component and switch to survey tab
                                const searchParams = new URLSearchParams(window.location.search);
                                searchParams.set('tab', 'survey');
                                window.history.replaceState(null, '', `${window.location.pathname}?${searchParams.toString()}`);
                                // Dispatch custom event to notify parent component
                                window.dispatchEvent(new CustomEvent('survey-tab-change', { detail: 'survey' }));
                            }}
                        >
                            {completionRate === 100 ? 'Cập nhật khảo sát' : 'Hoàn thành khảo sát'}
                        </Button>
                        <Button onClick={fetchMySurveyResults}>
                            Làm mới dữ liệu
                        </Button>
                    </Space>
                </div>
            </Card>
        </div>
    );
};

export default MySurveyResults; 