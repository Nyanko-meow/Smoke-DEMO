import React, { useState, useEffect } from 'react';
import { Statistic, Alert, Spin, Typography } from 'antd';
import { DollarOutlined, HeartOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Text } = Typography;

const SavingsDisplay = ({
    title = "Tiền tiết kiệm",
    displayType = "money", // "money" | "cigarettes"
    showDetails = false,
    style = {},
    valueStyle = { color: '#52c41a' },
    prefix = <DollarOutlined />,
    suffix = "VND"
}) => {
    const [savingsData, setSavingsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadSavingsData();
    }, []);

    const loadSavingsData = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('memberToken') || localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Fetch real progress data from API
            const response = await axios.get('https://smokeking.wibu.me:4000/api/progress/summary', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                const data = response.data.data;
                setSavingsData({
                    totalMoneySaved: data.TotalMoneySaved || 0,
                    cigarettesNotSmoked: data.CigarettesNotSmoked || 0,
                    daysTracked: data.TotalDaysTracked || 0,
                    calculation: data.calculation || null,
                    isDemo: false // This is real data from API
                });
            } else {
                throw new Error(response.data.message || 'Failed to load savings data');
            }
        } catch (error) {
            console.error('Error loading savings data:', error);
            setError(error.message);

            // Use fallback data only if API fails
            setSavingsData({
                totalMoneySaved: 0,
                cigarettesNotSmoked: 0,
                daysTracked: 0,
                calculation: null,
                isDemo: true // Mark as demo/fallback data
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '20px' }}>
                <Spin size="small" />
            </div>
        );
    }

    if (error && !savingsData) {
        return (
            <Alert
                message="Lỗi tải dữ liệu"
                type="error"
                size="small"
                showIcon
            />
        );
    }

    const formatValue = (value) => {
        return value.toLocaleString('vi-VN');
    };

    // Determine what to display based on displayType
    const getDisplayValue = () => {
        if (displayType === "cigarettes") {
            return savingsData.cigarettesNotSmoked;
        }
        return savingsData.totalMoneySaved;
    };

    const getSuffix = () => {
        if (displayType === 'cigarettes') {
            return savingsData.daysTracked > 0
                ? `điếu (${savingsData.daysTracked} ngày)`
                : "điếu";
        }
        return suffix || "";
    };

    return (
        <div style={style}>
            <Statistic
                title={title}
                value={getDisplayValue()}
                prefix={displayType === "cigarettes" ? <HeartOutlined /> : prefix}
                suffix={getSuffix()}
                valueStyle={displayType === "cigarettes" ? { color: '#cf1322' } : valueStyle}
                formatter={(value) => formatValue(value)}
            />

            {showDetails && savingsData && (
                <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                    <div>
                        <Text className="text-gray-500">
                            {savingsData.cigarettesNotSmoked} điếu không hút
                        </Text>
                        {savingsData.daysTracked > 0 && (
                            <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
                                {' '}(trong {savingsData.daysTracked} ngày theo dõi)
                            </span>
                        )}
                    </div>
                    <div>{savingsData.daysTracked} ngày theo dõi</div>
                    {savingsData.calculation?.description && (
                        <div style={{ marginTop: 4, fontStyle: 'italic' }}>
                            {savingsData.calculation.description}
                        </div>
                    )}
                    {savingsData.isDemo && (
                        <div style={{ color: '#faad14', fontWeight: 'bold' }}>
                            (Dữ liệu demo - API không khả dụng)
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SavingsDisplay; 