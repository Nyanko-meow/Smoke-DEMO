import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    Layout,
    Card,
    Typography,
    Avatar,
    Button,
    Input,
    Divider,
    Space,
    message,
    Modal,
    List,
    Spin,
    Empty,
    Popconfirm,
    Tag
} from 'antd';
import {
    DeleteOutlined,
    EditOutlined,
    LikeOutlined,
    LikeFilled,
    CommentOutlined,
    TrophyOutlined,
    ArrowLeftOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import CommentManager from './CommentManager';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const CommunityDetail = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);

    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [liked, setLiked] = useState(false);
    const [deletingPost, setDeletingPost] = useState(false);

    useEffect(() => {
        if (postId) {
            fetchPost();
            fetchComments();
            if (user) {
                checkLikeStatus();
            }
        }
    }, [postId, user]);

    const fetchPost = async () => {
        try {
            const response = await axios.get(`/api/community/posts/${postId}`);
            if (response.data.success) {
                setPost(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching post:', error);
            message.error('Lỗi khi tải bài viết');
        }
    };

    const fetchComments = async () => {
        try {
            const response = await axios.get(`/api/community/posts/${postId}/comments`);
            if (response.data.success) {
                setComments(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
            message.error('Lỗi khi tải comment');
        } finally {
            setLoading(false);
        }
    };

    const checkLikeStatus = async () => {
        try {
            const response = await axios.get(`/api/community/posts/${postId}/like-status`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (response.data.success) {
                setLiked(response.data.liked);
            }
        } catch (error) {
            console.error('Error checking like status:', error);
        }
    };

    const handleLike = async () => {
        if (!user) {
            message.warning('Vui lòng đăng nhập để thích bài viết');
            return;
        }

        try {
            const response = await axios.post(`/api/community/posts/${postId}/like`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.data.success) {
                setLiked(response.data.liked);
                setPost(prev => ({ ...prev, LikesCount: response.data.likesCount }));
            }
        } catch (error) {
            message.error('Lỗi khi thực hiện like');
        }
    };

    const handleCommentSubmit = async () => {
        if (!commentText.trim()) return;

        setSubmittingComment(true);
        try {
            const response = await axios.post(`/api/community/posts/${postId}/comments`, {
                content: commentText
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.data.success) {
                fetchComments(); // Refresh comments
                message.success('Thêm comment thành công');
                setCommentText('');
            }
        } catch (error) {
            message.error('Lỗi khi xử lý comment');
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleDeletePost = async () => {
        if (!user) {
            message.error('Bạn cần đăng nhập để thực hiện thao tác này');
            return;
        }

        setDeletingPost(true);
        try {
            const response = await axios.delete(`/api/community/posts/${postId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.data.success) {
                message.success('Đã xóa bài viết thành công!');
                navigate('/community'); // Redirect to community list
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            if (error.response?.status === 404) {
                message.error('Bài viết không tồn tại hoặc bạn không có quyền xóa');
            } else if (error.response?.status === 403) {
                message.error('Bạn không có quyền xóa bài viết này');
            } else {
                message.error('Lỗi khi xóa bài viết: ' + (error.response?.data?.message || error.message));
            }
        } finally {
            setDeletingPost(false);
        }
    };

    const canEditOrDelete = (item) => {
        console.log('Debug canEditOrDelete:', {
            user: user,
            userID: user?.id,
            userIDField: user?.UserID,
            itemUserID: item?.UserID,
            userRole: user?.role,
            canEdit: user && (user.id === item.UserID || user.role === 'admin')
        });
        return user && (user.id === item.UserID || user.role === 'admin');
    };

    if (loading) {
        return (
            <Content style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Spin size="large" />
            </Content>
        );
    }

    if (!post) {
        return (
            <Content style={{ padding: '24px' }}>
                <Empty description="Không tìm thấy bài viết" />
            </Content>
        );
    }

    return (
        <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
            <Content style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/community')}
                    style={{ marginBottom: 16 }}
                >
                    Quay lại
                </Button>

                <Card style={{ marginBottom: 24 }}>
                    {/* Post Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar
                                src={post.Avatar}
                                size="large"
                                style={{ marginRight: 12 }}
                            >
                                {post.FirstName?.charAt(0)}
                            </Avatar>
                            <div>
                                <Text strong>{`${post.FirstName} ${post.LastName}`}</Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    {formatDistanceToNow(new Date(post.CreatedAt), {
                                        addSuffix: true,
                                        locale: vi
                                    })}
                                </Text>
                            </div>
                        </div>

                        {/* Debug info - remove this later */}
                        {console.log('Post data:', post)}
                        {console.log('User data:', user)}

                        {canEditOrDelete(post) && (
                            <Space>
                                <Popconfirm
                                    title="Xóa bài viết"
                                    description="Bạn có chắc muốn xóa bài viết này? Tất cả bình luận liên quan cũng sẽ bị xóa."
                                    onConfirm={handleDeletePost}
                                    okText={deletingPost ? "Đang xóa..." : "Xóa"}
                                    cancelText="Hủy"
                                    okButtonProps={{
                                        danger: true,
                                        loading: deletingPost
                                    }}
                                    disabled={deletingPost}
                                >
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        size="small"
                                        loading={deletingPost}
                                        disabled={deletingPost}
                                    >
                                        {deletingPost ? 'Đang xóa...' : 'Xóa'}
                                    </Button>
                                </Popconfirm>
                            </Space>
                        )}

                        {/* Temporary debug - always show buttons for testing */}
                        {!canEditOrDelete(post) && user && (
                            <Space>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    Debug: No edit/delete permission - UserID: {user.UserID} vs PostUserID: {post.UserID}
                                </Text>
                            </Space>
                        )}
                    </div>

                    {/* Achievement Tag */}
                    {post.AchievementName && (
                        <Tag
                            icon={<TrophyOutlined />}
                            color="gold"
                            style={{ marginBottom: 12 }}
                        >
                            {post.AchievementName}
                        </Tag>
                    )}

                    {/* Post Content */}
                    <Title level={3} style={{ marginBottom: 16 }}>
                        {post.Title}
                    </Title>

                    <Paragraph style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: 20 }}>
                        {post.Content}
                    </Paragraph>

                    {/* Post Actions */}
                    <Divider style={{ margin: '16px 0' }} />
                    <Space size="large">
                        <Button
                            type="text"
                            icon={liked ? <LikeFilled style={{ color: '#1890ff' }} /> : <LikeOutlined />}
                            onClick={handleLike}
                        >
                            {post.LikesCount || 0}
                        </Button>

                        <Button
                            type="text"
                            icon={<CommentOutlined />}
                        >
                            {comments.length} comments
                        </Button>
                    </Space>
                </Card>

                {/* Comments Section */}
                <Card title={`Bình luận (${comments.length})`}>
                    {user && (
                        <div style={{ marginBottom: 24 }}>
                            <TextArea
                                rows={3}
                                placeholder="Viết bình luận..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                style={{ marginBottom: 12 }}
                            />
                            <Button
                                type="primary"
                                loading={submittingComment}
                                onClick={handleCommentSubmit}
                                disabled={!commentText.trim()}
                            >
                                Đăng bình luận
                            </Button>
                        </div>
                    )}

                    {comments.length === 0 ? (
                        <Empty description="Chưa có bình luận nào" />
                    ) : (
                        <CommentManager
                            comments={comments}
                            setComments={setComments}
                            postId={postId}
                        />
                    )}
                </Card>
            </Content>
        </Layout>
    );
};

export default CommunityDetail; 