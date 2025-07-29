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
    Tooltip,
    Upload,
    Image
} from 'antd';
import {
    SendOutlined,
    CalendarOutlined,
    VideoCameraOutlined,
    PhoneOutlined,
    MessageOutlined,
    UserOutlined,
    SmileOutlined,
    PaperClipOutlined,
    FileOutlined,
    DownloadOutlined,
    EyeOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import notificationManager from '../../utils/notifications';

import './ChatBox.css';

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
    height = 400,
    isCoachView = false,
    autoRefresh = true // Add option to disable auto-refresh
}) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sendingMessage, setSendingMessage] = useState(false);

    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [lastMessageCount, setLastMessageCount] = useState(0);
    const [hasNewMessages, setHasNewMessages] = useState(false);
    const messagesEndRef = useRef(null);
    const [form] = Form.useForm();

    useEffect(() => {
        // Request notification permission on component mount
        notificationManager.requestPermission();

        // Get user data from multiple possible sources
        let userData = currentUser;
        if (!userData) {
            // Try to get from localStorage
            const storedUser = localStorage.getItem('user');
            const storedUserData = localStorage.getItem('userData');
            const storedCoachUser = localStorage.getItem('coachUser');

            if (storedUser) {
                try {
                    userData = JSON.parse(storedUser);
                    console.log('Successfully parsed storedUser:', userData);
                } catch (error) {
                    console.error('Failed to parse storedUser:', error);
                    userData = null;
                }
            } else if (storedUserData) {
                try {
                    const parsed = JSON.parse(storedUserData);
                    userData = {
                        userId: parsed.UserID || parsed.userId,
                        UserID: parsed.UserID || parsed.userId,
                        role: 'member',
                        firstName: parsed.FirstName,
                        lastName: parsed.LastName,
                        email: parsed.Email
                    };
                    console.log('Successfully parsed storedUserData:', userData);
                } catch (error) {
                    console.error('Failed to parse storedUserData:', error);
                    userData = null;
                }
            } else if (storedCoachUser) {
                try {
                    const parsed = JSON.parse(storedCoachUser);
                    userData = {
                        userId: parsed.UserID || parsed.userId,
                        UserID: parsed.UserID || parsed.userId,
                        role: 'coach',
                        firstName: parsed.FirstName,
                        lastName: parsed.LastName,
                        email: parsed.Email
                    };
                    console.log('Successfully parsed storedCoachUser:', userData);
                } catch (error) {
                    console.error('Failed to parse storedCoachUser:', error);
                    userData = null;
                }
            }
        }

        // Debug current user
        console.log('🔍 ChatBox userData:', {
            provided: currentUser,
            resolved: userData,
            localStorage: {
                user: localStorage.getItem('user'),
                userData: localStorage.getItem('userData'),
                coachUser: localStorage.getItem('coachUser')
            }
        });

        // Load messages if we have conversationId (coach) or if we're a member (no conversationId needed)
        if (conversationId || userData?.role === 'member') {
            loadMessages();
        }
    }, [conversationId, currentUser]);

    useEffect(() => {
        scrollToBottom();
        // Clear new message indicator when messages are viewed
        if (hasNewMessages) {
            setTimeout(() => setHasNewMessages(false), 2000);
        }
    }, [messages, hasNewMessages]);

    // Auto-refresh messages every 15 seconds (reduced frequency)
    useEffect(() => {
        // Only auto-refresh if enabled and we have a valid context
        if (autoRefresh && (conversationId || currentUser?.role === 'member')) {
            const interval = setInterval(() => {
                console.log('🔄 Auto-refreshing messages...', { conversationId, role: currentUser?.role });
                loadMessages();
            }, 15000); // Refresh every 15 seconds

            return () => {
                if (interval) {
                    clearInterval(interval);
                    console.log('🛑 Cleared auto-refresh interval');
                }
            };
        }
    }, [conversationId, currentUser, autoRefresh]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadMessages = async () => {
        try {
            // Only show loading on first load, not on refresh
            if (messages.length === 0) {
                setLoading(true);
            }

            const token = localStorage.getItem('token') || localStorage.getItem('coachToken');

            // Get current user data
            let userData = currentUser;
            if (!userData) {
                const storedUser = localStorage.getItem('user');
                const storedUserData = localStorage.getItem('userData');
                const storedCoachUser = localStorage.getItem('coachUser');

                if (storedUser) {
                    try {
                        userData = JSON.parse(storedUser);
                        console.log('Successfully parsed storedUser:', userData);
                    } catch (error) {
                        console.error('Failed to parse storedUser:', error);
                        userData = null;
                    }
                } else if (storedUserData) {
                    try {
                        const parsed = JSON.parse(storedUserData);
                        userData = {
                            userId: parsed.UserID || parsed.userId,
                            UserID: parsed.UserID || parsed.userId,
                            role: 'member'
                        };
                        console.log('Successfully parsed storedUserData:', userData);
                    } catch (error) {
                        console.error('Failed to parse storedUserData:', error);
                        userData = null;
                    }
                } else if (storedCoachUser) {
                    try {
                        const parsed = JSON.parse(storedCoachUser);
                        userData = {
                            userId: parsed.UserID || parsed.userId,
                            UserID: parsed.UserID || parsed.userId,
                            role: 'coach'
                        };
                        console.log('Successfully parsed storedCoachUser:', userData);
                    } catch (error) {
                        console.error('Failed to parse storedCoachUser:', error);
                        userData = null;
                    }
                }
            }

            let apiUrl;
            if (conversationId) {
                // Use conversation-based API for coach
                apiUrl = `/api/chat/conversation/${conversationId}/messages`;
            } else {
                // Use member messages API for member
                apiUrl = '/api/chat/member/messages';
            }

            console.log('🔄 Loading messages from:', apiUrl, 'User:', userData);

            const response = await axios.get(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                const newMessages = response.data.data || [];
                console.log('📨 Loaded messages:', newMessages.length);

                // Check for new messages and show notification ONLY from others
                if (newMessages.length > lastMessageCount && lastMessageCount > 0) {
                    // Get current user ID from different possible sources
                    const currentUserId = userData?.userId || userData?.UserID || userData?.id;

                    // Get only the new messages
                    const newMessagesOnly = newMessages.slice(lastMessageCount);

                    // Filter only messages from others (not from current user)
                    const newMessagesFromOthers = newMessagesOnly.filter(msg => msg.SenderID !== currentUserId);

                    console.log('🔔 Checking new messages:', {
                        totalNew: newMessagesOnly.length,
                        fromOthers: newMessagesFromOthers.length,
                        currentUserId: currentUserId,
                        allNewMessages: newMessagesOnly.map(m => ({
                            id: m.MessageID,
                            senderId: m.SenderID,
                            senderName: m.SenderName,
                            content: m.Content,
                            isFromOther: m.SenderID !== currentUserId
                        }))
                    });

                    // Only show notification if there are messages from others
                    if (newMessagesFromOthers.length > 0) {
                        const latestMessageFromOther = newMessagesFromOthers[newMessagesFromOthers.length - 1];

                        console.log('🔔 Showing notification for message from other:', latestMessageFromOther);

                        // Set visual indicator
                        setHasNewMessages(true);

                        // Show in-app notification
                        message.info(`📩 Tin nhắn mới từ ${latestMessageFromOther.SenderName}`, 3);

                        // Show browser notification if tab is not active
                        notificationManager.showNewMessageNotification(
                            latestMessageFromOther.SenderName || 'Người dùng',
                            latestMessageFromOther.Content
                        );
                        notificationManager.playNotificationSound();
                    } else {
                        console.log('🔕 No new messages from others, skipping notification');
                    }
                }

                setMessages(newMessages);
                setLastMessageCount(newMessages.length);
            }
        } catch (error) {
            console.error('❌ Error loading messages:', error);
            // Only show error on first load
            if (messages.length === 0) {
                setMessages([]);
            }
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim()) return;

        try {
            setSendingMessage(true);
            const token = localStorage.getItem('token') || localStorage.getItem('coachToken');

            // Determine which API endpoint to use based on whether we have a conversationId
            let apiUrl;
            let requestData = {
                content: newMessage.trim(),
                messageType: 'text'
            };

            if (conversationId) {
                // Use conversation-based API for coaches with specific conversations
                apiUrl = `/api/chat/conversation/${conversationId}/send`;
            } else {
                // Use the general chat API for members or coaches without specific conversation
                apiUrl = '/api/chat/coach/chat/send';
                // If receiverId is provided (for coach), add it to request data
                if (receiverId) {
                    requestData.memberId = receiverId;
                }
            }

            console.log('🔍 Sending message via:', apiUrl, 'Data:', requestData);

            const response = await axios.post(apiUrl, requestData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

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

            // Create a temporary message for UI feedback
            const currentUserId = currentUser?.userId || currentUser?.UserID || currentUser?.id;
            const tempMessage = {
                MessageID: Date.now(),
                SenderID: currentUserId,
                Content: newMessage.trim(),
                MessageType: 'text',
                CreatedAt: new Date().toISOString(),
                SenderName: currentUser?.firstName + ' ' + currentUser?.lastName,
                SenderRole: currentUser?.role,
                IsRead: false
            };

            setMessages(prev => [...prev, tempMessage]);
            setNewMessage('');

            message.warning('Tin nhắn đã được gửi (chế độ offline)');
        } finally {
            setSendingMessage(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (newMessage.trim()) {
                sendMessage();
            }
        }
    };

    const handleFileUpload = async (file) => {
        try {
            setUploading(true);

            const formData = new FormData();
            formData.append('file', file);
            formData.append('content', `📎 ${file.name}`);
            formData.append('messageType', 'file');

            const token = localStorage.getItem('token') || localStorage.getItem('coachToken');

            let apiUrl;
            if (conversationId) {
                // Send to specific conversation
                apiUrl = `http://smokeking.wibu.me:4000/api/chat/conversation/${conversationId}/send-with-file`;
            } else {
                // Auto-detect receiver (for member to coach)
                apiUrl = 'http://smokeking.wibu.me:4000/api/chat/send-with-file';
                if (receiverId) {
                    formData.append('receiverId', receiverId);
                }
            }

            const response = await axios.post(apiUrl, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // Don't set Content-Type, let browser set it with boundary for multipart
                }
            });

            if (response.data.success) {
                const newMsg = response.data.data;
                setMessages(prev => [...prev, newMsg]);
                message.success(`File ${file.name} đã được gửi thành công`);

                if (onNewMessage) {
                    onNewMessage(newMsg);
                }

                // Scroll to bottom to show new message
                setTimeout(scrollToBottom, 100);
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            if (error.response?.data?.message) {
                message.error(error.response.data.message);
            } else {
                message.error('Không thể gửi file. Vui lòng thử lại!');
            }
        } finally {
            setUploading(false);
        }

        return false; // Prevent default upload behavior
    };

    const sendFileMessage = async (fileInfo) => {
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('coachToken');

            let apiUrl;
            let requestData = {
                content: `📎 ${fileInfo.name}`,
                messageType: 'file',
                fileUrl: fileInfo.url,
                fileName: fileInfo.name,
                fileSize: fileInfo.size,
                fileType: fileInfo.type
            };

            if (conversationId) {
                apiUrl = `http://smokeking.wibu.me:4000/api/chat/conversation/${conversationId}/send`;
            } else {
                apiUrl = 'http://smokeking.wibu.me:4000/api/chat/coach/chat/send';
                if (receiverId) {
                    requestData.memberId = receiverId;
                }
            }

            const response = await axios.post(apiUrl, requestData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                const newMsg = response.data.data;
                setMessages(prev => [...prev, newMsg]);
                console.log('File message sent successfully:', newMsg);

                if (onNewMessage) {
                    onNewMessage(newMsg);
                }
            } else {
                console.warn('File message not sent successfully:', response.data);
                message.warning('Tin nhắn file không được gửi thành công');
            }
        } catch (error) {
            console.error('Error sending file message:', error);
            message.error('Không thể gửi file');
        }
    };

    const removeUploadedFile = (uid) => {
        if (!uid) {
            console.warn('No file UID provided for removal');
            return;
        }
        setUploadedFiles(prev => prev.filter(file => file.uid !== uid));
        console.log(`Removed file with UID: ${uid}`);
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
        const currentUserId = currentUser?.userId || currentUser?.UserID || currentUser?.id;
        const isCurrentUser = msg.SenderID === currentUserId;
        const isSystemMessage = msg.MessageType === 'plan_update';
        const isFileMessage = msg.MessageType === 'file';

        if (isSystemMessage) {
            return (
                <div key={msg.MessageID} className="flex justify-center my-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium shadow-sm border border-blue-100">
                        <CalendarOutlined className="mr-2" />
                        {msg.Content}
                    </div>
                </div>
            );
        }

        return (
            <div key={msg.MessageID} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-3 px-2 message-container`}>
                <div className={`flex items-end max-w-xs lg:max-w-md ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className={`flex-shrink-0 ${isCurrentUser ? 'ml-2' : 'mr-2'}`}>
                        <Avatar
                            size={32}
                            src={msg.SenderAvatar}
                            icon={<UserOutlined />}
                            className="shadow-sm"
                            style={{
                                backgroundColor: isCurrentUser ? '#1890ff' : '#52c41a',
                                border: '2px solid white'
                            }}
                        />
                    </div>

                    {/* Message Content */}
                    <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                        {/* Sender Name (only show for received messages) */}
                        {!isCurrentUser && (
                            <div className="text-xs text-gray-500 mb-1 px-2 font-medium">
                                {msg.SenderName}
                            </div>
                        )}

                        {/* Message Bubble */}
                        <div
                            className={`relative px-4 py-2 rounded-2xl shadow-sm max-w-full message-bubble ${isCurrentUser
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md'
                                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                                }`}
                            style={{
                                wordBreak: 'break-word',
                                boxShadow: isCurrentUser
                                    ? '0 2px 8px rgba(24, 144, 255, 0.3)'
                                    : '0 2px 8px rgba(0, 0, 0, 0.1)'
                            }}
                        >
                            {/* Message tail */}
                            <div
                                className={`absolute w-0 h-0 ${isCurrentUser
                                    ? 'right-0 bottom-0 border-l-8 border-t-8 border-l-transparent border-t-blue-600'
                                    : 'left-0 bottom-0 border-r-8 border-t-8 border-r-transparent border-t-white'
                                    }`}
                                style={{
                                    transform: isCurrentUser ? 'translateX(6px)' : 'translateX(-6px)'
                                }}
                            />

                            {isFileMessage ? (
                                <div className="file-message">
                                    <div className="flex items-center space-x-3 p-2">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isCurrentUser ? 'bg-white bg-opacity-20' : 'bg-blue-50'
                                            }`}>
                                            {msg.MimeType?.startsWith('image/') ? (
                                                <EyeOutlined className={isCurrentUser ? 'text-white' : 'text-blue-500'} />
                                            ) : (
                                                <FileOutlined className={isCurrentUser ? 'text-white' : 'text-blue-500'} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`font-medium text-sm ${isCurrentUser ? 'text-white' : 'text-gray-800'}`}>
                                                {msg.FileName || 'File đính kèm'}
                                            </div>
                                            <div className={`text-xs ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'}`}>
                                                {msg.FileSize ? `${(msg.FileSize / 1024).toFixed(1)} KB` : 'Unknown size'}
                                            </div>
                                        </div>
                                        <div className="flex space-x-1">
                                            {msg.MimeType?.startsWith('image/') && (
                                                <Button
                                                    type="text"
                                                    size="small"
                                                    icon={<EyeOutlined />}
                                                    className={isCurrentUser ? 'text-white hover:bg-white hover:bg-opacity-20' : 'text-blue-500 hover:bg-blue-50'}
                                                    onClick={() => {
                                                        const imageUrl = msg.FileURL?.startsWith('http') ? msg.FileURL : `http://smokeking.wibu.me:4000${msg.FileURL}`;
                                                        Modal.info({
                                                            title: msg.FileName,
                                                            content: <Image src={imageUrl} alt={msg.FileName} />,
                                                            width: 600,
                                                            footer: null
                                                        });
                                                    }}
                                                />
                                            )}
                                            <Button
                                                type="text"
                                                size="small"
                                                icon={<DownloadOutlined />}
                                                className={isCurrentUser ? 'text-white hover:bg-white hover:bg-opacity-20' : 'text-blue-500 hover:bg-blue-50'}
                                                onClick={() => {
                                                    const fileUrl = msg.FileURL?.startsWith('http') ? msg.FileURL : `http://smokeking.wibu.me:4000${msg.FileURL}`;
                                                    const link = document.createElement('a');
                                                    link.href = fileUrl;
                                                    link.download = msg.FileName;
                                                    link.click();
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="whitespace-pre-wrap break-words leading-relaxed">
                                    {msg.Content}
                                </div>
                            )}
                        </div>

                        {/* Timestamp */}
                        <div className={`text-xs text-gray-400 mt-1 px-2 message-time ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                            {formatMessageTime(msg.CreatedAt)}
                            {isCurrentUser && (
                                <span className="ml-1">
                                    {msg.IsRead ? (
                                        <span className="text-blue-400">✓✓</span>
                                    ) : (
                                        <span className="text-gray-400">✓</span>
                                    )}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Card
            title={
                <div className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <Avatar
                                size={40}
                                src={receiverInfo?.Avatar || receiverInfo?.MemberAvatar}
                                icon={<UserOutlined />}
                                className="shadow-md"
                                style={{
                                    backgroundColor: '#52c41a',
                                    border: '2px solid white'
                                }}
                            />
                            {/* Online status indicator */}
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full online-indicator"></div>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-white text-base">
                                {receiverInfo?.FullName || receiverInfo?.MemberName || receiverInfo?.CoachName}
                            </span>
                            <span className="text-xs text-blue-100 font-medium">Đang hoạt động</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Tooltip title="Cuộc gọi video">
                            <Button
                                type="text"
                                shape="circle"
                                icon={<VideoCameraOutlined />}
                                className="hover:bg-white hover:bg-opacity-20 hover:text-white action-button text-white"
                            />
                        </Tooltip>
                        <Tooltip title="Cuộc gọi thoại">
                            <Button
                                type="text"
                                shape="circle"
                                icon={<PhoneOutlined />}
                                className="hover:bg-white hover:bg-opacity-20 hover:text-white action-button text-white"
                            />
                        </Tooltip>
                        <Tooltip title="Làm mới tin nhắn">
                            <Button
                                type="text"
                                shape="circle"
                                icon={<ReloadOutlined />}
                                onClick={loadMessages}
                                loading={loading}
                                className="hover:bg-white hover:bg-opacity-20 hover:text-white action-button text-white"
                            />
                        </Tooltip>

                    </div>
                </div>
            }
            className="chat-card"
            style={{
                ...style,
                height: height,
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}
            headStyle={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '16px 16px 0 0'
            }}
            bodyStyle={{ padding: 0 }}
        >
            {/* Messages Container */}
            <div
                className="chat-messages"
                style={{
                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
            >
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="bg-white rounded-lg p-6 shadow-lg">
                            <Spin size="large" />
                            <div className="mt-3 text-gray-600">Đang tải tin nhắn...</div>
                        </div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="text-center bg-white rounded-lg p-8 shadow-lg mx-4">
                            <div className="text-6xl mb-4">💬</div>
                            <div className="text-gray-600 text-lg font-medium mb-2">Chưa có tin nhắn nào</div>
                            <div className="text-gray-400 text-sm">Hãy bắt đầu cuộc trò chuyện!</div>
                        </div>
                    </div>
                ) : (
                    <div className="py-4">
                        {messages.map(renderMessage)}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Message Input */}
            {isCoachView ? (
                // Coach input layout with send button at bottom
                <div className="coach-chat-input-container">
                    <div className="coach-input-row">
                        <div className="coach-input-wrapper">
                            {/* Left side icons */}
                            <div className="coach-input-icons">
                                <Tooltip title="Đính kèm file">
                                    <Upload
                                        beforeUpload={handleFileUpload}
                                        showUploadList={false}
                                        accept="*"
                                        multiple={false}
                                    >
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<PaperClipOutlined />}
                                            className="coach-file-upload text-gray-400 hover:text-blue-500"
                                            style={{ padding: '4px' }}
                                            loading={uploading}
                                        />
                                    </Upload>
                                </Tooltip>
                                <Tooltip title="Emoji">
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<SmileOutlined />}
                                        className="text-gray-400 hover:text-yellow-500"
                                        style={{ padding: '4px' }}
                                    />
                                </Tooltip>
                            </div>

                            <TextArea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Nhập tin nhắn cho thành viên..."
                                autoSize={{ minRows: 2, maxRows: 6 }}
                                disabled={sendingMessage}
                                className="coach-textarea"
                            />
                        </div>
                    </div>

                    {/* Send button row */}
                    <div className="coach-send-button-row">
                        {sendingMessage && (
                            <div className="flex items-center text-gray-500 text-sm">
                                <div className="flex space-x-1 mr-2">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                                </div>
                                Đang gửi...
                            </div>
                        )}
                        <Button
                            type="primary"
                            icon={<SendOutlined />}
                            onClick={sendMessage}
                            loading={sendingMessage}
                            disabled={!newMessage.trim()}
                            className={`coach-send-button ${sendingMessage ? 'loading' : ''}`}
                        >
                            Gửi tin nhắn
                        </Button>
                    </div>
                </div>
            ) : (
                // Member input layout with embedded send button
                <div className="member-chat-input-container">
                    <div className="chat-input-container relative">
                        {/* Left side icons */}
                        <div className="input-left-icons">
                            <Tooltip title="Đính kèm file">
                                <Upload
                                    beforeUpload={handleFileUpload}
                                    showUploadList={false}
                                    accept="*"
                                    multiple={false}
                                >
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<PaperClipOutlined />}
                                        className="input-icon-button text-gray-400 hover:text-blue-500"
                                        style={{ padding: '4px' }}
                                        loading={uploading}
                                    />
                                </Upload>
                            </Tooltip>
                            <Tooltip title="Emoji">
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<SmileOutlined />}
                                    className="input-icon-button text-gray-400 hover:text-yellow-500"
                                    style={{ padding: '4px' }}
                                />
                            </Tooltip>
                        </div>

                        <TextArea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Nhập tin nhắn..."
                            autoSize={{ minRows: 1, maxRows: 4 }}
                            disabled={sendingMessage}
                            className="resize-none chat-input"
                            style={{
                                borderRadius: '25px',
                                border: '1px solid #e8e8e8',
                                padding: '12px 50px 12px 70px',
                                fontSize: '14px',
                                lineHeight: '1.4',
                                boxShadow: 'none',
                                width: '100%'
                            }}
                        />

                        <Button
                            type="primary"
                            shape="circle"
                            size="small"
                            icon={<SendOutlined />}
                            onClick={sendMessage}
                            loading={sendingMessage}
                            disabled={!newMessage.trim()}
                            className={`embedded-send-button ${newMessage.trim() ? 'active send-button-active' : 'inactive'}`}
                            style={{
                                width: '36px',
                                height: '36px',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        />
                    </div>

                    {/* Typing indicator placeholder */}
                    {sendingMessage && (
                        <div className="flex items-center mt-2 text-gray-500 text-sm">
                            <div className="flex space-x-1 mr-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                            </div>
                            Đang gửi...
                        </div>
                    )}
                </div>
            )}


        </Card>
    );
};

export default ChatBox; 