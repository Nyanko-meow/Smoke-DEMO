import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Radio, InputNumber, Card, Typography, message, Divider, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchSmokingStatus,
    fetchUserSurvey,
    submitSmokingStatusSurvey,
    resetSuccess,
    resetError
} from '../store/slices/smokingStatusSlice';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const SmokingStatusPage = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const {
        smokingStatus,
        userSurvey,
        loading,
        submitting,
        success,
        error
    } = useSelector(state => state.smokingStatus);

    const { isAuthenticated } = useSelector(state => state.auth);

    // Fetch data on component mount
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        dispatch(fetchSmokingStatus());
        dispatch(fetchUserSurvey());
    }, [dispatch, isAuthenticated, navigate]);

    // Set form values when data is loaded
    useEffect(() => {
        if (userSurvey) {
            form.setFieldsValue({
                smokingDuration: userSurvey.SmokingDuration,
                cigarettesPerDay: userSurvey.CigarettesPerDay,
                smokingTime: userSurvey.SmokingTime,
                quitReason: userSurvey.QuitReason,
                previousAttempts: userSurvey.PreviousAttempts,
                supportNeeds: userSurvey.SupportNeeds,
                monthlyBudget: userSurvey.MonthlyBudget,
                preferredPlatform: userSurvey.PreferredPlatform,
                importantMetrics: userSurvey.ImportantMetrics,
                socialSharing: userSurvey.SocialSharing === true ? 'yes' : 'no',
            });
        }

        if (smokingStatus) {
            form.setFieldsValue({
                cigarettePrice: smokingStatus.CigarettePrice,
                smokingFrequency: smokingStatus.SmokingFrequency,
            });
        }
    }, [form, smokingStatus, userSurvey]);

    // Handle success and error messages
    useEffect(() => {
        if (success) {
            message.success('Your smoking status has been updated successfully!');
            dispatch(resetSuccess());

            // Navigate to home or dashboard after success
            setTimeout(() => {
                navigate('/');
            }, 1500);
        }

        if (error) {
            message.error(error);
            dispatch(resetError());
        }
    }, [success, error, dispatch, navigate]);

    const onFinish = (values) => {
        // Convert socialSharing from yes/no to boolean
        if (values.socialSharing) {
            values.socialSharing = values.socialSharing === 'yes';
        }

        dispatch(submitSmokingStatusSurvey(values));
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Spin size="large" tip="Loading your data..." />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <Card className="shadow-lg">
                <Title level={2} className="text-center mb-6">Smoking Status Survey</Title>
                <Text className="block mb-6">
                    Please complete this survey to help us understand your smoking habits and tailor our program to your needs.
                    This information will be used to track your progress and provide personalized support.
                </Text>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    requiredMark="optional"
                >
                    <Divider orientation="left">Basic Information</Divider>

                    <Form.Item
                        name="smokingDuration"
                        label="How long have you been smoking?"
                        rules={[{ required: true, message: 'Please select how long you have been smoking' }]}
                    >
                        <Select placeholder="Select smoking duration">
                            <Option value="less than 1 year">Less than 1 year</Option>
                            <Option value="1-5 years">1-5 years</Option>
                            <Option value="6-10 years">6-10 years</Option>
                            <Option value="11-20 years">11-20 years</Option>
                            <Option value="more than 20 years">More than 20 years</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="cigarettesPerDay"
                        label="How many cigarettes do you smoke per day?"
                        rules={[{ required: true, message: 'Please enter the number of cigarettes per day' }]}
                    >
                        <InputNumber min={1} max={100} className="w-full" />
                    </Form.Item>

                    <Form.Item
                        name="cigarettePrice"
                        label="Average price per pack (in your local currency)"
                        rules={[{ required: true, message: 'Please enter the average price per pack' }]}
                    >
                        <InputNumber min={0.1} step={0.1} className="w-full" />
                    </Form.Item>

                    <Form.Item
                        name="smokingFrequency"
                        label="How would you describe your smoking pattern?"
                        rules={[{ required: true, message: 'Please select your smoking frequency' }]}
                    >
                        <Select placeholder="Select smoking frequency">
                            <Option value="regular">Regular (about the same number every day)</Option>
                            <Option value="social">Social (mainly when with others)</Option>
                            <Option value="stress">Stress-related (mainly during stressful times)</Option>
                            <Option value="binge">Binge (vary between heavy and light periods)</Option>
                            <Option value="occasional">Occasional (not every day)</Option>
                        </Select>
                    </Form.Item>

                    <Divider orientation="left">Smoking Behavior</Divider>

                    <Form.Item
                        name="smokingTime"
                        label="When do you typically smoke? (time of day, situations, etc.)"
                    >
                        <TextArea rows={3} />
                    </Form.Item>

                    <Form.Item
                        name="quitReason"
                        label="What is your primary reason for wanting to quit smoking?"
                    >
                        <Select placeholder="Select your primary reason">
                            <Option value="health">Health concerns</Option>
                            <Option value="family">Family pressure/for loved ones</Option>
                            <Option value="financial">Financial reasons</Option>
                            <Option value="social">Social reasons/stigma</Option>
                            <Option value="pregnancy">Pregnancy or planning for children</Option>
                            <Option value="performance">Physical performance/fitness</Option>
                            <Option value="other">Other</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="previousAttempts"
                        label="Have you tried to quit smoking before? If yes, what methods did you try?"
                    >
                        <TextArea rows={3} />
                    </Form.Item>

                    <Divider orientation="left">Support Preferences</Divider>

                    <Form.Item
                        name="supportNeeds"
                        label="What kind of support do you think would help you most?"
                    >
                        <Select placeholder="Select support type" mode="multiple">
                            <Option value="coaching">One-on-one coaching</Option>
                            <Option value="group">Group support</Option>
                            <Option value="app">Mobile app reminders and tracking</Option>
                            <Option value="medication">Nicotine replacement or medication</Option>
                            <Option value="content">Educational content</Option>
                            <Option value="community">Community forum</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="monthlyBudget"
                        label="If applicable, what is your monthly budget for smoking cessation support? (in your local currency)"
                    >
                        <InputNumber min={0} className="w-full" />
                    </Form.Item>

                    <Form.Item
                        name="preferredPlatform"
                        label="How would you prefer to receive support and information?"
                    >
                        <Select placeholder="Select preferred platform">
                            <Option value="mobile">Mobile app</Option>
                            <Option value="web">Website</Option>
                            <Option value="email">Email</Option>
                            <Option value="text">Text messages</Option>
                            <Option value="inperson">In-person</Option>
                            <Option value="call">Phone calls</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="importantMetrics"
                        label="What metrics are most important for you to track during your quit journey?"
                    >
                        <Select placeholder="Select metrics" mode="multiple">
                            <Option value="money">Money saved</Option>
                            <Option value="health">Health improvements</Option>
                            <Option value="cravings">Cravings management</Option>
                            <Option value="smokefree">Smoke-free days</Option>
                            <Option value="mood">Mood and emotions</Option>
                            <Option value="weight">Weight management</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="socialSharing"
                        label="Would you be comfortable sharing your progress on social media?"
                    >
                        <Radio.Group>
                            <Radio value="yes">Yes</Radio>
                            <Radio value="no">No</Radio>
                        </Radio.Group>
                    </Form.Item>

                    <Form.Item className="mt-8">
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={submitting}
                            block
                            size="large"
                        >
                            Save Information
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default SmokingStatusPage; 