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
    Tag,
    Tooltip
} from 'antd';
import {
    DeleteOutlined,
    EditOutlined,
    LikeOutlined,
    LikeFilled,
    CommentOutlined,
    TrophyOutlined,
    ArrowLeftOutlined,
    HeartOutlined,
    HeartFilled
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

    // Helper function to render achievement icon
    const renderAchievementIcon = (iconUrl, achievementName, size = '16px') => {
        console.log('🎯 Achievement Icon Debug:', { iconUrl, achievementName });

        // Priority 1: Use achievement name to determine emoji
        if (achievementName) {
            const name = achievementName.toLowerCase();
            // Map common achievement names to emojis
            if (name.includes('đầu tiên') || name.includes('first') || name.includes('ngày đầu')) return <span style={{ fontSize: size }}>🥉</span>;
            if (name.includes('tuần') || name.includes('week') || name.includes('7 ngày')) return <span style={{ fontSize: size }}>🥈</span>;
            if (name.includes('tháng') || name.includes('month') || name.includes('30 ngày')) return <span style={{ fontSize: size }}>🥇</span>;
            if (name.includes('đặc biệt') || name.includes('special') || name.includes('vip')) return <span style={{ fontSize: size }}>💎</span>;
            if (name.includes('liên tục') || name.includes('streak') || name.includes('chuỗi')) return <span style={{ fontSize: size }}>🔥</span>;
            if (name.includes('sao') || name.includes('star') || name.includes('xuất sắc')) return <span style={{ fontSize: size }}>⭐</span>;
            if (name.includes('vương') || name.includes('crown') || name.includes('master')) return <span style={{ fontSize: size }}>👑</span>;
            if (name.includes('tim') || name.includes('heart') || name.includes('yêu thương')) return <span style={{ fontSize: size }}>❤️</span>;
            if (name.includes('thử thách') || name.includes('challenge')) return <span style={{ fontSize: size }}>🎯</span>;
            if (name.includes('mốc') || name.includes('milestone')) return <span style={{ fontSize: size }}>🏁</span>;
        }

        // Priority 2: If iconUrl is already an emoji (length <= 4 and not a path)
        if (iconUrl && iconUrl.length <= 4 && !/^\/|^http|\.png|\.jpg|\.gif|\.svg/i.test(iconUrl)) {
            return <span style={{ fontSize: size, display: 'inline-block', lineHeight: 1 }}>{iconUrl}</span>;
        }

        // Priority 3: If iconUrl looks like an image path, determine from URL
        if (iconUrl && (/\/images\/|\.png|\.jpg|\.gif|\.svg/i.test(iconUrl))) {
            const url = iconUrl.toLowerCase();
            if (url.includes('bronze') || url.includes('first') || url.includes('start')) return <span style={{ fontSize: size }}>🥉</span>;
            if (url.includes('silver') || url.includes('week')) return <span style={{ fontSize: size }}>🥈</span>;
            if (url.includes('gold') || url.includes('month')) return <span style={{ fontSize: size }}>🥇</span>;
            if (url.includes('diamond') || url.includes('special')) return <span style={{ fontSize: size }}>💎</span>;
            if (url.includes('fire') || url.includes('streak')) return <span style={{ fontSize: size }}>🔥</span>;
            if (url.includes('star')) return <span style={{ fontSize: size }}>⭐</span>;
            if (url.includes('crown')) return <span style={{ fontSize: size }}>👑</span>;
            if (url.includes('heart')) return <span style={{ fontSize: size }}>❤️</span>;
            // Default trophy for image paths
            return <span style={{ fontSize: size }}>🏆</span>;
        }

        // Default case - show trophy
        return <span style={{ fontSize: size }}>🏆</span>;
    };

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
        return user && (user.id === item.UserID || user.role === 'admin');
    };

    if (loading) {
        return (
            <Layout style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '24px',
                    padding: '48px',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    textAlign: 'center'
                }}>
                    <Spin size="large" />
                    <div style={{ marginTop: '16px', color: '#6b7280', fontSize: '16px' }}>
                        Đang tải bài viết...
                    </div>
                </div>
            </Layout>
        );
    }

    if (!post) {
        return (
            <Layout style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '24px',
                    padding: '48px',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                    <Empty description={
                        <Text style={{ color: '#6b7280', fontSize: '18px' }}>
                            Không tìm thấy bài viết
                        </Text>
                    } />
                </div>
            </Layout>
        );
    }

    return (
        <Layout style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            position: 'relative'
        }}>
            {/* Animated background elements */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                overflow: 'hidden',
                pointerEvents: 'none'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '15%',
                    right: '10%',
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    animation: 'float 8s ease-in-out infinite'
                }}></div>
                <div style={{
                    position: 'absolute',
                    bottom: '25%',
                    left: '15%',
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    animation: 'float 6s ease-in-out infinite reverse'
                }}></div>
            </div>

            <Content style={{
                padding: '32px 24px',
                maxWidth: '900px',
                margin: '0 auto',
                width: '100%',
                position: 'relative',
                zIndex: 1
            }}>
                {/* Back Button */}
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/community')}
                    style={{
                        marginBottom: 24,
                        background: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '16px',
                        height: '48px',
                        paddingInline: '20px',
                        fontSize: '15px',
                        fontWeight: 600,
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
                        backdropFilter: 'blur(20px)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.1)';
                    }}
                >
                    <span style={{ fontSize: '14px' }}>←</span>
                    Quay lại cộng đồng
                </Button>

                {/* Main Post Card */}
                <div style={{
                    marginBottom: 28,
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '24px',
                    padding: '32px',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Top gradient bar */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '6px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '24px 24px 0 0'
                    }}></div>

                    {/* Post Header */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 24
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ position: 'relative' }}>
                                <Avatar
                                    src={post.Avatar}
                                    size={64}
                                    style={{
                                        border: '3px solid rgba(102, 126, 234, 0.2)',
                                        backgroundColor: '#667eea',
                                        fontSize: '24px',
                                        fontWeight: 600
                                    }}
                                >
                                    {post.FirstName?.charAt(0)}
                                </Avatar>
                                {post.AchievementName && (
                                    <Tooltip title={post.AchievementName}>
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '-6px',
                                            right: '-6px',
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '16px',
                                            border: '3px solid white',
                                            boxShadow: '0 4px 12px rgba(251, 191, 36, 0.4)'
                                        }}>
                                            {renderAchievementIcon(post.AchievementIcon, post.AchievementName, '16px')}
                                        </div>
                                    </Tooltip>
                                )}
                            </div>
                            <div>
                                <Text strong style={{
                                    fontSize: '20px',
                                    color: '#1f2937',
                                    fontWeight: 700,
                                    display: 'block',
                                    marginBottom: '4px'
                                }}>
                                    {`${post.FirstName} ${post.LastName}`}
                                </Text>
                                <Text style={{
                                    fontSize: '14px',
                                    color: '#9ca3af',
                                    fontWeight: 500
                                }}>
                                    {formatDistanceToNow(new Date(post.CreatedAt), {
                                        addSuffix: true,
                                        locale: vi
                                    })}
                                </Text>
                            </div>
                        </div>

                        {canEditOrDelete(post) && (
                            <Popconfirm
                                title={
                                    <div style={{ fontWeight: 600, fontSize: '16px' }}>
                                        🗑️ Xóa bài viết
                                    </div>
                                }
                                description={
                                    <div style={{ maxWidth: '300px' }}>
                                        Bạn có chắc muốn xóa bài viết này?
                                        <br />
                                        <Text type="warning" style={{ fontSize: '13px' }}>
                                            ⚠️ Tất cả bình luận liên quan cũng sẽ bị xóa.
                                        </Text>
                                    </div>
                                }
                                onConfirm={handleDeletePost}
                                okText={deletingPost ? "Đang xóa..." : "Xóa bài viết"}
                                cancelText="Hủy bỏ"
                                okButtonProps={{
                                    danger: true,
                                    loading: deletingPost,
                                    style: {
                                        borderRadius: '8px',
                                        fontWeight: 600
                                    }
                                }}
                                cancelButtonProps={{
                                    style: {
                                        borderRadius: '8px',
                                        fontWeight: 600
                                    }
                                }}
                                disabled={deletingPost}
                            >
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    size="large"
                                    loading={deletingPost}
                                    disabled={deletingPost}
                                    style={{
                                        borderRadius: '12px',
                                        fontWeight: 600,
                                        height: '44px',
                                        paddingInline: '16px',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!deletingPost) {
                                            e.currentTarget.style.backgroundColor = '#fef2f2';
                                            e.currentTarget.style.borderColor = '#fecaca';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.borderColor = 'transparent';
                                    }}
                                >
                                    {deletingPost ? 'Đang xóa...' : 'Xóa bài viết'}
                                </Button>
                            </Popconfirm>
                        )}
                    </div>

                    {/* Achievement Tag */}
                    {post.AchievementName && (
                        <div style={{
                            marginBottom: 20,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '10px',
                            background: 'linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%)',
                            color: '#92400e',
                            padding: '8px 20px',
                            borderRadius: '24px',
                            fontSize: '15px',
                            fontWeight: 700,
                            border: '2px solid rgba(251, 191, 36, 0.3)',
                            boxShadow: '0 4px 12px rgba(251, 191, 36, 0.2)'
                        }}>
                            {renderAchievementIcon(post.AchievementIcon, post.AchievementName, '18px')}
                            <span>{post.AchievementName}</span>
                            <span style={{ fontSize: '14px' }}>🎉</span>
                        </div>
                    )}

                    {/* Post Content */}
                    <Title level={2} style={{
                        marginBottom: 20,
                        color: '#1f2937',
                        fontWeight: 800,
                        fontSize: '28px',
                        lineHeight: 1.3,
                        letterSpacing: '-0.5px'
                    }}>
                        {post.Title}
                    </Title>

                    <Paragraph style={{
                        fontSize: '18px',
                        lineHeight: 1.8,
                        marginBottom: 28,
                        color: '#374151',
                        fontWeight: 400,
                        textAlign: 'justify'
                    }}>
                        {post.Content}
                    </Paragraph>

                    {/* Post Actions */}
                    <Divider style={{
                        margin: '24px 0',
                        borderColor: 'rgba(0, 0, 0, 0.06)'
                    }} />

                    <Space size="large" wrap>
                        <Button
                            type="text"
                            icon={liked ?
                                <HeartFilled style={{ color: '#ef4444', fontSize: '20px' }} /> :
                                <HeartOutlined style={{ fontSize: '20px' }} />
                            }
                            onClick={handleLike}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '12px 20px',
                                borderRadius: '16px',
                                color: liked ? '#ef4444' : '#6b7280',
                                fontWeight: 700,
                                fontSize: '16px',
                                background: liked ? 'rgba(239, 68, 68, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                                border: `2px solid ${liked ? 'rgba(239, 68, 68, 0.2)' : 'rgba(107, 114, 128, 0.2)'}`,
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                height: '48px'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = liked ?
                                    '0 8px 24px rgba(239, 68, 68, 0.3)' :
                                    '0 8px 24px rgba(107, 114, 128, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            {post.LikesCount || 0} {liked ? 'đã thích' : 'thích'}
                        </Button>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '12px 20px',
                            borderRadius: '16px',
                            color: '#6b7280',
                            fontWeight: 700,
                            fontSize: '16px',
                            background: 'rgba(107, 114, 128, 0.1)',
                            border: '2px solid rgba(107, 114, 128, 0.2)',
                            height: '48px'
                        }}>
                            <CommentOutlined style={{ fontSize: '20px' }} />
                            {comments.length} bình luận
                        </div>
                    </Space>
                </div>

                {/* Comments Section */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '24px',
                    padding: '32px',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        marginBottom: 28
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px'
                        }}>
                            💬
                        </div>
                        <Title level={3} style={{
                            margin: 0,
                            color: '#1f2937',
                            fontWeight: 700,
                            fontSize: '24px'
                        }}>
                            Bình luận ({comments.length})
                        </Title>
                    </div>

                    {user && (
                        <div style={{
                            marginBottom: 32,
                            padding: '24px',
                            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                            borderRadius: '20px',
                            border: '2px solid rgba(102, 126, 234, 0.1)'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                marginBottom: '16px'
                            }}>
                                <Avatar
                                    src={user.avatar}
                                    size={40}
                                    style={{
                                        border: '2px solid rgba(102, 126, 234, 0.2)',
                                        backgroundColor: '#667eea'
                                    }}
                                >
                                    {user.firstName?.charAt(0)}
                                </Avatar>
                                <Text style={{
                                    fontWeight: 600,
                                    fontSize: '16px',
                                    color: '#374151'
                                }}>
                                    Viết bình luận của bạn
                                </Text>
                            </div>
                            <TextArea
                                rows={4}
                                placeholder="Chia sẻ suy nghĩ của bạn về bài viết này..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                style={{
                                    marginBottom: 16,
                                    borderRadius: '12px',
                                    fontSize: '15px',
                                    border: '2px solid rgba(102, 126, 234, 0.1)',
                                    resize: 'none'
                                }}
                            />
                            <Button
                                type="primary"
                                loading={submittingComment}
                                onClick={handleCommentSubmit}
                                disabled={!commentText.trim()}
                                style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    height: '44px',
                                    paddingInline: '24px',
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    boxShadow: !commentText.trim() ? 'none' : '0 4px 16px rgba(102, 126, 234, 0.4)',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {submittingComment ? 'Đang đăng...' : '📝 Đăng bình luận'}
                            </Button>
                        </div>
                    )}

                    {comments.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '48px 24px',
                            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                            borderRadius: '20px',
                            border: '2px dashed rgba(107, 114, 128, 0.2)'
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💭</div>
                            <Empty
                                description={
                                    <Text style={{
                                        color: '#6b7280',
                                        fontSize: '18px',
                                        fontWeight: 500
                                    }}>
                                        Chưa có bình luận nào
                                    </Text>
                                }
                            />
                            {user && (
                                <Text style={{
                                    color: '#9ca3af',
                                    fontSize: '14px',
                                    fontStyle: 'italic',
                                    marginTop: '8px',
                                    display: 'block'
                                }}>
                                    Hãy là người đầu tiên bình luận về bài viết này! 🎉
                                </Text>
                            )}
                        </div>
                    ) : (
                        <CommentManager
                            comments={comments}
                            setComments={setComments}
                            postId={postId}
                        />
                    )}
                </div>
            </Content>

            {/* Add CSS animations */}
            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                }
                
                .ant-input:focus,
                .ant-input-focused {
                    border-color: #667eea !important;
                    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2) !important;
                }
                
                .ant-btn-primary:not(:disabled):hover {
                    background: linear-gradient(135deg, #5a6fd8 0%, #6b5b95 100%) !important;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5) !important;
                }
                
                .ant-typography-expand {
                    color: #667eea !important;
                    font-weight: 600 !important;
                }
                
                .ant-typography-expand:hover {
                    color: #764ba2 !important;
                }
            `}</style>
        </Layout>
    );
};

export default CommunityDetail; 