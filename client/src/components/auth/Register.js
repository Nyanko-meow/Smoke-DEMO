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

        // Add role - default to guest
        registerData.role = 'guest';

        console.log('Submitting registration form:', {
            ...registerData,
            password: '[HIDDEN]'
        });

        try {
            const resultAction = await dispatch(register(registerData));
            console.log('Registration result:', resultAction);

            if (register.fulfilled.match(resultAction)) {
                console.log('Registration successful, navigating to home');
                navigate('/');
            } else if (register.rejected.match(resultAction)) {
                // Format API errors based on response
                console.error('Registration failed with error:', resultAction.payload);

                if (typeof resultAction.payload === 'string') {
                    setApiError(resultAction.payload);
                } else if (typeof resultAction.payload === 'object') {
                    // Handle structured validation errors from API
                    let fieldErrors = {};
                    let hasFieldErrors = false;

                    Object.entries(resultAction.payload).forEach(([field, message]) => {
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
                        setApiError(JSON.stringify(resultAction.payload));
                    }
                }
            }
        } catch (err) {
            console.error('Registration error:', err);
            setApiError('Registration failed. Please try again later.');
        }
    };

    return (
        <div className="register-page-wrapper">
            <div className="register-card-wrapper">
                <Card className="register-card">
                    <div className="register-header">
                        <Title className="register-title">
                            Register Your Account
                        </Title>
                        <Text className="register-subtitle">
                            Join SmokeKing and start your journey to a smoke-free life
                        </Text>
                    </div>

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
                        className="register-form"
                    >
                        <div className="register-name-grid">
                            <Form.Item
                                name="firstName"
                                label="First Name"
                                rules={[{ required: true }]}
                                style={{ marginBottom: 0 }}
                            >
                                <Input
                                    prefix={<UserOutlined />}
                                    placeholder="First Name"
                                    size="large"
                                />
                            </Form.Item>

                            <Form.Item
                                name="lastName"
                                label="Last Name"
                                rules={[{ required: true }]}
                                style={{ marginBottom: 0 }}
                            >
                                <Input
                                    prefix={<UserOutlined />}
                                    placeholder="Last Name"
                                    size="large"
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
                                prefix={<MailOutlined />}
                                placeholder="Email Address"
                                size="large"
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
                                prefix={<PhoneOutlined />}
                                placeholder="Phone Number (Optional)"
                                size="large"
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
                                prefix={<LockOutlined />}
                                placeholder="Password"
                                size="large"
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
                                prefix={<LockOutlined />}
                                placeholder="Confirm Password"
                                size="large"
                                iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                            />
                        </Form.Item>

                        <Form.Item className="mt-6">
                            <Button
                                type="primary"
                                htmlType="submit"
                                className="register-submit-btn w-full"
                                loading={loading}
                            >
                                Create Account
                            </Button>
                        </Form.Item>
                    </Form>

                    <Divider className="register-divider">OR</Divider>

                    <div className="register-login-link">
                        <Text>
                            Already have an account?{' '}
                            <Link to="/login">
                                Log In
                            </Link>
                        </Text>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Register; 