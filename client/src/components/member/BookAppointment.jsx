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
    const [form] = Form.useForm();

    useEffect(() => {
        loadAssignedCoach();
        loadMembershipInfo();
    }, []);

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

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Title level={2} className="mb-2 text-gray-800">
                        <CalendarOutlined className="mr-3 text-blue-500" />
                        Đặt lịch tư vấn
                    </Title>
                    <Text className="text-gray-600">
                        Đặt lịch hẹn với coach được phân công để nhận tư vấn chuyên nghiệp
                    </Text>
                </div>

                {/* Coach Assignment Status */}
                {loading && (
                    <Card className="mb-6 shadow-lg" style={{ borderRadius: '12px' }}>
                        <div className="text-center py-8">
                            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <Text>Đang tải thông tin coach...</Text>
                        </div>
                    </Card>
                )}

                {!loading && !assignedCoach && (
                    <Card className="mb-6 shadow-lg" style={{ borderRadius: '12px' }}>
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={
                                <div className="text-center">
                                    <Title level={4} className="text-gray-600 mb-2">
                                        Chưa được phân công coach
                                    </Title>
                                    <Text className="text-gray-500 mb-4 block">
                                        Bạn chưa được phân công coach nào. Vui lòng liên hệ admin để được hỗ trợ.
                                    </Text>
                                    <Button
                                        onClick={loadAssignedCoach}
                                        className="mt-4"
                                        type="primary"
                                    >
                                        🔄 Tải lại thông tin
                                    </Button>
                                </div>
                            }
                        />
                    </Card>
                )}

                {!loading && assignedCoach && (
                    <>
                        {/* Assigned Coach Info */}
                        <Card className="mb-6 shadow-lg" style={{ borderRadius: '12px' }}>
                            <div className="flex items-center space-x-4">
                                <Avatar
                                    size={80}
                                    src={assignedCoach.avatar}
                                    icon={<UserOutlined />}
                                    className="border-4 border-green-100"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <Title level={3} className="mb-0">
                                            Coach {assignedCoach.fullName}
                                        </Title>
                                        <CheckCircleOutlined className="text-green-500 text-xl" />
                                    </div>
                                    <Text className="text-gray-600 block">{assignedCoach.email}</Text>
                                    {assignedCoach.specialization && (
                                        <Text className="text-blue-600 block text-sm">
                                            🎯 {assignedCoach.specialization}
                                        </Text>
                                    )}
                                    {assignedCoach.bio && (
                                        <Text className="text-gray-500 block text-sm mt-2">
                                            {assignedCoach.bio}
                                        </Text>
                                    )}
                                    <div className="flex items-center space-x-4 mt-3">
                                        {assignedCoach.averageRating > 0 && (
                                            <Text className="text-yellow-600">
                                                ⭐ {assignedCoach.averageRating} ({assignedCoach.reviewCount} đánh giá)
                                            </Text>
                                        )}
                                        {assignedCoach.isAvailable && (
                                            <Text className="text-green-600">🟢 Đang hoạt động</Text>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    type="primary"
                                    size="large"
                                    icon={<PlusOutlined />}
                                    onClick={() => setShowCreateModal(true)}
                                    style={{
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        height: '48px',
                                        paddingLeft: '24px',
                                        paddingRight: '24px'
                                    }}
                                    className="hover:shadow-lg transition-all duration-200"
                                >
                                    Đặt lịch ngay
                                </Button>
                            </div>
                        </Card>

                        {/* Membership Info Warning */}
                        {membershipInfo && (
                            <Alert
                                message="Thông tin gói dịch vụ"
                                description={`Gói ${membershipInfo.planName} của bạn có hiệu lực đến ngày ${dayjs(membershipInfo.endDate).format('DD/MM/YYYY')}. Bạn chỉ có thể đặt lịch trong thời gian này.`}
                                type="info"
                                showIcon
                                className="mb-6"
                            />
                        )}

                        {/* Quick Tips */}
                        <Card className="shadow-lg" style={{ borderRadius: '12px' }}>
                            <Title level={4} className="mb-4 text-gray-800">
                                💡 Lưu ý khi đặt lịch
                            </Title>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="space-y-2">
                                    <p className="text-gray-600">
                                        <strong>⏰ Thời gian:</strong> Chọn thời gian phù hợp, tránh giờ cao điểm
                                    </p>
                                    <p className="text-gray-600">
                                        <strong>📱 Loại tư vấn:</strong> Video call cho tương tác tốt nhất
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-gray-600">
                                        <strong>📝 Ghi chú:</strong> Mô tả vấn đề cần tư vấn để coach chuẩn bị
                                    </p>
                                    <p className="text-gray-600">
                                        <strong>🔔 Nhắc nhở:</strong> Hệ thống sẽ gửi thông báo trước 15 phút
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </>
                )}

                {/* Create Appointment Modal */}
                {assignedCoach && (
                    <Modal
                        title={
                            <div className="flex items-center space-x-3 py-2">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                    <CalendarOutlined className="text-white text-lg" />
                                </div>
                                <div>
                                    <div className="text-lg font-semibold text-gray-800">Đặt lịch tư vấn</div>
                                    <div className="text-sm text-gray-500">Với Coach {assignedCoach.fullName}</div>
                                </div>
                            </div>
                        }
                        open={showCreateModal}
                        onCancel={() => {
                            form.resetFields();
                            setShowCreateModal(false);
                        }}
                        footer={null}
                        width={600}
                        style={{ borderRadius: '16px' }}
                        bodyStyle={{ padding: '24px' }}
                    >
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={createAppointment}
                            className="space-y-4"
                        >
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        name="appointmentDate"
                                        label={<span className="font-medium text-gray-700">Thời gian</span>}
                                        rules={[
                                            { required: true, message: 'Vui lòng chọn thời gian' },
                                            {
                                                validator: (_, value) => {
                                                    if (!value) return Promise.resolve();

                                                    console.log('🔍 Validating appointment date:', {
                                                        selectedDate: value.format('DD/MM/YYYY HH:mm'),
                                                        membershipInfo: membershipInfo,
                                                        endDate: membershipInfo?.endDate
                                                    });

                                                    if (value.isBefore(dayjs())) {
                                                        return Promise.reject('Thời gian hẹn phải trong tương lai');
                                                    }

                                                    // Check membership end date if available
                                                    if (membershipInfo?.endDate) {
                                                        const membershipEndDate = dayjs(membershipInfo.endDate);
                                                        console.log('🔍 Membership validation:', {
                                                            selectedDate: value.format('DD/MM/YYYY'),
                                                            membershipEndDate: membershipEndDate.format('DD/MM/YYYY'),
                                                            isAfter: value.isAfter(membershipEndDate, 'day'),
                                                            isValid: membershipEndDate.isValid()
                                                        });

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

                                                // Disable past dates
                                                if (current < dayjs().startOf('day')) return true;

                                                // Disable dates after membership end date if membership exists
                                                if (membershipInfo?.endDate) {
                                                    const membershipEndDate = dayjs(membershipInfo.endDate);
                                                    if (membershipEndDate.isValid() && current > membershipEndDate.endOf('day')) {
                                                        console.log('🔍 Disabling date:', current.format('DD/MM/YYYY'), 'after membership end:', membershipEndDate.format('DD/MM/YYYY'));
                                                        return true;
                                                    }
                                                }

                                                return false;
                                            }}
                                            style={{ width: '100%', height: '48px' }}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="duration"
                                        label={<span className="font-medium text-gray-700">Thời lượng</span>}
                                        initialValue={30}
                                        rules={[{ required: true, message: 'Vui lòng chọn thời lượng' }]}
                                    >
                                        <Select style={{ height: '48px' }}>
                                            <Option value={15}>15 phút</Option>
                                            <Option value={30}>30 phút</Option>
                                            <Option value={45}>45 phút</Option>
                                            <Option value={60}>60 phút</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item
                                name="type"
                                label={<span className="font-medium text-gray-700">Loại tư vấn</span>}
                                initialValue="chat"
                                rules={[{ required: true, message: 'Vui lòng chọn loại tư vấn' }]}
                            >
                                <Select style={{ height: '48px' }}>
                                    <Option value="chat">
                                        <div className="flex items-center">
                                            <MessageOutlined className="mr-2 text-blue-500" />
                                            Chat text
                                        </div>
                                    </Option>
                                    <Option value="audio">
                                        <div className="flex items-center">
                                            <PhoneOutlined className="mr-2 text-green-500" />
                                            Tư vấn audio
                                        </div>
                                    </Option>
                                    <Option value="video">
                                        <div className="flex items-center">
                                            <VideoCameraOutlined className="mr-2 text-purple-500" />
                                            Tư vấn video
                                        </div>
                                    </Option>
                                </Select>
                            </Form.Item>

                            <Form.Item
                                name="notes"
                                label={<span className="font-medium text-gray-700">Ghi chú</span>}
                            >
                                <TextArea
                                    rows={3}
                                    placeholder="Mô tả vấn đề cần tư vấn để coach chuẩn bị tốt hơn..."
                                    style={{ borderRadius: '8px' }}
                                />
                            </Form.Item>

                            <Form.Item className="mb-0 pt-4">
                                <div className="flex justify-end space-x-3">
                                    <Button
                                        onClick={() => setShowCreateModal(false)}
                                        style={{ height: '44px', borderRadius: '8px' }}
                                    >
                                        Hủy
                                    </Button>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={submitting}
                                        style={{
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            border: 'none',
                                            height: '44px',
                                            borderRadius: '8px'
                                        }}
                                    >
                                        Đặt lịch
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
        </div>
    );
};

export default BookAppointment; 