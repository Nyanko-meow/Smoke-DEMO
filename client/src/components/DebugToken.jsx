import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Space, message } from 'antd';

const { Text, Paragraph } = Typography;

const DebugToken = () => {
    const [tokenInfo, setTokenInfo] = useState(null);
    const [userInfo, setUserInfo] = useState(null);

    useEffect(() => {
        checkTokens();
    }, []);

    const checkTokens = () => {
        // Get all possible tokens
        const memberToken = localStorage.getItem('memberToken');
        const token = localStorage.getItem('token');
        const sessionToken = sessionStorage.getItem('token');
        const sessionMemberToken = sessionStorage.getItem('memberToken');

        // Get user info
        const user = localStorage.getItem('user');
        const member = localStorage.getItem('member');

        setTokenInfo({
            memberToken: memberToken ? memberToken.substring(0, 30) + '...' : null,
            token: token ? token.substring(0, 30) + '...' : null,
            sessionToken: sessionToken ? sessionToken.substring(0, 30) + '...' : null,
            sessionMemberToken: sessionMemberToken ? sessionMemberToken.substring(0, 30) + '...' : null,
        });

        setUserInfo({
            user: user ? JSON.parse(user) : null,
            member: member ? JSON.parse(member) : null,
        });
    };

    const testFeedbackAPI = async () => {
        try {
            const token = localStorage.getItem('memberToken') ||
                localStorage.getItem('token') ||
                sessionStorage.getItem('token') ||
                sessionStorage.getItem('memberToken');

            if (!token) {
                message.error('Không tìm thấy token!');
                return;
            }

            console.log('Testing with token:', token.substring(0, 30) + '...');

            // Test simple endpoint first
            const response = await fetch('http://smokeking.wibu.me:4000/api/coach/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    coachId: 3, // Coach from schema
                    rating: 5,
                    comment: 'Test feedback',
                    categories: {
                        professionalism: 5,
                        helpfulness: 5,
                        communication: 5,
                        knowledge: 5
                    },
                    isAnonymous: false
                })
            });

            const data = await response.json();

            console.log('Response status:', response.status);
            console.log('Response data:', data);

            if (response.ok) {
                message.success('API test thành công!');
            } else {
                message.error(`API test thất bại: ${response.status} - ${data.message}`);
            }
        } catch (error) {
            console.error('API test error:', error);
            message.error('Lỗi kết nối API');
        }
    };

    const generateNewToken = async () => {
        try {
            // Try to get a new token using test login endpoint
            const response = await fetch('http://smokeking.wibu.me:4000/api/test-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: 'member@example.com',
                    password: 'H12345678@'
                })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                message.success('Token mới đã được tạo và lưu!');
                checkTokens(); // Refresh display
            } else {
                message.error('Không thể tạo token mới: ' + data.message);
            }
        } catch (error) {
            console.error('Generate token error:', error);
            message.error('Lỗi khi tạo token mới');
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <Card title="🔍 Debug Token & Authentication" style={{ marginBottom: '20px' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                        <Text strong>Tokens trong localStorage/sessionStorage:</Text>
                        <div>
                            <div>memberToken: {tokenInfo?.memberToken || 'Không có'}</div>
                            <div>token: {tokenInfo?.token || 'Không có'}</div>
                            <div>sessionToken: {tokenInfo?.sessionToken || 'Không có'}</div>
                            <div>sessionMemberToken: {tokenInfo?.sessionMemberToken || 'Không có'}</div>
                        </div>
                    </div>

                    <div>
                        <Text strong>User Info:</Text>
                        <div>
                            <div>localStorage.user: {userInfo?.user ? JSON.stringify(userInfo.user, null, 2) : 'Không có'}</div>
                            <div>localStorage.member: {userInfo?.member ? JSON.stringify(userInfo.member, null, 2) : 'Không có'}</div>
                        </div>
                    </div>

                    <Space>
                        <Button onClick={checkTokens}>🔄 Refresh</Button>
                        <Button type="primary" onClick={generateNewToken}>🔑 Tạo Token Mới</Button>
                        <Button onClick={testFeedbackAPI}>🧪 Test Feedback API</Button>
                    </Space>
                </Space>
            </Card>

            <Card title="📋 Hướng dẫn sửa lỗi">
                <div>
                    <Text strong>Nếu gặp lỗi 403:</Text>
                    <div>1. Click &quot;Tạo Token Mới&quot; để lấy token hợp lệ</div>
                    <div>2. Click &quot;Test Feedback API&quot; để kiểm tra</div>
                    <div>3. Nếu vẫn lỗi, kiểm tra console để xem chi tiết</div>
                    <div>4. Đảm bảo server đang chạy trên port 4000</div>
                </div>
            </Card>
        </div>
    );
};

export default DebugToken; 