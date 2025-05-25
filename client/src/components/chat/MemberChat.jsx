import React, { useState, useEffect } from 'react';
import { Card, Alert, Spin, Button, Space, Typography } from 'antd';
import { MessageOutlined, UserOutlined } from '@ant-design/icons';
import ChatBox from './ChatBox';
import axios from 'axios';

const { Text, Title } = Typography;

const MemberChat = ({ style, height = 400 }) => {
    const [conversationData, setConversationData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        // Get current user info from localStorage
        const userData = localStorage.getItem('userData');
        if (userData) {
            try {
                const parsedData = JSON.parse(userData);
                setCurrentUser({
                    userId: parsedData.UserID || parsedData.userId,
                    role: 'member',
                    name: `${parsedData.FirstName} ${parsedData.LastName}`,
                    email: parsedData.Email
                });
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }

        loadConversation();
    }, []);

    const loadConversation = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');

            const response = await axios.get(
                'http://localhost:4000/api/chat/member/conversation',
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                setConversationData(response.data.data);
            }
        } catch (error) {
            console.error('Error loading conversation:', error);
            if (error.response?.status === 404) {
                setError('Bạn chưa được assign coach hoặc chưa có kế hoạch cai thuốc active');
            } else {
                setError('Không thể tải cuộc trò chuyện. Vui lòng thử lại sau.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleNewMessage = (message) => {
        // Handle new message if needed
    };

    if (loading) {
        return (
            <Card
                title={
                    <Space>
                        <MessageOutlined />
                        <span>Chat với Coach</span>
                    </Space>
                }
                style={style}
            >
                <div className="flex justify-center items-center py-8">
                    <Spin />
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card
                title={
                    <Space>
                        <MessageOutlined />
                        <span>Chat với Coach</span>
                    </Space>
                }
                style={style}
            >
                <Alert
                    message="Không thể tải chat"
                    description={error}
                    type="warning"
                    showIcon
                    action={
                        <Button size="small" onClick={loadConversation}>
                            Thử lại
                        </Button>
                    }
                />
            </Card>
        );
    }

    if (!conversationData) {
        return (
            <Card
                title={
                    <Space>
                        <MessageOutlined />
                        <span>Chat với Coach</span>
                    </Space>
                }
                style={style}
            >
                <Alert
                    message="Chưa có coach"
                    description="Bạn chưa được assign coach. Vui lòng liên hệ admin để được hỗ trợ."
                    type="info"
                    showIcon
                />
            </Card>
        );
    }

    return (
        <div style={style}>
            <ChatBox
                conversationId={conversationData.conversation.ConversationID}
                receiverId={conversationData.coach.UserID}
                receiverInfo={{
                    FullName: conversationData.coach.FullName,
                    CoachName: conversationData.coach.FullName,
                    Avatar: conversationData.coach.Avatar,
                    Email: conversationData.coach.Email
                }}
                currentUser={currentUser}
                onNewMessage={handleNewMessage}
                height={height}
            />
        </div>
    );
};

export default MemberChat; 