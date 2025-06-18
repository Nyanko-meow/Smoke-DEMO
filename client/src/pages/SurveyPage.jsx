import React, { useState, useEffect } from 'react';
import { Card, Tabs, Typography } from 'antd';
import { FormOutlined, FileTextOutlined } from '@ant-design/icons';
import SmokingSurveyPage from './SmokingSurveyPage';
import MySurveyResults from '../components/member/MySurveyResults';

const { Title } = Typography;

const SurveyPage = () => {
    const [activeTab, setActiveTab] = useState('survey');

    useEffect(() => {
        // Check URL params for initial tab
        const searchParams = new URLSearchParams(window.location.search);
        const tab = searchParams.get('tab');
        if (tab && (tab === 'survey' || tab === 'results')) {
            setActiveTab(tab);
        }

        // Listen for tab change events from child components
        const handleTabChange = (event) => {
            setActiveTab(event.detail);
        };

        window.addEventListener('survey-tab-change', handleTabChange);

        return () => {
            window.removeEventListener('survey-tab-change', handleTabChange);
        };
    }, []);

    const handleTabChange = (key) => {
        setActiveTab(key);
        // Update URL without refreshing page
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set('tab', key);
        window.history.replaceState(null, '', `${window.location.pathname}?${searchParams.toString()}`);
    };

    const tabItems = [
        {
            key: 'survey',
            label: (
                <span style={{ fontSize: '15px', fontWeight: 600 }}>
                    <FormOutlined style={{ marginRight: '8px' }} />
                    Làm Khảo Sát
                </span>
            ),
            children: <SmokingSurveyPage />
        },
        {
            key: 'results',
            label: (
                <span style={{ fontSize: '15px', fontWeight: 600 }}>
                    <FileTextOutlined style={{ marginRight: '8px' }} />
                    Kết Quả Khảo Sát
                </span>
            ),
            children: <MySurveyResults />
        }
    ];

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '24px'
        }}>
            {/* Header Section */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '20px',
                padding: '32px',
                marginBottom: '24px',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                textAlign: 'center'
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)'
                }}>
                    <FormOutlined style={{ fontSize: '32px', color: 'white' }} />
                </div>
                <Title level={2} style={{
                    margin: 0,
                    marginBottom: '12px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 700
                }}>
                    Khảo Sát Về Thói Quen Hút Thuốc
                </Title>
                <p style={{
                    margin: 0,
                    color: '#6b7280',
                    fontSize: '16px',
                    fontWeight: 500,
                    lineHeight: '1.6'
                }}>
                    Làm khảo sát để chúng tôi hiểu rõ hơn về thói quen hút thuốc của bạn và xem kết quả đã hoàn thành
                </p>
            </div>

            {/* Tabs Section */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '20px',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                overflow: 'hidden'
            }}>
                <Tabs
                    activeKey={activeTab}
                    onChange={handleTabChange}
                    items={tabItems}
                    size="large"
                    style={{
                        minHeight: '500px',
                        '& .ant-tabs-nav': {
                            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                            margin: 0,
                            padding: '16px 24px 0',
                            borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
                        },
                        '& .ant-tabs-tab': {
                            borderRadius: '12px 12px 0 0',
                            background: 'transparent',
                            border: 'none',
                            padding: '12px 24px'
                        },
                        '& .ant-tabs-tab-active': {
                            background: 'rgba(255, 255, 255, 0.9)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                        },
                        '& .ant-tabs-content-holder': {
                            padding: '24px'
                        }
                    }}
                />
            </div>
        </div>
    );
};

export default SurveyPage; 