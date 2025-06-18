import React from 'react';
import { Modal, Typography, List, Alert, Button, Space } from 'antd';
import {
    InfoCircleOutlined,
    ReloadOutlined,
    CalendarOutlined,
    BarChartOutlined,
    FormOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const ProgressResetNotification = ({
    visible,
    onConfirm,
    onCancel,
    planName = "Premium Plan",
    loading = false
}) => {
    const resetItems = [
        {
            icon: <BarChartOutlined style={{ color: '#1890ff' }} />,
            title: 'Kế hoạch bỏ thuốc',
            description: 'Các kế hoạch bỏ thuốc hiện tại sẽ được lưu trữ và bạn có thể tạo kế hoạch mới phù hợp với gói dịch vụ mới'
        },
        {
            icon: <ReloadOutlined style={{ color: '#52c41a' }} />,
            title: 'Tiến trình ghi nhận',
            description: 'Lịch sử ghi nhận tiến trình sẽ được lưu trữ để bạn bắt đầu fresh với gói dịch vụ mới'
        },
        {
            icon: <FormOutlined style={{ color: '#722ed1' }} />,
            title: 'Khảo sát',
            description: 'Các câu trả lời khảo sát cũ sẽ được lưu trữ, bạn có thể thực hiện khảo sát mới phù hợp với gói hiện tại'
        },
        {
            icon: <CalendarOutlined style={{ color: '#fa8c16' }} />,
            title: 'Lịch hẹn',
            description: 'Các lịch hẹn đang chờ sẽ được hủy để bạn có thể đặt lịch mới với coach phù hợp'
        }
    ];

    return (
        <Modal
            title={
                <Space>
                    <InfoCircleOutlined style={{ color: '#1890ff' }} />
                    <span>Thông báo quan trọng</span>
                </Space>
            }
            visible={visible}
            onCancel={onCancel}
            width={600}
            footer={[
                <Button key="cancel" onClick={onCancel} disabled={loading}>
                    Hủy bỏ
                </Button>,
                <Button
                    key="confirm"
                    type="primary"
                    onClick={onConfirm}
                    loading={loading}
                    icon={<CheckCircleOutlined />}
                >
                    Tôi hiểu và đồng ý
                </Button>
            ]}
        >
            <div style={{ marginBottom: 16 }}>
                <Title level={4} style={{ color: '#1890ff', marginBottom: 8 }}>
                    🔄 Reset tiến trình khi mua gói mới
                </Title>

                <Alert
                    message="Bắt đầu hành trình mới"
                    description={
                        <Paragraph style={{ marginBottom: 0 }}>
                            Khi bạn mua gói <strong>{planName}</strong>, tất cả tiến trình hiện tại sẽ được
                            <strong> reset để bạn có cơ hội bắt đầu fresh</strong> với gói dịch vụ mới.
                            Đừng lo lắng, dữ liệu cũ sẽ được lưu trữ an toàn cho mục đích tham khảo.
                        </Paragraph>
                    }
                    type="info"
                    showIcon
                    style={{ marginBottom: 20 }}
                />
            </div>

            <Title level={5} style={{ marginBottom: 16 }}>
                📋 Những gì sẽ được reset:
            </Title>

            <List
                dataSource={resetItems}
                renderItem={(item) => (
                    <List.Item style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                        <List.Item.Meta
                            avatar={item.icon}
                            title={<Text strong>{item.title}</Text>}
                            description={<Text type="secondary">{item.description}</Text>}
                        />
                    </List.Item>
                )}
            />

            <Alert
                message="Lưu ý quan trọng"
                description={
                    <div>
                        <Paragraph style={{ marginBottom: 8 }}>
                            ✅ <strong>Dữ liệu được bảo toàn:</strong> Tất cả thông tin cũ sẽ được lưu trữ an toàn
                        </Paragraph>
                        <Paragraph style={{ marginBottom: 8 }}>
                            🎯 <strong>Cơ hội mới:</strong> Bắt đầu fresh với các tính năng nâng cao của gói mới
                        </Paragraph>
                        <Paragraph style={{ marginBottom: 0 }}>
                            🏆 <strong>Hỗ trợ tốt hơn:</strong> Được hỗ trợ phù hợp với gói dịch vụ bạn chọn
                        </Paragraph>
                    </div>
                }
                type="success"
                showIcon
                style={{ marginTop: 16 }}
            />
        </Modal>
    );
};

export default ProgressResetNotification; 