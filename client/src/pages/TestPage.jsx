import React from 'react';
import { Card, Typography, Button, Space } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const TestPage = () => {
    const navigate = useNavigate();

    return (
        <div className="container mx-auto py-8 px-4">
            <Card className="max-w-2xl mx-auto">
                <Title level={2}>Test Quit Plan Feature</Title>
                <Paragraph>
                    Trang này để test tính năng Quit Plan. Bạn có thể:
                </Paragraph>

                <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
                    <Button
                        type="primary"
                        size="large"
                        onClick={() => navigate('/quit-plan')}
                    >
                        Test Quit Plan Page
                    </Button>

                    <Button
                        size="large"
                        onClick={() => navigate('/membership')}
                    >
                        Membership Page (để có quyền truy cập)
                    </Button>

                    <Button
                        size="large"
                        onClick={() => navigate('/smoking-survey')}
                    >
                        Smoking Survey Page
                    </Button>

                    <Button
                        size="large"
                        onClick={() => navigate('/coach/quit-plans')}
                    >
                        Coach Dashboard (chỉ cho coach/admin)
                    </Button>
                </Space>

                <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
                    <Title level={4}>Lưu ý để test:</Title>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Bạn cần đăng nhập với tài khoản có role <strong>member</strong></li>
                        <li>Hoặc có membership active trong database</li>
                        <li>User ID mặc định trong DB: guest (id: 1), member (id: 2), coach (id: 3), admin (id: 4)</li>
                        <li>Coach dashboard chỉ dành cho role <strong>coach</strong> hoặc <strong>admin</strong></li>
                    </ul>
                </div>
            </Card>
        </div>
    );
};

export default TestPage; 