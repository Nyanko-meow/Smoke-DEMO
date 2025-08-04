import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, message, Spin, Select, InputNumber, Alert, Result, Tabs, Row, Col, Divider } from 'antd';
import { CheckCircleOutlined, FormOutlined, DollarCircleOutlined, TrophyOutlined } from '@ant-design/icons';
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

// Hardcoded nicotine addiction survey questions
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
            severity: 'Very Low Nicotine Dependence',
            description: 'Mức độ nghiện nicotine của bạn ở mức thấp. Bạn có thể dễ dàng bỏ thuốc với sự hỗ trợ phù hợp.',
            color: '#52c41a'
        };
    } else if (totalScore >= 3.5 && totalScore <= 6.5) {
        return {
            level: 'Lệ thuộc trung bình',
            severity: 'Moderate Nicotine Dependence',
            description: 'Mức độ nghiện nicotine của bạn ở mức trung bình. Bạn cần có kế hoạch bỏ thuốc chi tiết và kiên trì.',
            color: '#faad14'
        };
    } else if (totalScore >= 7 && totalScore <= 9.5) {
        return {
            level: 'Lệ thuộc cao',
            severity: 'High Nicotine Dependence',
            description: 'Mức độ nghiện nicotine của bạn khá cao. Bạn cần sự hỗ trợ chuyên môn và các phương pháp điều trị phù hợp.',
            color: '#fa8c16'
        };
    } else {
        return {
            level: 'Lệ thuộc rất cao (nghiện nặng)',
            severity: 'Very High Nicotine Dependence',
            description: 'Mức độ nghiện nicotine của bạn rất cao. Bạn cần được tư vấn và điều trị chuyên sâu để bỏ thuốc thành công.',
            color: '#f5222d'
        };
    }
};

// Tính toán Pack-Year theo công thức y học
const calculatePackYear = (cigarettesPerDay, yearsSmoked) => {
    return (cigarettesPerDay / 20) * yearsSmoked;
};

// Tính số tiền tiết kiệm toàn diện (thuốc + chi phí y tế + chi phí khác)
const calculateSavings = (cigarettesPerDay, packagePrice, age, yearsSmoked) => {
    const cigarettesPerPackage = 20;
    const packagesPerDay = cigarettesPerDay / cigarettesPerPackage;
    
    // Chi phí thuốc lá trực tiếp
    const dailyTobaccoCost = packagesPerDay * packagePrice;
    
    // Chi phí y tế ước tính (theo nghiên cứu WHO)
    let dailyHealthCost = 0;
    if (yearsSmoked > 10) {
        dailyHealthCost = dailyTobaccoCost * 0.8; // 80% chi phí thuốc
    } else if (yearsSmoked > 5) {
        dailyHealthCost = dailyTobaccoCost * 0.5; // 50% chi phí thuốc
    } else {
        dailyHealthCost = dailyTobaccoCost * 0.3; // 30% chi phí thuốc
    }
    
    // Chi phí khác (răng miệng, làm đẹp, bảo hiểm)
    const dailyOtherCost = dailyTobaccoCost * 0.2; // 20% chi phí thuốc
    
    // Tổng chi phí hàng ngày
    const totalDailySavings = dailyTobaccoCost + dailyHealthCost + dailyOtherCost;
    
    return {
        daily: Math.round(totalDailySavings),
        weekly: Math.round(totalDailySavings * 7),
        monthly: Math.round(totalDailySavings * 30),
        yearly: Math.round(totalDailySavings * 365),
        // Chi tiết breakdown
        breakdown: {
            tobacco: Math.round(dailyTobaccoCost),
            health: Math.round(dailyHealthCost),
            other: Math.round(dailyOtherCost)
        }
    };
};

// Tính xác suất thành công dựa trên nghiên cứu khoa học và các yếu tố
const calculateSuccessProbability = (totalScore, cigarettesPerDay, yearsSmoked, age, packYear, motivation, monthlySavings) => {
    let baseSuccessRate = 35; // Tỷ lệ thành công cơ bản theo WHO
    
    // Yếu tố 1: Điểm FTND (quan trọng nhất - 40% ảnh hưởng)
    if (totalScore <= 3) {
        baseSuccessRate += 30; // Nghiện nhẹ - cao nhất
    } else if (totalScore <= 6) {
        baseSuccessRate += 15; // Nghiện trung bình
    } else if (totalScore <= 8) {
        baseSuccessRate -= 10; // Nghiện cao
    } else {
        baseSuccessRate -= 25; // Nghiện rất cao
    }
    
    // Yếu tố 2: Độ tuổi (25% ảnh hưởng)
    if (age < 25) {
        baseSuccessRate += 25; // Não bộ còn dẻo dai
    } else if (age < 35) {
        baseSuccessRate += 20; // Vẫn trẻ, động lực cao
    } else if (age < 45) {
        baseSuccessRate += 10; // Bắt đầu quan tâm sức khỏe
    } else if (age < 55) {
        baseSuccessRate += 5; // Áp lực sức khỏe tăng
    } else if (age < 65) {
        baseSuccessRate -= 5; // Khó thay đổi thói quen
    } else {
        baseSuccessRate -= 15; // Rất khó bỏ ở tuổi này
    }
    
    // Yếu tố 3: Pack-Year (20% ảnh hưởng) 
    if (packYear < 3) {
        baseSuccessRate += 20; // Chưa nghiện sâu
    } else if (packYear < 10) {
        baseSuccessRate += 10; // Còn khả năng hồi phục
    } else if (packYear < 20) {
        baseSuccessRate += 0; // Trung tính
    } else if (packYear < 40) {
        baseSuccessRate -= 10; // Nghiện sâu
    } else {
        baseSuccessRate -= 20; // Rất khó bỏ
    }
    
    // Yếu tố 4: Động lực (10% ảnh hưởng)
    const motivationBonus = {
        'Cải thiện sức khỏe': 15,
        'Tiết kiệm tiền': 10,
        'Gia đình': 12,
        'Áp lực xã hội': 5,
        'Khác': 8
    };
    baseSuccessRate += motivationBonus[motivation] || 8;
    
    // Yếu tố 5: Incentive kinh tế (5% ảnh hưởng)
    if (monthlySavings > 1000000) { // >1 triệu/tháng
        baseSuccessRate += 10;
    } else if (monthlySavings > 500000) { // >500k/tháng
        baseSuccessRate += 5;
    } else if (monthlySavings > 200000) { // >200k/tháng
        baseSuccessRate += 2;
    }
    
    // Điều chỉnh theo số điếu/ngày
    if (cigarettesPerDay > 30) {
        baseSuccessRate -= 15; // Hút quá nhiều
    } else if (cigarettesPerDay > 20) {
        baseSuccessRate -= 8;
    } else if (cigarettesPerDay <= 10) {
        baseSuccessRate += 10; // Hút ít dễ bỏ hơn
    }
    
    // Đảm bảo tỷ lệ trong khoảng 10-90% (thực tế hơn)
    return Math.max(10, Math.min(90, Math.round(baseSuccessRate)));
};

// Helper function để tính số điếu thuốc per day từ answer
const getCigarettesPerDayFromScore = (answerText) => {
    if (!answerText) return 15; // default
    
    if (answerText.includes('≤10')) return 8;
    if (answerText.includes('11–20')) return 15;
    if (answerText.includes('21–30')) return 25;
    if (answerText.includes('≥31')) return 35;
    
    return 15; // default fallback
};

// Helper function để thêm motivation field
const addMotivationField = () => {
    return (
        <Col xs={24} md={12}>
            <Form.Item
                name="motivation"
                label="Động lực chính để bỏ thuốc"
                rules={[{ required: true, message: 'Vui lòng chọn động lực' }]}
            >
                <Select placeholder="Chọn động lực chính">
                    <Option value="Cải thiện sức khỏe">🏃‍♂️ Cải thiện sức khỏe</Option>
                    <Option value="Tiết kiệm tiền">💰 Tiết kiệm tiền</Option>
                    <Option value="Gia đình">👨‍👩‍👧‍👦 Vì gia đình</Option>
                    <Option value="Áp lực xã hội">👥 Áp lực xã hội</Option>
                    <Option value="Khác">❓ Lý do khác</Option>
                </Select>
            </Form.Item>
        </Col>
    );
};

const SmokingSurveyPage = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [userAnswers, setUserAnswers] = useState({});
    const [error, setError] = useState(null);
    const [surveyCompleted, setSurveyCompleted] = useState(false);
    const [surveyResult, setSurveyResult] = useState(null);
    const [selectedPriceRange, setSelectedPriceRange] = useState(null);
    const [customPrice, setCustomPrice] = useState(null);
    const [showResetOption, setShowResetOption] = useState(false);
    const [resettingSurvey, setResettingSurvey] = useState(false);

    // Check if user has already completed the survey
    useEffect(() => {
        const checkSurveyCompletion = async () => {
            try {
                setLoading(true);
                setError(null);

                console.log('Checking survey completion status...');

                // Get the token from localStorage
                const token = localStorage.getItem('token');
                if (!token) {
                    console.log('No token found, user not logged in');
                    setLoading(false);
                    return;
                }

                // First, test server connection
                try {
                    const testResponse = await api.get('/api/test');
                    console.log('Server connection test:', testResponse.data);
                } catch (testError) {
                    console.error('Server connection test failed:', testError);
                    setError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.');
                    setLoading(false);
                    return;
                }

                // First, check eligibility using public endpoint
                const eligibilityResponse = await api.get('/api/survey-questions/check-eligibility-public', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                console.log('Eligibility response:', eligibilityResponse.data);

                // Store eligibility status but continue to check previous answers
                const canTakeSurvey = eligibilityResponse.data.canTakeSurvey;
                
                // If user cannot take survey anymore, show reset option
                if (!canTakeSurvey && eligibilityResponse.data.message.includes('membership')) {
                    console.log('User membership expired/cancelled, showing reset option');
                    setShowResetOption(true);
                }

                // Check user's previous answers
                const answersResponse = await api.get('/api/smoking-addiction-survey/my-answers', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (answersResponse.data && Array.isArray(answersResponse.data)) {
                    // If user has 10 or more answers, consider survey completed
                    if (answersResponse.data.length >= 10) {
                        setSurveyCompleted(true);
                        
                        try {
                            console.log('🔍 Making API request to /my-results...');
                            const resultsResponse = await api.get('/api/smoking-addiction-survey/my-results', {
                                headers: { Authorization: `Bearer ${token}` }
                            });

                            console.log('📡 Full API Response:', resultsResponse);
                            console.log('📊 Response Status:', resultsResponse.status);
                            console.log('💾 Response Data:', resultsResponse.data);

                            if (resultsResponse.data && resultsResponse.data.success) {
                                const surveyData = resultsResponse.data.data;
                                
                                // DEBUG: Log the actual data from database
                                console.log('🔍 Database survey data:', {
                                    FTNDScore: surveyData.FTNDScore,
                                    PackYear: surveyData.PackYear,
                                    SuccessProbability: surveyData.SuccessProbability,
                                    DailySavings: surveyData.DailySavings,
                                    MonthlySavings: surveyData.MonthlySavings
                                });
                                
                                // Format to match component expectations (giới hạn FTND tối đa 10)
                                const ftndScore = Math.min(surveyData.FTNDScore || 0, 10);
                                const addictionLevel = calculateAddictionLevel(ftndScore);
                                
                                const resultData = {
                                    totalScore: ftndScore,
                                    addictionLevel,
                                    packYear: Number(surveyData.PackYear) || 0,
                                    successProbability: Number(surveyData.SuccessProbability) || 50,
                                    cigarettesPerDay: Number(surveyData.CigarettesPerDay) || 0,
                                    dailySavings: Number(surveyData.DailySavings) || 0,
                                    monthlySavings: Number(surveyData.MonthlySavings) || 0,
                                    yearlySavings: Number(surveyData.YearlySavings) || 0,
                                    packageName: String(surveyData.PackageName) || '',
                                    packagePrice: Number(surveyData.PackagePrice) || 0,
                                    priceRange: String(surveyData.PriceRange) || '',
                                    age: Number(surveyData.Age) || 0,
                                    yearsSmoked: Math.floor(Number(surveyData.YearsSmoked) || 0),
                                    motivation: String(surveyData.Motivation) || '',
                                    answers: surveyData.rawAnswers || {}
                                };
                                
                                console.log('✅ Formatted result data:', resultData);
                                setSurveyResult(resultData);
                            } else {
                                // Fallback to calculated results if no database results
                        let totalScore = 0;
                        const answersObj = {};
                        
                        answersResponse.data.forEach(answer => {
                            answersObj[answer.QuestionID] = answer.AnswerText;
                            totalScore += answer.Score || 0;
                        });
                        
                        const addictionLevel = calculateAddictionLevel(totalScore);
                        setSurveyResult({
                            totalScore,
                            addictionLevel,
                            answers: answersObj
                        });
                            }
                        } catch (resultsError) {
                            console.error('Error fetching survey results, using calculated values:', resultsError);
                            
                            // Fallback to calculated results
                            let totalScore = 0;
                            const answersObj = {};
                            
                            answersResponse.data.forEach(answer => {
                                answersObj[answer.QuestionID] = answer.AnswerText;
                                totalScore += answer.Score || 0;
                            });
                            
                            const addictionLevel = calculateAddictionLevel(totalScore);
                            setSurveyResult({
                                totalScore,
                                addictionLevel,
                                answers: answersObj
                            });
                        }
                        
                        // Set form data
                        const answersObj = {};
                        answersResponse.data.forEach(answer => {
                            answersObj[answer.QuestionID] = answer.AnswerText;
                        });
                        setUserAnswers(answersObj);
                        form.setFieldsValue(answersObj);
                        console.log('Survey already completed, showing results');
                    } else {
                        // User has some answers but not complete
                        const answersObj = {};
                        answersResponse.data.forEach(answer => {
                            answersObj[answer.QuestionID] = answer.AnswerText;
                        });
                        setUserAnswers(answersObj);
                        form.setFieldsValue(answersObj);
                        console.log('User has partial answers, can continue');
                    }
                }

                setLoading(false);
            } catch (error) {
                console.error('Error checking survey completion:', error);
                
                // More detailed error handling
                if (error.code === 'ECONNREFUSED') {
                    setError('Không thể kết nối đến server. Vui lòng đảm bảo server đang chạy.');
                } else if (error.response) {
                    // Server responded with error status
                    if (error.response.status === 401) {
                        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                    } else if (error.response.status === 500) {
                        setError('Lỗi server. Vui lòng thử lại sau.');
                    } else if (error.response.data && error.response.data.message) {
                        setError(error.response.data.message);
                    } else {
                        setError(`Lỗi ${error.response.status}: ${error.response.statusText}`);
                    }
                } else if (error.request) {
                    // Request was made but no response received
                    setError('Không nhận được phản hồi từ server. Vui lòng kiểm tra kết nối mạng.');
                } else {
                    // Something else happened
                    setError('Có lỗi xảy ra khi kiểm tra trạng thái khảo sát');
                }
                setLoading(false);
            }
        };

        checkSurveyCompletion();
    }, [form]);

    // Reset form when userAnswers change
    useEffect(() => {
        if (Object.keys(userAnswers).length > 0) {
            form.setFieldsValue(userAnswers);
            console.log('Form values set:', userAnswers);
        }
    }, [userAnswers, form]);

    const handleSubmit = async (values) => {
        try {
            setSubmitting(true);

            console.log('Form values received:', values);

            // Validate all required fields first
            const requiredFields = ['yearsSmoked', 'age', 'priceRangeId'];
            const missingFields = [];
            
            requiredFields.forEach(field => {
                if (!values[field]) {
                    missingFields.push(field);
                }
            });

            // Check if all FTND questions are answered
            let answeredQuestions = 0;
            NICOTINE_SURVEY_QUESTIONS.forEach((question) => {
                if (values[question.QuestionID]) {
                    answeredQuestions++;
                }
            });

            if (answeredQuestions < NICOTINE_SURVEY_QUESTIONS.length) {
                message.error('Vui lòng trả lời đầy đủ tất cả các câu hỏi khảo sát');
                setSubmitting(false);
                return;
            }

            if (missingFields.length > 0) {
                message.error('Vui lòng điền đầy đủ thông tin bổ sung (số năm hút thuốc, tuổi, khoảng giá)');
                setSubmitting(false);
                return;
            }

            if (!customPrice && !selectedPriceRange) {
                message.error('Vui lòng chọn khoảng giá và nhập giá cụ thể của gói thuốc');
                setSubmitting(false);
                return;
            }

            console.log('✅ Form validation passed, proceeding with submission...');

            // Calculate total score
            let totalScore = 0;
            const answers = [];

            NICOTINE_SURVEY_QUESTIONS.forEach(question => {
                const answer = values[question.QuestionID];
                console.log(`Question ${question.QuestionID}: ${answer}`);
                if (answer) {
                    const option = question.options.find(opt => opt.text === answer);
                    if (option) {
                        totalScore += option.score;
                    }
                    answers.push({
                        questionId: question.QuestionID,
                        answerText: answer
                    });
                }
            });

            // Giới hạn FTND score tối đa 10 điểm (chuẩn FTND)
            totalScore = Math.min(totalScore, 10);
            
            console.log('Calculated total score (limited to 10):', totalScore);
            console.log('Submitting answers:', answers);

            // Get the token from localStorage to authenticate the request
            const token = localStorage.getItem('token');
            if (!token) {
                message.error('Bạn cần đăng nhập để gửi khảo sát');
                setSubmitting(false);
                return;
            }

            // Skip individual answers submission to avoid conflict
            // The main smoking-addiction-survey endpoint will handle everything
            console.log('Preparing to submit full survey data...');

            // Calculate addiction level
            const addictionLevel = calculateAddictionLevel(totalScore);
            
            // Get additional info from form
            const yearsSmoked = Math.floor(values.yearsSmoked || 5);
            const age = values.age || 30;
            const cigarettesPerDay = getCigarettesPerDayFromScore(values['3']);
            const actualPrice = customPrice || selectedPriceRange?.defaultPrice || 25000;
            const selectedRange = selectedPriceRange || CIGARETTE_PRICE_RANGES.find(range => range.id === values.priceRangeId);
            
            // Calculate pack-year
            const packYear = calculatePackYear(cigarettesPerDay, yearsSmoked);
            
            // Calculate savings với công thức mới
            const savings = calculateSavings(cigarettesPerDay, actualPrice, age, yearsSmoked);

            // Calculate success probability với đầy đủ yếu tố
            const successProbability = calculateSuccessProbability(
                totalScore, 
                cigarettesPerDay, 
                yearsSmoked, 
                age, 
                packYear,
                values.motivation || 'Cải thiện sức khỏe',
                savings.monthly
            );
            
            // Prepare comprehensive survey result data
            const surveyResultData = {
                ftndScore: totalScore,
                cigarettesPerDayCalculated: cigarettesPerDay,
                packYear: parseFloat(packYear.toFixed(2)),
                addictionLevel: addictionLevel.level,
                addictionSeverity: addictionLevel.severity,
                successProbability,
                priceRangeId: selectedRange?.id || 'range2',
                packageName: selectedRange?.name || 'Thuốc lá trung cấp',
                packagePrice: actualPrice,
                priceRange: selectedRange?.description || '25.000đ/gói',
                dailySavings: Math.round(savings.daily),
                monthlySavings: Math.round(savings.monthly),
                yearlySavings: Math.round(savings.yearly),
                age,
                yearsSmoked,
                motivation: values.motivation || 'Cải thiện sức khỏe',
                ...values // Include all raw answers
            };

            // Save calculated results to database
            console.log('💾 Saving survey results to database...');
            console.log('📤 Survey data being sent:', surveyResultData);
            const saveResultResponse = await api.post('/api/smoking-addiction-survey', surveyResultData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log('✅ Survey results saved:', saveResultResponse.data);
            
            // Set survey result for display
            setSurveyResult({
                totalScore,
                addictionLevel,
                packYear: parseFloat(packYear.toFixed(2)),
                cigarettesPerDay,
                yearsSmoked,
                age,
                successProbability,
                packageName: selectedRange?.name || 'Thuốc lá trung cấp',
                packagePrice: actualPrice,
                priceRange: selectedRange?.description || '25.000đ/gói',
                dailySavings: Math.round(savings.daily),
                weeklySavings: Math.round(savings.weekly),
                monthlySavings: Math.round(savings.monthly),
                yearlySavings: Math.round(savings.yearly),
                answers: values
            });
            
            setSurveyCompleted(true);
            setUserAnswers(values);

            message.success('Khảo sát đã được hoàn thành và lưu thành công!');
            setSubmitting(false);
        } catch (error) {
            console.error('Error submitting survey:', error);
            console.error('Error response:', error.response?.data);
            
            if (error.response?.status === 400) {
                // Validation errors from backend
                const errorMessage = error.response.data?.message || 'Dữ liệu khảo sát không hợp lệ';
                const validationErrors = error.response.data?.errors;
                
                if (validationErrors && validationErrors.length > 0) {
                    message.error(`${errorMessage}: ${validationErrors.join(', ')}`);
                } else {
                    message.error(errorMessage);
                }
            } else if (error.response?.status === 401) {
                message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            } else if (error.response?.status === 403) {
                message.error(error.response.data.message || 'Bạn đã hoàn thành khảo sát trong gói membership hiện tại.');
            } else if (error.response?.status === 500) {
                const serverError = error.response.data?.error || error.response.data?.message || 'Lỗi server';
                message.error(`Lỗi server: ${serverError}`);
            } else {
                message.error('Có lỗi xảy ra khi lưu khảo sát. Vui lòng thử lại sau.');
            }
            setSubmitting(false);
        }
    };

    // Render question input for nicotine addiction survey
    const renderQuestionInput = (question) => {
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
                onChange={(value) => {
                    console.log(`Question ${question.QuestionID} changed to:`, value);
                }}
            >
                {question.options.map((option, idx) => (
                    <Option key={idx} value={option.text}>
                        {option.text}
                    </Option>
                ))}
            </Select>
        );
    };

    const handleRetry = () => {
        setLoading(true);
        setError(null);
        
        // Retry the survey completion check
        const checkSurveyCompletion = async () => {
            try {
                setLoading(true);
                setError(null);

                console.log('Retrying survey completion check...');

                // Get the token from localStorage
                const token = localStorage.getItem('token');
                if (!token) {
                    console.log('No token found, user not logged in');
                    setLoading(false);
                    return;
                }

                // First, test server connection
                try {
                    const testResponse = await api.get('/api/test');
                    console.log('Server connection test:', testResponse.data);
                } catch (testError) {
                    console.error('Server connection test failed:', testError);
                    setError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.');
                    setLoading(false);
                    return;
                }

                // First, check eligibility
                const eligibilityResponse = await api.get('/api/survey-questions/check-eligibility', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                console.log('Eligibility response:', eligibilityResponse.data);

                if (!eligibilityResponse.data.canTakeSurvey) {
                    // User cannot take survey, show message
                    setError(eligibilityResponse.data.message);
                    setLoading(false);
                    return;
                }

                // Check user's previous answers
                const answersResponse = await api.get('/api/smoking-addiction-survey/my-answers', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (answersResponse.data && Array.isArray(answersResponse.data)) {
                    // If user has 10 or more answers, consider survey completed
                    if (answersResponse.data.length >= 10) {
                        setSurveyCompleted(true);
                        
                        // Calculate result from previous answers
                        let totalScore = 0;
                        const answersObj = {};
                        
                        answersResponse.data.forEach(answer => {
                            answersObj[answer.QuestionID] = answer.AnswerText;
                            totalScore += answer.Score || 0;
                        });
                        
                        const addictionLevel = calculateAddictionLevel(totalScore);
                        setSurveyResult({
                            totalScore,
                            addictionLevel,
                            answers: answersObj
                        });
                        
                        setUserAnswers(answersObj);
                        form.setFieldsValue(answersObj);
                        console.log('Survey already completed, showing results');
                    } else {
                        // User has some answers but not complete
                        const answersObj = {};
                        answersResponse.data.forEach(answer => {
                            answersObj[answer.QuestionID] = answer.AnswerText;
                        });
                        setUserAnswers(answersObj);
                        form.setFieldsValue(answersObj);
                        console.log('User has partial answers, can continue');
                    }
                }

                setLoading(false);
            } catch (error) {
                console.error('Error checking survey completion:', error);
                
                // More detailed error handling
                if (error.code === 'ECONNREFUSED') {
                    setError('Không thể kết nối đến server. Vui lòng đảm bảo server đang chạy.');
                } else if (error.response) {
                    // Server responded with error status
                    if (error.response.status === 401) {
                        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                    } else if (error.response.status === 500) {
                        setError('Lỗi server. Vui lòng thử lại sau.');
                    } else if (error.response.data && error.response.data.message) {
                        setError(error.response.data.message);
                    } else {
                        setError(`Lỗi ${error.response.status}: ${error.response.statusText}`);
                    }
                } else if (error.request) {
                    // Request was made but no response received
                    setError('Không nhận được phản hồi từ server. Vui lòng kiểm tra kết nối mạng.');
                } else {
                    // Something else happened
                    setError('Có lỗi xảy ra khi kiểm tra trạng thái khảo sát');
                }
                setLoading(false);
            }
        };

        checkSurveyCompletion();
    };

    // Function to reset survey data
    const handleResetSurveyData = async () => {
        try {
            setResettingSurvey(true);
            
            const token = localStorage.getItem('token');
            await api.delete('/api/survey-reset/my-data', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            message.success('Dữ liệu khảo sát đã được xóa thành công! Bạn có thể làm khảo sát mới khi có gói membership mới.');
            
            // Reset states
            setSurveyCompleted(false);
            setSurveyResult(null);
            setUserAnswers({});
            setShowResetOption(false);
            form.resetFields();
            
        } catch (error) {
            console.error('Error resetting survey data:', error);
            if (error.response?.data?.message) {
                message.error(error.response.data.message);
            } else {
                message.error('Có lỗi xảy ra khi xóa dữ liệu khảo sát');
            }
        } finally {
            setResettingSurvey(false);
        }
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

    // Show survey completed result
    if (surveyCompleted && surveyResult) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '32px 16px'
            }}>
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <Result
                        icon={<CheckCircleOutlined style={{ color: surveyResult.addictionLevel.color }} />}
                        status="success"
                        title="Khảo sát đã hoàn thành!"
                        subTitle={`Mức độ nghiện nicotine: ${surveyResult.addictionLevel.level}`}
                        extra={[
                            <Button
                                type="primary"
                                size="large"
                                key="quit-plan"
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
                            </Button>,
                            <Button
                                size="large"
                                key="results"
                                onClick={() => window.location.href = '/smoking-survey/results'}
                                style={{
                                    borderRadius: '12px',
                                    height: '48px',
                                    paddingInline: '32px',
                                    fontSize: '16px',
                                    fontWeight: 600
                                }}
                            >
                                Xem Chi Tiết Kết Quả
                            </Button>
                        ]}
                    >
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.95)',
                            borderRadius: '16px',
                            padding: '24px',
                            marginTop: '24px',
                            backdropFilter: 'blur(20px)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: '16px'
                            }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: surveyResult.addictionLevel.color,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '20px',
                                    marginRight: '16px'
                                }}>
                                    📊
                                </div>
                                <Title level={4} style={{ margin: 0, color: '#1e293b' }}>
                                    Kết quả chi tiết
                                </Title>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                <div style={{
                                    padding: '16px',
                                    borderRadius: '8px',
                                    background: 'white',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <Text style={{ color: '#64748b', fontSize: '14px' }}>Tổng điểm FTND</Text>
                                    <div style={{ fontWeight: 600, color: '#1e293b', marginTop: '4px', fontSize: '18px' }}>
                                        {surveyResult.totalScore}/10
                                    </div>
                                </div>

                                <div style={{
                                    padding: '16px',
                                    borderRadius: '8px',
                                    background: 'white',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <Text style={{ color: '#64748b', fontSize: '14px' }}>Pack-Year</Text>
                                    <div style={{ 
                                        fontWeight: 600, 
                                        color: '#722ed1', 
                                        marginTop: '4px',
                                        fontSize: '18px'
                                    }}>
                                        {surveyResult.packYear || 0}
                                    </div>
                                </div>

                                <div style={{
                                    padding: '16px',
                                    borderRadius: '8px',
                                    background: 'white',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <Text style={{ color: '#64748b', fontSize: '14px' }}>Xác suất thành công</Text>
                                    <div style={{ 
                                        fontWeight: 600, 
                                        color: '#52c41a', 
                                        marginTop: '4px',
                                        fontSize: '18px'
                                    }}>
                                        {surveyResult.successProbability || 50}%
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                <div style={{
                                    padding: '16px',
                                    borderRadius: '8px',
                                    background: 'white',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <Text style={{ color: '#64748b', fontSize: '14px' }}>Mức độ nghiện</Text>
                                    <div style={{ 
                                        fontWeight: 600, 
                                        color: surveyResult.addictionLevel.color, 
                                        marginTop: '4px',
                                        fontSize: '16px'
                                    }}>
                                        {surveyResult.addictionLevel.level}
                                    </div>
                                </div>

                                <div style={{
                                    padding: '16px',
                                    borderRadius: '8px',
                                    background: 'white',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <Text style={{ color: '#64748b', fontSize: '14px' }}>Tiết kiệm/tháng</Text>
                                    <div style={{ 
                                        fontWeight: 600, 
                                        color: '#fa8c16', 
                                        marginTop: '4px',
                                        fontSize: '16px'
                                    }}>
                                        {(surveyResult.monthlySavings || 0).toLocaleString()}đ
                                    </div>
                                </div>
                            </div>

                            {/* Thông tin chi tiết tiết kiệm */}
                            <div style={{
                                padding: '16px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #fff7e6 0%, #fffbf0 100%)',
                                border: '1px solid #ffd591',
                                marginBottom: '16px'
                            }}>
                                <Text style={{ color: '#d48806', fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                                    💰 Dự báo tiết kiệm tiền
                                </Text>
                                <Row gutter={16}>
                                    <Col span={6}>
                                        <Text style={{ color: '#8c8c8c', fontSize: '12px' }}>Ngày:</Text>
                                        <div style={{ fontWeight: 600, color: '#d48806' }}>
                                            {(surveyResult.dailySavings || 0).toLocaleString()}đ
                                        </div>
                                    </Col>
                                    <Col span={6}>
                                        <Text style={{ color: '#8c8c8c', fontSize: '12px' }}>Tuần:</Text>
                                        <div style={{ fontWeight: 600, color: '#d48806' }}>
                                            {(surveyResult.weeklySavings || 0).toLocaleString()}đ
                                        </div>
                                    </Col>
                                    <Col span={6}>
                                        <Text style={{ color: '#8c8c8c', fontSize: '12px' }}>Tháng:</Text>
                                        <div style={{ fontWeight: 600, color: '#d48806' }}>
                                            {(surveyResult.monthlySavings || 0).toLocaleString()}đ
                                        </div>
                                    </Col>
                                    <Col span={6}>
                                        <Text style={{ color: '#8c8c8c', fontSize: '12px' }}>Năm:</Text>
                                        <div style={{ fontWeight: 600, color: '#d48806' }}>
                                            {(surveyResult.yearlySavings || 0).toLocaleString()}đ
                                        </div>
                                    </Col>
                                </Row>
                                <Text style={{ color: '#8c8c8c', fontSize: '12px', marginTop: '8px', display: 'block' }}>
                                    Dựa trên: {surveyResult.packageName} - {(surveyResult.packagePrice || 0).toLocaleString()}đ/gói
                                </Text>
                            </div>

                            <div style={{
                                padding: '16px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                border: '1px solid #bfdbfe'
                            }}>
                                <Text style={{ color: '#1e40af', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                                    Khuyến nghị
                                </Text>
                                <Text style={{ color: '#1e40af', fontSize: '14px', lineHeight: '1.6' }}>
                                    {surveyResult.addictionLevel.description}
                                </Text>
                            </div>
                        </div>
                    </Result>
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
                            Lỗi Kết Nối
                        </Title>

                        <div style={{
                            background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
                            borderRadius: '12px',
                            padding: '20px',
                            marginBottom: '24px',
                            border: '1px solid rgba(239, 68, 68, 0.2)'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                marginBottom: '12px'
                            }}>
                                <div style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    background: '#dc2626',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: '12px',
                                    flexShrink: 0
                                }}>
                                    <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>!</span>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <Text style={{
                                        color: '#dc2626',
                                        fontWeight: 600,
                                        display: 'block',
                                        marginBottom: '8px',
                                        fontSize: '16px'
                                    }}>
                                        Lỗi Kết Nối
                                    </Text>
                                    <Text style={{ 
                                        color: '#7f1d1d', 
                                        fontSize: '14px',
                                        lineHeight: '1.5'
                                    }}>
                                        {error}
                                    </Text>
                                </div>
                            </div>
                            
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.5)',
                                borderRadius: '8px',
                                padding: '12px',
                                marginTop: '12px',
                                border: '1px solid rgba(239, 68, 68, 0.1)'
                            }}>
                                <Text style={{
                                    color: '#991b1b',
                                    fontSize: '12px',
                                    fontWeight: 500
                                }}>
                                    💡 Vui lòng thử lại hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp diễn.
                                </Text>
                            </div>
                        </div>

                        <div style={{ textAlign: 'center' }}>
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
                                    fontWeight: 600,
                                    marginRight: '12px'
                                }}
                            >
                                🔄 Thử Lại
                            </Button>
                            
                            <Button
                                size="large"
                                onClick={() => window.location.href = '/dashboard'}
                                style={{
                                    border: '2px solid #667eea',
                                    borderRadius: '12px',
                                    height: '48px',
                                    paddingInline: '32px',
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    color: '#667eea',
                                    background: 'transparent'
                                }}
                            >
                                🏠 Về Dashboard
                            </Button>
                            
                            {showResetOption && (
                                <Button
                                    danger
                                    size="large"
                                    loading={resettingSurvey}
                                    onClick={handleResetSurveyData}
                                    style={{
                                        border: '2px solid #dc2626',
                                        borderRadius: '12px',
                                        height: '48px',
                                        paddingInline: '32px',
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        marginTop: '12px',
                                        display: 'block',
                                        margin: '12px auto 0'
                                    }}
                                >
                                    🗑️ Xóa Dữ Liệu Khảo Sát
                                </Button>
                            )}
                        </div>
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
                        Khảo Sát Mức Độ Nghiện Nicotine
                    </Title>

                    <Text style={{
                        color: '#6b7280',
                        fontSize: '18px',
                        fontWeight: 500,
                        lineHeight: '1.6'
                    }}>
                        Đánh giá toàn diện mức độ nghiện nicotine và tính toán dự báo tiết kiệm tiền khi cai thuốc thành công.
                    </Text>

                    <Alert
                        message="Bộ câu hỏi đánh giá chuẩn quốc tế"
                        description="10 câu hỏi FTND + thông tin cá nhân để tính Pack-Year, xác suất thành công và dự báo tiết kiệm tiền chính xác."
                        type="info"
                        showIcon
                        style={{ marginTop: '16px', borderRadius: '8px' }}
                    />
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
                        onValuesChange={(changedValues, allValues) => {
                            console.log('Form values changed:', changedValues, 'All values:', allValues);
                        }}
                    >
                        {NICOTINE_SURVEY_QUESTIONS.map((question, index) => (
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
                                    validateFirst={true}
                                    style={{ marginBottom: 0, paddingLeft: '44px' }}
                                >
                                    {renderQuestionInput(question)}
                                </Form.Item>
                            </div>
                        ))}

                        {/* Thông tin bổ sung */}
                        <div style={{ 
                            background: 'linear-gradient(135deg, #e8f5e8 0%, #d4f1d4 100%)',
                            borderRadius: '16px',
                            padding: '24px',
                            marginTop: '32px',
                            marginBottom: '24px',
                            border: '1px solid rgba(76, 175, 80, 0.2)'
                        }}>
                            <Title level={4} style={{ 
                                textAlign: 'center', 
                                marginBottom: '24px',
                                color: '#2e7d32'
                            }}>
                                📋 Thông Tin Bổ Sung
                            </Title>
                            <Text style={{ 
                                display: 'block',
                                textAlign: 'center',
                                color: '#6b7280',
                                marginBottom: '24px'
                            }}>
                                Cung cấp thêm thông tin để tính toán chính xác Pack-Year và dự báo tiết kiệm
                            </Text>

                            <Row gutter={[16, 16]}>
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        name="yearsSmoked"
                                        label="Số năm đã hút thuốc"
                                        dependencies={['age']}
                                        rules={[
                                            { required: true, message: 'Vui lòng nhập số năm hút thuốc' },
                                            { type: 'number', min: 1, max: 70, message: 'Số năm phải từ 1-70' },
                                            ({ getFieldValue }) => ({
                                                validator(_, value) {
                                                    const age = getFieldValue('age');
                                                    if (!value || !age) {
                                                        return Promise.resolve();
                                                    }
                                                    if (value >= age) {
                                                        return Promise.reject(new Error('Số năm hút thuốc phải nhỏ hơn tuổi của bạn!'));
                                                    }
                                                    return Promise.resolve();
                                                },
                                            }),
                                        ]}
                                    >
                                        <InputNumber
                                            style={{ width: '100%' }}
                                            placeholder="Ví dụ: 5"
                                            addonAfter="năm"
                                            step={1}
                                            precision={0}
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

                                <Col xs={24} md={12}>
                                    <Form.Item
                                        name="motivation"
                                        label="Động lực chính để bỏ thuốc"
                                        rules={[{ required: true, message: 'Vui lòng chọn động lực' }]}
                                    >
                                        <Select placeholder="Chọn động lực chính">
                                            <Option value="Cải thiện sức khỏe">🏃‍♂️ Cải thiện sức khỏe</Option>
                                            <Option value="Tiết kiệm tiền">💰 Tiết kiệm tiền</Option>
                                            <Option value="Gia đình">👨‍👩‍👧‍👦 Vì gia đình</Option>
                                            <Option value="Áp lực xã hội">👥 Áp lực xã hội</Option>
                                            <Option value="Khác">❓ Lý do khác</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </div>

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
                                Hoàn Thành Khảo Sát
                            </Button>
                        </div>
                    </Form>
                </div>
            </div>
        </div>
    );
};

export default SmokingSurveyPage; 