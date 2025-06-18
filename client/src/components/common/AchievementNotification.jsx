import React, { useEffect } from 'react';
import { notification, Card, Space, Typography, Row, Col } from 'antd';
import { TrophyOutlined, StarOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const AchievementNotification = ({ achievements, motivationalMessages, onClose }) => {
    useEffect(() => {
        if (achievements && achievements.length > 0) {
            showAchievementNotification(achievements);
        }

        if (motivationalMessages && motivationalMessages.length > 0) {
            showMotivationalMessages(motivationalMessages);
        }
    }, [achievements, motivationalMessages]);

    const showAchievementNotification = (newAchievements) => {
        newAchievements.forEach((achievement, index) => {
            setTimeout(() => {
                notification.success({
                    message: '🎉 Huy hiệu mới!',
                    description: (
                        <Card
                            size="small"
                            style={{
                                border: '2px solid #52c41a',
                                backgroundColor: '#f6ffed'
                            }}
                        >
                            <Row align="middle" gutter={[16, 8]}>
                                <Col flex="auto">
                                    <Space direction="vertical" size={4}>
                                        <Title level={5} style={{ margin: 0, color: '#52c41a' }}>
                                            <TrophyOutlined /> {achievement.Name}
                                        </Title>
                                        <Text>{achievement.Description}</Text>
                                        {achievement.MilestoneDays && (
                                            <Text type="secondary">
                                                🗓️ {achievement.MilestoneDays} ngày không hút thuốc
                                            </Text>
                                        )}
                                        {achievement.SavedMoney && (
                                            <Text type="secondary">
                                                💰 Tiết kiệm {achievement.SavedMoney.toLocaleString('vi-VN')} VNĐ
                                            </Text>
                                        )}
                                    </Space>
                                </Col>
                                <Col>
                                    <div style={{ fontSize: '48px' }}>
                                        {achievement.IconURL ? (
                                            <img
                                                src={achievement.IconURL}
                                                alt={achievement.Name}
                                                style={{ width: 48, height: 48 }}
                                            />
                                        ) : (
                                            '🏆'
                                        )}
                                    </div>
                                </Col>
                            </Row>
                        </Card>
                    ),
                    duration: 8,
                    placement: 'topRight',
                    style: {
                        width: 400,
                    },
                });
            }, index * 1000); // Delay each notification by 1 second
        });
    };

    const showMotivationalMessages = (messages) => {
        messages.forEach((message, index) => {
            setTimeout(() => {
                notification.info({
                    message: '💪 Động lực',
                    description: message,
                    duration: 5,
                    placement: 'topRight',
                    icon: <StarOutlined style={{ color: '#1890ff' }} />,
                });
            }, (index + achievements.length) * 1000 + 500);
        });
    };

    return null; // This component doesn't render anything
};

export default AchievementNotification; 