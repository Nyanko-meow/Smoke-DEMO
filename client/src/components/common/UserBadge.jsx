import React, { useState, useEffect } from 'react';
import { Tag, Tooltip } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';
import axios from 'axios';

const UserBadge = ({ userId, size = 'small', showTooltip = true }) => {
    const [badge, setBadge] = useState(null);
    const [loading, setLoading] = useState(true);

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
            icon={<TrophyOutlined />}
            style={{
                fontSize: size === 'small' ? '10px' : '12px',
                margin: '0 4px',
                border: 'none',
                borderRadius: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                padding: size === 'small' ? '2px 6px' : '4px 8px'
            }}
        >
            <span style={{
                marginLeft: '2px',
                fontSize: size === 'small' ? '10px' : '11px',
                fontWeight: 'bold'
            }}>
                {badge.IconURL}
            </span>
        </Tag>
    );

    if (showTooltip) {
        return (
            <Tooltip
                title={
                    <div>
                        <div style={{ fontWeight: 'bold' }}>{badge.Name}</div>
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