import React, { useState, useEffect } from 'react';
import {
    List,
    Avatar,
    Button,
    Typography,
    Space,
    Empty,
    Spin,
    Card,
    Input,
    message,
    Tag,
    Badge
} from 'antd';
import {
    UserOutlined,
    MessageOutlined,
    SearchOutlined,
    PlusCircleOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Text } = Typography;
const { Search } = Input;

const MemberList = ({ onStartConversation, existingConversations = [] }) => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [startingConversation, setStartingConversation] = useState(null);

    useEffect(() => {
        loadMembers();
    }, []);

    const loadMembers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token') || localStorage.getItem('coachToken');

            const response = await axios.get(
                'http://smokeking.wibu.me:4000/api/chat/coach/members',
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                setMembers(response.data.data);
            }
        } catch (error) {
            console.error('Error loading members:', error);
            message.error('Không thể tải danh sách thành viên');
        } finally {
            setLoading(false);
        }
    };

    const startConversation = async (memberId) => {
        try {
            setStartingConversation(memberId);
            const token = localStorage.getItem('token') || localStorage.getItem('coachToken');

            const response = await axios.post(
                'http://smokeking.wibu.me:4000/api/chat/coach/start-conversation',
                { memberId },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                message.success(response.data.message);

                // Refresh member list to update conversation status
                await loadMembers();

                // Notify parent to refresh conversations and select the new one
                if (onStartConversation) {
                    onStartConversation(response.data.data.conversationId);
                }
            }
        } catch (error) {
            console.error('Error starting conversation:', error);
            message.error('Không thể tạo cuộc trò chuyện');
        } finally {
            setStartingConversation(null);
        }
    };

    const filteredMembers = members.filter(member =>
        member.FullName.toLowerCase().includes(searchText.toLowerCase()) ||
        member.Email.toLowerCase().includes(searchText.toLowerCase())
    );

    const renderMemberItem = (member) => {
        const hasConversation = member.HasConversation;
        const hasQuitPlan = member.QuitPlanStatus === 'active';
        const isStarting = startingConversation === member.UserID;

        return (
            <List.Item
                key={member.UserID}
                className="hover:bg-gray-50 transition-colors"
                style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}
                actions={[
                    hasConversation ? (
                        <Tag color="green" icon={<CheckCircleOutlined />}>
                            Đã có cuộc trò chuyện
                        </Tag>
                    ) : (
                        <Button
                            type="primary"
                            size="small"
                            icon={<MessageOutlined />}
                            loading={isStarting}
                            onClick={() => startConversation(member.UserID)}
                        >
                            Bắt đầu chat
                        </Button>
                    )
                ]}
            >
                <List.Item.Meta
                    avatar={
                        <Avatar
                            size={48}
                            src={member.Avatar}
                            icon={<UserOutlined />}
                            style={{
                                backgroundColor: hasConversation ? '#52c41a' : '#1890ff',
                                color: 'white'
                            }}
                        />
                    }
                    title={
                        <div className="flex items-center gap-2">
                            <Text strong className="text-gray-800">
                                {member.FullName}
                            </Text>
                            {hasQuitPlan && (
                                <Tag color="blue" size="small">
                                    Có kế hoạch cai thuốc
                                </Tag>
                            )}
                            {member.Role === 'guest' && (
                                <Tag color="orange" size="small">
                                    Khách
                                </Tag>
                            )}
                        </div>
                    }
                    description={
                        <div>
                            <Text type="secondary" className="block">
                                {member.Email}
                            </Text>
                            <Text type="secondary" className="text-xs">
                                Trạng thái: {member.IsActive ? 'Hoạt động' : 'Không hoạt động'}
                            </Text>
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
                    <UserOutlined />
                    <span>Danh sách thành viên</span>
                    <Badge count={members.length} style={{ backgroundColor: '#52c41a' }} />
                </Space>
            }
            extra={
                <Button
                    type="text"
                    icon={<PlusCircleOutlined />}
                    onClick={loadMembers}
                    loading={loading}
                >
                    Làm mới
                </Button>
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

            {/* Members List */}
            {loading ? (
                <div className="flex justify-center items-center py-8">
                    <Spin />
                </div>
            ) : filteredMembers.length === 0 ? (
                <Empty
                    description={
                        searchText
                            ? "Không tìm thấy thành viên nào"
                            : "Chưa có thành viên nào"
                    }
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    className="py-8"
                />
            ) : (
                <List
                    dataSource={filteredMembers}
                    renderItem={renderMemberItem}
                    style={{ maxHeight: '500px', overflowY: 'auto' }}
                />
            )}
        </Card>
    );
};

export default MemberList; 