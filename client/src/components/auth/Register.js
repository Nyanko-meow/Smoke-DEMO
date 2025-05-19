import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Form, Input, Button, Alert, Spin, Divider, Card, Typography } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, LockOutlined, EyeTwoTone, EyeInvisibleOutlined } from '@ant-design/icons';
import { register, clearError } from '../../store/slices/authSlice';

const { Title, Text } = Typography;

const Register = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { loading, error } = useSelector(state => state.auth);
    const [form] = Form.useForm();
    const [apiError, setApiError] = useState('');

    // Clear errors when component unmounts
    React.useEffect(() => {
        return () => {
            dispatch(clearError());
        };
    }, [dispatch]);

    const validateMessages = {
        required: '${label} không được để trống!',
        types: {
            email: '${label} không hợp lệ!',
            number: '${label} không phải là số!',
        },
        string: {
            min: '${label} phải có ít nhất ${min} ký tự!',
        },
    };

    const handleSubmit = async (values) => {
        // Clear previous API errors
        setApiError('');
        dispatch(clearError());

        // Remove confirmPassword as it's not needed for the API
        const { confirmPassword, ...registerData } = values;

        try {
            const result = await dispatch(register(registerData));

            if (result.meta.requestStatus === 'rejected') {
                // Format API errors based on response
                if (typeof result.payload === 'string') {
                    setApiError(result.payload);
                } else if (typeof result.payload === 'object') {
                    // Handle structured validation errors from API
                    let fieldErrors = {};
                    let hasFieldErrors = false;

                    Object.entries(result.payload).forEach(([field, message]) => {
                        fieldErrors[field] = message;
                        hasFieldErrors = true;
                    });

                    if (hasFieldErrors) {
                        form.setFields(
                            Object.entries(fieldErrors).map(([name, errors]) => ({
                                name,
                                errors: Array.isArray(errors) ? errors : [errors],
                            }))
                        );
                    } else {
                        setApiError(JSON.stringify(result.payload));
                    }
                }
            } else if (result.meta.requestStatus === 'fulfilled') {
                navigate('/');
            }
        } catch (err) {
            setApiError('Registration failed. Please try again later.');
        }
    };

    return (
        <div className="w-full max-w-md mx-auto my-8 px-4">
            <Card className="shadow-lg rounded-lg overflow-hidden">
                <div className="p-6">
                    <Title level={2} className="text-center text-blue-600 font-bold">
                        Create Your Account
                    </Title>
                    <Text className="text-center block mb-6 text-gray-500">
                        Join SmokeKing and start your journey to a smoke-free life
                    </Text>

                    {(error || apiError) && (
                        <Alert
                            message={error || apiError}
                            type="error"
                            showIcon
                            className="mb-4"
                        />
                    )}

                    <Form
                        form={form}
                        name="register"
                        onFinish={handleSubmit}
                        validateMessages={validateMessages}
                        layout="vertical"
                        scrollToFirstError
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Form.Item
                                name="firstName"
                                label="First Name"
                                rules={[{ required: true }]}
                            >
                                <Input
                                    prefix={<UserOutlined className="text-gray-400" />}
                                    placeholder="First Name"
                                />
                            </Form.Item>

                            <Form.Item
                                name="lastName"
                                label="Last Name"
                                rules={[{ required: true }]}
                            >
                                <Input
                                    prefix={<UserOutlined className="text-gray-400" />}
                                    placeholder="Last Name"
                                />
                            </Form.Item>
                        </div>

                        <Form.Item
                            name="email"
                            label="Email Address"
                            rules={[
                                { required: true },
                                { type: 'email' }
                            ]}
                        >
                            <Input
                                prefix={<MailOutlined className="text-gray-400" />}
                                placeholder="Email Address"
                            />
                        </Form.Item>

                        <Form.Item
                            name="phoneNumber"
                            label="Phone Number"
                            rules={[
                                { pattern: /^\d{10,11}$/, message: 'Please enter a valid phone number' }
                            ]}
                            tooltip="Optional"
                        >
                            <Input
                                prefix={<PhoneOutlined className="text-gray-400" />}
                                placeholder="Phone Number (Optional)"
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label="Password"
                            rules={[
                                { required: true },
                                { min: 8 },
                                {
                                    pattern: /(?=.*[A-Z])/,
                                    message: 'Password must contain at least one uppercase letter'
                                },
                                {
                                    pattern: /(?=.*\d)/,
                                    message: 'Password must contain at least one number'
                                }
                            ]}
                            extra="Password must be at least 8 characters with 1 uppercase letter and 1 number"
                        >
                            <Input.Password
                                prefix={<LockOutlined className="text-gray-400" />}
                                placeholder="Password"
                                iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                            />
                        </Form.Item>

                        <Form.Item
                            name="confirmPassword"
                            label="Confirm Password"
                            dependencies={['password']}
                            rules={[
                                { required: true },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('password') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('Passwords do not match'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password
                                prefix={<LockOutlined className="text-gray-400" />}
                                placeholder="Confirm Password"
                                iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                            />
                        </Form.Item>

                        <Form.Item className="mt-6">
                            <Button
                                type="primary"
                                htmlType="submit"
                                className="w-full h-12 text-lg"
                                loading={loading}
                            >
                                Create Account
                            </Button>
                        </Form.Item>
                    </Form>

                    <Divider plain>OR</Divider>

                    <div className="text-center">
                        <Text className="text-gray-600">
                            Already have an account?{' '}
                            <Link to="/login" className="text-blue-600 font-medium">
                                Log In
                            </Link>
                        </Text>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Register; 