import React, { useState, useEffect } from 'react';
import {
    Card,
    Table,
    Button,
    Space,
    message,
    Popconfirm,
    Typography,
    Tabs,
    Tag,
    Avatar,
    Modal,
    Divider,
    Tooltip,
    Badge
} from 'antd';
import {
    DeleteOutlined,
    EyeOutlined,
    MessageOutlined,
    LikeOutlined,
    TrophyOutlined,
    UserOutlined,
    CalendarOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const CommunityModeration = () => {
    const [posts, setPosts] = useState([]);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [selectedComment, setSelectedComment] = useState(null);
    const [postModalVisible, setPostModalVisible] = useState(false);
    const [commentModalVisible, setCommentModalVisible] = useState(false);
    const [deletingPostId, setDeletingPostId] = useState(null);
    const [deletingCommentId, setDeletingCommentId] = useState(null);

    useEffect(() => {
        loadCommunityPosts();
        loadCommunityComments();
    }, []);

    const loadCommunityPosts = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await axios.get('http://smokeking.wibu.me:4000/api/admin/community-posts', {
                headers: { 'Authorization': `Bearer ${token}` },
                withCredentials: true
            });

            if (response.data.success) {
                setPosts(response.data.data);
            }
        } catch (error) {
            console.error('Error loading community posts:', error);
            message.error('Lỗi khi tải danh sách bài viết');
        } finally {
            setLoading(false);
        }
    };

    const loadCommunityComments = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get('http://smokeking.wibu.me:4000/api/admin/community-comments', {
                headers: { 'Authorization': `Bearer ${token}` },
                withCredentials: true
            });

            if (response.data.success) {
                setComments(response.data.data);
            }
        } catch (error) {
            console.error('Error loading community comments:', error);
            message.error('Lỗi khi tải danh sách bình luận');
        }
    };

    const handleDeletePost = async (postId) => {
        try {
            setDeletingPostId(postId);
            const token = localStorage.getItem('adminToken');
            const response = await axios.delete(`http://smokeking.wibu.me:4000/api/admin/community-posts/${postId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
                withCredentials: true
            });

            if (response.data.success) {
                message.success('Đã xóa bài viết thành công');
                setPosts(posts.filter(post => post.PostID !== postId));
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            message.error('Lỗi khi xóa bài viết');
        } finally {
            setDeletingPostId(null);
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            setDeletingCommentId(commentId);
            const token = localStorage.getItem('adminToken');
            const response = await axios.delete(`http://smokeking.wibu.me:4000/api/admin/community-comments/${commentId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
                withCredentials: true
            });

            if (response.data.success) {
                message.success('Đã xóa bình luận thành công');
                setComments(comments.filter(comment => comment.CommentID !== commentId));
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            message.error('Lỗi khi xóa bình luận');
        } finally {
            setDeletingCommentId(null);
        }
    };

    const formatDate = (date) => {
        return formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi });
    };

    const truncateText = (text, maxLength = 100) => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    const postsColumns = [
        {
            title: 'Thông tin bài viết',
            key: 'postInfo',
            render: (_, record) => (
                <div>
                    <div className="flex items-center mb-2">
                        <Avatar
                            size="small"
                            icon={<UserOutlined />}
                            className="mr-2"
                        />
                        <strong>{record.FirstName} {record.LastName}</strong>
                        <Text type="secondary" className="ml-2">({record.Email})</Text>
                    </div>
                    <Title level={5} className="mb-1">{record.Title}</Title>
                    <Paragraph className="mb-2">{truncateText(record.Content, 150)}</Paragraph>
                    {record.AchievementName && (
                        <Tag icon={<TrophyOutlined />} color="gold" className="mb-2">
                            {record.AchievementName}
                        </Tag>
                    )}
                    <div className="flex items-center space-x-4 text-gray-500">
                        <span><CalendarOutlined /> {formatDate(record.CreatedAt)}</span>
                        <span><LikeOutlined /> {record.LikesCount}</span>
                        <span><MessageOutlined /> {record.CommentCount}</span>
                    </div>
                </div>
            ),
            width: '60%'
        },
        {
            title: 'Thống kê',
            key: 'stats',
            render: (_, record) => (
                <div className="text-center">
                    <div className="mb-2">
                        <Badge count={record.LikesCount} showZero color="#52c41a">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <LikeOutlined />
                            </div>
                        </Badge>
                    </div>
                    <div>
                        <Badge count={record.CommentCount} showZero color="#1890ff">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <MessageOutlined />
                            </div>
                        </Badge>
                    </div>
                </div>
            ),
            width: '15%'
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="primary"
                            icon={<EyeOutlined />}
                            size="small"
                            onClick={() => {
                                setSelectedPost(record);
                                setPostModalVisible(true);
                            }}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Xóa bài viết"
                        description="Bạn có chắc muốn xóa bài viết này? Tất cả bình luận liên quan cũng sẽ bị xóa."
                        onConfirm={() => handleDeletePost(record.PostID)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{
                            danger: true,
                            loading: deletingPostId === record.PostID
                        }}
                    >
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                            size="small"
                            loading={deletingPostId === record.PostID}
                        >
                            Xóa
                        </Button>
                    </Popconfirm>
                </Space>
            ),
            width: '25%'
        }
    ];

    const commentsColumns = [
        {
            title: 'Thông tin bình luận',
            key: 'commentInfo',
            render: (_, record) => (
                <div>
                    <div className="flex items-center mb-2">
                        <Avatar
                            size="small"
                            icon={<UserOutlined />}
                            className="mr-2"
                        />
                        <strong>{record.FirstName} {record.LastName}</strong>
                        <Text type="secondary" className="ml-2">({record.Email})</Text>
                    </div>
                    <Text strong className="text-blue-600">Bài viết: {record.PostTitle}</Text>
                    <Paragraph className="mt-2 mb-2">{truncateText(record.Content, 200)}</Paragraph>
                    <div className="text-gray-500">
                        <CalendarOutlined /> {formatDate(record.CreatedAt)}
                    </div>
                </div>
            ),
            width: '70%'
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="primary"
                            icon={<EyeOutlined />}
                            size="small"
                            onClick={() => {
                                setSelectedComment(record);
                                setCommentModalVisible(true);
                            }}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Xóa bình luận"
                        description="Bạn có chắc muốn xóa bình luận này?"
                        onConfirm={() => handleDeleteComment(record.CommentID)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{
                            danger: true,
                            loading: deletingCommentId === record.CommentID
                        }}
                    >
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                            size="small"
                            loading={deletingCommentId === record.CommentID}
                        >
                            Xóa
                        </Button>
                    </Popconfirm>
                </Space>
            ),
            width: '30%'
        }
    ];

    return (
        <div>
            <Card title="Kiểm duyệt Community" className="shadow-md">
                <Tabs defaultActiveKey="posts">
                    <TabPane tab={`Bài viết (${posts.length})`} key="posts">
                        <Table
                            columns={postsColumns}
                            dataSource={posts}
                            rowKey="PostID"
                            loading={loading}
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: true,
                                showTotal: (total, range) =>
                                    `${range[0]}-${range[1]} của ${total} bài viết`,
                            }}
                            scroll={{ x: 1000 }}
                        />
                    </TabPane>
                    <TabPane tab={`Bình luận (${comments.length})`} key="comments">
                        <Table
                            columns={commentsColumns}
                            dataSource={comments}
                            rowKey="CommentID"
                            loading={loading}
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: true,
                                showTotal: (total, range) =>
                                    `${range[0]}-${range[1]} của ${total} bình luận`,
                            }}
                            scroll={{ x: 1000 }}
                        />
                    </TabPane>
                </Tabs>
            </Card>

            {/* Post Detail Modal */}
            <Modal
                title="Chi tiết bài viết"
                open={postModalVisible}
                onCancel={() => {
                    setPostModalVisible(false);
                    setSelectedPost(null);
                }}
                width={800}
                footer={[
                    <Button key="close" onClick={() => setPostModalVisible(false)}>
                        Đóng
                    </Button>,
                    <Popconfirm
                        key="delete"
                        title="Xóa bài viết"
                        description="Bạn có chắc muốn xóa bài viết này?"
                        onConfirm={() => {
                            handleDeletePost(selectedPost?.PostID);
                            setPostModalVisible(false);
                        }}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Button danger icon={<DeleteOutlined />}>
                            Xóa bài viết
                        </Button>
                    </Popconfirm>
                ]}
            >
                {selectedPost && (
                    <div>
                        <div className="mb-4 p-4 bg-gray-50 rounded">
                            <div className="flex items-center mb-2">
                                <Avatar icon={<UserOutlined />} className="mr-2" />
                                <div>
                                    <strong>{selectedPost.FirstName} {selectedPost.LastName}</strong>
                                    <div className="text-gray-500 text-sm">{selectedPost.Email}</div>
                                </div>
                            </div>
                            <div className="text-gray-500 text-sm">
                                Đăng lúc: {new Date(selectedPost.CreatedAt).toLocaleString('vi-VN')}
                            </div>
                        </div>

                        {selectedPost.AchievementName && (
                            <div className="mb-4">
                                <Tag icon={<TrophyOutlined />} color="gold" className="text-base p-2">
                                    Thành tích: {selectedPost.AchievementName}
                                </Tag>
                                {selectedPost.AchievementDescription && (
                                    <div className="mt-2 text-gray-600">
                                        {selectedPost.AchievementDescription}
                                    </div>
                                )}
                            </div>
                        )}

                        <Title level={4}>{selectedPost.Title}</Title>
                        <Paragraph>{selectedPost.Content}</Paragraph>

                        <Divider />

                        <div className="flex justify-between items-center">
                            <div className="flex space-x-4">
                                <span>
                                    <LikeOutlined className="mr-1" />
                                    {selectedPost.LikesCount} lượt thích
                                </span>
                                <span>
                                    <MessageOutlined className="mr-1" />
                                    {selectedPost.CommentCount} bình luận
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Comment Detail Modal */}
            <Modal
                title="Chi tiết bình luận"
                open={commentModalVisible}
                onCancel={() => {
                    setCommentModalVisible(false);
                    setSelectedComment(null);
                }}
                width={600}
                footer={[
                    <Button key="close" onClick={() => setCommentModalVisible(false)}>
                        Đóng
                    </Button>,
                    <Popconfirm
                        key="delete"
                        title="Xóa bình luận"
                        description="Bạn có chắc muốn xóa bình luận này?"
                        onConfirm={() => {
                            handleDeleteComment(selectedComment?.CommentID);
                            setCommentModalVisible(false);
                        }}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Button danger icon={<DeleteOutlined />}>
                            Xóa bình luận
                        </Button>
                    </Popconfirm>
                ]}
            >
                {selectedComment && (
                    <div>
                        <div className="mb-4 p-4 bg-gray-50 rounded">
                            <div className="flex items-center mb-2">
                                <Avatar icon={<UserOutlined />} className="mr-2" />
                                <div>
                                    <strong>{selectedComment.FirstName} {selectedComment.LastName}</strong>
                                    <div className="text-gray-500 text-sm">{selectedComment.Email}</div>
                                </div>
                            </div>
                            <div className="text-gray-500 text-sm">
                                Bình luận lúc: {new Date(selectedComment.CreatedAt).toLocaleString('vi-VN')}
                            </div>
                        </div>

                        <div className="mb-4">
                            <Text strong className="text-blue-600">
                                Bài viết: {selectedComment.PostTitle}
                            </Text>
                        </div>

                        <Title level={5}>Nội dung bình luận:</Title>
                        <Paragraph>{selectedComment.Content}</Paragraph>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default CommunityModeration; 