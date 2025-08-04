import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Space, message, Alert, Divider } from 'antd';

const { Text, Title } = Typography;

const TokenDebugger = () => {
    const [debugInfo, setDebugInfo] = useState({});
    const [isFixing, setIsFixing] = useState(false);

    useEffect(() => {
        analyzeAuthState();
    }, []);

    const analyzeAuthState = () => {
        // Get all possible auth data
        const authData = {
            tokens: {
                token: localStorage.getItem('token'),
                memberToken: localStorage.getItem('memberToken'),
                coachToken: localStorage.getItem('coachToken'),
                refreshToken: localStorage.getItem('refreshToken'),
                sessionToken: sessionStorage.getItem('token'),
                sessionMemberToken: sessionStorage.getItem('memberToken')
            },
            users: {
                user: localStorage.getItem('user'),
                member: localStorage.getItem('member'),
                coachUser: localStorage.getItem('coachUser'),
                userData: localStorage.getItem('userData')
            },
            others: {
                userRole: localStorage.getItem('userRole'),
                userId: localStorage.getItem('userId'),
                userName: localStorage.getItem('userName'),
                tokenExpiration: localStorage.getItem('tokenExpiration')
            }
        };

        // Parse user objects
        const parsedUsers = {};
        Object.keys(authData.users).forEach(key => {
            if (authData.users[key]) {
                try {
                    parsedUsers[key] = JSON.parse(authData.users[key]);
                } catch (e) {
                    parsedUsers[key] = 'Invalid JSON';
                }
            }
        });

        setDebugInfo({
            ...authData,
            parsedUsers,
            analysis: analyzeIssues(authData, parsedUsers)
        });
    };

    const analyzeIssues = (authData, parsedUsers) => {
        const issues = [];
        const suggestions = [];

        // Check for tokens
        const hasAnyToken = Object.values(authData.tokens).some(token => token);
        if (!hasAnyToken) {
            issues.push('Không có token nào được tìm thấy');
            suggestions.push('Cần đăng nhập lại để lấy token mới');
        }

        // Check for multiple tokens
        const tokenCount = Object.values(authData.tokens).filter(token => token).length;
        if (tokenCount > 1) {
            issues.push(`Có ${tokenCount} tokens khác nhau, có thể gây conflict`);
            suggestions.push('Nên clear tất cả và chỉ giữ 1 token chính');
        }

        // Check user data consistency
        const userObjects = Object.values(parsedUsers).filter(user => user && typeof user === 'object');
        if (userObjects.length === 0) {
            issues.push('Không có thông tin user hợp lệ');
            suggestions.push('Cần lưu thông tin user sau khi đăng nhập');
        } else if (userObjects.length > 1) {
            // Check if user roles are consistent
            const roles = userObjects.map(user => user.role || user.Role).filter(role => role);
            const uniqueRoles = [...new Set(roles)];
            if (uniqueRoles.length > 1) {
                issues.push(`Có nhiều roles khác nhau: ${uniqueRoles.join(', ')}`);
                suggestions.push('Role không nhất quán, cần đăng nhập lại');
            }
        }

        return { issues, suggestions };
    };

    const fixAuthState = async () => {
        setIsFixing(true);
        try {
            // 1. Clear all existing auth data
            const authKeys = [
                'token', 'memberToken', 'coachToken', 'refreshToken',
                'user', 'member', 'coachUser', 'userData',
                'userRole', 'userId', 'userName', 'tokenExpiration'
            ];

            authKeys.forEach(key => {
                localStorage.removeItem(key);
                sessionStorage.removeItem(key);
            });

            message.success('Đã clear tất cả auth data cũ');

            // 2. Get new token for member
            const response = await fetch('http://localhost:4000/api/test-login', {
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

            if (response.ok && data.success) {
                // 3. Save auth data consistently
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                message.success('Đã tạo và lưu token mới thành công!');

                // 4. Test the new token
                await testNewToken(data.token);

                // 5. Refresh analysis
                setTimeout(() => {
                    analyzeAuthState();
                }, 1000);

            } else {
                message.error('Không thể tạo token mới: ' + (data.message || 'Unknown error'));
            }

        } catch (error) {
            console.error('Fix auth state error:', error);
            message.error('Lỗi khi fix auth state');
        } finally {
            setIsFixing(false);
        }
    };

    const testNewToken = async (token) => {
        try {
            console.log('Testing new token...');

            // Test with coach feedback API
            const testResponse = await fetch('http://localhost:4000/api/coach/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    coachId: 3,
                    rating: 5,
                    comment: 'Test feedback after token fix',
                    categories: {
                        professionalism: 5,
                        helpfulness: 5,
                        communication: 5,
                        knowledge: 5
                    },
                    isAnonymous: false
                })
            });

            const testData = await testResponse.json();

            if (testResponse.ok) {
                message.success('🎉 Token hoạt động hoàn hảo! Bạn có thể đánh giá coach ngay bây giờ.');
            } else {
                console.error('Token test failed:', testData);
                message.warning(`Token test failed: ${testData.message || 'Unknown error'}`);
            }

        } catch (error) {
            console.error('Token test error:', error);
        }
    };

    const quickFix = () => {
        // Quick fix: ensure consistent token usage
        const mainToken = localStorage.getItem('token') ||
            localStorage.getItem('memberToken') ||
            sessionStorage.getItem('token');

        if (mainToken) {
            localStorage.setItem('token', mainToken);
            localStorage.removeItem('memberToken');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('memberToken');

            message.success('Đã chuẩn hóa token storage');
            analyzeAuthState();
        } else {
            message.error('Không tìm thấy token để fix');
        }
    };

    const renderTokenInfo = (tokens) => (
        <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
            {Object.entries(tokens).map(([key, value]) => (
                <div key={key} style={{ marginBottom: '4px' }}>
                    <Text strong>{key}:</Text> {value ? `${value.substring(0, 40)}...` : 'null'}
                </div>
            ))}
        </div>
    );

    const renderUserInfo = (users) => (
        <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
            {Object.entries(users).map(([key, value]) => (
                <div key={key} style={{ marginBottom: '8px' }}>
                    <Text strong>{key}:</Text>
                    <div style={{ marginLeft: '10px', color: '#666' }}>
                        {value ? (typeof value === 'object' ? JSON.stringify(value, null, 2) : value) : 'null'}
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            <Title level={2}>🔧 Token Debugger & Fixer</Title>

            {debugInfo.analysis && (
                <>
                    {debugInfo.analysis.issues.length > 0 && (
                        <Alert
                            message="Phát hiện vấn đề authentication"
                            description={
                                <div>
                                    <div><strong>Vấn đề:</strong></div>
                                    <ul>
                                        {debugInfo.analysis.issues.map((issue, i) => (
                                            <li key={i}>{issue}</li>
                                        ))}
                                    </ul>
                                    <div><strong>Giải pháp:</strong></div>
                                    <ul>
                                        {debugInfo.analysis.suggestions.map((suggestion, i) => (
                                            <li key={i}>{suggestion}</li>
                                        ))}
                                    </ul>
                                </div>
                            }
                            type="warning"
                            showIcon
                            style={{ marginBottom: '20px' }}
                        />
                    )}
                </>
            )}

            <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Card title="🔑 Tokens" size="small">
                    {debugInfo.tokens && renderTokenInfo(debugInfo.tokens)}
                </Card>

                <Card title="👤 User Data" size="small">
                    {debugInfo.parsedUsers && renderUserInfo(debugInfo.parsedUsers)}
                </Card>

                <Card title="🛠️ Actions" size="small">
                    <Space wrap>
                        <Button onClick={analyzeAuthState}>🔄 Re-analyze</Button>
                        <Button onClick={quickFix} type="default">⚡ Quick Fix</Button>
                        <Button
                            onClick={fixAuthState}
                            type="primary"
                            loading={isFixing}
                            disabled={isFixing}
                        >
                            🔧 Complete Fix (Clear + New Token)
                        </Button>
                    </Space>
                </Card>

                <Alert
                    message="Hướng dẫn sử dụng"
                    description={
                        <div>
                            <strong>Quick Fix:</strong> Chuẩn hóa token storage hiện có<br />
                            <strong>Complete Fix:</strong> Clear tất cả và tạo token mới cho member@example.com<br />
                            <strong>Sau khi fix:</strong> Quay lại form đánh giá coach và thử submit lại
                        </div>
                    }
                    type="info"
                />
            </Space>
        </div>
    );
};

export default TokenDebugger; 