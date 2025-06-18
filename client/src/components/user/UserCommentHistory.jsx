import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Layout,
    Card,
    List,
    Typography,
    Button,
    Space,
    message,
    Popconfirm,
    Spin,
    Empty,
    Tag,
    Alert
} from 'antd';
import {
    DeleteOutlined,
    CommentOutlined,
    MessageOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import './UserCommentHistory.css';

const { Content } = Layout;
const { Title, Text } = Typography;

const UserCommentHistory = () => {
    const { user } = useSelector(state => state.auth);
    const navigate = useNavigate();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchUserComments();
        }
    }, [user]);

    const fetchUserComments = async () => {
        try {
            console.log('🔄 Fetching user comments...');

            // Gọi API để lấy tất cả comments của user
            const response = await axios.get('/api/community/user-comments', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            console.log('📥 API Response:', response.data);

            if (response.data.success) {
                setComments(response.data.data);
                console.log(`✅ Loaded ${response.data.count || response.data.data.length} comments`);
            } else {
                console.error('❌ API returned error:', response.data.message);
                if (response.data.missingTables) {
                    message.error(`Database chưa được thiết lập đúng. Thiếu bảng: ${response.data.missingTables.join(', ')}`);
                } else {
                    message.error(response.data.message || 'Lỗi khi tải danh sách comment');
                }
            }
        } catch (error) {
            console.error('❌ Error fetching user comments:', error);

            if (error.response?.status === 500) {
                message.error('Lỗi server: ' + (error.response.data?.message || 'Database có thể chưa được thiết lập'));
            } else if (error.response?.status === 401) {
                message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            } else {
                message.error('Lỗi kết nối: ' + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            const response = await axios.delete(`/api/community/comments/${commentId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.data.success) {
                setComments(prevComments =>
                    prevComments.filter(comment => comment.CommentID !== commentId)
                );
                message.success('Xóa comment thành công');
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            message.error('Lỗi khi xóa comment');
        }
    };

    if (loading) {
        return (
            <Content className="loading-container">
                <Spin size="large" />
            </Content>
        );
    }

    return (
        <Layout className="user-comment-history-layout">
            <Content className="comment-history-content">
                <div className="comment-history-header">
                    <div className="header-flex">
                        <div className="header-info">
                            <Title level={2}>
                                <CommentOutlined /> Quản lý bình luận của tôi
                            </Title>
                            <Text type="secondary">
                                Xem và quản lý tất cả các bình luận bạn đã đăng
                            </Text>
                        </div>
                        <Button
                            className="refresh-btn"
                            onClick={() => {
                                setLoading(true);
                                fetchUserComments();
                            }}
                            loading={loading}
                        >
                            Làm mới
                        </Button>
                    </div>
                </div>

                <Card className="comment-history-card">
                    {comments.length === 0 ? (
                        <div className="empty-state-container">
                            <Empty
                                description="Bạn chưa có bình luận nào"
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                            <Alert
                                message="Hướng dẫn"
                                description="Để có bình luận hiển thị ở đây, hãy vào trang Community và tham gia thảo luận trong các bài viết."
                                type="info"
                                showIcon
                            />
                            <div>
                                <Button
                                    className="community-btn"
                                    icon={<MessageOutlined />}
                                    onClick={() => navigate('/community')}
                                    size="large"
                                >
                                    Đi đến Community
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <List
                            className="comment-list"
                            dataSource={comments}
                            renderItem={(comment) => (
                                <List.Item className="comment-item">
                                    <div className="comment-content-wrapper">
                                        {/* Comment Header */}
                                        <div className="comment-header">
                                            <div className="comment-info">
                                                <Text className="comment-post-title">
                                                    Bình luận trong bài viết: {comment.PostTitle || 'Không có tiêu đề'}
                                                </Text>
                                                <br />
                                                <Text className="comment-date">
                                                    {formatDistanceToNow(new Date(comment.CreatedAt), {
                                                        addSuffix: true,
                                                        locale: vi
                                                    })}
                                                </Text>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="comment-actions">
                                                <Popconfirm
                                                    title="Bạn có chắc muốn xóa comment này?"
                                                    description="Hành động này không thể hoàn tác"
                                                    onConfirm={() => handleDeleteComment(comment.CommentID)}
                                                    okText="Xóa"
                                                    cancelText="Hủy"
                                                    okButtonProps={{ danger: true }}
                                                >
                                                    <Button
                                                        className="delete-btn"
                                                        type="text"
                                                        size="small"
                                                        danger
                                                        icon={<DeleteOutlined />}
                                                    >
                                                        Xóa
                                                    </Button>
                                                </Popconfirm>
                                            </div>
                                        </div>

                                        {/* Comment Content */}
                                        <div className="comment-content-box">
                                            <Text className="comment-content-text">{comment.Content}</Text>
                                        </div>
                                    </div>
                                </List.Item>
                            )}
                        />
                    )}
                </Card>
            </Content>
        </Layout>
    );
};

export default UserCommentHistory; 