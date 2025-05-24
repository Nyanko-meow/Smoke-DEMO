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

    const canEditOrDelete = (item) => {
        return user && (user.UserID === item.UserID || user.role === 'admin');
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

                        {canEditOrDelete(post) && (
                            <Space>
                                <Button
                                    type="text"
                                    icon={<EditOutlined />}
                                    size="small"
                                >
                                    Sửa
                                </Button>
                                <Popconfirm
                                    title="Bạn có chắc muốn xóa bài viết này?"
                                    onConfirm={() => {/* Handle delete post */ }}
                                    okText="Xóa"
                                    cancelText="Hủy"
                                >
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        size="small"
                                    >
                                        Xóa
                                    </Button>
                                </Popconfirm>
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