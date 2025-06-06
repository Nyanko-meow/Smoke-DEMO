import React from 'react';
import { Card, Typography } from 'antd';
import { MessageOutlined } from '@ant-design/icons';

const { Title } = Typography;

const CoachChatSimple = () => {
    return (
        <Card>
            <Title level={2}>
                <MessageOutlined className="mr-3" />
                Chat Test - Simple Version
            </Title>
            <p>Nếu bạn thấy text này, nghĩa là React component đã hoạt động!</p>
            <p>Vấn đề có thể là:</p>
            <ul>
                <li>Lỗi trong ConversationList component</li>
                <li>Lỗi trong MemberList component</li>
                <li>Lỗi trong ChatBox component</li>
                <li>Lỗi CSS hoặc styling</li>
            </ul>
        </Card>
    );
};

export default CoachChatSimple; 