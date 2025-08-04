import React, { useState, useEffect } from 'react';
import {
    Card,
    Button,
    Form,
    DatePicker,
    Select,
    Input,
    message,
    Avatar,
    Typography,
    Row,
    Col,
    Empty,
    Modal,
    Alert
} from 'antd';
import {
    CalendarOutlined,
    PlusOutlined,
    VideoCameraOutlined,
    PhoneOutlined,
    MessageOutlined,
    UserOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import AppointmentSuccessModal from '../chat/AppointmentSuccessModal';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

const BookAppointment = () => {
    const [assignedCoach, setAssignedCoach] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [appointmentData, setAppointmentData] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [membershipInfo, setMembershipInfo] = useState(null);
    const [membershipStatus, setMembershipStatus] = useState(null);
    const [membershipLoading, setMembershipLoading] = useState(true);
    const [form] = Form.useForm();

    useEffect(() => {
        checkMembershipStatus();
    }, []);

    const checkMembershipStatus = async () => {
        try {
            setMembershipLoading(true);
            const token = localStorage.getItem('token');

            const response = await axios.get('http://localhost:4000/api/membership/current', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success && response.data.data) {
                const membership = response.data.data;

                const isActive = (membership.Status === 'active' || membership.Status === 'pending_cancellation') &&
                    new Date(membership.EndDate) > new Date();

                setMembershipStatus({
                    isActive,
                    status: membership.Status,
                    endDate: membership.EndDate,
                    planName: membership.Name
                });

                if (isActive) {
                    loadAssignedCoach();
                    loadMembershipInfo();
                }
            } else {
                setMembershipStatus({
                    isActive: false,
                    status: null,
                    endDate: null,
                    planName: null
                });
            }
        } catch (error) {
            console.error('Error checking membership status:', error);
            setMembershipStatus({
                isActive: false,
                status: null,
                endDate: null,
                planName: null
            });
        } finally {
            setMembershipLoading(false);
        }
    };

    const loadAssignedCoach = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const userData = JSON.parse(localStorage.getItem('user') || '{}');

            console.log('🔍 Loading assigned coach...');
            console.log('🔍 User data:', userData);

            if (!token) {
                message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                return;
            }

            const response = await axios.get('http://localhost:4000/api/user/assigned-coach', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('🔍 Assigned coach API response:', response.data);

            if (response.data.success === true && response.data.data && typeof response.data.data === 'object') {
                setAssignedCoach(response.data.data);
                console.log('✅ Loaded assigned coach:', response.data.data.fullName);
                message.success(`Đã tìm thấy coach: ${response.data.data.fullName}`);
            } else {
                setAssignedCoach(null);
                console.log('❌ No assigned coach found');
                console.log('❌ Response structure:', response.data);

                if (response.data.message) {
                    message.warning(response.data.message);
                } else {
                    message.warning('Bạn chưa được phân công coach nào. Vui lòng liên hệ admin để được hỗ trợ.');
                }
            }
        } catch (error) {
            console.error('❌ Error loading assigned coach:', error);
            setAssignedCoach(null);

            if (error.response?.status === 401) {
                message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            } else if (error.response?.status === 403) {
                message.error('Bạn không có quyền truy cập.');
            } else {
                message.error('Không thể tải thông tin coach được phân công');
            }
        } finally {
            setLoading(false);
        }
    };

    const loadMembershipInfo = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:4000/api/user/status', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success && response.data.data.membership) {
                setMembershipInfo(response.data.data.membership);
                console.log('✅ Loaded membership info:', response.data.data.membership);
                console.log('🔍 Membership endDate:', response.data.data.membership.endDate);
                console.log('🔍 Membership endDate type:', typeof response.data.data.membership.endDate);

                // Test date parsing
                const testEndDate = dayjs(response.data.data.membership.endDate);
                console.log('🔍 Parsed endDate:', testEndDate.format('DD/MM/YYYY'));
                console.log('🔍 Is valid date:', testEndDate.isValid());
            } else {
                console.log('❌ No active membership found');
            }
        } catch (error) {
            console.error('❌ Error loading membership info:', error);
        }
    };

    const createAppointment = async (values) => {
        try {
            setSubmitting(true);
            const token = localStorage.getItem('token');
            const appointmentDateTime = dayjs(values.appointmentDate).toISOString();

            console.log('📋 Creating appointment with data:', {
                receiverId: assignedCoach.id,
                appointmentDate: appointmentDateTime,
                duration: parseInt(values.duration),
                type: values.type,
                notes: values.notes || ''
            });

            const response = await axios.post('http://localhost:4000/api/chat/appointment', {
                receiverId: assignedCoach.id,
                appointmentDate: appointmentDateTime,
                duration: parseInt(values.duration),
                type: values.type,
                notes: values.notes || ''
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                setAppointmentData(response.data.data);
                setShowCreateModal(false);
                setShowSuccessModal(true);
                form.resetFields();
                message.success('Đặt lịch tư vấn thành công! 🎉');
            }
        } catch (error) {
            console.error('🚨 Error creating appointment:', error);

            if (error.response?.status === 400) {
                message.error(error.response.data?.message || 'Thông tin đặt lịch không hợp lệ');
            } else if (error.response?.status === 409) {
                message.error('Thời gian này đã có lịch hẹn khác. Vui lòng chọn thời gian khác');
            } else if (error.response?.status === 500) {
                message.error('Lỗi server. Vui lòng thử lại sau.');
            } else {
                message.error('Không thể đặt lịch tư vấn. Vui lòng thử lại sau');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'video': return <VideoCameraOutlined className="text-purple-500" />;
            case 'audio': return <PhoneOutlined className="text-green-500" />;
            default: return <MessageOutlined className="text-blue-500" />;
        }
    };

    const getTypeText = (type) => {
        switch (type) {
            case 'video': return 'Video call';
            case 'audio': return 'Audio call';
            default: return 'Chat';
        }
    };

    if (membershipLoading) {
        return (
            <div className="min-h-screen" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '24px'
            }}>
                <div className="max-w-5xl mx-auto">
                    <Card
                        className="shadow-2xl transform"
                        style={{
                            borderRadius: '20px',
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                        bodyStyle={{ padding: '48px' }}
                    >
                        <div className="text-center">
                            <div
                                className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
                                style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                                }}
                            >
                                <CalendarOutlined style={{ fontSize: '24px', color: 'white' }} />
                            </div>
                            <Title level={4} style={{ color: '#6b7280', marginBottom: '8px' }}>
                                Đang kiểm tra trạng thái membership...
                            </Title>
                            <Text style={{ color: '#9ca3af' }}>
                                Vui lòng chờ trong giây lát
                            </Text>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    if (!membershipStatus?.isActive) {
        return (
            <div className="min-h-screen" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '24px'
            }}>
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <div
                            className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
                            style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255, 255, 255, 0.3)'
                            }}
                        >
                            <CalendarOutlined style={{ fontSize: '32px', color: 'white' }} />
                        </div>
                        <Title level={1} style={{ color: 'white', marginBottom: '8px', fontWeight: 700 }}>
                            Đặt lịch tư vấn
                        </Title>
                        <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px' }}>
                            Đặt lịch hẹn với coach được phân công để nhận tư vấn chuyên nghiệp
                        </Text>
                    </div>

                    {/* Warning Card */}
                    <Card
                        className="mb-8 shadow-2xl transform"
                        style={{
                            borderRadius: '20px',
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                        bodyStyle={{ padding: '32px' }}
                    >
                        <div className="flex items-start space-x-4 mb-6">
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
                            >
                                <span style={{ fontSize: '28px' }}>🚫</span>
                            </div>
                            <div>
                                <Title level={3} style={{ color: '#92400e', marginBottom: '8px' }}>
                                    Không thể đặt lịch hẹn
                                </Title>
                                <Text style={{ color: '#6b7280', fontSize: '16px', display: 'block', marginBottom: '16px' }}>
                                    Gói membership của bạn đã hết hạn hoặc bị hủy. Dịch vụ đặt lịch hẹn không còn khả dụng.
                                </Text>
                                {membershipStatus?.status === 'expired' && (
                                    <Text style={{ color: '#dc2626', display: 'block' }}>
                                        <strong>Trạng thái:</strong> Đã hết hạn vào {dayjs(membershipStatus.endDate).format('DD/MM/YYYY')}
                                    </Text>
                                )}
                                {membershipStatus?.status === 'cancelled' && (
                                    <Text style={{ color: '#dc2626', display: 'block' }}>
                                        <strong>Trạng thái:</strong> Gói đã bị hủy
                                    </Text>
                                )}
                            </div>
                        </div>

                        <div
                            className="p-6 rounded-xl text-center"
                            style={{
                                background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                                border: '1px solid rgba(209, 213, 219, 0.5)'
                            }}
                        >
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                            <Title level={4} style={{ color: '#374151', marginBottom: '8px' }}>
                                Dịch vụ không khả dụng
                            </Title>
                            <Text style={{ color: '#6b7280', fontSize: '16px', display: 'block', marginBottom: '24px' }}>
                                Vui lòng mua gói mới để tiếp tục sử dụng dịch vụ tư vấn.
                            </Text>
                            <Button
                                size="large"
                                style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    height: '48px',
                                    paddingLeft: '32px',
                                    paddingRight: '32px',
                                    color: 'white',
                                    fontWeight: 600
                                }}
                            >
                                💳 Mua gói dịch vụ
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '24px'
        }}>
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div
                        className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
                        style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.3)'
                        }}
                    >
                        <CalendarOutlined style={{ fontSize: '32px', color: 'white' }} />
                    </div>
                    <Title level={1} style={{ color: 'white', marginBottom: '8px', fontWeight: 700 }}>
                        Đặt lịch tư vấn
                    </Title>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px' }}>
                        Đặt lịch hẹn với coach được phân công để nhận tư vấn chuyên nghiệp
                    </Text>
                </div>

                {/* Coach Assignment Status */}
                {loading && (
                    <Card
                        className="mb-8 shadow-2xl transform"
                        style={{
                            borderRadius: '20px',
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                        bodyStyle={{ padding: '48px' }}
                    >
                        <div className="text-center">
                            <div
                                className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
                                style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                                }}
                            >
                                <UserOutlined style={{ fontSize: '24px', color: 'white' }} />
                            </div>
                            <Title level={4} style={{ color: '#6b7280', marginBottom: '8px' }}>
                                Đang tải thông tin coach...
                            </Title>
                            <Text style={{ color: '#9ca3af' }}>
                                Vui lòng chờ trong giây lát
                            </Text>
                        </div>
                    </Card>
                )}

                {!loading && !assignedCoach && (
                    <Card
                        className="mb-8 shadow-lg transform hover:shadow-xl transition-all duration-300"
                        style={{
                            borderRadius: '16px',
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                        bodyStyle={{ padding: '32px' }}
                    >
                        {/* Top accent bar */}
                        <div
                            style={{
                                height: '4px',
                                background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                                borderRadius: '2px',
                                marginBottom: '24px',
                                opacity: 0.8
                            }}
                        />

                        <div className="text-center">
                            <div
                                className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center"
                                style={{
                                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                    color: '#d97706',
                                    border: '2px solid #f59e0b20'
                                }}
                            >
                                <UserOutlined style={{ fontSize: '24px' }} />
                            </div>

                            <Title level={4} style={{ color: '#374151', marginBottom: '8px', fontWeight: 600 }}>
                                Chưa được phân công coach
                            </Title>

                            <Text style={{
                                color: '#6b7280',
                                fontSize: '14px',
                                display: 'block',
                                marginBottom: '20px',
                                lineHeight: '1.5'
                            }}>
                                Bạn chưa được phân công coach nào. Vui lòng liên hệ admin để được hỗ trợ.
                            </Text>

                            <Button
                                onClick={loadAssignedCoach}
                                size="large"
                                style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    height: '40px',
                                    paddingLeft: '24px',
                                    paddingRight: '24px',
                                    color: 'white',
                                    fontWeight: 500,
                                    fontSize: '14px'
                                }}
                                className="hover:shadow-lg transition-all duration-300"
                            >
                                🔄 Tải lại thông tin
                            </Button>
                        </div>
                    </Card>
                )}

                {!loading && assignedCoach && (
                    <>
                        {/* Assigned Coach Info - Compact */}
                        <Card
                            className="mb-6 shadow-lg transform hover:shadow-xl transition-all duration-300"
                            style={{
                                borderRadius: '16px',
                                background: 'rgba(255, 255, 255, 0.95)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)'
                            }}
                            bodyStyle={{ padding: '20px' }}
                        >
                            <div className="flex items-center justify-between">
                                {/* Coach Basic Info */}
                                <div className="flex items-center space-x-4">
                                    <div className="relative">
                                        <Avatar
                                            size={64}
                                            src={assignedCoach.avatar}
                                            icon={<UserOutlined />}
                                            style={{
                                                border: '3px solid #667eea',
                                                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                                            }}
                                        />
                                        <div
                                            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                                            style={{
                                                background: '#22c55e',
                                                border: '2px solid white'
                                            }}
                                        >
                                            <CheckCircleOutlined style={{ fontSize: '10px', color: 'white' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <Title level={4} style={{ margin: 0, color: '#1f2937' }}>
                                            Coach {assignedCoach.fullName}
                                        </Title>
                                        <Text style={{ color: '#6b7280', fontSize: '14px', display: 'block' }}>
                                            📧 {assignedCoach.email}
                                        </Text>
                                        {assignedCoach.specialization && (
                                            <Text style={{ color: '#667eea', fontSize: '13px', display: 'block' }}>
                                                🎯 {assignedCoach.specialization}
                                            </Text>
                                        )}

                                        {/* Compact Stats */}
                                        <div className="flex items-center space-x-4 mt-2">
                                            {assignedCoach.averageRating > 0 && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    ⭐ {assignedCoach.averageRating}/5
                                                </span>
                                            )}
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                                                🟢 {assignedCoach.isAvailable ? 'Online' : 'Offline'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Book Button */}
                                <Button
                                    type="primary"
                                    size="large"
                                    icon={<PlusOutlined />}
                                    onClick={() => setShowCreateModal(true)}
                                    style={{
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        border: 'none',
                                        borderRadius: '12px',
                                        height: '48px',
                                        paddingLeft: '24px',
                                        paddingRight: '24px',
                                        fontWeight: 600
                                    }}
                                    className="hover:shadow-lg transition-all duration-300"
                                >
                                    📅 Đặt lịch
                                </Button>
                            </div>

                            {/* Optional Bio - Collapsible */}
                            {assignedCoach.bio && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <Text style={{ color: '#6b7280', fontSize: '14px', lineHeight: 1.5 }}>
                                        💬 {assignedCoach.bio.length > 100
                                            ? `${assignedCoach.bio.substring(0, 100)}...`
                                            : assignedCoach.bio}
                                    </Text>
                                </div>
                            )}
                        </Card>

                        {/* Membership Info Warning */}
                        {membershipInfo && (
                            <Card
                                className="mb-8 transform hover:shadow-lg transition-all duration-300"
                                style={{
                                    borderRadius: '16px',
                                    background: 'rgba(255, 255, 255, 0.95)',
                                    backdropFilter: 'blur(20px)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)'
                                }}
                                bodyStyle={{ padding: '24px' }}
                            >
                                <div className="flex items-start space-x-4">
                                    <div
                                        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                                        style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}
                                    >
                                        <span style={{ fontSize: '20px' }}>ℹ️</span>
                                    </div>
                                    <div>
                                        <Title level={4} style={{ color: '#1f2937', marginBottom: '8px' }}>
                                            Thông tin gói dịch vụ
                                        </Title>
                                        <Text style={{ color: '#6b7280', fontSize: '15px' }}>
                                            Gói <strong>{membershipInfo.planName}</strong> của bạn có hiệu lực đến ngày{' '}
                                            <strong style={{ color: '#667eea' }}>
                                                {dayjs(membershipInfo.endDate).format('DD/MM/YYYY')}
                                            </strong>.
                                            Bạn chỉ có thể đặt lịch trong thời gian này.
                                        </Text>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Quick Tips */}
                        <Card
                            className="shadow-2xl transform hover:shadow-3xl transition-all duration-300"
                            style={{
                                borderRadius: '20px',
                                background: 'rgba(255, 255, 255, 0.95)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)'
                            }}
                            bodyStyle={{ padding: '32px' }}
                        >
                            <Title level={3} style={{ color: '#1f2937', marginBottom: '24px', textAlign: 'center' }}>
                                💡 Lưu ý khi đặt lịch
                            </Title>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    {
                                        icon: '⏰',
                                        title: 'Thời gian',
                                        desc: 'Chọn thời gian phù hợp, tránh giờ cao điểm',
                                        color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                                    },
                                    {
                                        icon: '📱',
                                        title: 'Loại tư vấn',
                                        desc: 'Video call cho tương tác tốt nhất',
                                        color: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                                    },
                                    {
                                        icon: '📝',
                                        title: 'Ghi chú',
                                        desc: 'Mô tả vấn đề cần tư vấn để coach chuẩn bị',
                                        color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                    },
                                    {
                                        icon: '🔔',
                                        title: 'Nhắc nhở',
                                        desc: 'Hệ thống sẽ gửi thông báo trước 15 phút',
                                        color: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                                    }
                                ].map((tip, index) => (
                                    <div
                                        key={index}
                                        className="p-6 rounded-xl hover:scale-105 transition-all duration-300"
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.6)',
                                            border: '1px solid rgba(255, 255, 255, 0.3)',
                                            backdropFilter: 'blur(10px)'
                                        }}
                                    >
                                        <div className="flex items-start space-x-4">
                                            <div
                                                className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                                                style={{ background: tip.color }}
                                            >
                                                <span style={{ fontSize: '20px' }}>{tip.icon}</span>
                                            </div>
                                            <div>
                                                <Title level={5} style={{ color: '#374151', marginBottom: '4px' }}>
                                                    {tip.title}
                                                </Title>
                                                <Text style={{ color: '#6b7280', fontSize: '14px' }}>
                                                    {tip.desc}
                                                </Text>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </>
                )}

                {/* Create Appointment Modal - Enhanced */}
                {assignedCoach && (
                    <Modal
                        title={
                            <div
                                className="flex items-center space-x-4 py-4"
                                style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    margin: '-24px -24px 24px -24px',
                                    padding: '24px',
                                    color: 'white'
                                }}
                            >
                                <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center"
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.2)',
                                        backdropFilter: 'blur(10px)'
                                    }}
                                >
                                    <CalendarOutlined style={{ fontSize: '20px', color: 'white' }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
                                        Đặt lịch tư vấn
                                    </div>
                                    <div style={{ fontSize: '14px', opacity: 0.8 }}>
                                        Với Coach {assignedCoach.fullName}
                                    </div>
                                </div>
                            </div>
                        }
                        open={showCreateModal}
                        onCancel={() => {
                            form.resetFields();
                            setShowCreateModal(false);
                        }}
                        footer={null}
                        width={700}
                        style={{ borderRadius: '20px' }}
                        bodyStyle={{ padding: '32px' }}
                    >
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={createAppointment}
                            className="space-y-6"
                        >
                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item
                                        name="appointmentDate"
                                        label={<span style={{ fontWeight: 600, color: '#374151' }}>⏰ Thời gian</span>}
                                        rules={[
                                            { required: true, message: 'Vui lòng chọn thời gian' },
                                            {
                                                validator: (_, value) => {
                                                    if (!value) return Promise.resolve();

                                                    if (value.isBefore(dayjs())) {
                                                        return Promise.reject('Thời gian hẹn phải trong tương lai');
                                                    }

                                                    if (membershipInfo?.endDate) {
                                                        const membershipEndDate = dayjs(membershipInfo.endDate);
                                                        if (membershipEndDate.isValid() && value.isAfter(membershipEndDate, 'day')) {
                                                            return Promise.reject(`Thời gian hẹn phải trong thời gian hợp đồng (đến ${membershipEndDate.format('DD/MM/YYYY')})`);
                                                        }
                                                    }

                                                    return Promise.resolve();
                                                }
                                            }
                                        ]}
                                    >
                                        <DatePicker
                                            showTime
                                            format="DD/MM/YYYY HH:mm"
                                            placeholder="Chọn ngày và giờ"
                                            disabledDate={(current) => {
                                                if (!current) return false;
                                                if (current < dayjs().startOf('day')) return true;
                                                if (membershipInfo?.endDate) {
                                                    const membershipEndDate = dayjs(membershipInfo.endDate);
                                                    if (membershipEndDate.isValid() && current > membershipEndDate.endOf('day')) {
                                                        return true;
                                                    }
                                                }
                                                return false;
                                            }}
                                            style={{
                                                width: '100%',
                                                height: '48px',
                                                borderRadius: '12px'
                                            }}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="duration"
                                        label={<span style={{ fontWeight: 600, color: '#374151' }}>⏱️ Thời lượng</span>}
                                        initialValue={30}
                                        rules={[{ required: true, message: 'Vui lòng chọn thời lượng' }]}
                                    >
                                        <Select
                                            style={{
                                                height: '48px',
                                                borderRadius: '12px'
                                            }}
                                        >
                                            <Option value={15}>15 phút</Option>
                                            <Option value={30}>30 phút</Option>
                                            <Option value={45}>45 phút</Option>
                                            <Option value={60}>60 phút</Option>
                                            <Option value={90}>90 phút</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item
                                name="type"
                                label={<span style={{ fontWeight: 600, color: '#374151' }}>📞 Loại tư vấn</span>}
                                initialValue="chat"
                                rules={[{ required: true, message: 'Vui lòng chọn loại tư vấn' }]}
                            >
                                <Select
                                    style={{
                                        height: '48px',
                                        borderRadius: '12px'
                                    }}
                                >
                                    <Option value="chat">
                                        <div className="flex items-center space-x-3">
                                            <MessageOutlined style={{ color: '#3b82f6' }} />
                                            <span>Chat text</span>
                                        </div>
                                    </Option>
                                    <Option value="audio">
                                        <div className="flex items-center space-x-3">
                                            <PhoneOutlined style={{ color: '#10b981' }} />
                                            <span>Tư vấn audio</span>
                                        </div>
                                    </Option>
                                    <Option value="video">
                                        <div className="flex items-center space-x-3">
                                            <VideoCameraOutlined style={{ color: '#8b5cf6' }} />
                                            <span>Tư vấn video</span>
                                        </div>
                                    </Option>
                                </Select>
                            </Form.Item>

                            <Form.Item
                                name="notes"
                                label={<span style={{ fontWeight: 600, color: '#374151' }}>📝 Ghi chú</span>}
                            >
                                <TextArea
                                    rows={4}
                                    placeholder="Mô tả vấn đề cần tư vấn để coach chuẩn bị tốt hơn..."
                                    style={{
                                        borderRadius: '12px',
                                        fontSize: '14px'
                                    }}
                                />
                            </Form.Item>

                            <Form.Item className="mb-0 pt-4">
                                <div className="flex justify-end space-x-4">
                                    <Button
                                        onClick={() => setShowCreateModal(false)}
                                        size="large"
                                        style={{
                                            height: '48px',
                                            borderRadius: '12px',
                                            paddingLeft: '24px',
                                            paddingRight: '24px'
                                        }}
                                    >
                                        Hủy
                                    </Button>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={submitting}
                                        size="large"
                                        style={{
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            border: 'none',
                                            height: '48px',
                                            borderRadius: '12px',
                                            paddingLeft: '32px',
                                            paddingRight: '32px',
                                            fontWeight: 600
                                        }}
                                    >
                                        📅 {submitting ? 'Đang đặt lịch...' : 'Đặt lịch'}
                                    </Button>
                                </div>
                            </Form.Item>
                        </Form>
                    </Modal>
                )}

                {/* Success Modal */}
                <AppointmentSuccessModal
                    visible={showSuccessModal}
                    onClose={() => setShowSuccessModal(false)}
                    appointmentData={appointmentData}
                    receiverInfo={assignedCoach}
                />
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: .5; }
                }
                
                .ant-modal-content {
                    border-radius: 20px !important;
                    overflow: hidden !important;
                }
                
                .ant-modal-header {
                    border-bottom: none !important;
                    padding: 0 !important;
                }
                
                .ant-modal-body {
                    padding: 0 !important;
                }
                
                .ant-select-selector,
                .ant-picker,
                .ant-input {
                    border-radius: 12px !important;
                    border: 2px solid #e5e7eb !important;
                    transition: all 0.3s ease !important;
                }
                
                .ant-select-selector:hover,
                .ant-picker:hover,
                .ant-input:hover {
                    border-color: #667eea !important;
                }
                
                .ant-select-focused .ant-select-selector,
                .ant-picker-focused,
                .ant-input:focus {
                    border-color: #667eea !important;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
                }
            `}</style>
        </div>
    );
};

export default BookAppointment; 