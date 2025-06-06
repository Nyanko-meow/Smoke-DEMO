import React from 'react';
import { Modal, Button, Result, Typography, Space, Tag } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, VideoCameraOutlined, PhoneOutlined, MessageOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

const AppointmentSuccessModal = ({
    visible,
    onClose,
    appointmentData,
    receiverInfo
}) => {
    if (!appointmentData) return null;

    const getTypeIcon = (type) => {
        switch (type) {
            case 'video':
                return <VideoCameraOutlined className="text-purple-500" />;
            case 'audio':
                return <PhoneOutlined className="text-green-500" />;
            default:
                return <MessageOutlined className="text-blue-500" />;
        }
    };

    const getTypeText = (type) => {
        switch (type) {
            case 'video':
                return 'Tư vấn video';
            case 'audio':
                return 'Tư vấn audio';
            default:
                return 'Chat text';
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'video':
                return 'purple';
            case 'audio':
                return 'green';
            default:
                return 'blue';
        }
    };

    return (
        <Modal
            open={visible}
            onCancel={onClose}
            footer={null}
            width={500}
            centered
            style={{
                borderRadius: '16px',
                overflow: 'hidden'
            }}
        >
            <Result
                status="success"
                title={
                    <Title level={3} className="text-green-600 mb-2">
                        Đặt lịch thành công! 🎉
                    </Title>
                }
                subTitle={
                    <Text className="text-gray-600">
                        Lịch tư vấn của bạn đã được tạo thành công. Bạn sẽ nhận được thông báo khi đến giờ hẹn.
                    </Text>
                }
                extra={
                    <div className="space-y-4">
                        {/* Appointment Details Card */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                            <div className="space-y-3">
                                {/* Date & Time */}
                                <div className="flex items-center space-x-3">
                                    <CalendarOutlined className="text-blue-500 text-lg" />
                                    <div>
                                        <Text strong className="text-gray-800">
                                            {dayjs(appointmentData.appointmentDate).format('dddd, DD/MM/YYYY')}
                                        </Text>
                                        <br />
                                        <Text className="text-gray-600">
                                            {dayjs(appointmentData.appointmentDate).format('HH:mm')}
                                        </Text>
                                    </div>
                                </div>

                                {/* Duration */}
                                <div className="flex items-center space-x-3">
                                    <ClockCircleOutlined className="text-orange-500 text-lg" />
                                    <Text className="text-gray-700">
                                        Thời lượng: <strong>{appointmentData.duration} phút</strong>
                                    </Text>
                                </div>

                                {/* Type */}
                                <div className="flex items-center space-x-3">
                                    {getTypeIcon(appointmentData.type)}
                                    <div className="flex items-center space-x-2">
                                        <Text className="text-gray-700">Loại tư vấn:</Text>
                                        <Tag color={getTypeColor(appointmentData.type)} className="font-medium">
                                            {getTypeText(appointmentData.type)}
                                        </Tag>
                                    </div>
                                </div>

                                {/* Coach/Member Info */}
                                {receiverInfo && (
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm font-bold">
                                                {receiverInfo.firstName?.charAt(0) || 'U'}
                                            </span>
                                        </div>
                                        <Text className="text-gray-700">
                                            Với: <strong>{receiverInfo.firstName} {receiverInfo.lastName}</strong>
                                        </Text>
                                    </div>
                                )}

                                {/* Meeting Link (if video/audio) */}
                                {appointmentData.meetingLink && (
                                    <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                                        <Text className="text-sm text-gray-600">
                                            Link cuộc họp sẽ được gửi qua tin nhắn trước giờ hẹn
                                        </Text>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <Space className="w-full justify-center">
                            <Button
                                type="primary"
                                size="large"
                                onClick={onClose}
                                style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    height: '44px',
                                    paddingLeft: '24px',
                                    paddingRight: '24px'
                                }}
                            >
                                Đóng
                            </Button>
                        </Space>
                    </div>
                }
            />
        </Modal>
    );
};

export default AppointmentSuccessModal; 