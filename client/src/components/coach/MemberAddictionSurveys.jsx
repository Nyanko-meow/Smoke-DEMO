import React, { useState, useEffect } from 'react';
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
    Tabs
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
    return (
        <div>
            {/* Header thông tin cơ bản */}
            <Card style={{ marginBottom: 16 }}>
                <Row gutter={[16, 16]}>
                    <Col span={6}>
                        <Statistic 
                            title="Xác Suất Thành Công" 
                            value={user.SuccessProbability || 50} 
                            suffix="%" 
                            valueStyle={{ 
                                color: user.SuccessProbability > 70 ? '#3f8600' : 
                                       user.SuccessProbability > 50 ? '#faad14' : '#cf1322' 
                            }}
                        />
                        <Progress 
                            percent={user.SuccessProbability || 50} 
                            strokeColor={
                                user.SuccessProbability > 70 ? '#3f8600' : 
                                user.SuccessProbability > 50 ? '#faad14' : '#cf1322'
                            }
                            size="small"
                        />
                    </Col>
                    <Col span={6}>
                        <Statistic 
                            title="Điểm FTND" 
                            value={user.FTNDScore || 0} 
                            suffix="/10"
                            valueStyle={{ 
                                color: user.FTNDScore <= 3 ? '#3f8600' : 
                                       user.FTNDScore <= 6 ? '#faad14' : '#cf1322' 
                            }}
                        />
                        <Text type="secondary">{user.AddictionLevel}</Text>
                    </Col>
                    <Col span={6}>
                        <Statistic 
                            title="Pack-Year" 
                            value={user.PackYear || 0} 
                            precision={1}
                            valueStyle={{ color: user.PackYear > 20 ? '#cf1322' : '#1890ff' }}
                        />
                        <Text type="secondary">Mức độ nghiện sâu</Text>
                    </Col>
                    <Col span={6}>
                        <Statistic 
                            title="Tuổi / Năm hút" 
                            value={`${user.Age || 0} / ${user.YearsSmoked || 0}`} 
                            valueStyle={{ color: '#722ed1' }}
                        />
                        <Text type="secondary">tuổi / năm</Text>
                    </Col>
                </Row>
            </Card>

            {/* Thông tin tiết kiệm chi tiết */}
            <Card title="💰 Dự Báo Tiết Kiệm" style={{ marginBottom: 16 }}>
                <Row gutter={[16, 16]}>
                    <Col span={8}>
                        <Card size="small" style={{ textAlign: 'center', backgroundColor: '#f6ffed' }}>
                            <Statistic 
                                title="Hàng Ngày" 
                                value={user.DailySavings || 0} 
                                suffix="đ"
                                precision={0}
                                valueStyle={{ color: '#52c41a', fontSize: '18px' }}
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card size="small" style={{ textAlign: 'center', backgroundColor: '#fff7e6' }}>
                            <Statistic 
                                title="Hàng Tháng" 
                                value={user.MonthlySavings || 0} 
                                suffix="đ"
                                precision={0}
                                valueStyle={{ color: '#fa8c16', fontSize: '18px' }}
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card size="small" style={{ textAlign: 'center', backgroundColor: '#f0f5ff' }}>
                            <Statistic 
                                title="Hàng Năm" 
                                value={user.YearlySavings || 0} 
                                suffix="đ"
                                precision={0}
                                valueStyle={{ color: '#1890ff', fontSize: '18px' }}
                            />
                        </Card>
                    </Col>
                </Row>
                
                <Divider />
                
                <Row gutter={[16, 16]}>
                    <Col span={12}>
                        <Text strong>Loại thuốc: </Text>
                        <Tag color="blue">{user.PackageName || 'Chưa xác định'}</Tag>
                        <br />
                        <Text type="secondary">
                            {user.PriceRange} - {(user.PackagePrice || 0).toLocaleString()}đ/gói
                        </Text>
                    </Col>
                    <Col span={12}>
                        <Text strong>Số điếu/ngày: </Text>
                        <Tag color={user.CigarettesPerDay > 20 ? 'red' : user.CigarettesPerDay > 10 ? 'orange' : 'green'}>
                            {user.CigarettesPerDay || 0} điếu
                        </Tag>
                        <br />
                        <Text type="secondary">Mức tiêu thụ</Text>
                    </Col>
                </Row>
            </Card>

            {/* Phân tích rủi ro và khuyến nghị */}
            <Card title="📊 Phân Tích Chuyên Sâu" style={{ marginBottom: 16 }}>
                <Tabs defaultActiveKey="risk">
                    <TabPane tab="Phân Tích Rủi Ro" key="risk">
                        <Timeline>
                            <Timeline.Item 
                                color={user.FTNDScore <= 3 ? 'green' : user.FTNDScore <= 6 ? 'orange' : 'red'}
                                dot={user.FTNDScore <= 3 ? <SmileOutlined /> : user.FTNDScore <= 6 ? <MehOutlined /> : <FrownOutlined />}
                            >
                                <Text strong>Mức độ nghiện nicotine: </Text>
                                <Tag color={user.FTNDScore <= 3 ? 'green' : user.FTNDScore <= 6 ? 'orange' : 'red'}>
                                    {user.AddictionLevel}
                                </Tag>
                                <br />
                                <Text type="secondary">{user.AddictionSeverity}</Text>
                            </Timeline.Item>
                            
                            <Timeline.Item 
                                color={user.PackYear < 10 ? 'green' : user.PackYear < 20 ? 'orange' : 'red'}
                                dot={<HeartOutlined />}
                            >
                                <Text strong>Rủi ro sức khỏe: </Text>
                                <Tag color={user.PackYear < 10 ? 'green' : user.PackYear < 20 ? 'orange' : 'red'}>
                                    {user.PackYear < 10 ? 'Thấp' : user.PackYear < 20 ? 'Trung bình' : 'Cao'}
                                </Tag>
                                <br />
                                <Text type="secondary">Dựa trên Pack-Year: {user.PackYear}</Text>
                            </Timeline.Item>
                            
                            <Timeline.Item 
                                color={user.SuccessProbability > 70 ? 'green' : user.SuccessProbability > 50 ? 'orange' : 'red'}
                                dot={<TrophyOutlined />}
                            >
                                <Text strong>Khả năng thành công: </Text>
                                <Tag color={user.SuccessProbability > 70 ? 'green' : user.SuccessProbability > 50 ? 'orange' : 'red'}>
                                    {user.SuccessProbability > 70 ? 'Cao' : user.SuccessProbability > 50 ? 'Trung bình' : 'Thấp'}
                                </Tag>
                                <br />
                                <Text type="secondary">Động lực: {user.Motivation}</Text>
                            </Timeline.Item>
                        </Timeline>
                    </TabPane>
                    
                    <TabPane tab="Khuyến Nghị" key="advice">
                        {renderAdviceBasedOnProfile(user)}
                    </TabPane>
                </Tabs>
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
    const [memberProgressData, setMemberProgressData] = useState(null);

    // Statistics
    const [statistics, setStatistics] = useState(null);

    useEffect(() => {
        fetchMembers();
        fetchOverview();
    }, [pagination.current, pagination.pageSize, searchText]);

    const fetchMembers = async () => {
        setLoading(true);
        try {
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
            console.error('Error fetching members:', error);
            message.error('Không thể tải danh sách members');
            setMembers([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchOverview = async () => {
        try {
            const response = await axiosInstance.get('/coach/addiction-overview');
            setStatistics(response.data);
        } catch (error) {
            console.error('Error fetching overview:', error);
        }
    };

    const handleSearch = (value) => {
        setSearchText(value);
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const handleViewDetail = async (member) => {
        setSelectedMember(member);
        setMemberDetailVisible(true);
        setMemberDetailLoading(true);

        try {
            // Fetch survey data
            const surveyResponse = await axiosInstance.get(`/coach/member-survey/${member.UserID}`);
            
            // Fetch progress data  
            const progressResponse = await axiosInstance.get(`/coach/member-progress/${member.UserID}`);

            setMemberSurveyData(surveyResponse.data);
            setMemberProgressData(progressResponse.data);
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
            title: 'Tiến trình',
            key: 'progress',
            render: (_, record) => (
                <div>
                    <Text>Ngày không hút: <Text strong>{record.smokeFreeDays || 0}</Text></Text>
                    <br />
                    <Text>Tiết kiệm: <Text strong>{(record.actualMoneySaved || 0).toLocaleString()}đ</Text></Text>
                </div>
            ),
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
        if (!memberSurveyData || !memberProgressData) {
            return <Empty description="Không có dữ liệu khảo sát" />;
        }

        // Sử dụng renderDetailedUserInfo cho detailed view
        return (
            <Tabs defaultActiveKey="detailed">
                <TabPane tab="📊 Chi Tiết Đầy Đủ" key="detailed">
                    {renderDetailedUserInfo(memberSurveyData)}
                </TabPane>
                
                <TabPane tab="📈 Tiến Trình" key="progress">
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={6}>
                            <Statistic
                                title="Ngày không hút thuốc"
                                value={memberProgressData.smokeFreeDays || 0}
                                valueStyle={{ color: '#52c41a' }}
                                prefix="📅"
                            />
                        </Col>
                        <Col xs={24} sm={6}>
                            <Statistic
                                title="Tiền đã tiết kiệm"
                                value={calculateActualSavings(
                                    memberProgressData.smokeFreeDays || 0, 
                                    memberSurveyData.DailySavings || 0
                                )}
                                formatter={(value) => `${value.toLocaleString()}đ`}
                                valueStyle={{ color: '#fa8c16' }}
                                prefix={<DollarCircleOutlined />}
                            />
                        </Col>
                        <Col xs={24} sm={6}>
                            <Statistic
                                title="Điếu thuốc đã tránh"
                                value={calculateCigarettesNotSmoked(
                                    memberProgressData.smokeFreeDays || 0,
                                    memberSurveyData.CigarettesPerDay || 0
                                )}
                                valueStyle={{ color: '#1890ff' }}
                                prefix="🚭"
                            />
                        </Col>
                        <Col xs={24} sm={6}>
                            <Statistic
                                title="Xác suất thành công"
                                value={memberSurveyData.SuccessProbability}
                                suffix="%"
                                valueStyle={{ color: '#722ed1' }}
                                prefix={<TrophyOutlined />}
                            />
                        </Col>
                    </Row>
                </TabPane>

                <TabPane tab="💡 Khuyến Nghị" key="recommendations">
                    <Card title="🎯 Khuyến Nghị Cho Coach">
                        <Space direction="vertical" style={{ width: '100%' }}>
                            {memberSurveyData.SuccessProbability > 70 && (
                                <Alert
                                    message="Member có tiềm năng thành công cao"
                                    description="Hãy duy trì động lực và khuyến khích member tiếp tục. Có thể tập trung vào việc chia sẻ thành tích để tăng cường tự tin."
                                    type="success"
                                    showIcon
                                />
                            )}
                            
                            {memberSurveyData.SuccessProbability <= 50 && (
                                <Alert
                                    message="Member cần hỗ trợ thêm"
                                    description="Nên tăng cường tư vấn 1-1, đưa ra kế hoạch chi tiết hơn và theo dõi sát sao hơn. Có thể cần thay đổi phương pháp tiếp cận."
                                    type="warning"
                                    showIcon
                                />
                            )}

                            {memberSurveyData.FTNDScore >= 7 && (
                                <Alert
                                    message="Mức độ nghiện cao"
                                    description="Member có mức độ nghiện nặng, cần kiên nhẫn và hỗ trợ chuyên sâu. Nên tập trung vào việc giảm dần thay vì bỏ ngay."
                                    type="error"
                                    showIcon
                                />
                            )}

                            <Alert
                                message="Tập trung vào động lực tài chính"
                                description={`Member có thể tiết kiệm ${(memberSurveyData.MonthlySavings || 0).toLocaleString()}đ/tháng. Hãy nhắc nhở họ về lợi ích tài chính này thường xuyên.`}
                                type="info"
                                showIcon
                            />
                        </Space>
                    </Card>
                </TabPane>
            </Tabs>
        );
    };

    return (
        <div style={{ padding: '24px' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <Title level={2}>🚭 Khảo Sát Mức Độ Nghiện Thuốc Lá</Title>
                <Paragraph type="secondary">
                    Theo dõi và quản lý thông tin khảo sát mức độ nghiện của members
                </Paragraph>
            </div>

            {/* Statistics */}
            {statistics && (
                <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic
                                title="Tổng số members"
                                value={statistics.totalMembers || 0}
                                prefix={<TeamOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic
                                title="Đã khảo sát"
                                value={statistics.completedSurveys || 0}
                                prefix={<FileTextOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic
                                title="Xác suất TB"
                                value={statistics.averageSuccessRate || 0}
                                suffix="%"
                                prefix={<TrophyOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Card>
                            <Statistic
                                title="Tổng tiết kiệm"
                                value={statistics.totalMoneySaved || 0}
                                formatter={(value) => `${value.toLocaleString()}đ`}
                                prefix={<DollarCircleOutlined />}
                            />
                        </Card>
                    </Col>
                </Row>
            )}

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
                title={`Chi tiết khảo sát - ${selectedMember?.FullName || selectedMember?.Username}`}
                visible={memberDetailVisible}
                onCancel={() => {
                    setMemberDetailVisible(false);
                    setSelectedMember(null);
                    setMemberSurveyData(null);
                    setMemberProgressData(null);
                }}
                footer={null}
                width={1200}
                style={{ top: 20 }}
            >
                {memberDetailLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        Đang tải dữ liệu...
                    </div>
                ) : (
                    renderMemberDetail()
                )}
            </Modal>
        </div>
    );
};

export default MemberAddictionSurveys;