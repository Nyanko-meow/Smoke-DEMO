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
                <span>
                    <FormOutlined />
                    Làm Khảo Sát
                </span>
            ),
            children: <SmokingSurveyPage />
        },
        {
            key: 'results',
            label: (
                <span>
                    <FileTextOutlined />
                    Kết Quả Khảo Sát
                </span>
            ),
            children: <MySurveyResults />
        }
    ];

    return (
        <div style={{ padding: '24px', minHeight: '100vh' }}>
            <Card style={{ marginBottom: '24px' }}>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <Title level={2} style={{ margin: 0 }}>
                        <FormOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
                        Khảo Sát Về Thói Quen Hút Thuốc
                    </Title>
                    <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '16px' }}>
                        Làm khảo sát để chúng tôi hiểu rõ hơn về thói quen hút thuốc của bạn và xem kết quả đã hoàn thành
                    </p>
                </div>
            </Card>

            <Card>
                <Tabs
                    activeKey={activeTab}
                    onChange={handleTabChange}
                    items={tabItems}
                    size="large"
                    style={{ minHeight: '500px' }}
                />
            </Card>
        </div>
    );
};

export default SurveyPage; 