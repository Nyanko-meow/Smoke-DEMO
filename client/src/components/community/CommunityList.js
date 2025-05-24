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
                icon={<TrophyOutlined />}
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
        <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
            <Content style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                <div style={{ marginBottom: 24 }}>
                    <Row justify="space-between" align="middle">
                        <Col>
                            <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                                🌟 Cộng đồng cai thuốc
                            </Title>
                            <Text type="secondary">Chia sẻ hành trình và động viên lẫn nhau</Text>
                        </Col>
                        <Col>
                            {user && (
                                <Space>
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        onClick={() => navigate('/community/new')}
                                    >
                                        Tạo bài viết
                                    </Button>
                                </Space>
                            )}
                        </Col>
                    </Row>
                </div>

                {/* User achievements section */}
                {user && achievements.length > 0 && (
                    <Card style={{ marginBottom: 24 }}>
                        <Title level={4}>🏆 Huy hiệu của bạn</Title>
                        <Row gutter={[16, 16]}>
                            {achievements.map((achievement) => (
                                <Col key={achievement.AchievementID} xs={12} sm={8} md={6}>
                                    <Card
                                        size="small"
                                        hoverable
                                        style={{ textAlign: 'center' }}
                                        actions={[
                                            <Tooltip title="Chia sẻ thành tích">
                                                <Button
                                                    type="text"
                                                    icon={<ShareAltOutlined />}
                                                    onClick={() => handleShareAchievement(achievement)}
                                                />
                                            </Tooltip>
                                        ]}
                                    >
                                        <div style={{ fontSize: '32px', marginBottom: 8 }}>
                                            {achievement.IconURL ? (
                                                <img
                                                    src={achievement.IconURL}
                                                    alt={achievement.Name}
                                                    style={{ width: 32, height: 32 }}
                                                />
                                            ) : (
                                                '🏆'
                                            )}
                                        </div>
                                        <Text strong style={{ fontSize: '12px' }}>{achievement.Name}</Text>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </Card>
                )}

                {/* Posts list */}
                {posts.length === 0 ? (
                    <Card>
                        <Empty description="Chưa có bài viết nào" />
                    </Card>
                ) : (
                    <List
                        dataSource={posts}
                        renderItem={(post) => (
                            <Card style={{ marginBottom: 16 }} hoverable>
                                <List.Item.Meta
                                    avatar={
                                        <Avatar
                                            src={post.Avatar}
                                            size="large"
                                        >
                                            {post.FirstName?.charAt(0)}
                                        </Avatar>
                                    }
                                    title={
                                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                            <Space>
                                                <Text strong>{`${post.FirstName} ${post.LastName}`}</Text>
                                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                                    {formatDistanceToNow(new Date(post.CreatedAt), {
                                                        addSuffix: true,
                                                        locale: vi
                                                    })}
                                                </Text>
                                            </Space>
                                            {renderAchievementTag(post)}
                                        </Space>
                                    }
                                    description={
                                        <div>
                                            <Title level={5} style={{ marginTop: 8, marginBottom: 8 }}>
                                                {post.Title}
                                            </Title>
                                            <Paragraph
                                                ellipsis={{ rows: 3, expandable: true, symbol: 'Xem thêm' }}
                                                style={{ marginBottom: 16 }}
                                            >
                                                {post.Content}
                                            </Paragraph>
                                        </div>
                                    }
                                />

                                <Divider style={{ margin: '12px 0' }} />

                                <Space size="large">
                                    <Button
                                        type="text"
                                        icon={likedPosts.has(post.PostID) ? <LikeFilled style={{ color: '#1890ff' }} /> : <LikeOutlined />}
                                        onClick={() => handleLike(post.PostID)}
                                    >
                                        {post.LikesCount || 0}
                                    </Button>

                                    <Button
                                        type="text"
                                        icon={<CommentOutlined />}
                                        onClick={() => navigate(`/community/${post.PostID}`)}
                                    >
                                        {post.CommentCount || 0}
                                    </Button>

                                    <Button
                                        type="text"
                                        onClick={() => navigate(`/community/${post.PostID}`)}
                                    >
                                        Xem chi tiết
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
                                                icon={<DeleteOutlined />}
                                                loading={deletingPostId === post.PostID}
                                                disabled={deletingPostId === post.PostID}
                                            >
                                                {deletingPostId === post.PostID ? 'Đang xóa...' : 'Xóa'}
                                            </Button>
                                        </Popconfirm>
                                    )}
                                </Space>
                            </Card>
                        )}
                    />
                )}

                {/* Share Achievement Modal */}
                <Modal
                    title={`Chia sẻ huy hiệu: ${selectedAchievement?.Name}`}
                    open={shareModalVisible}
                    onCancel={() => setShareModalVisible(false)}
                    footer={null}
                >
                    <Form
                        form={form}
                        onFinish={submitShareAchievement}
                        layout="vertical"
                    >
                        <Form.Item
                            name="message"
                            label="Thông điệp chia sẻ"
                        >
                            <TextArea
                                rows={4}
                                placeholder={`Tôi vừa đạt được huy hiệu "${selectedAchievement?.Name}"! ${selectedAchievement?.Description}`}
                            />
                        </Form.Item>
                        <Form.Item>
                            <Space>
                                <Button type="primary" htmlType="submit">
                                    Chia sẻ
                                </Button>
                                <Button onClick={() => setShareModalVisible(false)}>
                                    Hủy
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Modal>
            </Content>
        </Layout>
    );
};

export default CommunityList; 