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

            const response = await axios.get('/api/smoking-addiction-survey/my-survey-details', {
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
            <div style={{
                minHeight: '60vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '32px 16px',
                borderRadius: '20px'
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
                        Đang tải kết quả khảo sát...
                    </Text>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '20px',
                padding: '32px',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
                <div style={{
                    background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    textAlign: 'center'
                }}>
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
                        ⚠️
                    </div>
                    <Text style={{
                        color: '#dc2626',
                        fontWeight: 600,
                        display: 'block',
                        marginBottom: '8px'
                    }}>
                        Lỗi
                    </Text>
                    <Text style={{ color: '#7f1d1d', marginBottom: '16px' }}>
                        {error}
                    </Text>
                    <Button
                        type="primary"
                        onClick={fetchMySurveyResults}
                        style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 600
                        }}
                    >
                        Thử lại
                    </Button>
                </div>
            </div>
        );
    }

    if (!surveyData) {
        return (
            <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '20px',
                padding: '64px 32px',
                textAlign: 'center',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
                <div style={{
                    fontSize: '72px',
                    marginBottom: '24px'
                }}>
                    📋
                </div>
                <Title level={3} style={{ color: '#6b7280', marginBottom: '16px' }}>
                    Không có dữ liệu khảo sát
                </Title>
                <Text style={{ color: '#9ca3af', fontSize: '16px' }}>
                    Bạn chưa làm khảo sát nào. Hãy bắt đầu làm khảo sát để xem kết quả!
                </Text>
            </div>
        );
    }

    const { user, answers } = surveyData;
    const completionRate = getCompletionRate();
    const latestSubmission = getLatestSubmissionDate();

    return (
        <div>
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
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
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
                        <FileTextOutlined style={{ fontSize: '24px', color: 'white' }} />
                    </div>
                    <Title level={3} style={{
                        margin: 0,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontWeight: 700
                    }}>
                        Kết Quả Khảo Sát Của Tôi
                    </Title>
                </div>

                <Row gutter={[24, 24]}>
                    <Col xs={24} sm={12} md={6}>
                        <div style={{
                            background: completionRate >= 80
                                ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
                                : completionRate >= 50
                                    ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'
                                    : 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
                            borderRadius: '16px',
                            padding: '20px',
                            textAlign: 'center',
                            border: completionRate >= 80
                                ? '1px solid rgba(16, 185, 129, 0.2)'
                                : completionRate >= 50
                                    ? '1px solid rgba(245, 158, 11, 0.2)'
                                    : '1px solid rgba(239, 68, 68, 0.2)'
                        }}>
                            <div style={{
                                fontSize: '32px',
                                fontWeight: 700,
                                color: completionRate >= 80 ? '#059669' :
                                    completionRate >= 50 ? '#f59e0b' : '#dc2626',
                                marginBottom: '8px'
                            }}>
                                {completionRate}%
                            </div>
                            <Text style={{ color: '#374151', fontWeight: 600 }}>
                                Tỷ lệ hoàn thành
                            </Text>
                        </div>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <div style={{
                            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                            borderRadius: '16px',
                            padding: '20px',
                            textAlign: 'center',
                            border: '1px solid rgba(59, 130, 246, 0.2)'
                        }}>
                            <div style={{
                                fontSize: '28px',
                                fontWeight: 700,
                                color: '#1d4ed8',
                                marginBottom: '8px'
                            }}>
                                {getAnsweredQuestions()}<span style={{ fontSize: '16px', color: '#6b7280' }}>/{getTotalQuestions()}</span>
                            </div>
                            <Text style={{ color: '#374151', fontWeight: 600 }}>
                                Câu đã trả lời
                            </Text>
                        </div>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <div style={{
                            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                            borderRadius: '16px',
                            padding: '20px',
                            textAlign: 'center',
                            border: '1px solid rgba(14, 165, 233, 0.2)'
                        }}>
                            <div style={{
                                fontSize: '28px',
                                fontWeight: 700,
                                color: '#0284c7',
                                marginBottom: '8px'
                            }}>
                                {getTotalQuestions()}
                            </div>
                            <Text style={{ color: '#374151', fontWeight: 600 }}>
                                Tổng số câu hỏi
                            </Text>
                        </div>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <div style={{
                            background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
                            borderRadius: '16px',
                            padding: '20px',
                            textAlign: 'center',
                            border: '1px solid rgba(139, 92, 246, 0.2)'
                        }}>
                            <div style={{
                                fontSize: '20px',
                                fontWeight: 700,
                                color: '#7c3aed',
                                marginBottom: '8px'
                            }}>
                                {latestSubmission ? latestSubmission.format('DD/MM') : 'Chưa có'}
                            </div>
                            <Text style={{ color: '#374151', fontWeight: 600 }}>
                                Lần cuối cập nhật
                            </Text>
                        </div>
                    </Col>
                </Row>
            </div>

            {/* User Info Section */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '20px',
                padding: '32px',
                marginBottom: '24px',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                    <UserOutlined style={{
                        fontSize: '20px',
                        color: '#667eea',
                        marginRight: '8px'
                    }} />
                    <Title level={4} style={{
                        margin: 0,
                        color: '#374151',
                        fontWeight: 600
                    }}>
                        Thông Tin Người Dùng
                    </Title>
                </div>
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12}>
                        <div style={{
                            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                            borderRadius: '12px',
                            padding: '16px',
                            border: '1px solid rgba(0, 0, 0, 0.05)'
                        }}>
                            <Text style={{ color: '#6b7280', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                                Họ tên
                            </Text>
                            <Text style={{ fontWeight: 600, color: '#374151', fontSize: '16px' }}>
                                {user.FirstName} {user.LastName}
                            </Text>
                        </div>
                    </Col>
                    <Col xs={24} sm={12}>
                        <div style={{
                            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                            borderRadius: '12px',
                            padding: '16px',
                            border: '1px solid rgba(0, 0, 0, 0.05)'
                        }}>
                            <Text style={{ color: '#6b7280', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                                Email
                            </Text>
                            <Text style={{ fontWeight: 600, color: '#374151', fontSize: '16px' }}>
                                {user.Email}
                            </Text>
                        </div>
                    </Col>
                    <Col xs={24} sm={12}>
                        <div style={{
                            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                            borderRadius: '12px',
                            padding: '16px',
                            border: '1px solid rgba(0, 0, 0, 0.05)'
                        }}>
                            <Text style={{ color: '#6b7280', fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                                Vai trò
                            </Text>
                            <div style={{
                                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                color: 'white',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: 600,
                                display: 'inline-block'
                            }}>
                                {user.Role}
                            </div>
                        </div>
                    </Col>
                    <Col xs={24} sm={12}>
                        <div style={{
                            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                            borderRadius: '12px',
                            padding: '16px',
                            border: '1px solid rgba(0, 0, 0, 0.05)'
                        }}>
                            <Text style={{ color: '#6b7280', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                                Ngày tham gia
                            </Text>
                            <Text style={{ fontWeight: 600, color: '#374151', fontSize: '16px' }}>
                                {moment(user.CreatedAt).format('DD/MM/YYYY')}
                            </Text>
                        </div>
                    </Col>
                </Row>
            </div>

            {/* Survey Results Section */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '20px',
                padding: '32px',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                    <FileTextOutlined style={{
                        fontSize: '20px',
                        color: '#667eea',
                        marginRight: '8px'
                    }} />
                    <Title level={4} style={{
                        margin: 0,
                        color: '#374151',
                        fontWeight: 600
                    }}>
                        Chi Tiết Khảo Sát
                    </Title>
                </div>

                <Space direction="vertical" style={{ width: '100%' }} size="large">
                    {answers.map((answer, index) => (
                        <div key={answer.QuestionID} style={{
                            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                            borderRadius: '16px',
                            padding: '24px',
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
                                    background: answer.AnswerText && answer.AnswerText.trim()
                                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                        : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: '12px',
                                    fontSize: '14px',
                                    color: 'white',
                                    fontWeight: 600,
                                    flexShrink: 0
                                }}>
                                    {answer.AnswerText && answer.AnswerText.trim() ? '✓' : index + 1}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <Text strong style={{
                                        color: '#374151',
                                        fontSize: '16px',
                                        lineHeight: '1.5',
                                        fontWeight: 600,
                                        display: 'block',
                                        marginBottom: '8px'
                                    }}>
                                        {answer.QuestionText}
                                    </Text>

                                    {answer.AnswerText && answer.AnswerText.trim() ? (
                                        <div style={{
                                            background: 'rgba(255, 255, 255, 0.8)',
                                            padding: '16px',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(16, 185, 129, 0.2)',
                                            marginTop: '12px'
                                        }}>
                                            <Text style={{
                                                color: '#374151',
                                                fontSize: '15px',
                                                lineHeight: '1.6'
                                            }}>
                                                {answer.AnswerText}
                                            </Text>
                                            {answer.SubmittedAt && (
                                                <div style={{ marginTop: '8px' }}>
                                                    <CalendarOutlined style={{ color: '#6b7280', marginRight: '4px' }} />
                                                    <Text style={{ fontSize: '12px', color: '#6b7280' }}>
                                                        Trả lời lúc: {moment(answer.SubmittedAt).format('DD/MM/YYYY HH:mm')}
                                                    </Text>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{
                                            background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
                                            padding: '16px',
                                            borderRadius: '12px',
                                            border: '1px dashed rgba(239, 68, 68, 0.3)',
                                            textAlign: 'center',
                                            marginTop: '12px'
                                        }}>
                                            <Text style={{
                                                color: '#dc2626',
                                                fontStyle: 'italic',
                                                fontWeight: 500
                                            }}>
                                                Bạn chưa trả lời câu hỏi này
                                            </Text>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </Space>

                <div style={{
                    borderTop: '1px solid rgba(0, 0, 0, 0.1)',
                    paddingTop: '24px',
                    marginTop: '32px',
                    textAlign: 'center'
                }}>
                    <Space size="large">
                        <Button
                            type="primary"
                            size="large"
                            onClick={() => {
                                const searchParams = new URLSearchParams(window.location.search);
                                searchParams.set('tab', 'survey');
                                window.history.replaceState(null, '', `${window.location.pathname}?${searchParams.toString()}`);
                                window.dispatchEvent(new CustomEvent('survey-tab-change', { detail: 'survey' }));
                            }}
                            style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                border: 'none',
                                borderRadius: '12px',
                                height: '48px',
                                paddingInline: '32px',
                                fontSize: '16px',
                                fontWeight: 600,
                                boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
                            }}
                        >
                            {completionRate === 100 ? 'Cập nhật khảo sát' : 'Hoàn thành khảo sát'}
                        </Button>
                        <Button
                            size="large"
                            onClick={fetchMySurveyResults}
                            style={{
                                borderRadius: '12px',
                                height: '48px',
                                paddingInline: '32px',
                                fontSize: '16px',
                                fontWeight: 500
                            }}
                        >
                            Làm mới dữ liệu
                        </Button>
                    </Space>
                </div>
            </div>
        </div>
    );
};

export default MySurveyResults; 