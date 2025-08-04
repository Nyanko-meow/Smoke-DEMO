import React, { useState, useEffect, useCallback } from 'react';
import {
    Table,
    Input,
    Button,
    Modal,
    Card,
    Typography,
    Space,
    Tag,
    Statistic,
    Row,
    Col,
    Avatar,
    message,
    Progress,
    Empty,
    Divider,
    Alert,
    Timeline,
    Tabs,
    Spin,
    Descriptions
} from 'antd';
import {
    SearchOutlined,
    EyeOutlined,
    FileTextOutlined,
    UserOutlined,
    ClockCircleOutlined,
    TeamOutlined,
    TrophyOutlined,
    DollarCircleOutlined,
    HeartOutlined,
    SmileOutlined,
    MehOutlined,
    FrownOutlined,
    ExclamationCircleOutlined,
    BarChartOutlined
} from '@ant-design/icons';
import axiosInstance from '../../utils/axiosConfig';
import moment from 'moment';
// import logger from '../../utils/debugLogger';
import {
    getAddictionLevel,
    getHealthRiskLevel,
    calculateActualSavings,
    calculateCigarettesNotSmoked,
    getHealthImprovements,
    getPriceRangeById
} from '../../utils/smokingCalculations';

const { Title, Text, Paragraph } = Typography;

const { TabPane } = Tabs;

// Thêm component hiển thị chi tiết user
const renderDetailedUserInfo = (user) => {
    const formatNumber = (num) => {
        return new Intl.NumberFormat('vi-VN').format(num || 0);
    };

    return (
        <div>
            {/* Kết quả chi tiết - Main Stats */}
            <Card 
                title={
                    <Space>
                        <TrophyOutlined style={{ color: '#fa8c16' }} />
                        <span>Kết quả chi tiết</span>
                    </Space>
                }
                style={{ marginBottom: 24 }}
            >
                <Row gutter={[16, 24]}>
                    <Col xs={24} sm={12} md={8}>
                        <div style={{ textAlign: 'center', padding: '16px' }}>
                            <div style={{ color: '#8c8c8c', marginBottom: '8px' }}>Tổng điểm FTND</div>
                            <div style={{ 
                                fontSize: '24px', 
                                fontWeight: 'bold',
                                color: user.FTNDScore <= 3 ? '#52c41a' : 
                                       user.FTNDScore <= 6 ? '#faad14' : '#ff4d4f'
                            }}>
                                {user.FTNDScore || 0}/10
                            </div>
                        </div>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <div style={{ textAlign: 'center', padding: '16px' }}>
                            <div style={{ color: '#8c8c8c', marginBottom: '8px' }}>Pack-Year</div>
                            <div style={{ 
                                fontSize: '24px', 
                                fontWeight: 'bold',
                                color: '#722ed1'
                            }}>
                                {user.PackYear || 0}
                            </div>
                        </div>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <div style={{ textAlign: 'center', padding: '16px' }}>
                            <div style={{ color: '#8c8c8c', marginBottom: '8px' }}>Xác suất thành công</div>
                            <div style={{ 
                                fontSize: '24px', 
                                fontWeight: 'bold',
                                color: user.SuccessProbability > 70 ? '#52c41a' : 
                                       user.SuccessProbability > 50 ? '#faad14' : '#ff4d4f'
                            }}>
                                {user.SuccessProbability || 0}%
                            </div>
                        </div>
                    </Col>
                    <Col xs={24} sm={12}>
                        <div style={{ textAlign: 'center', padding: '16px' }}>
                            <div style={{ color: '#8c8c8c', marginBottom: '8px' }}>Mức độ nghiện</div>
                            <Tag 
                                color={
                                    user.AddictionLevel?.includes('cao') || user.AddictionLevel?.includes('high') ? 'red' :
                                    user.AddictionLevel?.includes('trung bình') || user.AddictionLevel?.includes('medium') ? 'orange' : 'green'
                                }
                                style={{ fontSize: '14px', padding: '4px 12px' }}
                            >
                                {user.AddictionLevel || 'Chưa xác định'}
                            </Tag>
                        </div>
                    </Col>
                    <Col xs={24} sm={12}>
                        <div style={{ textAlign: 'center', padding: '16px' }}>
                            <div style={{ color: '#8c8c8c', marginBottom: '8px' }}>Tiết kiệm/tháng</div>
                            <div style={{ 
                                fontSize: '20px', 
                                fontWeight: 'bold',
                                color: '#fa8c16'
                            }}>
                                {formatNumber(user.MonthlySavings)}đ
                            </div>
                        </div>
                    </Col>
                </Row>
            </Card>

            {/* Dự báo tiết kiệm tiền */}
            <Card 
                title={
                    <Space>
                        <DollarCircleOutlined style={{ color: '#52c41a' }} />
                        <span>💰 Dự báo tiết kiệm tiền</span>
                    </Space>
                }
                style={{ marginBottom: 24 }}
            >
                <Row gutter={[16, 16]}>
                    <Col xs={12} sm={6}>
                        <div style={{ textAlign: 'center', padding: '12px' }}>
                            <div style={{ color: '#8c8c8c', marginBottom: '4px' }}>Ngày:</div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a' }}>
                                {formatNumber(user.DailySavings)}đ
                            </div>
                        </div>
                    </Col>
                    <Col xs={12} sm={6}>
                        <div style={{ textAlign: 'center', padding: '12px' }}>
                            <div style={{ color: '#8c8c8c', marginBottom: '4px' }}>Tuần:</div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fa8c16' }}>
                                {formatNumber((user.DailySavings || 0) * 7)}đ
                            </div>
                        </div>
                    </Col>
                    <Col xs={12} sm={6}>
                        <div style={{ textAlign: 'center', padding: '12px' }}>
                            <div style={{ color: '#8c8c8c', marginBottom: '4px' }}>Tháng:</div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
                                {formatNumber(user.MonthlySavings)}đ
                            </div>
                        </div>
                    </Col>
                    <Col xs={12} sm={6}>
                        <div style={{ textAlign: 'center', padding: '12px' }}>
                            <div style={{ color: '#8c8c8c', marginBottom: '4px' }}>Năm:</div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#722ed1' }}>
                                {formatNumber(user.YearlySavings)}đ
                            </div>
                        </div>
                    </Col>
                </Row>
                
                {user.PackageName && (
                    <div style={{ 
                        marginTop: 16, 
                        padding: '12px', 
                        backgroundColor: '#fafafa', 
                        borderRadius: '6px',
                        textAlign: 'center',
                        fontSize: '13px',
                        color: '#666'
                    }}>
                        Dựa trên: {user.PackageName} - {formatNumber(user.PackagePrice)}đ/gói
                    </div>
                )}
            </Card>
        </div>
    );
};

// Hàm đưa ra khuyến nghị dựa trên profile
const renderAdviceBasedOnProfile = (user) => {
    const advices = [];
    
    // Khuyến nghị dựa trên FTND
    if (user.FTNDScore > 7) {
        advices.push({
            type: 'warning',
            title: 'Nghiện nicotine cao',
            content: 'Cần hỗ trợ y tế chuyên sâu, có thể cần thuốc thay thế nicotine',
            priority: 'Cao'
        });
    } else if (user.FTNDScore > 4) {
        advices.push({
            type: 'info',
            title: 'Nghiện nicotine trung bình',
            content: 'Nên kết hợp tư vấn tâm lý và thay đổi thói quen',
            priority: 'Trung bình'
        });
    }
    
    // Khuyến nghị dựa trên tuổi
    if (user.Age < 30) {
        advices.push({
            type: 'success',
            title: 'Tuổi trẻ - Lợi thế lớn',
            content: 'Cơ thể hồi phục nhanh, tập trung vào thay đổi thói quen',
            priority: 'Cao'
        });
    } else if (user.Age > 50) {
        advices.push({
            type: 'warning',
            title: 'Cần can thiệp sớm',
            content: 'Rủi ro sức khỏe tăng cao, ưu tiên hỗ trợ y tế',
            priority: 'Cao'
        });
    }
    
    // Khuyến nghị dựa trên tiết kiệm
    if (user.MonthlySavings > 500000) {
        advices.push({
            type: 'success',
            title: 'Động lực kinh tế mạnh',
            content: 'Sử dụng mục tiêu tiết kiệm như một động lực chính',
            priority: 'Trung bình'
        });
    }
    
    return (
        <div>
            {advices.map((advice, index) => (
                <Alert
                    key={index}
                    message={
                        <div>
                            <Text strong>{advice.title}</Text>
                            <Tag color={advice.priority === 'Cao' ? 'red' : 'blue'} style={{ marginLeft: 8 }}>
                                {advice.priority}
                            </Tag>
                        </div>
                    }
                    description={advice.content}
                    type={advice.type}
                    style={{ marginBottom: 12 }}
                />
            ))}
        </div>
    );
};

const MemberAddictionSurveys = () => {
    console.log('\n🔥 ========== MEMBER ADDICTION SURVEYS COMPONENT ==========');
    console.log('🚀 Component initialized at:', new Date().toISOString());
    console.log('🔑 Token check:', {
        hasToken: !!localStorage.getItem('coachToken'),
        tokenLength: localStorage.getItem('coachToken')?.length,
        tokenPreview: localStorage.getItem('coachToken')?.substring(0, 30) + '...'
    });
    console.log('👤 User check:', localStorage.getItem('coachUser'));
    console.log('🌍 Current URL:', window.location.href);
    console.log('🔥 ========================================\n');
    
    // logger.info('🚀 MemberAddictionSurveys component initialized');
    
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });

    // Modal states
    const [selectedMember, setSelectedMember] = useState(null);
    const [memberDetailVisible, setMemberDetailVisible] = useState(false);
    const [memberDetailLoading, setMemberDetailLoading] = useState(false);
    const [memberSurveyData, setMemberSurveyData] = useState(null);

    // Statistics
    const [statistics, setStatistics] = useState(null);

    const fetchMembers = useCallback(async () => {
        setLoading(true);
        try {
            // Debug token before making request
            const token = localStorage.getItem('coachToken'); // Sửa từ 'token' thành 'coachToken'
            console.log('🔍 Token check before fetchMembers', {
                hasToken: !!token,
                tokenLength: token?.length,
                tokenPreview: token?.substring(0, 20) + '...'
            });

            if (!token) {
                console.error('❌ No token found, redirecting to login');
                message.error('Phiên đăng nhập đã hết hạn');
                window.location.href = '/coach/login'; // Sửa redirect URL
                return;
            }

            const response = await axiosInstance.get('/coach/member-addiction-surveys', {
                params: {
                    page: pagination.current,
                    limit: pagination.pageSize,
                    search: searchText
                }
            });

            setMembers(response.data.data.members || []);
            setPagination(prev => ({
                ...prev,
                total: response.data.data.pagination?.total || 0
            }));
        } catch (error) {
            console.error('Error fetching members', { error: error.message, response: error.response?.data });
            if (error.response?.status === 401) {
                message.error('Phiên đăng nhập đã hết hạn');
                localStorage.clear();
                window.location.href = '/coach/login'; // Sửa redirect URL
            } else {
                message.error('Không thể tải danh sách members');
            }
            setMembers([]);
        } finally {
            setLoading(false);
        }
    }, [pagination.current, pagination.pageSize, searchText]);

    const fetchOverview = useCallback(async () => {
        try {
            // Debug token before making request
            const token = localStorage.getItem('coachToken'); // Sửa từ 'token' thành 'coachToken'
            console.log('🔍 Token check before fetchOverview', {
                hasToken: !!token,
                tokenLength: token?.length,
                tokenPreview: token?.substring(0, 20) + '...'
            });

            if (!token) {
                console.error('❌ No token found for overview, redirecting to login');
                message.error('Phiên đăng nhập đã hết hạn');
                window.location.href = '/coach/login'; // Sửa redirect URL
                return;
            }

            const response = await axiosInstance.get('/coach/addiction-overview');
            setStatistics(response.data);
        } catch (error) {
            console.error('Error fetching overview', { error: error.message, response: error.response?.data });
            if (error.response?.status === 401) {
                message.error('Phiên đăng nhập đã hết hạn');
                localStorage.clear();
                window.location.href = '/coach/login'; // Sửa redirect URL
            }
        }
    }, []);

    useEffect(() => {
        console.log('🔄 useEffect triggered with dependencies', {
            fetchMembers: typeof fetchMembers,
            fetchOverview: typeof fetchOverview,
            pagination: pagination,
            searchText
        });
        
        // Add small delay to ensure token is available
        const timer = setTimeout(() => {
            console.log('🚀 Starting addiction survey data fetch...');
            console.log('🔑 Token status', {
                hasToken: !!localStorage.getItem('coachToken'),
                tokenLength: localStorage.getItem('coachToken')?.length,
                user: localStorage.getItem('coachUser') ? JSON.parse(localStorage.getItem('coachUser')) : null
            });
            
            fetchMembers();
            fetchOverview();
        }, 100);

        return () => {
            console.log('🧹 useEffect cleanup');
            clearTimeout(timer);
        };
    }, [fetchMembers, fetchOverview]);

    const handleSearch = (value) => {
        setSearchText(value);
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const handleViewDetail = async (member) => {
        setSelectedMember(member);
        setMemberDetailVisible(true);
        setMemberDetailLoading(true);

        try {
            // Chỉ fetch survey data, bỏ progress data
            const surveyResponse = await axiosInstance.get(`/coach/member-survey/${member.UserID}`);
            
            console.log('🔍 Survey Response:', surveyResponse.data);
            console.log('🔍 Survey Data:', surveyResponse.data.data);
            
            setMemberSurveyData(surveyResponse.data);
        } catch (error) {
            console.error('Error fetching member details:', error);
            message.error('Không thể tải chi tiết member');
        } finally {
            setMemberDetailLoading(false);
        }
    };

    const handleTableChange = (paginationInfo) => {
        setPagination(prev => ({
            ...prev,
            current: paginationInfo.current,
            pageSize: paginationInfo.pageSize
        }));
    };

    const getMotivationIcon = (motivation) => {
        switch (motivation) {
            case 'very_high': return <SmileOutlined style={{ color: '#52c41a' }} />;
            case 'high': return <SmileOutlined style={{ color: '#1890ff' }} />;
            case 'medium': return <MehOutlined style={{ color: '#fa8c16' }} />;
            case 'low': return <FrownOutlined style={{ color: '#faad14' }} />;
            case 'very_low': return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
            default: return <MehOutlined />;
        }
    };

    const getMotivationText = (motivation) => {
        const motivationMap = {
            'very_high': 'Rất cao',
            'high': 'Cao', 
            'medium': 'Trung bình',
            'low': 'Thấp',
            'very_low': 'Rất thấp'
        };
        return motivationMap[motivation] || 'Chưa xác định';
    };

    const columns = [
        {
            title: 'Member',
            key: 'member',
            render: (_, record) => (
                <Space>
                    <Avatar icon={<UserOutlined />} />
                    <div>
                        <Text strong>{record.FullName || record.Username}</Text>
                        <br />
                        <Text type="secondary">{record.Email}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Mức độ nghiện',
            dataIndex: 'AddictionLevel',
            key: 'addictionLevel',
            render: (level) => level ? (
                <Tag color={level.includes('nhẹ') ? 'green' : level.includes('cao') ? 'red' : 'orange'}>
                    {level}
                </Tag>
            ) : (
                <Text type="secondary">Chưa khảo sát</Text>
            ),
        },
        {
            title: '🎯 Xác Suất',
            dataIndex: 'SuccessProbability',
            key: 'successProbability',
            sorter: (a, b) => (a.SuccessProbability || 0) - (b.SuccessProbability || 0),
            render: (probability) => (
                <div style={{ textAlign: 'center' }}>
                    <Progress
                        type="circle"
                        size={50}
                        percent={probability || 50}
                        strokeColor={
                            probability > 70 ? '#52c41a' : 
                            probability > 50 ? '#faad14' : '#ff4d4f'
                        }
                    />
                    <div style={{ marginTop: 4, fontSize: '12px' }}>
                        {probability > 70 ? 'Cao' : probability > 50 ? 'TB' : 'Thấp'}
                    </div>
                </div>
            )
        },
        {
            title: '💰 Tiết Kiệm/Tháng',
            dataIndex: 'MonthlySavings',
            key: 'monthlySavings',
            sorter: (a, b) => (a.MonthlySavings || 0) - (b.MonthlySavings || 0),
            render: (savings) => (
                <div>
                    <Text strong style={{ color: '#fa8c16' }}>
                        {(savings || 0).toLocaleString()}đ
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                        {Math.round((savings || 0) / 30000).toLocaleString()}k/ngày
                    </Text>
                </div>
            )
        },
        {
            title: 'Cập nhật lần cuối',
            dataIndex: 'lastUpdated',
            key: 'lastUpdated',
            render: (date) => date ? moment(date).format('DD/MM/YYYY') : 'Chưa có',
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_, record) => (
                <Button
                    type="primary"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewDetail(record)}
                >
                    Xem chi tiết
                </Button>
            ),
        },
    ];

    const renderMemberDetail = () => {
        if (!memberSurveyData || !memberSurveyData.data) {
            return <Empty description="Không có dữ liệu khảo sát" />;
        }

        // Pass đúng data từ API response
        return renderDetailedUserInfo(memberSurveyData.data);
    };

    console.log('🎨 MemberAddictionSurveys rendering with state', {
        membersCount: members.length,
        loading,
        hasStatistics: !!statistics,
        searchText,
        pagination
    });

    return (
        <div style={{ padding: '24px' }}>
            {/* Debug Panel */}
            <div style={{ 
                position: 'fixed', 
                top: '10px', 
                right: '10px', 
                background: '#f0f0f0', 
                padding: '10px',
                borderRadius: '5px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                zIndex: 9999,
                fontSize: '12px'
            }}>
                <div>🔍 Debug Status</div>
                <div>Token: {localStorage.getItem('coachToken') ? '✅' : '❌'}</div>
                <div>Members: {members.length}</div>
                <div>Loading: {loading ? '🔄' : '✅'}</div>
                <div style={{ marginTop: '5px' }}>
                    <Button size="small" onClick={() => console.log('Export logs disabled')}>
                        📥 Download Logs
                    </Button>
                    <Button size="small" onClick={() => console.log('Clear logs disabled')} style={{ marginLeft: '5px' }}>
                        🗑️ Clear
                    </Button>
                </div>
            </div>

            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <Title level={2}>🚭 Khảo Sát Mức Độ Nghiện Thuốc Lá</Title>
                <Paragraph type="secondary">
                    Theo dõi và quản lý thông tin khảo sát mức độ nghiện của members
                </Paragraph>
            </div>

            {/* Search and Table */}
            <Card>
                <div style={{ marginBottom: '16px' }}>
                    <Input.Search
                        placeholder="Tìm kiếm member..."
                        allowClear
                        onSearch={handleSearch}
                        style={{ width: 300 }}
                        prefix={<SearchOutlined />}
                    />
                </div>

                <Table
                    columns={columns}
                    dataSource={members}
                    loading={loading}
                    pagination={{
                        ...pagination,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => 
                            `${range[0]}-${range[1]} của ${total} members`,
                    }}
                    onChange={handleTableChange}
                    rowKey="UserID"
                />
            </Card>

            {/* Member Detail Modal */}
            <Modal
                title={`Chi tiết khảo sát - ${selectedMember?.FirstName} ${selectedMember?.LastName}`}
                open={memberDetailVisible}
                onCancel={() => {
                    setMemberDetailVisible(false);
                    setSelectedMember(null);
                    setMemberSurveyData(null);
                    // Bỏ: setMemberProgressData(null);
                }}
                footer={null}
                width={1200}
                style={{ top: 20 }}
            >
                <Spin spinning={memberDetailLoading}>
                    {renderMemberDetail()}
                </Spin>
            </Modal>
        </div>
    );
};

export default MemberAddictionSurveys;