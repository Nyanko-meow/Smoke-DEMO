import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    Layout,
    Card,
    Button,
    List,
    Avatar,
    Space,
    Typography,
    Tag,
    Divider,
    Empty,
    Spin,
    message,
    Row,
    Col,
    Badge,
    Tooltip,
    Modal,
    Input,
    Form,
    Popconfirm
} from 'antd';
import {
    LikeOutlined,
    LikeFilled,
    CommentOutlined,
    TrophyOutlined,
    PlusOutlined,
    ShareAltOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const CommunityList = () => {
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);
    const [posts, setPosts] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [likedPosts, setLikedPosts] = useState(new Set());
    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [selectedAchievement, setSelectedAchievement] = useState(null);
    const [form] = Form.useForm();
    const [deletingPostId, setDeletingPostId] = useState(null);

    // Helper function to render achievement icon
    const renderAchievementIcon = (iconUrl, size = '32px') => {
        // If no IconURL, show default trophy
        if (!iconUrl) {
            return <span style={{ fontSize: size }}>🏆</span>;
        }

        // If IconURL is already an emoji (length <= 4 and not a path)
        if (iconUrl.length <= 4 && !/^\/|^http|\.png|\.jpg|\.gif|\.svg/i.test(iconUrl)) {
            return <span style={{ fontSize: size, display: 'block', lineHeight: 1 }}>{iconUrl}</span>;
        }

        // If IconURL looks like an image path, show appropriate emoji based on name/type
        if (/\/images\/|\.png|\.jpg|\.gif|\.svg/i.test(iconUrl)) {
            // Try to determine achievement type from URL and show appropriate emoji
            if (/bronze|đầu|first|start/i.test(iconUrl)) return <span style={{ fontSize: size }}>🥉</span>;
            if (/silver|tuần|week/i.test(iconUrl)) return <span style={{ fontSize: size }}>🥈</span>;
            if (/gold|tháng|month/i.test(iconUrl)) return <span style={{ fontSize: size }}>🥇</span>;
            if (/diamond|special|đặc/i.test(iconUrl)) return <span style={{ fontSize: size }}>💎</span>;
            if (/fire|streak|liên/i.test(iconUrl)) return <span style={{ fontSize: size }}>🔥</span>;
            if (/star|sao/i.test(iconUrl)) return <span style={{ fontSize: size }}>⭐</span>;
            if (/crown|vương/i.test(iconUrl)) return <span style={{ fontSize: size }}>👑</span>;
            if (/heart|tim/i.test(iconUrl)) return <span style={{ fontSize: size }}>❤️</span>;
            // Default trophy for any other image paths
            return <span style={{ fontSize: size }}>🏆</span>;
        }

        // Default case
        return <span style={{ fontSize: size }}>🏆</span>;
    };

    useEffect(() => {
        fetchPosts();
        if (user) {
            fetchUserAchievements();
        }
    }, [user]);

    const fetchPosts = async () => {
        try {
            const response = await axios.get('/api/community/posts');
            if (response.data.success) {
                setPosts(response.data.data);
                // Check like status for each post if user is logged in
                if (user) {
                    const likeStatuses = await Promise.all(
                        response.data.data.map(post =>
                            axios.get(`/api/community/posts/${post.PostID}/like-status`, {
                                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                            })
                        )
                    );
                    const likedSet = new Set();
                    likeStatuses.forEach((status, index) => {
                        if (status.data.liked) {
                            likedSet.add(response.data.data[index].PostID);
                        }
                    });
                    setLikedPosts(likedSet);
                }
            }
        } catch (error) {
            message.error('Lỗi khi tải danh sách bài viết');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserAchievements = async () => {
        try {
            const response = await axios.get('/api/achievements/earned', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (response.data.success) {
                setAchievements(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching achievements:', error);
        }
    };

    const handleLike = async (postId) => {
        if (!user) {
            message.warning('Vui lòng đăng nhập để thích bài viết');
            return;
        }

        try {
            const response = await axios.post(`/api/community/posts/${postId}/like`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.data.success) {
                const newLikedPosts = new Set(likedPosts);
                if (response.data.liked) {
                    newLikedPosts.add(postId);
                } else {
                    newLikedPosts.delete(postId);
                }
                setLikedPosts(newLikedPosts);

                // Update posts data
                setPosts(posts.map(post =>
                    post.PostID === postId
                        ? { ...post, LikesCount: response.data.likesCount }
                        : post
                ));
            }
        } catch (error) {
            message.error('Lỗi khi thực hiện like');
        }
    };

    const handleShareAchievement = (achievement) => {
        setSelectedAchievement(achievement);
        setShareModalVisible(true);
    };

    const submitShareAchievement = async (values) => {
        try {
            const response = await axios.post('/api/community/share-achievement', {
                achievementId: selectedAchievement.AchievementID,
                message: values.message
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.data.success) {
                message.success('Đã chia sẻ thành tích thành công!');
                setShareModalVisible(false);
                form.resetFields();
                fetchPosts(); // Refresh posts
            }
        } catch (error) {
            message.error('Lỗi khi chia sẻ thành tích');
        }
    };

    const handleDeletePost = async (postId) => {
        setDeletingPostId(postId);
        try {
            const response = await axios.delete(`/api/community/posts/${postId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.data.success) {
                message.success('Đã xóa bài viết thành công!');
                // Remove post from state
                setPosts(posts.filter(post => post.PostID !== postId));
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
            setDeletingPostId(null);
        }
    };

    const canEditOrDelete = (post) => {
        return user && (user.UserID === post.UserID || user.role === 'admin');
    };

    const renderAchievementTag = (post) => {
        if (!post.AchievementName) return null;

        return (
            <Tag
                icon={renderAchievementIcon(post.AchievementIcon, '14px')}
                color="gold"
                style={{ marginBottom: 8 }}
            >
                {post.AchievementName}
            </Tag>
        );
    };

    if (loading) {
        return (
            <Content style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Spin size="large" />
            </Content>
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
                    top: '10%',
                    left: '10%',
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    animation: 'float 6s ease-in-out infinite'
                }}></div>
                <div style={{
                    position: 'absolute',
                    top: '60%',
                    right: '15%',
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    animation: 'float 8s ease-in-out infinite reverse'
                }}></div>
                <div style={{
                    position: 'absolute',
                    bottom: '20%',
                    left: '20%',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    animation: 'float 7s ease-in-out infinite'
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
                {/* Header Section */}
                <div style={{
                    marginBottom: 32,
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '24px',
                    padding: '32px',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    transform: 'translateY(0)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                    <Row justify="space-between" align="middle">
                        <Col>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '8px' }}>
                                <div style={{
                                    width: '72px',
                                    height: '72px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '32px',
                                    boxShadow: '0 8px 24px rgba(251, 191, 36, 0.4)',
                                    transform: 'scale(1)',
                                    transition: 'transform 0.3s ease'
                                }}>
                                    🌟
                                </div>
                                <div>
                                    <Title level={2} style={{
                                        margin: 0,
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        backgroundClip: 'text',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        fontWeight: 800,
                                        fontSize: '28px',
                                        letterSpacing: '-0.5px'
                                    }}>
                                        Cộng đồng cai thuốc
                                    </Title>
                                    <Text style={{
                                        color: '#6b7280',
                                        fontSize: '16px',
                                        fontWeight: 500,
                                        letterSpacing: '0.3px'
                                    }}>
                                        Chia sẻ hành trình và động viên lẫn nhau 💪
                                    </Text>
                                </div>
                            </div>
                        </Col>
                        <Col>
                            {user && (
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => navigate('/community/new')}
                                    style={{
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        border: 'none',
                                        borderRadius: '16px',
                                        height: '52px',
                                        paddingInline: '28px',
                                        fontSize: '16px',
                                        fontWeight: 700,
                                        boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        transform: 'translateY(0)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.5)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.4)';
                                    }}
                                >
                                    <span style={{ fontSize: '18px' }}>✨</span>
                                    Tạo bài viết
                                </Button>
                            )}
                        </Col>
                    </Row>
                </div>

                {/* User achievements section */}
                {user && achievements.length > 0 && (
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '24px',
                        padding: '28px',
                        marginBottom: 28,
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* Decorative background pattern */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: '200px',
                            height: '200px',
                            background: 'radial-gradient(circle, rgba(251, 191, 36, 0.1) 0%, transparent 70%)',
                            borderRadius: '50%',
                            transform: 'translate(50%, -50%)'
                        }}></div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            marginBottom: '24px',
                            position: 'relative',
                            zIndex: 1
                        }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px',
                                boxShadow: '0 6px 20px rgba(251, 191, 36, 0.3)'
                            }}>
                                🏆
                            </div>
                            <div>
                                <Title level={4} style={{
                                    margin: 0,
                                    color: '#1f2937',
                                    fontWeight: 700,
                                    fontSize: '20px'
                                }}>
                                    Huy hiệu của bạn
                                </Title>
                                <Text style={{
                                    color: '#6b7280',
                                    fontSize: '14px'
                                }}>
                                    Chia sẻ thành tích với cộng đồng
                                </Text>
                            </div>
                        </div>
                        <Row gutter={[20, 20]} style={{ position: 'relative', zIndex: 1 }}>
                            {achievements.map((achievement) => (
                                <Col key={achievement.AchievementID} xs={12} sm={8} md={6}>
                                    <div
                                        style={{
                                            textAlign: 'center',
                                            background: 'linear-gradient(135deg, #fef3c7 0%, #fef08a 50%, #fbbf24 100%)',
                                            borderRadius: '20px',
                                            padding: '24px 16px',
                                            cursor: 'pointer',
                                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                            border: '2px solid rgba(251, 191, 36, 0.3)',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            transform: 'translateY(0) scale(1)',
                                            boxShadow: '0 4px 12px rgba(251, 191, 36, 0.2)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
                                            e.currentTarget.style.boxShadow = '0 16px 32px rgba(251, 191, 36, 0.4)';
                                            e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.6)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(251, 191, 36, 0.2)';
                                            e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.3)';
                                        }}
                                        onClick={() => handleShareAchievement(achievement)}
                                    >
                                        {/* Shimmer effect */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '-50%',
                                            left: '-50%',
                                            width: '200%',
                                            height: '200%',
                                            background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%)',
                                            transform: 'rotate(45deg)',
                                            animation: 'shimmer 3s infinite',
                                            pointerEvents: 'none'
                                        }}></div>

                                        <div style={{
                                            marginBottom: 16,
                                            fontSize: '40px',
                                            transform: 'scale(1)',
                                            transition: 'transform 0.3s ease',
                                            position: 'relative',
                                            zIndex: 1
                                        }}>
                                            {renderAchievementIcon(achievement.IconURL, '40px')}
                                        </div>
                                        <Text strong style={{
                                            fontSize: '14px',
                                            color: '#92400e',
                                            display: 'block',
                                            lineHeight: 1.4,
                                            fontWeight: 700,
                                            position: 'relative',
                                            zIndex: 1
                                        }}>
                                            {achievement.Name}
                                        </Text>
                                        <div style={{
                                            position: 'absolute',
                                            top: '12px',
                                            right: '12px',
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: '50%',
                                            background: 'rgba(255, 255, 255, 0.9)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '14px',
                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                            transition: 'all 0.3s ease',
                                            zIndex: 2
                                        }}>
                                            <ShareAltOutlined style={{ color: '#f59e0b' }} />
                                        </div>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    </div>
                )}

                {/* Posts list */}
                {posts.length === 0 ? (
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '24px',
                        padding: '64px 48px',
                        textAlign: 'center',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                        <Empty
                            description={
                                <Text style={{
                                    color: '#6b7280',
                                    fontSize: '18px',
                                    fontWeight: 500
                                }}>
                                    Chưa có bài viết nào trong cộng đồng
                                </Text>
                            }
                        />
                        {user && (
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => navigate('/community/new')}
                                style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    height: '44px',
                                    paddingInline: '24px',
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    marginTop: '16px'
                                }}
                            >
                                Tạo bài viết đầu tiên
                            </Button>
                        )}
                    </div>
                ) : (
                    <List
                        dataSource={posts}
                        renderItem={(post) => (
                            <div style={{
                                marginBottom: 24,
                                background: 'rgba(255, 255, 255, 0.95)',
                                borderRadius: '24px',
                                padding: '28px',
                                backdropFilter: 'blur(20px)',
                                boxShadow: '0 12px 28px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                cursor: 'pointer',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.06)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04)';
                                }}
                            >
                                {/* Subtle gradient overlay */}
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: '4px',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    borderRadius: '24px 24px 0 0'
                                }}></div>

                                <List.Item.Meta
                                    avatar={
                                        <div style={{ position: 'relative' }}>
                                            <Avatar
                                                src={post.Avatar}
                                                size={56}
                                                style={{
                                                    border: '3px solid rgba(102, 126, 234, 0.2)',
                                                    backgroundColor: '#667eea',
                                                    fontSize: '20px',
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
                                                        width: '28px',
                                                        height: '28px',
                                                        borderRadius: '50%',
                                                        background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '14px',
                                                        border: '2px solid white',
                                                        boxShadow: '0 2px 8px rgba(251, 191, 36, 0.4)'
                                                    }}>
                                                        {renderAchievementIcon(post.AchievementIcon, '14px')}
                                                    </div>
                                                </Tooltip>
                                            )}
                                        </div>
                                    }
                                    title={
                                        <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                            <Space align="center" wrap>
                                                <Text strong style={{
                                                    fontSize: '18px',
                                                    color: '#1f2937',
                                                    fontWeight: 700
                                                }}>
                                                    {`${post.FirstName} ${post.LastName}`}
                                                </Text>
                                                <div style={{
                                                    width: '6px',
                                                    height: '6px',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#d1d5db'
                                                }} />
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
                                            </Space>
                                            {post.AchievementName && (
                                                <div style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    background: 'linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%)',
                                                    color: '#92400e',
                                                    padding: '6px 16px',
                                                    borderRadius: '24px',
                                                    fontSize: '13px',
                                                    fontWeight: 700,
                                                    border: '1px solid rgba(251, 191, 36, 0.3)',
                                                    boxShadow: '0 2px 8px rgba(251, 191, 36, 0.2)',
                                                    transition: 'all 0.3s ease'
                                                }}>
                                                    {renderAchievementIcon(post.AchievementIcon, '16px')}
                                                    <span>{post.AchievementName}</span>
                                                    <span style={{ fontSize: '12px' }}>🎉</span>
                                                </div>
                                            )}
                                        </Space>
                                    }
                                    description={
                                        <div style={{ marginTop: '16px' }}>
                                            <Title level={5} style={{
                                                marginTop: 0,
                                                marginBottom: 16,
                                                color: '#1f2937',
                                                fontSize: '20px',
                                                fontWeight: 700,
                                                lineHeight: 1.4
                                            }}>
                                                {post.Title}
                                            </Title>
                                            <Paragraph
                                                ellipsis={{ rows: 3, expandable: true, symbol: 'Xem thêm' }}
                                                style={{
                                                    marginBottom: 24,
                                                    color: '#4b5563',
                                                    fontSize: '16px',
                                                    lineHeight: 1.7,
                                                    fontWeight: 400
                                                }}
                                            >
                                                {post.Content}
                                            </Paragraph>
                                        </div>
                                    }
                                />

                                <Divider style={{
                                    margin: '20px 0',
                                    borderColor: 'rgba(0, 0, 0, 0.06)'
                                }} />

                                <Space size="large" wrap>
                                    <Button
                                        type="text"
                                        icon={likedPosts.has(post.PostID) ?
                                            <LikeFilled style={{ color: '#ef4444', fontSize: '18px' }} /> :
                                            <LikeOutlined style={{ fontSize: '18px' }} />
                                        }
                                        onClick={() => handleLike(post.PostID)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '10px 16px',
                                            borderRadius: '12px',
                                            color: likedPosts.has(post.PostID) ? '#ef4444' : '#6b7280',
                                            fontWeight: 600,
                                            fontSize: '15px',
                                            transition: 'all 0.3s ease',
                                            border: '1px solid transparent'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = likedPosts.has(post.PostID) ? '#fef2f2' : '#f9fafb';
                                            e.currentTarget.style.borderColor = likedPosts.has(post.PostID) ? '#fecaca' : '#e5e7eb';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                            e.currentTarget.style.borderColor = 'transparent';
                                        }}
                                    >
                                        {post.LikesCount || 0}
                                    </Button>

                                    <Button
                                        type="text"
                                        icon={<CommentOutlined style={{ fontSize: '18px' }} />}
                                        onClick={() => navigate(`/community/${post.PostID}`)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '10px 16px',
                                            borderRadius: '12px',
                                            color: '#6b7280',
                                            fontWeight: 600,
                                            fontSize: '15px',
                                            transition: 'all 0.3s ease',
                                            border: '1px solid transparent'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#f9fafb';
                                            e.currentTarget.style.borderColor = '#e5e7eb';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                            e.currentTarget.style.borderColor = 'transparent';
                                        }}
                                    >
                                        {post.CommentCount || 0}
                                    </Button>

                                    <Button
                                        type="text"
                                        onClick={() => navigate(`/community/${post.PostID}`)}
                                        style={{
                                            padding: '10px 20px',
                                            borderRadius: '12px',
                                            color: '#667eea',
                                            fontWeight: 700,
                                            fontSize: '15px',
                                            background: 'rgba(102, 126, 234, 0.1)',
                                            border: '1px solid rgba(102, 126, 234, 0.2)',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                                            e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.4)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                                            e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.2)';
                                        }}
                                    >
                                        Xem chi tiết →
                                    </Button>

                                    {canEditOrDelete(post) && (
                                        <Popconfirm
                                            title="Bạn có chắc muốn xóa bài viết này?"
                                            description="Hành động này không thể hoàn tác và sẽ xóa tất cả bình luận liên quan."
                                            onConfirm={() => handleDeletePost(post.PostID)}
                                            okText="Xóa"
                                            cancelText="Hủy"
                                            okButtonProps={{ danger: true, loading: deletingPostId === post.PostID }}
                                            disabled={deletingPostId === post.PostID}
                                        >
                                            <Button
                                                type="text"
                                                danger
                                                icon={<DeleteOutlined style={{ fontSize: '16px' }} />}
                                                loading={deletingPostId === post.PostID}
                                                disabled={deletingPostId === post.PostID}
                                                style={{
                                                    padding: '10px 16px',
                                                    borderRadius: '12px',
                                                    fontWeight: 600,
                                                    fontSize: '15px',
                                                    border: '1px solid transparent',
                                                    transition: 'all 0.3s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#fef2f2';
                                                    e.currentTarget.style.borderColor = '#fecaca';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                    e.currentTarget.style.borderColor = 'transparent';
                                                }}
                                            >
                                                {deletingPostId === post.PostID ? 'Đang xóa...' : 'Xóa'}
                                            </Button>
                                        </Popconfirm>
                                    )}
                                </Space>
                            </div>
                        )}
                    />
                )}

                {/* Share Achievement Modal */}
                <Modal
                    title={
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontSize: '18px',
                            fontWeight: 700
                        }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '16px'
                            }}>
                                {selectedAchievement && renderAchievementIcon(selectedAchievement.IconURL, '16px')}
                            </div>
                            Chia sẻ huy hiệu: {selectedAchievement?.Name}
                        </div>
                    }
                    open={shareModalVisible}
                    onCancel={() => setShareModalVisible(false)}
                    footer={null}
                    style={{
                        borderRadius: '20px'
                    }}
                    styles={{
                        body: { padding: '24px' }
                    }}
                >
                    <Form
                        form={form}
                        onFinish={submitShareAchievement}
                        layout="vertical"
                    >
                        <Form.Item
                            name="message"
                            label={
                                <Text style={{ fontSize: '16px', fontWeight: 600 }}>
                                    Thông điệp chia sẻ
                                </Text>
                            }
                        >
                            <TextArea
                                rows={4}
                                placeholder={`Tôi vừa đạt được huy hiệu "${selectedAchievement?.Name}"! ${selectedAchievement?.Description || 'Cùng nhau cố gắng nhé! 💪'}`}
                                style={{
                                    borderRadius: '12px',
                                    fontSize: '15px',
                                    resize: 'none'
                                }}
                            />
                        </Form.Item>
                        <Form.Item style={{ marginBottom: 0 }}>
                            <Space size="large">
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    style={{
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        border: 'none',
                                        borderRadius: '12px',
                                        height: '44px',
                                        paddingInline: '24px',
                                        fontSize: '16px',
                                        fontWeight: 600
                                    }}
                                >
                                    ✨ Chia sẻ
                                </Button>
                                <Button
                                    onClick={() => setShareModalVisible(false)}
                                    style={{
                                        borderRadius: '12px',
                                        height: '44px',
                                        paddingInline: '24px',
                                        fontSize: '16px',
                                        fontWeight: 600
                                    }}
                                >
                                    Hủy
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Modal>
            </Content>

            {/* Add CSS animations */}
            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                }
                
                @keyframes shimmer {
                    0% { transform: translateX(-100%) rotate(45deg); }
                    100% { transform: translateX(100%) rotate(45deg); }
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

export default CommunityList; 