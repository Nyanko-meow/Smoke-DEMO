import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, Card, Empty, Button, Space, Tabs, message } from 'antd';
import { MessageOutlined, ArrowLeftOutlined, TeamOutlined, CommentOutlined } from '@ant-design/icons';
import ConversationList from './ConversationList';
import MemberList from './MemberList';
import ChatBox from './ChatBox';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const CoachChat = ({ onBack }) => {
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [activeTab, setActiveTab] = useState('conversations');

    useEffect(() => {
        // Get current user info from localStorage
        const coachData = localStorage.getItem('coachData') || localStorage.getItem('coachUser');
        if (coachData) {
            try {
                const parsedData = JSON.parse(coachData);
                setCurrentUser({
                    userId: parsedData.UserID || parsedData.userId,
                    UserID: parsedData.UserID || parsedData.userId, // Add this for compatibility
                    role: 'coach',
                    Role: 'coach', // Add this for compatibility
                    firstName: parsedData.FirstName,
                    lastName: parsedData.LastName,
                    name: `${parsedData.FirstName} ${parsedData.LastName}`,
                    email: parsedData.Email
                });
                console.log('🔍 CoachChat currentUser set:', {
                    userId: parsedData.UserID || parsedData.userId,
                    role: 'coach',
                    firstName: parsedData.FirstName,
                    lastName: parsedData.LastName
                });
            } catch (error) {
                console.error('Error parsing coach data:', error);
            }
        }
    }, []);

    const handleSelectConversation = (conversation) => {
        setSelectedConversation(conversation);
        setActiveTab('conversations'); // Switch to conversations tab when selecting
    };

    const handleNewMessage = (message) => {
        // Refresh conversations when new message is sent
        setRefreshKey(prev => prev + 1);
    };

    const handleStartConversation = (conversationId) => {
        // Refresh conversations and optionally select the new one
        setRefreshKey(prev => prev + 1);
        message.success('Cuộc trò chuyện mới đã được tạo!');

        // Switch to conversations tab to see the new conversation
        setActiveTab('conversations');
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <Space>
                    {onBack && (
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={onBack}
                        />
                    )}
                    <Title level={2} className="mb-0">
                        <MessageOutlined className="mr-3" />
                        Chat với thành viên
                    </Title>
                </Space>
                <Text type="secondary">
                    Tư vấn và hỗ trợ thành viên trong quá trình cai thuốc
                </Text>
            </div>

            <Row gutter={[24, 24]} style={{ height: 'calc(100vh - 200px)' }}>
                {/* Left Panel: Conversations & Members */}
                <Col xs={24} md={8} lg={6}>
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        type="card"
                        size="small"
                    >
                        <TabPane
                            tab={
                                <span>
                                    <CommentOutlined />
                                    Cuộc trò chuyện
                                </span>
                            }
                            key="conversations"
                        >
                            <ConversationList
                                key={refreshKey} // Force refresh when refreshKey changes
                                onSelectConversation={handleSelectConversation}
                                selectedConversationId={selectedConversation?.ConversationID}
                            />
                        </TabPane>
                        <TabPane
                            tab={
                                <span>
                                    <TeamOutlined />
                                    Thành viên
                                </span>
                            }
                            key="members"
                        >
                            <MemberList
                                onStartConversation={handleStartConversation}
                            />
                        </TabPane>
                    </Tabs>
                </Col>

                {/* Right Panel: Chat Area */}
                <Col xs={24} md={16} lg={18}>
                    {selectedConversation ? (
                        <ChatBox
                            conversationId={selectedConversation.ConversationID}
                            receiverId={selectedConversation.MemberID}
                            receiverInfo={{
                                FullName: selectedConversation.MemberName,
                                MemberName: selectedConversation.MemberName,
                                MemberAvatar: selectedConversation.MemberAvatar,
                                MemberEmail: selectedConversation.MemberEmail
                            }}
                            currentUser={currentUser}
                            onNewMessage={handleNewMessage}
                            height={600}
                            isCoachView={true}
                        />
                    ) : (
                        <Card style={{ height: '100%' }}>
                            <div className="flex items-center justify-center h-full">
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={
                                        <div className="text-center">
                                            <Text type="secondary" className="text-lg">
                                                Chọn một cuộc trò chuyện để bắt đầu chat
                                            </Text>
                                            <br />
                                            <Text type="secondary">
                                                Hoặc chọn tab &quot;Thành viên&quot; để bắt đầu cuộc trò chuyện mới
                                            </Text>
                                            <div className="mt-4">
                                                <Button
                                                    type="primary"
                                                    icon={<TeamOutlined />}
                                                    onClick={() => setActiveTab('members')}
                                                >
                                                    Xem danh sách thành viên
                                                </Button>
                                            </div>
                                        </div>
                                    }
                                />
                            </div>
                        </Card>
                    )}
                </Col>
            </Row>
        </div>
    );
};

export default CoachChat; 