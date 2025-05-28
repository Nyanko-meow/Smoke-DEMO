import React from 'react';
import {
    Modal,
    Tabs,
    Card,
    Row,
    Col,
    Descriptions,
    Tag,
    Alert,
    Statistic,
    Rate,
    Timeline,
    Spin
} from 'antd';
import {
    EyeOutlined,
    SmileOutlined,
    ClockCircleOutlined,
    WarningOutlined,
    CalendarOutlined,
    FireOutlined,
    DollarOutlined,
    HeartOutlined,
    TrophyOutlined,
    BarChartOutlined
} from '@ant-design/icons';

const MemberDetailsModal = ({
    visible,
    onClose,
    memberDetails,
    loading,
    selectedMember
}) => {
    return (
        <Modal
            title={
                <div className="flex items-center">
                    <EyeOutlined className="mr-2" />
                    <span>Chi tiết thành viên: {selectedMember?.fullName}</span>
                </div>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            width={1000}
            style={{ top: 20 }}
        >
            {loading ? (
                <div className="text-center py-8">
                    <Spin size="large" />
                    <div className="mt-4">Đang tải thông tin chi tiết...</div>
                </div>
            ) : memberDetails ? (
                <div className="member-details">
                    <Tabs defaultActiveKey="basic" type="card">
                        <Tabs.TabPane key="basic" tab="Thông tin cơ bản">
                            <Row gutter={[24, 24]}>
                                <Col span={24}>
                                    <Card title="Thông tin cá nhân" size="small">
                                        <Descriptions column={2} bordered>
                                            <Descriptions.Item label="Họ tên">{memberDetails.fullName}</Descriptions.Item>
                                            <Descriptions.Item label="Email">{memberDetails.email}</Descriptions.Item>
                                            <Descriptions.Item label="Role">{memberDetails.role}</Descriptions.Item>
                                            <Descriptions.Item label="Điện thoại">{memberDetails.phoneNumber || 'Chưa cập nhật'}</Descriptions.Item>
                                            <Descriptions.Item label="Địa chỉ" span={2}>{memberDetails.address || 'Chưa cập nhật'}</Descriptions.Item>
                                        </Descriptions>
                                    </Card>
                                </Col>

                                {memberDetails.membership && (
                                    <Col span={24}>
                                        <Card title="Gói dịch vụ" size="small">
                                            <Descriptions column={2} bordered>
                                                <Descriptions.Item label="Gói">{memberDetails.membership.planName}</Descriptions.Item>
                                                <Descriptions.Item label="Giá">{memberDetails.membership.planPrice?.toLocaleString()} VNĐ</Descriptions.Item>
                                                <Descriptions.Item label="Còn lại">{memberDetails.membership.daysRemaining} ngày</Descriptions.Item>
                                                <Descriptions.Item label="Trạng thái">
                                                    <Tag color={memberDetails.membership.status === 'active' ? 'green' : 'orange'}>
                                                        {memberDetails.membership.status}
                                                    </Tag>
                                                </Descriptions.Item>
                                                <Descriptions.Item label="Tính năng" span={2}>
                                                    {memberDetails.membership.planFeatures?.join(', ')}
                                                </Descriptions.Item>
                                            </Descriptions>
                                        </Card>
                                    </Col>
                                )}
                            </Row>
                        </Tabs.TabPane>

                        <Tabs.TabPane key="quit-status" tab="Trạng thái cai thuốc">
                            <Row gutter={[24, 24]}>
                                <Col span={24}>
                                    <Card size="small">
                                        <div className="text-center mb-4">
                                            <div className={`status-badge status-${memberDetails.quitSmokingStatus.statusCode}`}>
                                                {memberDetails.quitSmokingStatus.statusCode === 'progressing' && <SmileOutlined className="text-green-500 text-2xl" />}
                                                {memberDetails.quitSmokingStatus.statusCode === 'stagnating' && <ClockCircleOutlined className="text-yellow-500 text-2xl" />}
                                                {memberDetails.quitSmokingStatus.statusCode === 'need_support' && <WarningOutlined className="text-red-500 text-2xl" />}

                                                <h3 className="mt-2">{memberDetails.quitSmokingStatus.status}</h3>
                                            </div>
                                        </div>

                                        <Alert
                                            message={memberDetails.quitSmokingStatus.description}
                                            description={memberDetails.quitSmokingStatus.recommendation}
                                            type={memberDetails.quitSmokingStatus.statusCode === 'progressing' ? 'success' :
                                                memberDetails.quitSmokingStatus.statusCode === 'stagnating' ? 'warning' : 'error'}
                                            showIcon
                                        />

                                        {memberDetails.quitSmokingStatus.metrics && (
                                            <div className="mt-4">
                                                <Row gutter={16}>
                                                    <Col span={6}>
                                                        <Statistic
                                                            title="TB điếu/ngày gần đây"
                                                            value={memberDetails.quitSmokingStatus.metrics.recentAvgCigarettes}
                                                            suffix="điếu"
                                                            valueStyle={{ color: '#1890ff' }}
                                                        />
                                                    </Col>
                                                    <Col span={6}>
                                                        <Statistic
                                                            title="Mức thèm TB"
                                                            value={memberDetails.quitSmokingStatus.metrics.recentAvgCraving}
                                                            suffix="/10"
                                                            valueStyle={{ color: '#52c41a' }}
                                                        />
                                                    </Col>
                                                    <Col span={6}>
                                                        <Statistic
                                                            title="Ngày không hút"
                                                            value={memberDetails.quitSmokingStatus.metrics.daysSmokeFree}
                                                            suffix="ngày"
                                                            valueStyle={{ color: '#722ed1' }}
                                                        />
                                                    </Col>
                                                    <Col span={6}>
                                                        <Statistic
                                                            title="Tổng ngày theo dõi"
                                                            value={memberDetails.quitSmokingStatus.metrics.totalProgressDays}
                                                            suffix="ngày"
                                                            valueStyle={{ color: '#faad14' }}
                                                        />
                                                    </Col>
                                                </Row>
                                            </div>
                                        )}
                                    </Card>
                                </Col>
                            </Row>
                        </Tabs.TabPane>

                        <Tabs.TabPane key="plan" tab="Kế hoạch cai thuốc">
                            {memberDetails.quitPlan ? (
                                <Card size="small">
                                    <Descriptions column={2} bordered>
                                        <Descriptions.Item label="Ngày bắt đầu">
                                            {new Date(memberDetails.quitPlan.startDate).toLocaleDateString('vi-VN')}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Ngày mục tiêu">
                                            {new Date(memberDetails.quitPlan.targetDate).toLocaleDateString('vi-VN')}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Số ngày thực hiện">
                                            {memberDetails.quitPlan.daysInPlan} ngày
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Mức động lực">
                                            <Rate disabled value={memberDetails.quitPlan.motivationLevel} count={10} />
                                            <span className="ml-2">({memberDetails.quitPlan.motivationLevel}/10)</span>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Lý do cai thuốc" span={2}>
                                            {memberDetails.quitPlan.reason}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Kế hoạch chi tiết" span={2}>
                                            {memberDetails.quitPlan.detailedPlan}
                                        </Descriptions.Item>
                                    </Descriptions>
                                </Card>
                            ) : (
                                <div className="text-center py-8">
                                    <CalendarOutlined className="text-gray-400 text-4xl mb-4" />
                                    <div>Chưa có kế hoạch cai thuốc</div>
                                </div>
                            )}
                        </Tabs.TabPane>

                        <Tabs.TabPane key="stats" tab="Thống kê">
                            <Row gutter={[24, 24]}>
                                <Col span={24}>
                                    <Card title="Thống kê tổng quan" size="small">
                                        <Row gutter={16}>
                                            <Col span={6}>
                                                <Statistic
                                                    title="Ngày theo dõi"
                                                    value={memberDetails.statistics.totalDaysTracked}
                                                    prefix={<CalendarOutlined />}
                                                />
                                            </Col>
                                            <Col span={6}>
                                                <Statistic
                                                    title="TB điếu/ngày"
                                                    value={memberDetails.statistics.averageCigarettesPerDay}
                                                    prefix={<FireOutlined />}
                                                />
                                            </Col>
                                            <Col span={6}>
                                                <Statistic
                                                    title="Tiền tiết kiệm"
                                                    value={memberDetails.statistics.totalMoneySaved}
                                                    prefix={<DollarOutlined />}
                                                    suffix="₫"
                                                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                />
                                            </Col>
                                            <Col span={6}>
                                                <Statistic
                                                    title="Ngày không hút tốt nhất"
                                                    value={memberDetails.statistics.bestDaysSmokeFree}
                                                    prefix={<HeartOutlined />}
                                                />
                                            </Col>
                                        </Row>
                                    </Card>
                                </Col>
                            </Row>
                        </Tabs.TabPane>

                        <Tabs.TabPane key="achievements" tab={`Thành tích (${memberDetails.achievementCount})`}>
                            {memberDetails.achievements.length > 0 ? (
                                <Row gutter={[16, 16]}>
                                    {memberDetails.achievements.map((achievement) => (
                                        <Col xs={24} sm={12} md={8} key={achievement.AchievementID}>
                                            <Card size="small" className="text-center">
                                                <img
                                                    src={achievement.IconURL}
                                                    alt={achievement.Name}
                                                    className="w-12 h-12 mx-auto mb-2"
                                                />
                                                <div className="font-medium">{achievement.Name}</div>
                                                <div className="text-gray-500 text-sm">{achievement.Description}</div>
                                                <div className="text-xs text-gray-400 mt-1">
                                                    {new Date(achievement.EarnedAt).toLocaleDateString('vi-VN')}
                                                </div>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            ) : (
                                <div className="text-center py-8">
                                    <TrophyOutlined className="text-gray-400 text-4xl mb-4" />
                                    <div>Chưa có thành tích nào</div>
                                </div>
                            )}
                        </Tabs.TabPane>

                        <Tabs.TabPane key="progress" tab="Tiến trình gần đây">
                            {memberDetails.recentProgress.length > 0 ? (
                                <Timeline mode="left">
                                    {memberDetails.recentProgress.map((progress, index) => (
                                        <Timeline.Item
                                            key={index}
                                            color={progress.CigarettesSmoked === 0 ? 'green' :
                                                progress.CigarettesSmoked <= 2 ? 'orange' : 'red'}
                                        >
                                            <div className="mb-2">
                                                <strong>{new Date(progress.Date).toLocaleDateString('vi-VN')}</strong>
                                            </div>
                                            <div>Hút: {progress.CigarettesSmoked} điếu</div>
                                            <div>Mức thèm: {progress.CravingLevel}/10</div>
                                            <div>Ngày không hút: {progress.DaysSmokeFree}</div>
                                            <div>Tiền tiết kiệm: {progress.MoneySaved?.toLocaleString()}₫</div>
                                            {progress.EmotionNotes && (
                                                <div className="text-gray-600 italic mt-1">&quot;{progress.EmotionNotes}&quot;</div>
                                            )}
                                        </Timeline.Item>
                                    ))}
                                </Timeline>
                            ) : (
                                <div className="text-center py-8">
                                    <BarChartOutlined className="text-gray-400 text-4xl mb-4" />
                                    <div>Chưa có dữ liệu tiến trình</div>
                                </div>
                            )}
                        </Tabs.TabPane>
                    </Tabs>
                </div>
            ) : (
                <div className="text-center py-8">
                    <div>Không thể tải thông tin chi tiết</div>
                </div>
            )}
        </Modal>
    );
};

export default MemberDetailsModal; 