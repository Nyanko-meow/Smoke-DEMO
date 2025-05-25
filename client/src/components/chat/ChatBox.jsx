import React, { useState, useEffect, useRef } from 'react';
import {
    Card,
    Input,
    Button,
    List,
    Typography,
    Avatar,
    Divider,
    Space,
    Badge,
    Empty,
    Spin,
    message,
    Modal,
    Form,
    DatePicker,
    Select,
    Tooltip
} from 'antd';
import {
    SendOutlined,
    CalendarOutlined,
    VideoCameraOutlined,
    PhoneOutlined,
    MessageOutlined,
    UserOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Text, Title } = Typography;
const { Option } = Select;

const ChatBox = ({
    conversationId,
    receiverId,
    receiverInfo,
    currentUser,
    onNewMessage,
    style,
    height = 400
}) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const messagesEndRef = useRef(null);
    const [form] = Form.useForm();

    useEffect(() => {
        if (conversationId) {
            loadMessages();
        }
    }, [conversationId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadMessages = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token') || localStorage.getItem('coachToken');

            const response = await axios.get(
                `http://localhost:4000/api/chat/conversation/${conversationId}/messages`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                setMessages(response.data.data);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
            message.error('Không thể tải tin nhắn');
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !receiverId) return;

        try {
            setSendingMessage(true);
            const token = localStorage.getItem('token') || localStorage.getItem('coachToken');

            const response = await axios.post(
                'http://localhost:4000/api/chat/send',
                {
                    receiverId,
                    content: newMessage.trim(),
                    messageType: 'text'
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                const newMsg = response.data.data;
                setMessages(prev => [...prev, newMsg]);
                setNewMessage('');

                // Notify parent component about new message
                if (onNewMessage) {
                    onNewMessage(newMsg);
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
            message.error('Không thể gửi tin nhắn');
        } finally {
            setSendingMessage(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const createAppointment = async (values) => {
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('coachToken');

            const response = await axios.post(
                'http://localhost:4000/api/chat/appointment',
                {
                    receiverId,
                    appointmentDate: values.appointmentDate.toISOString(),
                    duration: values.duration,
                    type: values.type,
                    notes: values.notes
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                message.success('Lịch tư vấn đã được đặt thành công');
                setShowAppointmentModal(false);
                form.resetFields();
                // Reload messages to see the appointment notification
                loadMessages();
            }
        } catch (error) {
            console.error('Error creating appointment:', error);
            message.error('Không thể đặt lịch tư vấn');
        }
    };

    const formatMessageTime = (timestamp) => {
        const messageDate = dayjs(timestamp);
        const now = dayjs();

        if (messageDate.isSame(now, 'day')) {
            return messageDate.format('HH:mm');
        } else if (messageDate.isSame(now, 'year')) {
            return messageDate.format('DD/MM HH:mm');
        } else {
            return messageDate.format('DD/MM/YYYY HH:mm');
        }
    };

    const getMessageTypeIcon = (messageType) => {
        switch (messageType) {
            case 'plan_update':
                return <CalendarOutlined style={{ color: '#1890ff' }} />;
            default:
                return null;
        }
    };

    const renderMessage = (msg) => {
        const isCurrentUser = msg.SenderID === currentUser?.userId;
        const isSystemMessage = msg.MessageType === 'plan_update';

        if (isSystemMessage) {
            return (
                <div key={msg.MessageID} className="text-center my-4">
                    <div className="inline-block bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-sm">
                        <CalendarOutlined className="mr-2" />
                        {msg.Content}
                    </div>
                </div>
            );
        }

        return (
            <div key={msg.MessageID} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
                <div className={`flex items-start max-w-xs lg:max-w-md ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    <Avatar
                        size="small"
                        src={msg.SenderAvatar}
                        icon={<UserOutlined />}
                        className={isCurrentUser ? 'ml-2' : 'mr-2'}
                    />
                    <div className={`${isCurrentUser ? 'text-right' : 'text-left'}`}>
                        <div className={`inline-block px-3 py-2 rounded-lg ${isCurrentUser
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-800'
                            }`}>
                            <div className="whitespace-pre-wrap break-words">
                                {msg.Content}
                            </div>
                        </div>
                        <div className={`text-xs text-gray-500 mt-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                            {formatMessageTime(msg.CreatedAt)}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Card
            title={
                <div className="flex items-center justify-between">
                    <Space>
                        <MessageOutlined />
                        <span>Chat với {receiverInfo?.FullName || receiverInfo?.MemberName || receiverInfo?.CoachName}</span>
                    </Space>
                    <Button
                        type="primary"
                        size="small"
                        icon={<CalendarOutlined />}
                        onClick={() => setShowAppointmentModal(true)}
                    >
                        Đặt lịch
                    </Button>
                </div>
            }
            style={style}
            bodyStyle={{ padding: 0 }}
        >
            {/* Messages Container */}
            <div
                className="px-4 py-2 overflow-y-auto"
                style={{ height: height - 120 }}
            >
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <Spin />
                    </div>
                ) : messages.length === 0 ? (
                    <Empty
                        description="Chưa có tin nhắn nào"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                ) : (
                    <>
                        {messages.map(renderMessage)}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            <Divider style={{ margin: 0 }} />

            {/* Message Input */}
            <div className="p-4">
                <div className="flex space-x-2">
                    <TextArea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Nhập tin nhắn..."
                        autoSize={{ minRows: 1, maxRows: 3 }}
                        disabled={sendingMessage}
                        className="flex-1"
                    />
                    <Button
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={sendMessage}
                        loading={sendingMessage}
                        disabled={!newMessage.trim()}
                    >
                        Gửi
                    </Button>
                </div>
            </div>

            {/* Appointment Modal */}
            <Modal
                title="Đặt lịch tư vấn"
                open={showAppointmentModal}
                onCancel={() => setShowAppointmentModal(false)}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={createAppointment}
                >
                    <Form.Item
                        name="appointmentDate"
                        label="Thời gian tư vấn"
                        rules={[{ required: true, message: 'Vui lòng chọn thời gian' }]}
                    >
                        <DatePicker
                            showTime
                            format="DD/MM/YYYY HH:mm"
                            placeholder="Chọn ngày và giờ"
                            disabledDate={(current) => current && current < dayjs().endOf('day')}
                            style={{ width: '100%' }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="duration"
                        label="Thời lượng (phút)"
                        initialValue={30}
                        rules={[{ required: true, message: 'Vui lòng chọn thời lượng' }]}
                    >
                        <Select>
                            <Option value={15}>15 phút</Option>
                            <Option value={30}>30 phút</Option>
                            <Option value={45}>45 phút</Option>
                            <Option value={60}>60 phút</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="type"
                        label="Loại tư vấn"
                        initialValue="chat"
                        rules={[{ required: true, message: 'Vui lòng chọn loại tư vấn' }]}
                    >
                        <Select>
                            <Option value="chat">
                                <MessageOutlined className="mr-2" />
                                Chat text
                            </Option>
                            <Option value="audio">
                                <PhoneOutlined className="mr-2" />
                                Tư vấn audio
                            </Option>
                            <Option value="video">
                                <VideoCameraOutlined className="mr-2" />
                                Tư vấn video
                            </Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="notes"
                        label="Ghi chú"
                    >
                        <TextArea
                            rows={3}
                            placeholder="Ghi chú về nội dung tư vấn..."
                        />
                    </Form.Item>

                    <Form.Item className="mb-0">
                        <Space>
                            <Button onClick={() => setShowAppointmentModal(false)}>
                                Hủy
                            </Button>
                            <Button type="primary" htmlType="submit">
                                Đặt lịch
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

export default ChatBox; 