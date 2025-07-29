import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, Card, Empty, Button, Space, message, Avatar, Badge } from 'antd';
import { MessageOutlined, ArrowLeftOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';
import ChatBox from './ChatBox';
import './CoachChat.css';

const { Title, Text } = Typography;

const CoachChat = ({ onBack }) => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedMember, setSelectedMember] = useState(null);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        // Handle window resize for responsive behavior
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        // Get current user info from localStorage
        const coachData = localStorage.getItem('coachData') || localStorage.getItem('coachUser');
        if (coachData) {
            try {
                const parsedData = JSON.parse(coachData);
                setCurrentUser({
                    userId: parsedData.UserID || parsedData.userId,
                    UserID: parsedData.UserID || parsedData.userId,
                    role: 'coach',
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

        // Load members
        loadMembers();
    }, []);

    const loadMembers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token') || localStorage.getItem('coachToken');

            console.log('🔍 Loading members for coach chat...');

            const response = await axios.get(
                'http://smokeking.wibu.me:4000/api/chat/coach/members',
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            console.log('📋 Members response:', response.data);

            if (response.data.success) {
                setMembers(response.data.data);
                console.log('✅ Loaded members:', response.data.data.length);
            } else {
                console.error('❌ Failed to load members:', response.data.message);
                message.error('Không thể tải danh sách thành viên');
            }
        } catch (error) {
            console.error('❌ Error loading members:', error);
            message.error('Lỗi khi tải danh sách thành viên: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const startConversation = async (member) => {
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('coachToken');

            console.log('🚀 Starting conversation with member:', member.UserID);

            // If conversation already exists, just select it
            if (member.HasConversation && member.ConversationID) {
                setSelectedMember(member);
                setSelectedConversation({
                    ConversationID: member.ConversationID,
                    MemberID: member.UserID,
                    MemberName: member.FullName,
                    MemberEmail: member.Email,
                    MemberAvatar: member.Avatar
                });
                return;
            }

            // Create new conversation
            const response = await axios.post(
                'http://smokeking.wibu.me:4000/api/chat/coach/start-conversation',
                { memberId: member.UserID },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                message.success('Cuộc trò chuyện đã được tạo!');

                // Set selected member and conversation
                setSelectedMember(member);
                setSelectedConversation({
                    ConversationID: response.data.data.conversationId,
                    MemberID: member.UserID,
                    MemberName: member.FullName,
                    MemberEmail: member.Email,
                    MemberAvatar: member.Avatar
                });

                // Reload members to update status
                loadMembers();
            } else {
                message.error('Không thể tạo cuộc trò chuyện');
            }
        } catch (error) {
            console.error('Error starting conversation:', error);
            message.error('Lỗi khi tạo cuộc trò chuyện');
        }
    };

    const handleBackToList = () => {
        setSelectedMember(null);
        setSelectedConversation(null);
    };

    const handleNewMessage = (newMessage) => {
        // Update unread count for the member
        console.log('💬 New message received:', newMessage);
        // Optionally reload members to update unread counts
        loadMembers();
    };

    const renderMemberItem = (member) => (
        <div
            key={member.UserID}
            className={`member-item ${selectedMember?.UserID === member.UserID ? 'selected' : ''
                }`}
            onClick={() => startConversation(member)}
        >
            <div className="flex items-center space-x-3">
                <div className="member-avatar-container">
                    <Avatar
                        size={48}
                        src={member.Avatar}
                        icon={<UserOutlined />}
                        className="border border-gray-200"
                    />
                    {member.UnreadCount > 0 && (
                        <div className="member-unread-badge">
                            {member.UnreadCount}
                        </div>
                    )}
                    <div className="online-indicator"></div>
                </div>
                <div className="member-info">
                    <div className="flex items-center justify-between">
                        <h4 className="member-name">{member.FullName}</h4>
                        <span className="member-last-activity">
                            {member.LastActivity && new Date(member.LastActivity).toLocaleDateString('vi-VN')}
                        </span>
                    </div>
                    <p className="member-email">{member.Email}</p>
                    <div className="member-status-row">
                        <div className="member-status-indicators">
                            {member.HasConversation && (
                                <span className="member-conversation-status">
                                    ● Đã có cuộc trò chuyện
                                </span>
                            )}
                            <span className="member-plan-status">
                                Kế hoạch: {member.QuitPlanStatus}
                            </span>
                        </div>
                        {member.UnreadCount > 0 && (
                            <span className="member-unread-text">
                                {member.UnreadCount} tin nhắn mới
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    // Mobile view: Show either member list or chat
    if (isMobile) {
        return (
            <div className="coach-chat-container">
                {/* Header */}
                <div className="coach-chat-header">
                    <Space>
                        {(onBack || selectedMember) && (
                            <Button
                                icon={<ArrowLeftOutlined />}
                                onClick={selectedMember ? handleBackToList : onBack}
                                type="text"
                                style={{ color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
                            />
                        )}
                        <Title level={3} className="mb-0" style={{ color: 'white' }}>
                            <MessageOutlined className="mr-2" />
                            {selectedMember ? selectedMember.FullName : 'Chat với thành viên'}
                        </Title>
                    </Space>
                    {!selectedMember && (
                        <Text type="secondary" style={{ color: 'rgba(255,255,255,0.8)' }}>
                            Tư vấn và hỗ trợ thành viên trong quá trình cai thuốc
                        </Text>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                    {selectedMember && selectedConversation ? (
                        // Show chat interface
                        <ChatBox
                            conversationId={selectedConversation.ConversationID}
                            receiverId={selectedMember.UserID}
                            receiverInfo={{
                                FullName: selectedMember.FullName,
                                MemberName: selectedMember.FullName,
                                Avatar: selectedMember.Avatar,
                                Email: selectedMember.Email
                            }}
                            currentUser={currentUser}
                            onNewMessage={handleNewMessage}
                            isCoachView={true}
                            height="100%"
                            style={{ height: '100%' }}
                        />
                    ) : (
                        // Show member list
                        <div className="members-list-container">
                            <div className="members-list-header">
                                <h3 className="font-semibold text-gray-900 flex items-center">
                                    <TeamOutlined className="mr-2" />
                                    Thành viên được phân công
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {members.length} thành viên
                                </p>
                            </div>

                            <div className="flex-1 overflow-y-auto members-list-scroll">
                                {loading ? (
                                    <div className="flex justify-center items-center py-8">
                                        <div className="loading-spinner rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                    </div>
                                ) : members.length === 0 ? (
                                    <div className="empty-members-state">
                                        <Empty
                                            description="Chưa có thành viên nào được phân công"
                                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        {members.map(member => renderMemberItem(member))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Desktop view: Show both member list and chat side by side
    return (
        <div className="coach-chat-container">
            {/* Header */}
            <div className="coach-chat-header">
                <Space>
                    {onBack && (
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={onBack}
                            type="text"
                            style={{ color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
                        />
                    )}
                    <Title level={2} className="mb-0" style={{ color: 'white' }}>
                        <MessageOutlined className="mr-3" />
                        Chat với thành viên
                    </Title>
                </Space>
                <Text type="secondary" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    Tư vấn và hỗ trợ thành viên trong quá trình cai thuốc
                </Text>
            </div>

            {/* Chat Content */}
            <div className="flex-1 flex overflow-hidden">
                <Row className="w-full h-full" gutter={0}>
                    {/* Members List */}
                    <Col xs={24} md={selectedMember ? 8 : 24} lg={selectedMember ? 6 : 24} className="h-full">
                        <div className="members-list-container">
                            <div className="members-list-header">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-900 flex items-center">
                                        <TeamOutlined className="mr-2" />
                                        Thành viên được phân công
                                    </h3>
                                    {selectedMember && (
                                        <Button
                                            size="small"
                                            onClick={handleBackToList}
                                            className="md:hidden"
                                        >
                                            Danh sách
                                        </Button>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    {members.length} thành viên
                                </p>
                            </div>

                            <div className="flex-1 overflow-y-auto members-list-scroll">
                                {loading ? (
                                    <div className="flex justify-center items-center py-8">
                                        <div className="loading-spinner rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                    </div>
                                ) : members.length === 0 ? (
                                    <div className="empty-members-state">
                                        <Empty
                                            description="Chưa có thành viên nào được phân công"
                                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        {members.map(member => renderMemberItem(member))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Col>

                    {/* Chat Area */}
                    {selectedMember && selectedConversation && (
                        <Col xs={24} md={16} lg={18} className="h-full">
                            <div className="chat-area-container">
                                <ChatBox
                                    conversationId={selectedConversation.ConversationID}
                                    receiverId={selectedMember.UserID}
                                    receiverInfo={{
                                        FullName: selectedMember.FullName,
                                        MemberName: selectedMember.FullName,
                                        Avatar: selectedMember.Avatar,
                                        Email: selectedMember.Email
                                    }}
                                    currentUser={currentUser}
                                    onNewMessage={handleNewMessage}
                                    isCoachView={true}
                                    height="calc(100vh - 200px)"
                                    style={{ height: '100%' }}
                                />
                            </div>
                        </Col>
                    )}

                    {/* Chat Placeholder */}
                    {!selectedMember && (
                        <Col xs={0} md={16} lg={18} className="h-full hidden md:block">
                            <div className="chat-placeholder">
                                <div className="chat-placeholder-content">
                                    <div className="chat-placeholder-icon">
                                        <MessageOutlined />
                                    </div>
                                    <h3 className="chat-placeholder-title">
                                        Chọn một thành viên để bắt đầu chat
                                    </h3>
                                    <p className="chat-placeholder-description">
                                        Danh sách bên trái hiển thị các thành viên được admin phân công cho bạn.
                                        Click vào bất kỳ thành viên nào để bắt đầu cuộc trò chuyện và tư vấn hỗ trợ cai thuốc.
                                    </p>
                                </div>
                            </div>
                        </Col>
                    )}
                </Row>
            </div>
        </div>
    );
};

export default CoachChat; 