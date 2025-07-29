import React, { useState, useEffect } from 'react';
import { Card, Alert, Spin, Button, Space, Typography, message } from 'antd';
import { MessageOutlined, UserOutlined, ReloadOutlined } from '@ant-design/icons';
import ChatBox from './ChatBox';
import AccessGuard from '../common/AccessGuard';
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

            if (!token) {
                setError('Bạn cần đăng nhập để sử dụng chat');
                setLoading(false);
                return;
            }

            console.log('🔍 Loading conversation for member...');

            // Test server connection first
            try {
                const serverResponse = await axios.get('http://smokeking.wibu.me:4000/api/test', { timeout: 5000 });
                console.log('✅ Server connection OK:', serverResponse.data);
            } catch (serverError) {
                console.error('❌ Server connection failed:', serverError);
                if (serverError.code === 'ECONNREFUSED') {
                    setError('Server không chạy. Vui lòng start server với lệnh: npm start (trong thư mục server)');
                } else if (serverError.code === 'ECONNABORTED') {
                    setError('Server phản hồi quá chậm. Vui lòng kiểm tra server có đang chạy không');
                } else {
                    setError(`Không thể kết nối đến server: ${serverError.message}`);
                }
                setLoading(false);
                return;
            }

            // Get debug info
            try {
                const debugResponse = await axios.get(
                    'http://smokeking.wibu.me:4000/api/chat/debug-user',
                    {
                        headers: { 'Authorization': `Bearer ${token}` },
                        timeout: 10000
                    }
                );
                console.log('🔍 Debug user info:', debugResponse.data);
            } catch (debugError) {
                console.error('Debug API error:', debugError);
            }

            // Load conversation
            const response = await axios.get(
                'http://smokeking.wibu.me:4000/api/chat/member/conversation',
                {
                    headers: { 'Authorization': `Bearer ${token}` },
                    timeout: 10000
                }
            );

            console.log('📞 Conversation API response:', response.data);

            if (response.data.success) {
                setConversationData(response.data.data);
                message.success('Đã tải cuộc trò chuyện thành công');
            } else {
                setError(response.data.message || 'Không thể tải cuộc trò chuyện');
            }
        } catch (error) {
            console.error('❌ Error loading conversation:', error);

            if (error.code === 'ECONNABORTED') {
                setError('Timeout: Server phản hồi quá chậm. Vui lòng thử lại');
            } else if (error.response?.status === 404) {
                const errorData = error.response.data;
                if (errorData.error_code === 'NO_ASSIGNED_COACH') {
                    setError('Bạn chưa được phân công coach. Vui lòng liên hệ admin để được phân công coach trước khi có thể chat.');
                } else {
                    setError('Bạn chưa được assign coach hoặc chưa có kế hoạch cai thuốc active. Vui lòng liên hệ admin để được hỗ trợ');
                }
            } else if (error.response?.status === 401) {
                setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
                localStorage.removeItem('token');
                localStorage.removeItem('userData');
            } else if (error.response?.status === 500) {
                setError('Lỗi server. Vui lòng kiểm tra database connection và thử lại sau');
            } else if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
                setError('Không thể kết nối đến server. Vui lòng kiểm tra server có đang chạy không (npm start)');
            } else {
                setError(`Lỗi: ${error.response?.data?.message || error.message || 'Không thể tải cuộc trò chuyện'}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleNewMessage = (message) => {
        // Handle new message if needed
    };

    return (
        <AccessGuard feature="chat với coach">
            <Card
                title={
                    <Space>
                        <MessageOutlined />
                        <span>Chat với Coach</span>
                    </Space>
                }
                style={style}
                actions={[
                    <Button
                        key="reload"
                        icon={<ReloadOutlined />}
                        onClick={loadConversation}
                        loading={loading}
                        type="link"
                    >
                        Làm mới
                    </Button>
                ]}
            >
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px 0' }}>
                        <Spin size="large" />
                        <div style={{ marginTop: 16 }}>
                            <Text>Đang kết nối với coach...</Text>
                        </div>
                    </div>
                ) : error ? (
                    <Alert
                        message="Không thể kết nối"
                        description={error}
                        type="error"
                        showIcon
                        action={
                            <Button
                                size="small"
                                type="primary"
                                onClick={loadConversation}
                            >
                                Thử lại
                            </Button>
                        }
                        style={{ marginBottom: 16 }}
                    />
                ) : conversationData ? (
                    <div>
                        {/* Coach Info */}
                        <Alert
                            message={`Đang chat với: ${conversationData.coach?.FullName || 'Coach'}`}
                            description={`Chuyên môn: ${conversationData.coach?.Specialization || 'Hỗ trợ cai thuốc'}`}
                            type="info"
                            showIcon
                            style={{ marginBottom: 16 }}
                            icon={<UserOutlined />}
                        />

                        {/* Chat Box */}
                        <ChatBox
                            conversationId={conversationData.conversation?.ConversationID}
                            receiverId={conversationData.coach?.UserID}
                            receiverInfo={{
                                FullName: conversationData.coach?.FullName,
                                Avatar: conversationData.coach?.Avatar,
                                Email: conversationData.coach?.Email
                            }}
                            currentUser={currentUser}
                            height={height}
                            style={{ minHeight: height }}
                        />
                    </div>
                ) : (
                    <Alert
                        message="Chưa có cuộc trò chuyện"
                        description="Bạn chưa được phân công coach hoặc chưa có cuộc trò chuyện nào."
                        type="warning"
                        showIcon
                    />
                )}
            </Card>
        </AccessGuard>
    );
};

export default MemberChat; 