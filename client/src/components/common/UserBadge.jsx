import React, { useState, useEffect } from 'react';
import { Tag, Tooltip } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';
import axios from 'axios';

const UserBadge = ({ userId, size = 'small', showTooltip = true }) => {
    const [badge, setBadge] = useState(null);
    const [loading, setLoading] = useState(true);

    // Helper function to render achievement icon
    const renderAchievementIcon = (iconUrl, achievementName, size = '12px') => {
        // Priority 1: Use achievement name to determine emoji
        if (achievementName) {
            const name = achievementName.toLowerCase();
            // Map common achievement names to emojis
            if (name.includes('đầu tiên') || name.includes('first') || name.includes('ngày đầu')) return <span style={{ fontSize: size }}>🥉</span>;
            if (name.includes('tuần') || name.includes('week') || name.includes('7 ngày')) return <span style={{ fontSize: size }}>🥈</span>;
            if (name.includes('tháng') || name.includes('month') || name.includes('30 ngày')) return <span style={{ fontSize: size }}>🥇</span>;
            if (name.includes('đặc biệt') || name.includes('special') || name.includes('vip')) return <span style={{ fontSize: size }}>💎</span>;
            if (name.includes('liên tục') || name.includes('streak') || name.includes('chuỗi')) return <span style={{ fontSize: size }}>🔥</span>;
            if (name.includes('sao') || name.includes('star') || name.includes('xuất sắc')) return <span style={{ fontSize: size }}>⭐</span>;
            if (name.includes('vương') || name.includes('crown') || name.includes('master')) return <span style={{ fontSize: size }}>👑</span>;
            if (name.includes('tim') || name.includes('heart') || name.includes('yêu thương')) return <span style={{ fontSize: size }}>❤️</span>;
            if (name.includes('thử thách') || name.includes('challenge')) return <span style={{ fontSize: size }}>🎯</span>;
            if (name.includes('mốc') || name.includes('milestone')) return <span style={{ fontSize: size }}>🏁</span>;
        }

        // Priority 2: If iconUrl is already an emoji (length <= 4 and not a path)
        if (iconUrl && iconUrl.length <= 4 && !/^\/|^http|\.png|\.jpg|\.gif|\.svg/i.test(iconUrl)) {
            return <span style={{ fontSize: size, display: 'inline-block', lineHeight: 1 }}>{iconUrl}</span>;
        }

        // Priority 3: If iconUrl looks like an image path, determine from URL
        if (iconUrl && (/\/images\/|\.png|\.jpg|\.gif|\.svg/i.test(iconUrl))) {
            const url = iconUrl.toLowerCase();
            if (url.includes('bronze') || url.includes('first') || url.includes('start')) return <span style={{ fontSize: size }}>🥉</span>;
            if (url.includes('silver') || url.includes('week')) return <span style={{ fontSize: size }}>🥈</span>;
            if (url.includes('gold') || url.includes('month')) return <span style={{ fontSize: size }}>🥇</span>;
            if (url.includes('diamond') || url.includes('special')) return <span style={{ fontSize: size }}>💎</span>;
            if (url.includes('fire') || url.includes('streak')) return <span style={{ fontSize: size }}>🔥</span>;
            if (url.includes('star')) return <span style={{ fontSize: size }}>⭐</span>;
            if (url.includes('crown')) return <span style={{ fontSize: size }}>👑</span>;
            if (url.includes('heart')) return <span style={{ fontSize: size }}>❤️</span>;
            // Default trophy for image paths
            return <span style={{ fontSize: size }}>🏆</span>;
        }

        // Default case - show trophy
        return <span style={{ fontSize: size }}>🏆</span>;
    };

    useEffect(() => {
        if (userId) {
            fetchUserBadge();
        }
    }, [userId]);

    const fetchUserBadge = async () => {
        try {
            const response = await axios.get('/api/achievements/top-badge', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.data.success && response.data.data) {
                setBadge(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching user badge:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !badge) {
        return null;
    }

    const getBadgeColor = (category) => {
        const colors = {
            'basic': 'green',
            'premium': 'blue',
            'pro': 'purple',
            'money': 'gold',
            'special': 'red',
            'social': 'cyan'
        };
        return colors[category] || 'default';
    };

    const badgeElement = (
        <Tag
            color={getBadgeColor(badge.Category)}
            style={{
                fontSize: size === 'small' ? '10px' : '12px',
                margin: '0 4px',
                border: 'none',
                borderRadius: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                padding: size === 'small' ? '2px 6px' : '4px 8px',
                background: `linear-gradient(135deg, ${getBadgeColor(badge.Category) === 'gold' ? '#fbbf24' :
                    getBadgeColor(badge.Category) === 'blue' ? '#3b82f6' :
                        getBadgeColor(badge.Category) === 'green' ? '#10b981' :
                            getBadgeColor(badge.Category) === 'purple' ? '#8b5cf6' :
                                getBadgeColor(badge.Category) === 'red' ? '#ef4444' :
                                    '#6b7280'} 0%, ${getBadgeColor(badge.Category) === 'gold' ? '#f59e0b' :
                                        getBadgeColor(badge.Category) === 'blue' ? '#2563eb' :
                                            getBadgeColor(badge.Category) === 'green' ? '#059669' :
                                                getBadgeColor(badge.Category) === 'purple' ? '#7c3aed' :
                                                    getBadgeColor(badge.Category) === 'red' ? '#dc2626' :
                                                        '#4b5563'} 100%)`,
                color: 'white',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
        >
            <span style={{
                fontSize: size === 'small' ? '10px' : '11px',
                display: 'flex',
                alignItems: 'center',
                fontWeight: 'bold'
            }}>
                {renderAchievementIcon(badge.IconURL, badge.Name, size === 'small' ? '10px' : '12px')}
            </span>
        </Tag>
    );

    if (showTooltip) {
        return (
            <Tooltip
                title={
                    <div>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {renderAchievementIcon(badge.IconURL, badge.Name, '16px')}
                            <span>{badge.Name}</span>
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.8 }}>
                            {badge.Points} điểm • Độ khó: {badge.Difficulty}/6
                        </div>
                    </div>
                }
                placement="top"
            >
                {badgeElement}
            </Tooltip>
        );
    }

    return badgeElement;
};

export default UserBadge; 