import React, { useState, useEffect } from 'react';
import {
    Card,
    Button,
    Form,
    Input,
    Upload,
    message,
    Avatar,
    Typography,
    Row,
    Col,
    Divider,
    Tag,
    Rate,
    Progress,
    Statistic,
    Badge,
    Space,
    Modal,
    Select,
    DatePicker,
    Switch
} from 'antd';
import {
    UserOutlined,
    EditOutlined,
    SaveOutlined,
    PlusOutlined,
    DeleteOutlined,
    StarOutlined,
    TrophyOutlined,
    BookOutlined,
    CalendarOutlined,
    PhoneOutlined,
    MailOutlined,
    EnvironmentOutlined,
    CameraOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const CoachProfile = () => {
    const [coachData, setCoachData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(false);
    const [showCertModal, setShowCertModal] = useState(false);
    const [showExpModal, setShowExpModal] = useState(false);
    const [form] = Form.useForm();
    const [certForm] = Form.useForm();
    const [expForm] = Form.useForm();

    useEffect(() => {
        loadCoachProfile();
    }, []);

    const loadCoachProfile = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('coachToken');
            const response = await axios.get('http://smokeking.wibu.me:4000/api/coach/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                const data = response.data.data;
                setCoachData(data);
                form.setFieldsValue({
                    firstName: data.FirstName,
                    lastName: data.LastName,
                    email: data.Email,
                    phoneNumber: data.PhoneNumber,
                    address: data.Address,
                    bio: data.Bio,
                    specialization: data.Specialization,
                    experience: data.Experience,
                    hourlyRate: data.HourlyRate,
                    isAvailable: data.IsAvailable,
                    yearsOfExperience: data.YearsOfExperience,
                    education: data.Education,
                    certifications: data.Certifications,
                    languages: data.Languages,
                    workingHours: data.WorkingHours,
                    servicesOffered: data.ConsultationTypes
                });
            }
        } catch (error) {
            console.error('Error loading coach profile:', error);
            message.error('Không thể tải thông tin cá nhân');
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async (values) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('coachToken');
            const response = await axios.put('http://smokeking.wibu.me:4000/api/coach/profile', values, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                message.success('Cập nhật thông tin thành công!');
                setEditing(false);
                loadCoachProfile();
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            message.error('Không thể cập nhật thông tin');
        } finally {
            setLoading(false);
        }
    };

    const uploadAvatar = async (file) => {
        try {
            const formData = new FormData();
            formData.append('avatar', file);

            const token = localStorage.getItem('coachToken');
            const response = await axios.post('http://smokeking.wibu.me:4000/api/coach/upload-avatar', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                message.success('Cập nhật ảnh đại diện thành công!');
                loadCoachProfile();
            }
        } catch (error) {
            console.error('Error uploading avatar:', error);
            message.error('Không thể cập nhật ảnh đại diện');
        }
        return false; // Prevent default upload behavior
    };

    const addCertification = async (values) => {
        try {
            const token = localStorage.getItem('coachToken');
            const response = await axios.post('http://smokeking.wibu.me:4000/api/coach/certifications', {
                ...values,
                issueDate: values.issueDate.toISOString(),
                expiryDate: values.expiryDate ? values.expiryDate.toISOString() : null
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                message.success('Thêm chứng chỉ thành công!');
                setShowCertModal(false);
                certForm.resetFields();
                loadCoachProfile();
            }
        } catch (error) {
            console.error('Error adding certification:', error);
            message.error('Không thể thêm chứng chỉ');
        }
    };

    const addExperience = async (values) => {
        try {
            const token = localStorage.getItem('coachToken');
            const response = await axios.post('http://smokeking.wibu.me:4000/api/coach/experiences', {
                ...values,
                startDate: values.startDate.toISOString(),
                endDate: values.endDate ? values.endDate.toISOString() : null
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                message.success('Thêm kinh nghiệm thành công!');
                setShowExpModal(false);
                expForm.resetFields();
                loadCoachProfile();
            }
        } catch (error) {
            console.error('Error adding experience:', error);
            message.error('Không thể thêm kinh nghiệm');
        }
    };

    if (!coachData) {
        return <div className="p-6">Đang tải...</div>;
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Title level={2} className="mb-2 text-gray-800">
                        <UserOutlined className="mr-3 text-blue-500" />
                        Thông tin cá nhân
                    </Title>
                    <Text className="text-gray-600">
                        Quản lý thông tin cá nhân và chuyên môn của bạn
                    </Text>
                </div>

                <Row gutter={24}>
                    {/* Left Column - Basic Info */}
                    <Col span={16}>
                        <Card
                            title={
                                <div className="flex items-center justify-between">
                                    <span>Thông tin cơ bản</span>
                                    <Button
                                        type={editing ? "default" : "primary"}
                                        icon={editing ? <SaveOutlined /> : <EditOutlined />}
                                        onClick={() => {
                                            if (editing) {
                                                form.submit();
                                            } else {
                                                setEditing(true);
                                            }
                                        }}
                                        loading={loading}
                                    >
                                        {editing ? 'Lưu' : 'Chỉnh sửa'}
                                    </Button>
                                </div>
                            }
                            className="shadow-lg"
                            style={{ borderRadius: '12px' }}
                        >
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={updateProfile}
                                disabled={!editing}
                            >
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            name="firstName"
                                            label="Họ"
                                            rules={[{ required: true, message: 'Vui lòng nhập họ' }]}
                                        >
                                            <Input placeholder="Nhập họ" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="lastName"
                                            label="Tên"
                                            rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
                                        >
                                            <Input placeholder="Nhập tên" />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            name="email"
                                            label="Email"
                                            rules={[
                                                { required: true, message: 'Vui lòng nhập email' },
                                                { type: 'email', message: 'Email không hợp lệ' }
                                            ]}
                                        >
                                            <Input placeholder="Nhập email" disabled />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="phoneNumber"
                                            label="Số điện thoại"
                                            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
                                        >
                                            <Input placeholder="Nhập số điện thoại" />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Form.Item
                                    name="address"
                                    label="Địa chỉ"
                                >
                                    <Input placeholder="Nhập địa chỉ" />
                                </Form.Item>

                                <Form.Item
                                    name="bio"
                                    label="Giới thiệu bản thân"
                                >
                                    <TextArea
                                        rows={4}
                                        placeholder="Viết một đoạn giới thiệu về bản thân..."
                                    />
                                </Form.Item>

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            name="specialization"
                                            label="Chuyên môn"
                                        >
                                            <Select
                                                mode="multiple"
                                                placeholder="Chọn chuyên môn"
                                                options={[
                                                    { value: 'smoking_cessation', label: 'Cai thuốc lá' },
                                                    { value: 'addiction_counseling', label: 'Tư vấn nghiện' },
                                                    { value: 'behavioral_therapy', label: 'Liệu pháp hành vi' },
                                                    { value: 'stress_management', label: 'Quản lý stress' },
                                                    { value: 'health_coaching', label: 'Huấn luyện sức khỏe' },
                                                    { value: 'nutrition', label: 'Dinh dưỡng' }
                                                ]}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="experience"
                                            label="Số năm kinh nghiệm"
                                        >
                                            <Input type="number" placeholder="Nhập số năm kinh nghiệm" />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            name="hourlyRate"
                                            label="Giá tư vấn (VNĐ/giờ)"
                                        >
                                            <Input type="number" placeholder="Nhập giá tư vấn" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="isAvailable"
                                            label="Trạng thái hoạt động"
                                            valuePropName="checked"
                                        >
                                            <Switch
                                                checkedChildren="Đang hoạt động"
                                                unCheckedChildren="Tạm nghỉ"
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                {/* Additional professional fields */}
                                <Divider orientation="left" className="text-blue-600 font-semibold">
                                    Thông tin chuyên môn
                                </Divider>

                                <Form.Item
                                    name="education"
                                    label="Học vấn & Bằng cấp"
                                >
                                    <TextArea
                                        rows={3}
                                        placeholder="Ví dụ: Thạc sĩ Tâm lý học - Đại học Quốc gia Hà Nội..."
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="certifications"
                                    label="Chứng chỉ chuyên môn"
                                >
                                    <TextArea
                                        rows={3}
                                        placeholder="Ví dụ: Chứng chỉ tư vấn cai thuốc quốc tế, Chứng chỉ CBT..."
                                    />
                                </Form.Item>

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            name="languages"
                                            label="Ngôn ngữ hỗ trợ"
                                        >
                                            <Input placeholder="Ví dụ: Tiếng Việt, Tiếng Anh" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="workingHours"
                                            label="Giờ làm việc"
                                        >
                                            <Input placeholder="Ví dụ: Thứ 2-6: 8:00-17:00" />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Form.Item
                                    name="servicesOffered"
                                    label="Dịch vụ cung cấp"
                                >
                                    <TextArea
                                        rows={2}
                                        placeholder="Ví dụ: Video call, Voice call, Chat, Tư vấn nhóm..."
                                    />
                                </Form.Item>
                            </Form>
                        </Card>

                        {/* Certifications */}
                        <Card
                            title={
                                <div className="flex items-center justify-between">
                                    <span>
                                        <BookOutlined className="mr-2" />
                                        Chứng chỉ & Bằng cấp
                                    </span>
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        onClick={() => setShowCertModal(true)}
                                    >
                                        Thêm chứng chỉ
                                    </Button>
                                </div>
                            }
                            className="shadow-lg mt-6"
                            style={{ borderRadius: '12px' }}
                        >
                            {coachData.certifications?.length > 0 ? (
                                <div className="space-y-4">
                                    {coachData.certifications.map((cert, index) => (
                                        <div key={index} className="border rounded-lg p-4 bg-blue-50">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <Title level={5} className="mb-1">{cert.name}</Title>
                                                    <Text className="text-gray-600">{cert.issuer}</Text>
                                                    <br />
                                                    <Text className="text-sm text-gray-500">
                                                        Cấp: {dayjs(cert.issueDate).format('DD/MM/YYYY')}
                                                        {cert.expiryDate && ` - Hết hạn: ${dayjs(cert.expiryDate).format('DD/MM/YYYY')}`}
                                                    </Text>
                                                </div>
                                                <Badge
                                                    status={cert.expiryDate && dayjs(cert.expiryDate).isBefore(dayjs()) ? "error" : "success"}
                                                    text={cert.expiryDate && dayjs(cert.expiryDate).isBefore(dayjs()) ? "Hết hạn" : "Còn hiệu lực"}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <BookOutlined className="text-4xl mb-2" />
                                    <div>Chưa có chứng chỉ nào</div>
                                </div>
                            )}
                        </Card>

                        {/* Experience */}
                        <Card
                            title={
                                <div className="flex items-center justify-between">
                                    <span>
                                        <TrophyOutlined className="mr-2" />
                                        Kinh nghiệm làm việc
                                    </span>
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        onClick={() => setShowExpModal(true)}
                                    >
                                        Thêm kinh nghiệm
                                    </Button>
                                </div>
                            }
                            className="shadow-lg mt-6"
                            style={{ borderRadius: '12px' }}
                        >
                            {coachData.experiences?.length > 0 ? (
                                <div className="space-y-4">
                                    {coachData.experiences.map((exp, index) => (
                                        <div key={index} className="border rounded-lg p-4 bg-green-50">
                                            <Title level={5} className="mb-1">{exp.position}</Title>
                                            <Text className="text-gray-600">{exp.company}</Text>
                                            <br />
                                            <Text className="text-sm text-gray-500">
                                                {dayjs(exp.startDate).format('MM/YYYY')} -
                                                {exp.endDate ? dayjs(exp.endDate).format('MM/YYYY') : 'Hiện tại'}
                                            </Text>
                                            {exp.description && (
                                                <Paragraph className="mt-2 text-gray-700">
                                                    {exp.description}
                                                </Paragraph>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <TrophyOutlined className="text-4xl mb-2" />
                                    <div>Chưa có kinh nghiệm nào</div>
                                </div>
                            )}
                        </Card>
                    </Col>

                    {/* Right Column - Profile Summary */}
                    <Col span={8}>
                        {/* Avatar & Basic Info */}
                        <Card className="shadow-lg text-center" style={{ borderRadius: '12px' }}>
                            <div className="relative inline-block">
                                <Avatar
                                    size={120}
                                    src={coachData.Avatar}
                                    icon={<UserOutlined />}
                                    className="border-4 border-white shadow-lg"
                                />
                                <Upload
                                    beforeUpload={uploadAvatar}
                                    showUploadList={false}
                                    accept="image/*"
                                >
                                    <Button
                                        type="primary"
                                        shape="circle"
                                        icon={<CameraOutlined />}
                                        className="absolute bottom-0 right-0"
                                        size="small"
                                    />
                                </Upload>
                            </div>

                            <Title level={3} className="mt-4 mb-2">
                                {coachData.FirstName} {coachData.LastName}
                            </Title>

                            <div className="space-y-2 text-gray-600">
                                <div className="flex items-center justify-center">
                                    <MailOutlined className="mr-2" />
                                    {coachData.Email}
                                </div>
                                {coachData.PhoneNumber && (
                                    <div className="flex items-center justify-center">
                                        <PhoneOutlined className="mr-2" />
                                        {coachData.PhoneNumber}
                                    </div>
                                )}
                                {coachData.Address && (
                                    <div className="flex items-center justify-center">
                                        <EnvironmentOutlined className="mr-2" />
                                        {coachData.Address}
                                    </div>
                                )}
                            </div>

                            <Divider />

                            <div className="flex items-center justify-center space-x-2">
                                <Badge
                                    status={coachData.IsAvailable ? "success" : "default"}
                                    text={coachData.IsAvailable ? "Đang hoạt động" : "Tạm nghỉ"}
                                />
                            </div>
                        </Card>

                        {/* Statistics */}
                        <Card
                            title="Thống kê"
                            className="shadow-lg mt-6"
                            style={{ borderRadius: '12px' }}
                        >
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Statistic
                                        title="Kinh nghiệm"
                                        value={coachData.Experience || 0}
                                        suffix="năm"
                                        prefix={<ClockCircleOutlined />}
                                    />
                                </Col>
                                <Col span={12}>
                                    <Statistic
                                        title="Đánh giá"
                                        value={coachData.Rating || 0}
                                        precision={1}
                                        suffix="/ 5"
                                        prefix={<StarOutlined />}
                                    />
                                </Col>
                            </Row>

                            <Divider />

                            <div className="space-y-3">
                                <div>
                                    <Text className="text-gray-600">Tỷ lệ thành công</Text>
                                    <Progress
                                        percent={coachData.SuccessRate || 0}
                                        strokeColor="#52c41a"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Text className="text-gray-600">Số thành viên đã hỗ trợ</Text>
                                    <div className="text-2xl font-bold text-blue-600 mt-1">
                                        {coachData.TotalMembers || 0}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Specializations */}
                        {coachData.Specialization && (
                            <Card
                                title="Chuyên môn"
                                className="shadow-lg mt-6"
                                style={{ borderRadius: '12px' }}
                            >
                                <div className="space-y-2">
                                    {coachData.Specialization.split(',').map((spec, index) => (
                                        <Tag key={index} color="blue" className="mb-2">
                                            {spec.trim()}
                                        </Tag>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Professional Details */}
                        <Card
                            title="Thông tin chuyên môn"
                            className="shadow-lg mt-6"
                            style={{ borderRadius: '12px' }}
                        >
                            <div className="space-y-4">
                                {coachData.Education && (
                                    <div>
                                        <Text strong className="text-gray-700">Học vấn:</Text>
                                        <div className="text-gray-600 mt-1">{coachData.Education}</div>
                                    </div>
                                )}

                                {coachData.Certifications && (
                                    <div>
                                        <Text strong className="text-gray-700">Chứng chỉ:</Text>
                                        <div className="text-gray-600 mt-1">{coachData.Certifications}</div>
                                    </div>
                                )}

                                {coachData.Languages && (
                                    <div>
                                        <Text strong className="text-gray-700">Ngôn ngữ:</Text>
                                        <div className="text-gray-600 mt-1">{coachData.Languages}</div>
                                    </div>
                                )}

                                {coachData.WorkingHours && (
                                    <div>
                                        <Text strong className="text-gray-700">Giờ làm việc:</Text>
                                        <div className="text-gray-600 mt-1">{coachData.WorkingHours}</div>
                                    </div>
                                )}

                                {coachData.ConsultationTypes && (
                                    <div>
                                        <Text strong className="text-gray-700">Dịch vụ:</Text>
                                        <div className="text-gray-600 mt-1">{coachData.ConsultationTypes}</div>
                                    </div>
                                )}

                                {coachData.HourlyRate && (
                                    <div>
                                        <Text strong className="text-gray-700">Giá tư vấn:</Text>
                                        <div className="text-blue-600 font-semibold mt-1">
                                            {Number(coachData.HourlyRate).toLocaleString('vi-VN')} VNĐ/giờ
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </Col>
                </Row>

                {/* Add Certification Modal */}
                <Modal
                    title="Thêm chứng chỉ"
                    open={showCertModal}
                    onCancel={() => setShowCertModal(false)}
                    footer={null}
                    width={500}
                >
                    <Form
                        form={certForm}
                        layout="vertical"
                        onFinish={addCertification}
                    >
                        <Form.Item
                            name="name"
                            label="Tên chứng chỉ"
                            rules={[{ required: true, message: 'Vui lòng nhập tên chứng chỉ' }]}
                        >
                            <Input placeholder="Nhập tên chứng chỉ" />
                        </Form.Item>

                        <Form.Item
                            name="issuer"
                            label="Tổ chức cấp"
                            rules={[{ required: true, message: 'Vui lòng nhập tổ chức cấp' }]}
                        >
                            <Input placeholder="Nhập tổ chức cấp" />
                        </Form.Item>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="issueDate"
                                    label="Ngày cấp"
                                    rules={[{ required: true, message: 'Vui lòng chọn ngày cấp' }]}
                                >
                                    <DatePicker style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="expiryDate"
                                    label="Ngày hết hạn"
                                >
                                    <DatePicker style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item className="mb-0 pt-4">
                            <div className="flex justify-end space-x-3">
                                <Button onClick={() => setShowCertModal(false)}>
                                    Hủy
                                </Button>
                                <Button type="primary" htmlType="submit">
                                    Thêm
                                </Button>
                            </div>
                        </Form.Item>
                    </Form>
                </Modal>

                {/* Add Experience Modal */}
                <Modal
                    title="Thêm kinh nghiệm"
                    open={showExpModal}
                    onCancel={() => setShowExpModal(false)}
                    footer={null}
                    width={600}
                >
                    <Form
                        form={expForm}
                        layout="vertical"
                        onFinish={addExperience}
                    >
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="position"
                                    label="Vị trí"
                                    rules={[{ required: true, message: 'Vui lòng nhập vị trí' }]}
                                >
                                    <Input placeholder="Nhập vị trí công việc" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="company"
                                    label="Công ty"
                                    rules={[{ required: true, message: 'Vui lòng nhập tên công ty' }]}
                                >
                                    <Input placeholder="Nhập tên công ty" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="startDate"
                                    label="Ngày bắt đầu"
                                    rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu' }]}
                                >
                                    <DatePicker style={{ width: '100%' }} picker="month" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="endDate"
                                    label="Ngày kết thúc"
                                >
                                    <DatePicker style={{ width: '100%' }} picker="month" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            name="description"
                            label="Mô tả công việc"
                        >
                            <TextArea
                                rows={4}
                                placeholder="Mô tả về công việc và trách nhiệm..."
                            />
                        </Form.Item>

                        <Form.Item className="mb-0 pt-4">
                            <div className="flex justify-end space-x-3">
                                <Button onClick={() => setShowExpModal(false)}>
                                    Hủy
                                </Button>
                                <Button type="primary" htmlType="submit">
                                    Thêm
                                </Button>
                            </div>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </div>
    );
};

export default CoachProfile; 