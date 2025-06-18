import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    Layout,
    Form,
    Input,
    Button,
    Typography,
    Spin,
    message,
    Space,
    Upload,
    Card,
    Divider
} from 'antd';
import {
    ArrowLeftOutlined,
    SaveOutlined,
    EyeOutlined,
    PictureOutlined,
    SendOutlined,
    EditOutlined
} from '@ant-design/icons';
import { createBlogPost, updateBlogPost, getBlogPost, clearError, clearSuccess } from '../../store/slices/blogSlice';

const { Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

const BlogEditor = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { currentPost, loading, error, success } = useSelector(state => state.blog);
    const { user } = useSelector(state => state.auth);

    const [form] = Form.useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [postStatus, setPostStatus] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState('');

    useEffect(() => {
        if (postId) {
            dispatch(getBlogPost(postId));
        }
        return () => {
            dispatch(clearError());
            dispatch(clearSuccess());
        };
    }, [dispatch, postId]);

    useEffect(() => {
        if (currentPost && postId) {
            form.setFieldsValue({
                title: currentPost.Title || '',
                content: currentPost.Content || '',
                metaDescription: currentPost.MetaDescription || '',
                thumbnailURL: currentPost.ThumbnailURL || ''
            });
            setThumbnailPreview(currentPost.ThumbnailURL || '');
        }
    }, [currentPost, postId, form]);

    useEffect(() => {
        if (success) {
            message.success(postId ? 'Bài viết đã được cập nhật thành công!' : 'Bài viết đã được tạo thành công!');
            setTimeout(() => {
                navigate('/blog');
            }, 2000);
        }
    }, [success, navigate, postId]);

    useEffect(() => {
        if (error) {
            message.error(error);
        }
    }, [error]);

    const handleSubmit = async (values) => {
        if (isSubmitting || loading) {
            return;
        }

        setIsSubmitting(true);

        try {
            // Clean up thumbnail URL if empty
            const cleanValues = {
                ...values,
                thumbnailURL: values.thumbnailURL?.trim() || ''
            };

            console.log('Submitting blog post with values:', cleanValues);

            let result;
            if (postId) {
                result = await dispatch(updateBlogPost({
                    postId,
                    postData: { ...cleanValues, status: 'published' }
                }));

                if (updateBlogPost.fulfilled.match(result)) {
                    setPostStatus('published');
                } else {
                    console.error('Update failed:', result.payload);
                    message.error(result.payload || 'Lỗi khi cập nhật bài viết');
                    setIsSubmitting(false);
                    return;
                }
            } else {
                result = await dispatch(createBlogPost(cleanValues));

                if (createBlogPost.fulfilled.match(result)) {
                    const { status } = result.payload;
                    setPostStatus(status);
                    console.log('Blog post created with status:', status);
                } else {
                    console.error('Create failed:', result.payload);
                    message.error(result.payload || 'Lỗi khi tạo bài viết');
                    setIsSubmitting(false);
                    return;
                }
            }
        } catch (error) {
            console.error('Error submitting blog post:', error);
            message.error('Có lỗi xảy ra khi xử lý bài viết');
            setIsSubmitting(false);
        }
    };

    const handleThumbnailChange = (e) => {
        const url = e.target.value;
        setThumbnailPreview(url);
    };

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

    return (
        <Layout style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
            <Content style={{
                padding: '32px 24px',
                maxWidth: '900px',
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                        <Button
                            type="text"
                            icon={<ArrowLeftOutlined />}
                            onClick={() => navigate('/blog')}
                            style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                background: 'rgba(59, 130, 246, 0.1)',
                                border: '2px solid rgba(59, 130, 246, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px',
                                color: '#3b82f6',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = '#3b82f6';
                                e.target.style.color = 'white';
                                e.target.style.transform = 'scale(1.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'rgba(59, 130, 246, 0.1)';
                                e.target.style.color = '#3b82f6';
                                e.target.style.transform = 'scale(1)';
                            }}
                        />
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '24px',
                                    color: 'white'
                                }}>
                                    <EditOutlined />
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
                                        {postId ? 'Chỉnh sửa bài viết' : 'Viết bài mới'}
                                    </Title>
                                    <Text style={{
                                        color: '#6b7280',
                                        fontSize: '16px',
                                        fontWeight: 500
                                    }}>
                                        Chia sẻ kinh nghiệm và truyền cảm hứng cho cộng đồng
                                    </Text>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Section */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '20px',
                    padding: '32px',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    marginBottom: '24px'
                }}>
                    <Spin spinning={loading || isSubmitting} tip="Đang xử lý...">
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleSubmit}
                            size="large"
                        >
                            {/* Title */}
                            <Form.Item
                                name="title"
                                label={
                                    <Text style={{
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        color: '#1f2937'
                                    }}>
                                        Tiêu đề bài viết
                                    </Text>
                                }
                                rules={[
                                    { required: true, message: 'Vui lòng nhập tiêu đề!' },
                                    { min: 10, message: 'Tiêu đề phải có ít nhất 10 ký tự!' },
                                    { max: 200, message: 'Tiêu đề không được quá 200 ký tự!' }
                                ]}
                                style={{ marginBottom: '24px' }}
                            >
                                <Input
                                    placeholder="Nhập tiêu đề hấp dẫn cho bài viết của bạn..."
                                    style={{
                                        borderRadius: '12px',
                                        height: '52px',
                                        fontSize: '16px',
                                        border: '2px solid #e5e7eb',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#3b82f6';
                                        e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#e5e7eb';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </Form.Item>

                            {/* Meta Description */}
                            <Form.Item
                                name="metaDescription"
                                label={
                                    <Text style={{
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        color: '#1f2937'
                                    }}>
                                        Mô tả ngắn
                                    </Text>
                                }
                                rules={[
                                    { max: 300, message: 'Mô tả không được quá 300 ký tự!' }
                                ]}
                                style={{ marginBottom: '24px' }}
                            >
                                <TextArea
                                    rows={3}
                                    placeholder="Mô tả ngắn gọn về nội dung bài viết... (tối đa 300 ký tự)"
                                    maxLength={300}
                                    showCount
                                    style={{
                                        borderRadius: '12px',
                                        fontSize: '15px',
                                        border: '2px solid #e5e7eb',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#3b82f6';
                                        e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#e5e7eb';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </Form.Item>

                            {/* Thumbnail URL */}
                            <Form.Item
                                name="thumbnailURL"
                                label={
                                    <Text style={{
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        color: '#1f2937'
                                    }}>
                                        URL hình ảnh đại diện (tùy chọn)
                                    </Text>
                                }
                                rules={[
                                    {
                                        pattern: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
                                        message: 'Vui lòng nhập URL hợp lệ!'
                                    },
                                    {
                                        max: 500,
                                        message: 'URL không được quá 500 ký tự!'
                                    }
                                ]}
                                style={{ marginBottom: thumbnailPreview ? '16px' : '24px' }}
                            >
                                <Input
                                    placeholder="https://example.com/image.jpg (không bắt buộc)"
                                    onChange={handleThumbnailChange}
                                    style={{
                                        borderRadius: '12px',
                                        height: '52px',
                                        fontSize: '16px',
                                        border: '2px solid #e5e7eb',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#3b82f6';
                                        e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#e5e7eb';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </Form.Item>

                            {/* Image Preview */}
                            {thumbnailPreview && (
                                <div style={{ marginBottom: '24px' }}>
                                    <Text style={{
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        color: '#6b7280',
                                        display: 'block',
                                        marginBottom: '8px'
                                    }}>
                                        Xem trước hình ảnh:
                                    </Text>
                                    <div style={{
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        border: '2px solid #e5e7eb',
                                        maxHeight: '300px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: '#f9fafb'
                                    }}>
                                        <img
                                            src={thumbnailPreview}
                                            alt="Preview"
                                            style={{
                                                width: '100%',
                                                maxHeight: '300px',
                                                objectFit: 'cover'
                                            }}
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.parentNode.innerHTML = `
                                                    <div style="
                                                        padding: 48px;
                                                        text-align: center;
                                                        color: #9ca3af;
                                                        font-size: 14px;
                                                    ">
                                                        <div style="font-size: 48px; margin-bottom: 12px;">🖼️</div>
                                                        Không thể tải hình ảnh
                                                    </div>
                                                `;
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Content */}
                            <Form.Item
                                name="content"
                                label={
                                    <Text style={{
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        color: '#1f2937'
                                    }}>
                                        Nội dung bài viết
                                    </Text>
                                }
                                rules={[
                                    { required: true, message: 'Vui lòng nhập nội dung!' },
                                    { min: 100, message: 'Nội dung phải có ít nhất 100 ký tự!' }
                                ]}
                                style={{ marginBottom: '32px' }}
                            >
                                <TextArea
                                    rows={15}
                                    placeholder="Viết nội dung bài viết của bạn ở đây...

💡 Gợi ý:
• Chia sẻ câu chuyện cai thuốc của bạn
• Những khó khăn và cách vượt qua
• Kinh nghiệm và bài học rút ra
• Lời khuyên cho những người mới bắt đầu
• Động lực và nguồn cảm hứng"
                                    style={{
                                        borderRadius: '12px',
                                        fontSize: '15px',
                                        lineHeight: '1.6',
                                        border: '2px solid #e5e7eb',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#3b82f6';
                                        e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#e5e7eb';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </Form.Item>

                            {/* Action Buttons */}
                            <div style={{
                                display: 'flex',
                                gap: '16px',
                                justifyContent: 'center',
                                alignItems: 'center',
                                paddingTop: '16px',
                                borderTop: '1px solid rgba(0, 0, 0, 0.06)'
                            }}>
                                <Button
                                    size="large"
                                    onClick={() => navigate('/blog')}
                                    disabled={loading || isSubmitting}
                                    style={{
                                        borderRadius: '12px',
                                        height: '48px',
                                        paddingInline: '24px',
                                        fontSize: '16px',
                                        fontWeight: 500,
                                        border: '2px solid #e5e7eb',
                                        color: '#6b7280'
                                    }}
                                >
                                    Hủy bỏ
                                </Button>

                                <Button
                                    size="large"
                                    icon={<EyeOutlined />}
                                    disabled={loading || isSubmitting}
                                    style={{
                                        borderRadius: '12px',
                                        height: '48px',
                                        paddingInline: '24px',
                                        fontSize: '16px',
                                        fontWeight: 500,
                                        border: '2px solid #3b82f6',
                                        color: '#3b82f6'
                                    }}
                                >
                                    Xem trước
                                </Button>

                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    size="large"
                                    icon={<SendOutlined />}
                                    disabled={loading || isSubmitting}
                                    style={{
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                        border: 'none',
                                        borderRadius: '12px',
                                        height: '48px',
                                        paddingInline: '32px',
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    {(loading || isSubmitting) ? 'Đang xử lý...' : (postId ? 'Cập nhật' : 'Đăng')}
                                </Button>
                            </div>
                        </Form>
                    </Spin>
                </div>

                {/* Tips Section */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '16px',
                    padding: '24px',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
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
                            💡
                        </div>
                        <Text style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            color: '#1f2937'
                        }}>
                            Mẹo viết bài hiệu quả
                        </Text>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '12px',
                        fontSize: '14px',
                        color: '#4b5563',
                        lineHeight: '1.5'
                    }}>
                        <div>✨ Chia sẻ những trải nghiệm thật của bạn</div>
                        <div>📝 Sử dụng ngôn ngữ dễ hiểu và gần gũi</div>
                        <div>🖼️ Thêm hình ảnh để bài viết sinh động hơn</div>
                        <div>🎯 Kết thúc bằng lời khuyên hoặc động viên</div>
                    </div>
                </div>
            </Content>
        </Layout>
    );
};

export default BlogEditor; 