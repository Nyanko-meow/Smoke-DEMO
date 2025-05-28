import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

const BadgeWrapper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.2s ease-in-out',
    '&:hover': {
        transform: 'translateY(-5px)',
    },
}));

const BadgeImage = styled('img')({
    width: '64px',
    height: '64px',
    marginBottom: '8px',
    objectFit: 'contain',
});

const BadgeTitle = styled(Typography)({
    fontWeight: 600,
    fontSize: '1rem',
    marginBottom: '4px',
});

const BadgeDescription = styled(Typography)({
    fontSize: '0.875rem',
    color: 'rgba(0, 0, 0, 0.6)',
});

const BadgeDate = styled(Typography)({
    fontSize: '0.75rem',
    color: 'rgba(0, 0, 0, 0.4)',
    marginTop: '8px',
});

const AchievementBadge = ({ achievement, earnedAt }) => {
    return (
        <BadgeWrapper elevation={2}>
            <BadgeImage
                src={achievement.IconURL}
                alt={achievement.Name}
                onError={(e) => {
                    e.target.src = '/images/achievements/default-badge.png';
                }}
            />
            <BadgeTitle variant="h6">
                {achievement.Name}
            </BadgeTitle>
            <BadgeDescription>
                {achievement.Description}
            </BadgeDescription>
            {earnedAt && (
                <BadgeDate>
                    Đạt được: {new Date(earnedAt).toLocaleDateString('vi-VN')}
                </BadgeDate>
            )}
        </BadgeWrapper>
    );
};

export default AchievementBadge; 