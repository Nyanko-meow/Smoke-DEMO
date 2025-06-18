import React, { useState } from 'react';
import { Tabs, Typography } from 'antd';
import {
    CalendarOutlined,
    StarOutlined,
    HistoryOutlined
} from '@ant-design/icons';
import BookAppointment from './BookAppointment';
import CoachFeedback from './CoachFeedback';
import AppointmentHistory from './AppointmentHistory';

const { Title } = Typography;

const Appointments = () => {
    const [activeTab, setActiveTab] = useState('book');

    const tabItems = [
        {
            key: 'book',
            label: (
                <span className="flex items-center space-x-2">
                    <CalendarOutlined />
                    <span>Đặt lịch</span>
                </span>
            ),
            children: <BookAppointment />
        },
        {
            key: 'history',
            label: (
                <span className="flex items-center space-x-2">
                    <HistoryOutlined />
                    <span>Lịch sử</span>
                </span>
            ),
            children: <AppointmentHistory />
        },
        {
            key: 'feedback',
            label: (
                <span className="flex items-center space-x-2">
                    <StarOutlined />
                    <span>Đánh giá</span>
                </span>
            ),
            children: <CoachFeedback />
        }
    ];

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Title level={2} className="mb-2 text-gray-800">
                        <CalendarOutlined className="mr-3 text-blue-500" />
                        Quản lý lịch hẹn tư vấn
                    </Title>
                </div>

                {/* Tabs */}
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={tabItems}
                    size="large"
                    type="card"
                    className="bg-white rounded-lg shadow-sm"
                />
            </div>
        </div>
    );
};

export default Appointments; 