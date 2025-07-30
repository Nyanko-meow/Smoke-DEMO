import React, { useState, useEffect } from 'react';
import {
    Modal,
    Rate,
    Input,
    Button,
    Form,
    message,
    Card,
    List,
    Tag,
    Empty,
    Avatar,
    Typography
} from 'antd';
import {
    StarOutlined,
    UserOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Title, Text } = Typography;

const CoachFeedback = () => {
    const [completedAppointments, setCompletedAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [feedbackModal, setFeedbackModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        loadCompletedAppointments();
    }, []);

    const loadCompletedAppointments = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            // Lấy appointments đã completed và chưa có feedback
            const response = await axios.get('http://localhost:4000/api/chat/appointments/completed', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                setCompletedAppointments(response.data.data);
                console.log('✅ Loaded completed appointments:', response.data.data);
            }
        } catch (error) {
            console.error('❌ Error loading completed appointments:', error);
            message.error('Không thể tải danh sách lịch hẹn đã hoàn thành');
        } finally {
            setLoading(false);
        }
    };

    const handleFeedback = (appointment) => {
        setSelectedAppointment(appointment);
        setFeedbackModal(true);
        form.resetFields();
    };

    const submitFeedback = async (values) => {
        try {
            setSubmitting(true);
            const token = localStorage.getItem('token');

            const feedbackData = {
                coachId: selectedAppointment.coach.id,
                appointmentId: selectedAppointment.id,
                rating: values.rating,
                comment: values.comment || '',
                categories: {
                    professionalism: values.professionalism || 5,
                    helpfulness: values.helpfulness || 5,
                    communication: values.communication || 5,
                    knowledge: values.knowledge || 5
                },
                isAnonymous: false
            };

            console.log('📝 Submitting feedback:', feedbackData);

            const response = await axios.post('http://localhost:4000/api/chat/feedback', feedbackData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                message.success('Cảm ơn bạn đã đánh giá coach! 🌟');
                setFeedbackModal(false);
                form.resetFields();
                setSelectedAppointment(null);
                // Reload để remove appointment đã feedback
                loadCompletedAppointments();
            }
        } catch (error) {
            console.error('❌ Error submitting feedback:', error);
            message.error('Không thể gửi đánh giá. Vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
    };

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
                        <StarOutlined style={{ fontSize: '32px', color: 'white' }} />
                    </div>
                    <Title level={1} style={{ color: 'white', marginBottom: '8px', fontWeight: 700 }}>
                        Đánh giá Coach
                    </Title>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px' }}>
                        Đánh giá các buổi tư vấn đã hoàn thành để giúp cải thiện dịch vụ
                    </Text>
                </div>

                {/* Completed Appointments List */}
                <Card
                    className="shadow-2xl transform hover:shadow-3xl transition-all duration-300"
                    style={{
                        borderRadius: '20px',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        overflow: 'hidden'
                    }}
                    bodyStyle={{ padding: '32px' }}
                >
                    <div className="mb-6">
                        <Title level={3} style={{ margin: 0, color: '#1f2937' }}>
                            ⭐ Cuộc hẹn đã hoàn thành
                        </Title>
                        <Text style={{ color: '#6b7280', fontSize: '14px' }}>
                            Chia sẻ trải nghiệm để giúp coach cải thiện chất lượng dịch vụ
                        </Text>
                    </div>

                    <List
                        loading={loading}
                        dataSource={completedAppointments}
                        locale={{
                            emptyText: (
                                <div className="py-12">
                                    <div
                                        className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
                                        style={{
                                            background: 'linear-gradient(135deg, #faad14 0%, #fa8c16 100%)',
                                            color: 'white'
                                        }}
                                    >
                                        <StarOutlined style={{ fontSize: '32px' }} />
                                    </div>
                                    <Title level={4} style={{ color: '#6b7280', marginBottom: '8px' }}>
                                        Chưa có buổi tư vấn nào đã hoàn thành
                                    </Title>
                                    <Text style={{ color: '#9ca3af', fontSize: '14px' }}>
                                        Sau khi hoàn thành buổi tư vấn với coach, bạn có thể đánh giá tại đây
                                    </Text>
                                </div>
                            )
                        }}
                        renderItem={(appointment) => (
                            <List.Item
                                key={appointment.id}
                                className="border-0 py-4 px-6 mb-4 rounded-xl transition-all duration-300 hover:shadow-md"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.6)',
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                    backdropFilter: 'blur(10px)'
                                }}
                                actions={[
                                    <Button
                                        key="feedback-btn"
                                        type="primary"
                                        size="large"
                                        icon={<StarOutlined />}
                                        onClick={() => handleFeedback(appointment)}
                                        style={{
                                            background: 'linear-gradient(135deg, #faad14 0%, #fa8c16 100%)',
                                            border: 'none',
                                            borderRadius: '12px',
                                            height: '44px',
                                            paddingLeft: '20px',
                                            paddingRight: '20px',
                                            fontWeight: 600,
                                            boxShadow: '0 4px 16px rgba(250, 173, 20, 0.3)'
                                        }}
                                        className="hover:shadow-lg transition-all duration-300"
                                    >
                                        ⭐ Đánh giá
                                    </Button>
                                ]}
                            >
                                <List.Item.Meta
                                    avatar={
                                        <div className="relative">
                                            <Avatar
                                                size={56}
                                                src={appointment.coach?.avatar}
                                                icon={<UserOutlined />}
                                                style={{
                                                    border: '3px solid #faad14',
                                                    boxShadow: '0 4px 12px rgba(250, 173, 20, 0.3)'
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
                                    }
                                    title={
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <span className="font-bold text-lg" style={{ color: '#1f2937' }}>
                                                    Coach {appointment.coach?.fullName}
                                                </span>
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <CheckCircleOutlined style={{ fontSize: '12px', marginRight: '4px' }} />
                                                    Hoàn thành
                                                </span>
                                            </div>
                                        </div>
                                    }
                                    description={
                                        <div className="space-y-3 mt-2">
                                            <div className="flex flex-wrap gap-4">
                                                <div className="flex items-center space-x-2">
                                                    <div
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                                                        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                                                    >
                                                        <span style={{ fontSize: '12px' }}>📅</span>
                                                    </div>
                                                    <Text style={{ color: '#374151', fontWeight: 500 }}>
                                                        {dayjs(appointment.appointmentDate).format('DD/MM/YYYY HH:mm')}
                                                    </Text>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <div
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                                                        style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
                                                    >
                                                        <span style={{ fontSize: '12px' }}>⏱️</span>
                                                    </div>
                                                    <Text style={{ color: '#374151', fontWeight: 500 }}>
                                                        {appointment.duration} phút
                                                    </Text>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <div
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                                                        style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}
                                                    >
                                                        <span style={{ fontSize: '12px' }}>💬</span>
                                                    </div>
                                                    <Text style={{ color: '#374151', fontWeight: 500 }}>
                                                        {appointment.type === 'video' ? 'Video call' :
                                                            appointment.type === 'audio' ? 'Audio call' : 'Chat'}
                                                    </Text>
                                                </div>
                                            </div>
                                            {appointment.notes && (
                                                <div
                                                    className="p-3 rounded-lg"
                                                    style={{ background: 'rgba(102, 126, 234, 0.1)' }}
                                                >
                                                    <Text style={{ color: '#4c1d95', fontSize: '14px' }}>
                                                        <strong>📝 Ghi chú:</strong> {appointment.notes}
                                                    </Text>
                                                </div>
                                            )}
                                        </div>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                </Card>

                {/* Feedback Modal */}
                <Modal
                    title={
                        <div
                            className="flex items-center space-x-4 py-4"
                            style={{
                                background: 'linear-gradient(135deg, #faad14 0%, #fa8c16 100%)',
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
                                <StarOutlined style={{ fontSize: '20px', color: 'white' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
                                    Đánh giá Coach {selectedAppointment?.coach?.fullName}
                                </div>
                                <div style={{ fontSize: '14px', opacity: 0.8 }}>
                                    Buổi tư vấn ngày {selectedAppointment && dayjs(selectedAppointment.appointmentDate).format('DD/MM/YYYY')}
                                </div>
                            </div>
                        </div>
                    }
                    open={feedbackModal}
                    onCancel={() => {
                        setFeedbackModal(false);
                        form.resetFields();
                        setSelectedAppointment(null);
                    }}
                    footer={null}
                    width={700}
                    style={{ borderRadius: '20px' }}
                    bodyStyle={{ padding: '32px' }}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={submitFeedback}
                        className="space-y-6"
                    >
                        {/* Overall Rating */}
                        <Form.Item
                            name="rating"
                            label={<span style={{ fontWeight: 600, color: '#374151', fontSize: '16px' }}>⭐ Đánh giá tổng thể</span>}
                            rules={[{ required: true, message: 'Vui lòng đánh giá' }]}
                        >
                            <div className="text-center p-6 rounded-xl" style={{ background: 'rgba(250, 173, 20, 0.1)' }}>
                                <Rate
                                    style={{ fontSize: '40px' }}
                                    character={<StarOutlined />}
                                    className="text-yellow-400"
                                />
                                <div className="mt-4">
                                    <Text style={{ color: '#92400e', fontSize: '14px' }}>
                                        Nhấp vào sao để đánh giá từ 1-5 ⭐
                                    </Text>
                                </div>
                            </div>
                        </Form.Item>

                        {/* Category Ratings */}
                        <div>
                            <Title level={5} style={{ color: '#374151', marginBottom: '16px' }}>
                                📊 Đánh giá chi tiết
                            </Title>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { name: 'professionalism', label: 'Tính chuyên nghiệp', icon: '🎯' },
                                    { name: 'helpfulness', label: 'Tính hữu ích', icon: '🤝' },
                                    { name: 'communication', label: 'Kỹ năng giao tiếp', icon: '💬' },
                                    { name: 'knowledge', label: 'Kiến thức chuyên môn', icon: '🧠' }
                                ].map((category) => (
                                    <Form.Item
                                        key={category.name}
                                        name={category.name}
                                        label={
                                            <span style={{ fontWeight: 500, color: '#6b7280' }}>
                                                {category.icon} {category.label}
                                            </span>
                                        }
                                        initialValue={5}
                                    >
                                        <div
                                            className="p-4 rounded-lg"
                                            style={{ background: 'rgba(255, 255, 255, 0.6)' }}
                                        >
                                            <Rate style={{ fontSize: '24px' }} />
                                        </div>
                                    </Form.Item>
                                ))}
                            </div>
                        </div>

                        {/* Comment */}
                        <Form.Item
                            name="comment"
                            label={<span style={{ fontWeight: 600, color: '#374151', fontSize: '16px' }}>💭 Nhận xét chi tiết</span>}
                        >
                            <TextArea
                                rows={5}
                                placeholder="Chia sẻ trải nghiệm của bạn về buổi tư vấn... Coach đã hỗ trợ bạn như thế nào?"
                                style={{
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    border: '2px solid #e5e7eb'
                                }}
                            />
                        </Form.Item>

                        <Form.Item className="mb-0 pt-4">
                            <div className="flex justify-end space-x-4">
                                <Button
                                    onClick={() => setFeedbackModal(false)}
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
                                        background: 'linear-gradient(135deg, #faad14 0%, #fa8c16 100%)',
                                        border: 'none',
                                        height: '48px',
                                        borderRadius: '12px',
                                        paddingLeft: '32px',
                                        paddingRight: '32px',
                                        fontWeight: 600,
                                        boxShadow: '0 4px 16px rgba(250, 173, 20, 0.4)'
                                    }}
                                >
                                    ⭐ {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                                </Button>
                            </div>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>

            <style>{`
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
                
                .ant-rate-star {
                    margin-right: 8px !important;
                }
                
                .ant-rate-star-full .ant-rate-star-first,
                .ant-rate-star-full .ant-rate-star-second {
                    color: #faad14 !important;
                }
                
                .ant-rate-star-half .ant-rate-star-first {
                    color: #faad14 !important;
                }
                
                .ant-input,
                .ant-input:focus {
                    border-radius: 12px !important;
                    transition: all 0.3s ease !important;
                }
                
                .ant-input:hover {
                    border-color: #faad14 !important;
                }
                
                .ant-input:focus {
                    border-color: #faad14 !important;
                    box-shadow: 0 0 0 2px rgba(250, 173, 20, 0.2) !important;
                }
            `}</style>
        </div>
    );
};

export default CoachFeedback; 