import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Layout,
    Row,
    Col,
    Card,
    Typography,
    Button,
    Empty,
    Spin,
    Space,
    Avatar,
    Tag,
    Divider
} from 'antd';
import {
    PlusOutlined,
    EyeOutlined,
    MessageOutlined,
    UserOutlined,
    EditOutlined
} from '@ant-design/icons';
import { getBlogPosts } from '../../store/slices/blogSlice';
import { formatDate } from '../../utils/dateUtils';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const BlogList = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { posts, loading, error } = useSelector(state => state.blog);
    const { user } = useSelector(state => state.auth);

    useEffect(() => {
        dispatch(getBlogPosts());
    }, [dispatch]);

    if (loading) {
        return (
            <Layout style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
                <Content style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '60vh'
                }}>
                    <Spin size="large" tip="Đang tải bài viết..." />
                </Content>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
                <Content style={{
                    padding: '32px 24px',
                    maxWidth: '1200px',
                    margin: '0 auto',
                    width: '100%'
                }}>
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.95)',
                        borderRadius: '20px',
                        padding: '48px',
                        textAlign: 'center',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                        <Title level={4} style={{ color: 'white', margin: 0, marginBottom: '16px' }}>
                            {error}
                        </Title>
                        <Button
                            type="primary"
                            size="large"
                            onClick={() => dispatch(getBlogPosts())}
                            style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: '2px solid rgba(255, 255, 255, 0.3)',
                                borderRadius: '12px'
                            }}
                        >
                            Thử lại
                        </Button>
                    </div>
                </Content>
            </Layout>
        );
    }

    return (
        <Layout style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
            <Content style={{
                padding: '32px 24px',
                maxWidth: '1200px',
                margin: '0 auto',
                width: '100%'
            }}>
                {/* Header Section */}
                <div style={{
                    marginBottom: 32,
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '20px',
                    padding: '32px',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '28px',
                                color: 'white'
                            }}>
                                📝
                            </div>
                            <div>
                                <Title level={2} style={{
                                    margin: 0,
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    fontWeight: 700
                                }}>
                                    Blog SmokieKing
                                </Title>
                                <Text style={{
                                    color: '#6b7280',
                                    fontSize: '16px',
                                    fontWeight: 500
                                }}>
                                    Chia sẻ hành trình cai thuốc và truyền cảm hứng cho cộng đồng
                                </Text>
                            </div>
                        </div>
                        {user && (
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                size="large"
                                onClick={() => navigate('/blog/new')}
                                style={{
                                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    height: '48px',
                                    paddingInline: '24px',
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    boxShadow: '0 4px 20px rgba(245, 158, 11, 0.4)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                Viết bài mới
                            </Button>
                        )}
                    </div>
                </div>

                {/* Blog Posts Grid */}
                {posts.length === 0 ? (
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '20px',
                        padding: '64px 32px',
                        textAlign: 'center',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                        <Empty
                            image={
                                <div style={{
                                    fontSize: '72px',
                                    marginBottom: '24px'
                                }}>
                                    📰
                                </div>
                            }
                            description={
                                <div>
                                    <Title level={4} style={{ color: '#6b7280', marginBottom: '8px' }}>
                                        Chưa có bài viết nào
                                    </Title>
                                    <Text style={{ color: '#9ca3af', fontSize: '16px' }}>
                                        Hãy là người đầu tiên chia sẻ câu chuyện của bạn!
                                    </Text>
                                </div>
                            }
                        />
                        {user && (
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                size="large"
                                onClick={() => navigate('/blog/new')}
                                style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    marginTop: '24px',
                                    height: '48px',
                                    paddingInline: '32px',
                                    fontSize: '16px',
                                    fontWeight: 600
                                }}
                            >
                                Viết bài đầu tiên
                            </Button>
                        )}
                    </div>
                ) : (
                    <Row gutter={[24, 24]}>
                        {posts.map((post) => (
                            <Col key={post.PostID} xs={24} md={12} lg={8}>
                                <div
                                    style={{
                                        height: '100%',
                                        background: 'rgba(255, 255, 255, 0.95)',
                                        borderRadius: '20px',
                                        backdropFilter: 'blur(20px)',
                                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}
                                    onClick={() => navigate(`/blog/${post.PostID}`)}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-8px)';
                                        e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
                                    }}
                                >
                                    {/* Image */}
                                    <div style={{
                                        height: '200px',
                                        background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        {post.ThumbnailURL ? (
                                            <img
                                                src={post.ThumbnailURL}
                                                alt={post.Title}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover'
                                                }}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.parentNode.innerHTML = `
                                                        <div style="
                                                            width: 100%;
                                                            height: 100%;
                                                            display: flex;
                                                            align-items: center;
                                                            justify-content: center;
                                                            font-size: 48px;
                                                            background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
                                                        ">📖</div>
                                                    `;
                                                }}
                                            />
                                        ) : (
                                            <div style={{ fontSize: '48px' }}>📖</div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                        <Title level={5} style={{
                                            margin: 0,
                                            marginBottom: '12px',
                                            color: '#1f2937',
                                            fontWeight: 600,
                                            lineHeight: '1.4',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            minHeight: '2.8em'
                                        }}>
                                            {post.Title}
                                        </Title>

                                        {post.MetaDescription && (
                                            <Paragraph
                                                style={{
                                                    color: '#6b7280',
                                                    fontSize: '14px',
                                                    lineHeight: '1.5',
                                                    margin: 0,
                                                    marginBottom: '16px',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 3,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    minHeight: '4.5em'
                                                }}
                                            >
                                                {post.MetaDescription}
                                            </Paragraph>
                                        )}

                                        {/* Author Info */}
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                                            <Avatar
                                                size={32}
                                                icon={<UserOutlined />}
                                                style={{
                                                    backgroundColor: '#667eea',
                                                    marginRight: '8px'
                                                }}
                                            />
                                            <Text style={{
                                                color: '#6b7280',
                                                fontSize: '13px',
                                                fontWeight: 500
                                            }}>
                                                {post.AuthorFirstName} {post.AuthorLastName}
                                            </Text>
                                        </div>

                                        {/* Stats and Date */}
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginTop: 'auto',
                                            paddingTop: '12px',
                                            borderTop: '1px solid rgba(0, 0, 0, 0.06)'
                                        }}>
                                            <Space size={12}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <EyeOutlined style={{ fontSize: '14px', color: '#9ca3af' }} />
                                                    <Text style={{ fontSize: '12px', color: '#9ca3af' }}>
                                                        {post.Views || 0}
                                                    </Text>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <MessageOutlined style={{ fontSize: '14px', color: '#9ca3af' }} />
                                                    <Text style={{ fontSize: '12px', color: '#9ca3af' }}>
                                                        {post.CommentCount || 0}
                                                    </Text>
                                                </div>
                                            </Space>
                                            <Text style={{
                                                fontSize: '12px',
                                                color: '#9ca3af',
                                                fontWeight: 500
                                            }}>
                                                {formatDate(post.CreatedAt)}
                                            </Text>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                )}

                {/* Call to Action */}
                {posts.length > 0 && user && (
                    <div style={{
                        marginTop: '48px',
                        background: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '20px',
                        padding: '48px 32px',
                        textAlign: 'center',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '32px',
                            margin: '0 auto 24px',
                            color: 'white'
                        }}>
                            <EditOutlined />
                        </div>
                        <Title level={3} style={{
                            color: '#1f2937',
                            marginBottom: '12px',
                            fontWeight: 600
                        }}>
                            Bạn có câu chuyện để chia sẻ?
                        </Title>
                        <Text style={{
                            color: '#6b7280',
                            fontSize: '16px',
                            display: 'block',
                            marginBottom: '32px',
                            lineHeight: '1.6'
                        }}>
                            Hãy viết về hành trình cai thuốc của bạn để truyền cảm hứng cho những người khác
                        </Text>
                        <Button
                            type="primary"
                            size="large"
                            icon={<PlusOutlined />}
                            onClick={() => navigate('/blog/new')}
                            style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                border: 'none',
                                borderRadius: '12px',
                                height: '52px',
                                paddingInline: '32px',
                                fontSize: '16px',
                                fontWeight: 600,
                                boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
                            }}
                        >
                            Chia sẻ câu chuyện
                        </Button>
                    </div>
                )}
            </Content>
        </Layout>
    );
};

export default BlogList; 