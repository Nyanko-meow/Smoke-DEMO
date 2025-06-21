import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Layout,
    Card,
    Typography,
    Input,
    Button,
    Form,
    Space,
    message,
    Spin
} from 'antd';
import {
    ArrowLeftOutlined,
    SendOutlined,
    EditOutlined
} from '@ant-design/icons';
import { createCommunityPost, clearSuccess, clearError } from '../../store/slices/communitySlice';

const { Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

const CommunityPost = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { loading, error, success } = useSelector(state => state.community);
    const [form] = Form.useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Clear previous states when component mounts
    useEffect(() => {
        dispatch(clearError());
        dispatch(clearSuccess());
    }, [dispatch]);

    // Handle success navigation
    useEffect(() => {
        if (success && !loading && !isSubmitting) {
            message.success('Đã tạo bài viết thành công!');
            navigate('/community');
        }
    }, [success, loading, navigate, isSubmitting]);

    // Handle error display
    useEffect(() => {
        if (error) {
            message.error(error);
        }
    }, [error]);

    const handleSubmit = async (values) => {
        if (isSubmitting || loading) {
            return; // Prevent double submission
        }

        setIsSubmitting(true);

        try {
            const resultAction = await dispatch(createCommunityPost(values));

            if (createCommunityPost.fulfilled.match(resultAction)) {
                // Success - navigation will be handled by useEffect
                console.log('Post created successfully');
            } else {
                // Error case
                console.error('Failed to create post:', resultAction.payload);
            }
        } catch (error) {
            console.error('Error creating post:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Layout style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
            <Content style={{
                padding: '32px 24px',
                maxWidth: '800px',
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
                            onClick={() => navigate('/community')}
                            style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                background: 'rgba(102, 126, 234, 0.1)',
                                border: '2px solid rgba(102, 126, 234, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px',
                                color: '#667eea',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = '#667eea';
                                e.target.style.color = 'white';
                                e.target.style.transform = 'scale(1.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'rgba(102, 126, 234, 0.1)';
                                e.target.style.color = '#667eea';
                                e.target.style.transform = 'scale(1)';
                            }}
                        />
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        backgroundClip: 'text',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        fontWeight: 700
                                    }}>
                                        Tạo bài viết mới
                                    </Title>
                                    <Text style={{
                                        color: '#6b7280',
                                        fontSize: '16px',
                                        fontWeight: 500
                                    }}>
                                        Chia sẻ câu chuyện và truyền cảm hứng cho cộng đồng
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
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                    <Spin spinning={loading || isSubmitting} tip="Đang tạo bài viết...">
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleSubmit}
                            size="large"
                        >
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
                                    { max: 100, message: 'Tiêu đề không được quá 100 ký tự!' }
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
                                        e.target.style.borderColor = '#667eea';
                                        e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#e5e7eb';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </Form.Item>

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
                                    { min: 50, message: 'Nội dung phải có ít nhất 50 ký tự!' },
                                    { max: 2000, message: 'Nội dung không được quá 2000 ký tự!' }
                                ]}
                                style={{ marginBottom: '32px' }}
                            >
                                <TextArea
                                    rows={12}
                                    placeholder="Hãy chia sẻ câu chuyện, kinh nghiệm hoặc động lực của bạn với cộng đồng...

💡 Gợi ý:
• Chia sẻ về hành trình cai thuốc của bạn
• Những khó khăn và cách vượt qua
• Những thành tựu bạn đã đạt được
• Lời khuyên cho những người mới bắt đầu
• Cảm xúc và suy nghĩ trong quá trình cai thuốc"
                                    style={{
                                        borderRadius: '12px',
                                        fontSize: '15px',
                                        lineHeight: '1.6',
                                        border: '2px solid #e5e7eb',
                                        transition: 'all 0.3s ease',
                                        padding: '16px'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#667eea';
                                        e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#e5e7eb';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </Form.Item>

                            <div style={{
                                display: 'flex',
                                gap: '16px',
                                justifyContent: 'flex-end',
                                alignItems: 'center',
                                paddingTop: '16px',
                                borderTop: '1px solid rgba(0, 0, 0, 0.06)'
                            }}>
                                <Button
                                    size="large"
                                    onClick={() => navigate('/community')}
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
                                    type="primary"
                                    htmlType="submit"
                                    size="large"
                                    icon={<SendOutlined />}
                                    disabled={loading || isSubmitting}
                                    style={{
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        border: 'none',
                                        borderRadius: '12px',
                                        height: '48px',
                                        paddingInline: '32px',
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    {(loading || isSubmitting) ? 'Đang đăng...' : 'Đăng bài viết'}
                                </Button>
                            </div>
                        </Form>
                    </Spin>
                </div>

                {/* Tips Section */}
                <div style={{
                    marginTop: '24px',
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
                            Lời khuyên khi viết bài
                        </Text>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '12px',
                        fontSize: '14px',
                        color: '#4b5563',
                        lineHeight: '1.5'
                    }}>
                        <div>✨ Chia sẻ trải nghiệm thật từ trái tim</div>
                        <div>🎯 Tập trung vào một chủ đề chính</div>
                        <div>💪 Khuyến khích và truyền cảm hứng</div>
                        <div>🤝 Tôn trọng và hỗ trợ lẫn nhau</div>
                    </div>
                </div>
            </Content>
        </Layout>
    );
};

export default CommunityPost; 