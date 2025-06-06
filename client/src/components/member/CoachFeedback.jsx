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
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Title level={2} className="mb-2 text-gray-800">
                        <StarOutlined className="mr-3 text-yellow-500" />
                        Đánh giá Coach
                    </Title>
                    <Text className="text-gray-600">
                        Đánh giá các buổi tư vấn đã hoàn thành để giúp cải thiện dịch vụ
                    </Text>
                </div>

                {/* Completed Appointments List */}
                <Card
                    className="shadow-lg"
                    style={{ borderRadius: '12px' }}
                    bodyStyle={{ padding: '24px' }}
                >
                    <List
                        loading={loading}
                        dataSource={completedAppointments}
                        locale={{
                            emptyText: (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={
                                        <div>
                                            <p>Chưa có buổi tư vấn nào đã hoàn thành</p>
                                            <Text type="secondary" className="text-sm">
                                                Sau khi hoàn thành buổi tư vấn với coach, bạn có thể đánh giá tại đây
                                            </Text>
                                        </div>
                                    }
                                />
                            )
                        }}
                        renderItem={(appointment) => (
                            <List.Item
                                key={appointment.id}
                                className="border-b border-gray-100 py-4"
                                actions={[
                                    <Button
                                        key="feedback-btn"
                                        type="primary"
                                        icon={<StarOutlined />}
                                        onClick={() => handleFeedback(appointment)}
                                        style={{
                                            background: 'linear-gradient(135deg, #faad14 0%, #fa8c16 100%)',
                                            border: 'none',
                                            borderRadius: '8px'
                                        }}
                                    >
                                        Đánh giá
                                    </Button>
                                ]}
                            >
                                <List.Item.Meta
                                    avatar={
                                        <Avatar
                                            size={48}
                                            src={appointment.coach?.avatar}
                                            icon={<UserOutlined />}
                                            className="border-2 border-yellow-100"
                                        />
                                    }
                                    title={
                                        <div className="flex items-center space-x-3">
                                            <span className="font-semibold text-lg">
                                                Coach {appointment.coach?.fullName}
                                            </span>
                                            <Tag icon={<CheckCircleOutlined />} color="success">
                                                Đã hoàn thành
                                            </Tag>
                                        </div>
                                    }
                                    description={
                                        <div className="space-y-2">
                                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                <span>📅 {dayjs(appointment.appointmentDate).format('DD/MM/YYYY HH:mm')}</span>
                                                <span>⏱️ {appointment.duration} phút</span>
                                                <span>💬 {appointment.type === 'video' ? 'Video call' : appointment.type === 'audio' ? 'Audio call' : 'Chat'}</span>
                                            </div>
                                            {appointment.notes && (
                                                <div className="text-sm text-gray-500">
                                                    <strong>Ghi chú:</strong> {appointment.notes}
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
                        <div className="flex items-center space-x-3 py-2">
                            <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                                <StarOutlined className="text-white text-lg" />
                            </div>
                            <div>
                                <div className="text-lg font-semibold text-gray-800">
                                    Đánh giá Coach {selectedAppointment?.coach?.fullName}
                                </div>
                                <div className="text-sm text-gray-500">
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
                    width={600}
                    style={{ borderRadius: '16px' }}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={submitFeedback}
                        className="space-y-4"
                    >
                        {/* Overall Rating */}
                        <Form.Item
                            name="rating"
                            label={<span className="font-medium text-gray-700">Đánh giá tổng thể</span>}
                            rules={[{ required: true, message: 'Vui lòng đánh giá' }]}
                        >
                            <Rate
                                style={{ fontSize: '32px' }}
                                character={<StarOutlined />}
                                className="text-yellow-400"
                            />
                        </Form.Item>

                        {/* Category Ratings */}
                        <div className="grid grid-cols-2 gap-4">
                            <Form.Item
                                name="professionalism"
                                label="Tính chuyên nghiệp"
                                initialValue={5}
                            >
                                <Rate style={{ fontSize: '20px' }} />
                            </Form.Item>
                            <Form.Item
                                name="helpfulness"
                                label="Tính hữu ích"
                                initialValue={5}
                            >
                                <Rate style={{ fontSize: '20px' }} />
                            </Form.Item>
                            <Form.Item
                                name="communication"
                                label="Kỹ năng giao tiếp"
                                initialValue={5}
                            >
                                <Rate style={{ fontSize: '20px' }} />
                            </Form.Item>
                            <Form.Item
                                name="knowledge"
                                label="Kiến thức chuyên môn"
                                initialValue={5}
                            >
                                <Rate style={{ fontSize: '20px' }} />
                            </Form.Item>
                        </div>

                        {/* Comment */}
                        <Form.Item
                            name="comment"
                            label={<span className="font-medium text-gray-700">Nhận xét chi tiết</span>}
                        >
                            <TextArea
                                rows={4}
                                placeholder="Chia sẻ trải nghiệm của bạn về buổi tư vấn..."
                                style={{ borderRadius: '8px' }}
                            />
                        </Form.Item>

                        <Form.Item className="mb-0 pt-4">
                            <div className="flex justify-end space-x-3">
                                <Button
                                    onClick={() => setFeedbackModal(false)}
                                    style={{ height: '44px', borderRadius: '8px' }}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={submitting}
                                    style={{
                                        background: 'linear-gradient(135deg, #faad14 0%, #fa8c16 100%)',
                                        border: 'none',
                                        height: '44px',
                                        borderRadius: '8px'
                                    }}
                                >
                                    Gửi đánh giá
                                </Button>
                            </div>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </div>
    );
};

export default CoachFeedback; 