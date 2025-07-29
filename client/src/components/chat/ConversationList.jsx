import React, { useState, useEffect } from 'react';
import {
    List,
    Avatar,
    Badge,
    Typography,
    Space,
    Empty,
    Spin,
    Card,
    Input
} from 'antd';
import {
    UserOutlined,
    MessageOutlined,
    SearchOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import notificationManager from '../../utils/notifications';

const { Text, Title } = Typography;
const { Search } = Input;

const ConversationList = ({ onSelectConversation, selectedConversationId }) => {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [lastConversationCount, setLastConversationCount] = useState(0);

    useEffect(() => {
        loadConversations();
    }, []);

    // Auto-refresh conversations every 30 seconds (further reduced)
    useEffect(() => {
        const interval = setInterval(() => {
            console.log('🔄 Auto-refreshing conversations...');
            loadConversations();
        }, 30000); // Refresh every 30 seconds (reduced from 15)

        return () => clearInterval(interval);
    }, []);

    const loadConversations = async () => {
        try {
            setLoading(true);
            // Try coachToken first, then token as fallback
            const token = localStorage.getItem('coachToken') || localStorage.getItem('token');

            if (!token) {
                console.error('No authentication token found');
                return;
            }

            const response = await axios.get(
                'http://smokeking.wibu.me:4000/api/chat/coach/conversations',
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                const newConversations = response.data.data;

                // Check for new conversations
                if (newConversations.length > lastConversationCount && lastConversationCount > 0) {
                    const newConversationCount = newConversations.length - lastConversationCount;
                    const latestConversation = newConversations[0]; // Assuming sorted by LastMessageAt DESC

                    // Show notification for new conversation
                    if (latestConversation) {
                        notificationManager.showNewConversationNotification(latestConversation.MemberName);
                        notificationManager.playNotificationSound();
                    }
                }

                setConversations(newConversations);
                setLastConversationCount(newConversations.length);
                console.log('Loaded conversations:', newConversations.length);
            } else {
                console.error('Failed to load conversations:', response.data.message);
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
            if (error.response?.status === 401) {
                console.error('Authentication failed - please login again');
            } else if (error.response?.status === 403) {
                console.error('Access forbidden - insufficient permissions');
            }
        } finally {
            setLoading(false);
        }
    };

    const filteredConversations = conversations.filter(conv =>
        conv.MemberName.toLowerCase().includes(searchText.toLowerCase()) ||
        conv.MemberEmail.toLowerCase().includes(searchText.toLowerCase())
    );

    const formatLastMessageTime = (timestamp) => {
        const messageDate = dayjs(timestamp);
        const now = dayjs();

        if (messageDate.isSame(now, 'day')) {
            return messageDate.format('HH:mm');
        } else if (messageDate.isSame(now, 'week')) {
            return messageDate.format('ddd HH:mm');
        } else if (messageDate.isSame(now, 'year')) {
            return messageDate.format('DD/MM');
        } else {
            return messageDate.format('DD/MM/YY');
        }
    };

    const renderConversationItem = (conversation) => {
        const isSelected = conversation.ConversationID === selectedConversationId;
        const hasUnread = conversation.UnreadCount > 0;

        return (
            <List.Item
                key={conversation.ConversationID}
                className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
                    }`}
                onClick={() => onSelectConversation(conversation)}
                style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}
            >
                <List.Item.Meta
                    avatar={
                        <Badge dot={hasUnread} offset={[-5, 5]}>
                            <Avatar
                                size={48}
                                src={conversation.MemberAvatar}
                                icon={<UserOutlined />}
                                style={{
                                    backgroundColor: hasUnread ? '#1890ff' : '#f0f0f0',
                                    color: hasUnread ? 'white' : '#666'
                                }}
                            />
                        </Badge>
                    }
                    title={
                        <div className="flex items-center justify-between">
                            <Text strong={hasUnread} className={hasUnread ? 'text-blue-600' : 'text-gray-800'}>
                                {conversation.MemberName}
                            </Text>
                            <Text type="secondary" className="text-xs">
                                {formatLastMessageTime(conversation.LastMessageAt)}
                            </Text>
                        </div>
                    }
                    description={
                        <div className="flex items-center justify-between">
                            <Text
                                ellipsis={{ rows: 1 }}
                                type="secondary"
                                className={hasUnread ? 'font-medium' : ''}
                                style={{ maxWidth: '200px' }}
                            >
                                {conversation.LastMessageContent || 'Chưa có tin nhắn'}
                            </Text>
                            {hasUnread && (
                                <Badge
                                    count={conversation.UnreadCount}
                                    size="small"
                                    style={{ backgroundColor: '#1890ff' }}
                                />
                            )}
                        </div>
                    }
                />
            </List.Item>
        );
    };

    return (
        <Card
            title={
                <Space>
                    <MessageOutlined />
                    <span>Cuộc trò chuyện</span>
                </Space>
            }
            extra={
                <Badge count={conversations.reduce((acc, conv) => acc + conv.UnreadCount, 0)} />
            }
            bodyStyle={{ padding: 0 }}
        >
            {/* Search Box */}
            <div className="p-4 border-b">
                <Search
                    placeholder="Tìm kiếm thành viên..."
                    allowClear
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    prefix={<SearchOutlined />}
                />
            </div>

            {/* Conversations List */}
            {loading ? (
                <div className="flex justify-center items-center py-8">
                    <Spin />
                </div>
            ) : filteredConversations.length === 0 ? (
                <Empty
                    description={
                        searchText
                            ? "Không tìm thấy cuộc trò chuyện nào"
                            : "Chưa có cuộc trò chuyện nào"
                    }
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    className="py-8"
                />
            ) : (
                <List
                    dataSource={filteredConversations}
                    renderItem={renderConversationItem}
                    style={{ maxHeight: '500px', overflowY: 'auto' }}
                />
            )}
        </Card>
    );
};

export default ConversationList; 