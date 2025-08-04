import React, { useState, useEffect } from 'react';
import { Card, Typography, Spin, Alert, Tabs, Button, Result } from 'antd';
import { CheckCircleOutlined, FormOutlined, BarChartOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// Hardcoded nicotine addiction survey questions (same as SmokingSurveyPage)
const NICOTINE_SURVEY_QUESTIONS = [
    {
        QuestionID: 1,
        QuestionText: 'Bạn hút điếu đầu tiên sau khi thức dậy bao lâu?',
        options: [
            { text: 'Trong 5 phút', score: 3 },
            { text: '6–30 phút', score: 2 },
            { text: '31–60 phút', score: 1 },
            { text: 'Sau 60 phút', score: 0 }
        ]
    },
    {
        QuestionID: 2,
        QuestionText: 'Điếu thuốc nào bạn cảm thấy khó bỏ nhất?',
        options: [
            { text: 'Điếu đầu tiên trong ngày', score: 1 },
            { text: 'Điếu khác', score: 0 }
        ]
    },
    {
        QuestionID: 3,
        QuestionText: 'Bạn hút bao nhiêu điếu thuốc mỗi ngày?',
        options: [
            { text: '≤10', score: 0 },
            { text: '11–20', score: 1 },
            { text: '21–30', score: 2 },
            { text: '≥31', score: 3 }
        ]
    },
    {
        QuestionID: 4,
        QuestionText: 'Bạn có hút thuốc nhiều hơn vào buổi sáng không?',
        options: [
            { text: 'Có', score: 1 },
            { text: 'Không', score: 0 }
        ]
    },
    {
        QuestionID: 5,
        QuestionText: 'Bạn có hút thuốc ngay cả khi đang bị bệnh, phải nằm nghỉ không?',
        options: [
            { text: 'Có', score: 1 },
            { text: 'Không', score: 0 }
        ]
    },
    {
        QuestionID: 6,
        QuestionText: 'Bạn có cảm thấy rất khó chịu nếu không được hút thuốc trong vài giờ?',
        options: [
            { text: 'Có', score: 1 },
            { text: 'Không', score: 0 }
        ]
    },
    {
        QuestionID: 7,
        QuestionText: 'Bạn có cố gắng bỏ thuốc trong năm qua nhưng thất bại?',
        options: [
            { text: 'Có', score: 1 },
            { text: 'Không', score: 0 }
        ]
    },
    {
        QuestionID: 8,
        QuestionText: 'Bạn có hút thuốc trong những tình huống bị cấm hoặc gây hại cho người khác?',
        options: [
            { text: 'Thường xuyên', score: 1 },
            { text: 'Thỉnh thoảng', score: 0.5 },
            { text: 'Không bao giờ', score: 0 }
        ]
    },
    {
        QuestionID: 9,
        QuestionText: 'Bạn có hút thuốc khi bị stress, lo âu hoặc tức giận?',
        options: [
            { text: 'Luôn luôn', score: 1 },
            { text: 'Đôi khi', score: 0.5 },
            { text: 'Không bao giờ', score: 0 }
        ]
    },
    {
        QuestionID: 10,
        QuestionText: 'Nếu bạn không hút thuốc vài giờ, bạn có các triệu chứng như bứt rứt, lo lắng, mất tập trung?',
        options: [
            { text: 'Có', score: 1 },
            { text: 'Không', score: 0 }
        ]
    }
];

// Function to calculate addiction level based on total score
const calculateAddictionLevel = (totalScore) => {
    if (totalScore >= 0 && totalScore <= 3) {
        return {
            level: 'Lệ thuộc nhẹ (thấp)',
            description: 'Mức độ nghiện nicotine của bạn ở mức thấp. Bạn có thể dễ dàng bỏ thuốc với sự hỗ trợ phù hợp.',
            color: '#52c41a'
        };
    } else if (totalScore >= 3.5 && totalScore <= 6.5) {
        return {
            level: 'Lệ thuộc trung bình',
            description: 'Mức độ nghiện nicotine của bạn ở mức trung bình. Bạn cần có kế hoạch bỏ thuốc chi tiết và kiên trì.',
            color: '#faad14'
        };
    } else if (totalScore >= 7 && totalScore <= 9.5) {
        return {
            level: 'Lệ thuộc cao',
            description: 'Mức độ nghiện nicotine của bạn khá cao. Bạn cần sự hỗ trợ chuyên môn và các phương pháp điều trị phù hợp.',
            color: '#fa8c16'
        };
    } else {
        return {
            level: 'Lệ thuộc rất cao (nghiện nặng)',
            description: 'Mức độ nghiện nicotine của bạn rất cao. Bạn cần được tư vấn và điều trị chuyên sâu để bỏ thuốc thành công.',
            color: '#f5222d'
        };
    }
};

const SurveyResultsPage = () => {
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [surveyData, setSurveyData] = useState(null);
    const [surveyResult, setSurveyResult] = useState(null);
    const [activeTab, setActiveTab] = useState('summary');

    // Set active tab based on URL parameter
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'results' || tab === 'details') {
            setActiveTab('details');
        } else {
            setActiveTab('summary');
        }
    }, [searchParams]);

    useEffect(() => {
        const fetchSurveyResults = async () => {
            try {
                setLoading(true);
                setError(null);

                const token = localStorage.getItem('token');
                if (!token) {
                    setError('Bạn cần đăng nhập để xem kết quả khảo sát');
                    setLoading(false);
                    return;
                }

                const response = await axios.get('/api/smoking-addiction-survey/my-answers', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.data && Array.isArray(response.data) && response.data.length >= 10) {
                    setSurveyData(response.data);
                    
                    // Calculate result from answers
                    let totalScore = 0;
                    const answersObj = {};
                    
                    response.data.forEach(answer => {
                        answersObj[answer.QuestionID] = answer.AnswerText;
                        
                        // Find the question and calculate score
                        const question = NICOTINE_SURVEY_QUESTIONS.find(q => q.QuestionID === answer.QuestionID);
                        if (question) {
                            const option = question.options.find(opt => opt.text === answer.AnswerText);
                            if (option) {
                                totalScore += option.score;
                            }
                        }
                    });
                    
                    const addictionLevel = calculateAddictionLevel(totalScore);
                    setSurveyResult({
                        totalScore,
                        addictionLevel,
                        answers: answersObj
                    });
                } else {
                    setError('Bạn chưa hoàn thành khảo sát. Vui lòng thực hiện khảo sát trước.');
                }

                setLoading(false);
            } catch (error) {
                console.error('Error fetching survey results:', error);
                setError('Không thể tải kết quả khảo sát. Vui lòng thử lại sau.');
                setLoading(false);
            }
        };

        fetchSurveyResults();
    }, []);

    const handleRetry = () => {
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
                        Đang tải kết quả khảo sát...
                    </Text>
                </div>
            </div>
        );
    }

    if (error) {
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
                            Lỗi
                        </Title>

                        <div style={{
                            background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
                            borderRadius: '12px',
                            padding: '16px',
                            marginBottom: '24px',
                            border: '1px solid rgba(239, 68, 68, 0.2)'
                        }}>
                            <Text style={{ color: '#7f1d1d', fontSize: '14px' }}>
                                {error}
                            </Text>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
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
                            <Button
                                size="large"
                                onClick={() => window.location.href = '/smoking-survey'}
                                style={{
                                    borderRadius: '12px',
                                    height: '48px',
                                    paddingInline: '32px',
                                    fontSize: '16px',
                                    fontWeight: 600
                                }}
                            >
                                Làm Khảo Sát
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!surveyResult) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '32px 16px'
            }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <Result
                        icon={<FormOutlined style={{ color: '#faad14' }} />}
                        status="warning"
                        title="Chưa có kết quả khảo sát"
                        subTitle="Bạn cần hoàn thành khảo sát trước khi có thể xem kết quả."
                        extra={[
                            <Button
                                type="primary"
                                size="large"
                                key="survey"
                                onClick={() => window.location.href = '/smoking-survey'}
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
                                Làm Khảo Sát Ngay
                            </Button>
                        ]}
                    />
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
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
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
                        <BarChartOutlined style={{ fontSize: '32px', color: 'white' }} />
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
                        Kết Quả Khảo Sát Nicotine
                    </Title>

                    <Text style={{
                        color: '#6b7280',
                        fontSize: '18px',
                        fontWeight: 500,
                        lineHeight: '1.6'
                    }}>
                        Dưới đây là kết quả chi tiết về mức độ nghiện nicotine của bạn
                    </Text>
                </div>

                {/* Results Tabs */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '20px',
                    padding: '32px',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                    <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
                        <TabPane 
                            tab={
                                <span>
                                    <CheckCircleOutlined />
                                    Tổng Quan
                                </span>
                            } 
                            key="summary"
                        >
                            <div style={{
                                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                borderRadius: '16px',
                                padding: '32px',
                                border: '1px solid #bfdbfe'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginBottom: '24px'
                                }}>
                                    <div style={{
                                        width: '64px',
                                        height: '64px',
                                        borderRadius: '16px',
                                        background: surveyResult.addictionLevel.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '24px',
                                        marginRight: '20px'
                                    }}>
                                        📊
                                    </div>
                                    <div>
                                        <Title level={3} style={{ margin: 0, color: '#1e293b' }}>
                                            Kết quả đánh giá
                                        </Title>
                                        <Text style={{ color: '#64748b', fontSize: '16px' }}>
                                            Dựa trên 10 câu hỏi khảo sát
                                        </Text>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                                    <Card style={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <Text style={{ color: '#64748b', fontSize: '14px' }}>Tổng điểm</Text>
                                            <div style={{ 
                                                fontWeight: 700, 
                                                color: '#1e293b', 
                                                marginTop: '8px', 
                                                fontSize: '32px' 
                                            }}>
                                                {surveyResult.totalScore}/10
                                            </div>
                                        </div>
                                    </Card>

                                    <Card style={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <Text style={{ color: '#64748b', fontSize: '14px' }}>Mức độ nghiện</Text>
                                            <div style={{ 
                                                fontWeight: 700, 
                                                color: surveyResult.addictionLevel.color, 
                                                marginTop: '8px',
                                                fontSize: '20px',
                                                lineHeight: '1.4'
                                            }}>
                                                {surveyResult.addictionLevel.level}
                                            </div>
                                        </div>
                                    </Card>
                                </div>

                                <div style={{
                                    background: 'white',
                                    borderRadius: '12px',
                                    padding: '24px',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <Text style={{ color: '#1e40af', fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                                        Khuyến nghị
                                    </Text>
                                    <Text style={{ color: '#1e40af', fontSize: '16px', lineHeight: '1.6' }}>
                                        {surveyResult.addictionLevel.description}
                                    </Text>
                                </div>

                                <div style={{ textAlign: 'center', marginTop: '32px' }}>
                                    <Button
                                        type="primary"
                                        size="large"
                                        onClick={() => window.location.href = '/quit-plan'}
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
                                        Chọn Kế Hoạch Cai Thuốc
                                    </Button>
                                </div>
                            </div>
                        </TabPane>

                        <TabPane 
                            tab={
                                <span>
                                    <FormOutlined />
                                    Chi Tiết Câu Trả Lời
                                </span>
                            } 
                            key="details"
                        >
                            <div style={{ padding: '24px 0' }}>
                                {NICOTINE_SURVEY_QUESTIONS.map((question, index) => {
                                    const userAnswer = surveyResult.answers[question.QuestionID];
                                    const selectedOption = question.options.find(opt => opt.text === userAnswer);
                                    
                                    return (
                                        <Card 
                                            key={question.QuestionID}
                                            style={{ 
                                                marginBottom: '16px', 
                                                borderRadius: '12px',
                                                border: '1px solid #e2e8f0'
                                            }}
                                        >
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
                                                <div style={{ flex: 1 }}>
                                                    <Text strong style={{
                                                        color: '#374151',
                                                        fontSize: '16px',
                                                        lineHeight: '1.5',
                                                        fontWeight: 600,
                                                        display: 'block',
                                                        marginBottom: '12px'
                                                    }}>
                                                        {question.QuestionText}
                                                    </Text>
                                                    
                                                    <div style={{
                                                        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                                        borderRadius: '8px',
                                                        padding: '12px 16px',
                                                        border: '1px solid #bfdbfe'
                                                    }}>
                                                        <Text style={{ color: '#1e40af', fontWeight: 600, marginBottom: '4px' }}>
                                                            Câu trả lời của bạn:
                                                        </Text>
                                                        <Text style={{ color: '#1e40af', fontSize: '16px' }}>
                                                            {userAnswer}
                                                        </Text>
                                                        {selectedOption && (
                                                            <div style={{ 
                                                                marginTop: '8px',
                                                                padding: '4px 8px',
                                                                background: 'white',
                                                                borderRadius: '4px',
                                                                display: 'inline-block'
                                                            }}>
                                                                <Text style={{ color: '#64748b', fontSize: '14px' }}>
                                                                    Điểm: {selectedOption.score}
                                                                </Text>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        </TabPane>
                    </Tabs>
                </div>
            </div>
        </div>
    );
};

export default SurveyResultsPage; 