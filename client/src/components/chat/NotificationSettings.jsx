import React, { useState, useEffect } from 'react';
import {
    Card,
    Switch,
    Space,
    Typography,
    Button,
    message,
    Divider,
    Alert
} from 'antd';
import {
    BellOutlined,
    SoundOutlined,
    DesktopOutlined,
    MobileOutlined
} from '@ant-design/icons';
import notificationManager from '../../utils/notifications';

const { Text, Title } = Typography;

const NotificationSettings = () => {
    const [settings, setSettings] = useState({
        browserNotifications: true,
        soundNotifications: true,
        newMessageNotifications: true,
        newConversationNotifications: true
    });
    const [permission, setPermission] = useState('default');

    useEffect(() => {
        // Load settings from localStorage
        const savedSettings = localStorage.getItem('notificationSettings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }

        // Check current permission
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    const saveSettings = (newSettings) => {
        setSettings(newSettings);
        localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
    };

    const handleSettingChange = (key, value) => {
        const newSettings = { ...settings, [key]: value };
        saveSettings(newSettings);
    };

    const requestPermission = async () => {
        try {
            const result = await notificationManager.requestPermission();
            setPermission(result);

            if (result === 'granted') {
                message.success('Đã bật thông báo trình duyệt!');
            } else if (result === 'denied') {
                message.error('Thông báo bị từ chối. Vui lòng bật trong cài đặt trình duyệt.');
            }
        } catch (error) {
            message.error('Không thể yêu cầu quyền thông báo');
        }
    };

    const testNotification = () => {
        if (permission === 'granted') {
            notificationManager.showNewMessageNotification(
                'Test User',
                'Đây là thông báo thử nghiệm!'
            );
            if (settings.soundNotifications) {
                notificationManager.playNotificationSound();
            }
            message.success('Đã gửi thông báo thử nghiệm!');
        } else {
            message.warning('Vui lòng bật quyền thông báo trước');
        }
    };

    return (
        <Card
            title={
                <Space>
                    <BellOutlined />
                    <span>Cài đặt thông báo</span>
                </Space>
            }
            style={{ maxWidth: 600 }}
        >
            {/* Permission Status */}
            {permission === 'denied' && (
                <Alert
                    message="Thông báo bị tắt"
                    description="Vui lòng bật thông báo trong cài đặt trình duyệt để nhận thông báo tin nhắn mới."
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
            )}

            {permission === 'default' && (
                <Alert
                    message="Chưa cấp quyền thông báo"
                    description={
                        <Space direction="vertical">
                            <Text>Bạn chưa cấp quyền thông báo cho ứng dụng.</Text>
                            <Button type="primary" onClick={requestPermission}>
                                Cấp quyền thông báo
                            </Button>
                        </Space>
                    }
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
            )}

            {permission === 'granted' && (
                <Alert
                    message="Thông báo đã được bật"
                    description="Bạn sẽ nhận được thông báo khi có tin nhắn mới."
                    type="success"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
            )}

            <Space direction="vertical" style={{ width: '100%' }}>
                {/* Browser Notifications */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                        <DesktopOutlined />
                        <div>
                            <Text strong>Thông báo trình duyệt</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                Hiển thị thông báo ngay cả khi tab không active
                            </Text>
                        </div>
                    </Space>
                    <Switch
                        checked={settings.browserNotifications && permission === 'granted'}
                        onChange={(checked) => handleSettingChange('browserNotifications', checked)}
                        disabled={permission !== 'granted'}
                    />
                </div>

                <Divider />

                {/* Sound Notifications */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                        <SoundOutlined />
                        <div>
                            <Text strong>Âm thanh thông báo</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                Phát âm thanh khi có tin nhắn mới
                            </Text>
                        </div>
                    </Space>
                    <Switch
                        checked={settings.soundNotifications}
                        onChange={(checked) => handleSettingChange('soundNotifications', checked)}
                    />
                </div>

                <Divider />

                {/* New Message Notifications */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                        <MobileOutlined />
                        <div>
                            <Text strong>Thông báo tin nhắn mới</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                Thông báo khi nhận được tin nhắn mới
                            </Text>
                        </div>
                    </Space>
                    <Switch
                        checked={settings.newMessageNotifications}
                        onChange={(checked) => handleSettingChange('newMessageNotifications', checked)}
                    />
                </div>

                <Divider />

                {/* New Conversation Notifications */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                        <BellOutlined />
                        <div>
                            <Text strong>Thông báo cuộc trò chuyện mới</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                Thông báo khi có cuộc trò chuyện mới (dành cho coach)
                            </Text>
                        </div>
                    </Space>
                    <Switch
                        checked={settings.newConversationNotifications}
                        onChange={(checked) => handleSettingChange('newConversationNotifications', checked)}
                    />
                </div>

                <Divider />

                {/* Test Button */}
                <div style={{ textAlign: 'center' }}>
                    <Button
                        type="dashed"
                        onClick={testNotification}
                        disabled={permission !== 'granted'}
                    >
                        Thử nghiệm thông báo
                    </Button>
                </div>
            </Space>
        </Card>
    );
};

export default NotificationSettings; 