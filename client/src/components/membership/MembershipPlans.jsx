import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchMembershipPlans,
    getCurrentMembership,
    purchaseMembership,
    setCurrentMembership,
    cancelMembership,
    clearSuccess
} from '../../store/slices/membershipSlice';
import { getCurrentUser } from '../../store/slices/authSlice';
import {
    Card,
    Button,
    Divider,
    Tag,
    List,
    Typography,
    Modal,
    Radio,
    Spin,
    Alert,
    Table,
    Steps,
    Popconfirm
} from 'antd';
import { notification } from 'antd';
import axiosInstance from '../../utils/axiosConfig';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

const PaymentMethodOptions = [
    { label: 'Bank Transfer', value: 'BankTransfer' },
    { label: 'Cash at Branch', value: 'Cash' },
];

// Dữ liệu mẫu khi API không hoạt động
const SAMPLE_PLANS = [
    {
        PlanID: 1,
        Name: 'Basic Plan',
        Description: 'Get started on your smoke-free journey with our basic plan.',
        Price: 99.00,
        Duration: 30,
        Features: 'Progress tracking\nBasic quitting tips\nCommunity access'
    },
    {
        PlanID: 2,
        Name: 'Premium Plan',
        Description: 'Enhanced support for your smoke-free journey.',
        Price: 199.00,
        Duration: 60,
        Features: 'Progress tracking\nAdvanced analytics\nPremium quitting strategies\nCommunity access\nWeekly motivation'
    },
    {
        PlanID: 3,
        Name: 'Pro Plan',
        Description: 'Maximum support to ensure your success.',
        Price: 299.00,
        Duration: 90,
        Features: 'Progress tracking\nAdvanced analytics\nPro quitting strategies\nCommunity access\nDaily motivation\nPersonalized coaching\nHealth improvement dashboard'
    }
];

const MembershipPlans = () => {
    const dispatch = useDispatch();
    const { plans, currentMembership, loading, error, success, message } = useSelector(
        (state) => state.membership
    );
    const { user } = useSelector((state) => state.auth);

    const [selectedPlan, setSelectedPlan] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('BankTransfer');
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [useSampleData, setUseSampleData] = useState(false);
    const [apiError, setApiError] = useState(null);
    const [sqlMessage, setSqlMessage] = useState(null);
    const [cancelModalVisible, setCancelModalVisible] = useState(false);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [paymentLoading, setPaymentLoading] = useState(false);

    // Determine whether to use API data or sample data as fallback
    const displayPlans = plans && plans.length > 0 ? plans : SAMPLE_PLANS;

    useEffect(() => {
        const loadData = async () => {
            try {
                // Fetch plans from API
                console.log("Fetching plans from API");
                const result = await dispatch(fetchMembershipPlans()).unwrap();

                if (result.message) {
                    console.log("Server message:", result.message);
                }

                // Check if we got data from SQL or we're using sample data
                if (result.plans && result.plans.length > 0) {
                    console.log("Successfully loaded", result.plans.length, "plans from SQL database");
                    setUseSampleData(false);
                } else {
                    console.log("No plans received from API, falling back to sample data");
                    setUseSampleData(true);
                }

                // Also get current membership if user is logged in
                if (user) {
                    try {
                        // Clear success state before getting membership to prevent notification trigger
                        dispatch(clearSuccess());
                        await dispatch(getCurrentMembership()).unwrap();

                        // Fetch payment history
                        await fetchPaymentHistory();
                    } catch (err) {
                        console.log("Could not fetch current membership:", err);
                    }
                }
            } catch (err) {
                console.error('Error fetching plans:', err);
                setApiError("Could not load plans from API. Using sample data as fallback.");
                setUseSampleData(true);
            }
        };

        loadData();
    }, [dispatch, user]);

    useEffect(() => {
        if (success && !loading) {
            // Use antd notification API
            notification.success({
                message: 'Success',
                description: 'Membership plan registered successfully!'
            });

            if (paymentModalVisible) {
                setPaymentModalVisible(false);
            }

            // Reload current membership data
            if (user) {
                dispatch(getCurrentMembership());

                // Also fetch updated payment history
                fetchPaymentHistory();
            }

            // Clear success state to prevent repeated notifications
            dispatch(clearSuccess());
        }
    }, [success, loading, paymentModalVisible, dispatch, user]);

    // Don't show API errors in demo mode
    useEffect(() => {
        if (error && !useSampleData) {
            let errorMsg = 'An error occurred. Please try again.';

            if (typeof error === 'string') {
                errorMsg = error;
            } else if (error && error.message) {
                errorMsg = error.message;
            }

            notification.error({
                message: 'Error',
                description: errorMsg
            });
        }
    }, [error, useSampleData]);

    // Function to fetch payment history
    const fetchPaymentHistory = async () => {
        if (!user) return;

        try {
            setPaymentLoading(true);
            const response = await axiosInstance.get('/membership/payment-history');
            if (response.data && response.data.success) {
                setPaymentHistory(response.data.data);
                console.log("Payment history loaded:", response.data.data);
            }
        } catch (error) {
            console.error("Error fetching payment history:", error);
        } finally {
            setPaymentLoading(false);
        }
    };

    // Function to render user's payment information
    const renderPaymentInfo = () => {
        if (!user || paymentLoading) {
            return null;
        }

        if (paymentHistory && paymentHistory.length > 0) {
            // Get most recent payment
            const latestPayment = paymentHistory[0];
            const startDate = new Date(latestPayment.StartDate).toLocaleDateString('vi-VN');
            const endDate = new Date(latestPayment.EndDate).toLocaleDateString('vi-VN');
            const status = latestPayment.PaymentStatus;

            return (
                <Alert
                    message="Thông tin đơn đặt hàng"
                    description={
                        <div>
                            <p><strong>Gói dịch vụ:</strong> {latestPayment.PlanName}</p>
                            <p><strong>Ngày bắt đầu:</strong> {startDate}</p>
                            <p><strong>Ngày kết thúc:</strong> {endDate}</p>
                            <p><strong>Trạng thái:</strong> {status === 'confirmed' ? 'Đã xác nhận' : status === 'pending' ? 'Đang chờ xác nhận' : 'Đã từ chối'}</p>
                            <p><strong>Phương thức thanh toán:</strong> {latestPayment.PaymentMethod === 'BankTransfer' ? 'Chuyển khoản' : 'Tiền mặt'}</p>
                        </div>
                    }
                    type="info"
                    showIcon
                    style={{ marginBottom: 20 }}
                />
            );
        }

        return null;
    };

    const handleSelectPlan = (plan) => {
        setSelectedPlan(plan);
        setPaymentModalVisible(true);
        setCurrentStep(1);
    };

    const handlePayment = () => {
        if (selectedPlan) {
            try {
                // Set to confirmation step
                setCurrentStep(2);

                // Make sure the user is logged in before attempting payment
                if (!user || !user.id) {
                    notification.error({
                        message: 'Authentication Error',
                        description: 'You must be logged in to purchase a membership'
                    });
                    setCurrentStep(1);
                    return;
                }

                console.log('Sending payment request for plan:', selectedPlan.PlanID, 'user:', user.id);

                // Clear any previous success state to prevent notification loops
                dispatch(clearSuccess());

                // Call the purchaseMembership action to save to database
                dispatch(purchaseMembership({
                    planId: selectedPlan.PlanID,
                    paymentMethod: paymentMethod
                }))
                    .unwrap()
                    .then(response => {
                        // Show success message
                        notification.success({
                            message: 'Payment Submitted',
                            description: 'Your payment is being processed.'
                        });
                        setPaymentModalVisible(false);

                        // Show notification about pending confirmation
                        notification.info({
                            message: 'Processing',
                            description: 'Your membership will be activated once confirmed.'
                        });

                        // Log the successful response
                        console.log('Payment success response:', response);

                        // Refresh user data to get updated role
                        dispatch(getCurrentUser());

                        // Fetch updated payment history
                        fetchPaymentHistory();
                    })
                    .catch(err => {
                        // Safe error handling
                        console.error('Payment error:', err);
                        let errorMsg = 'Failed to process payment. Please try again.';

                        if (err && typeof err === 'object') {
                            if (err.message) {
                                errorMsg = err.message;
                            } else if (err.error) {
                                errorMsg = err.error;
                            }
                        } else if (typeof err === 'string') {
                            errorMsg = err;
                        }

                        notification.error({
                            message: 'Payment Failed',
                            description: errorMsg
                        });
                        setCurrentStep(1);
                    });
            } catch (error) {
                // Handle any synchronous errors
                console.error('Error in payment process:', error);
                notification.error({
                    message: 'Error',
                    description: 'An error occurred during payment processing'
                });
                setCurrentStep(1);
            }
        }
    };

    const handleCancel = () => {
        setPaymentModalVisible(false);
        setCurrentStep(0);
    };

    const handleCancelMembership = async () => {
        try {
            if (!currentMembership) return;

            await dispatch(cancelMembership()).unwrap();
            notification.success({
                message: 'Success',
                description: 'Membership cancelled successfully'
            });

            // Show 50% refund message
            Modal.info({
                title: 'Membership Cancelled',
                content: (
                    <div>
                        <p>Your membership has been cancelled.</p>
                        <p>According to our policy, you will receive a 50% refund of your payment amount.</p>
                        <p>Refund amount: ${(currentMembership.Price * 0.5).toFixed(2)}</p>
                        <p>Your account status will revert to Guest.</p>
                    </div>
                ),
            });
        } catch (error) {
            notification.error({
                message: 'Error',
                description: 'Failed to cancel membership: ' + (error.message || 'Unknown error')
            });
        }
    };

    const formatFeatureList = (featuresString) => {
        // Handle both newline and semicolon delimiters
        if (featuresString.includes(';')) {
            // For semicolon-delimited features from database
            return featuresString.split(';').map(feature => feature.trim());
        }
        // For newline-delimited features 
        return featuresString.split('\n');
    };

    // Create plan table columns
    const columns = [
        {
            title: 'Plan Code',
            dataIndex: 'planCode',
            key: 'planCode',
            render: (_, record) => {
                let code = 'BASIC';
                if (record.Name.includes('Premium')) code = 'PREMIUM';
                if (record.Name.includes('Pro')) code = 'PRO';
                return <Text strong>{code}</Text>;
            }
        },
        {
            title: 'Name',
            dataIndex: 'Name',
            key: 'name',
        },
        {
            title: 'Price (USD)',
            dataIndex: 'Price',
            key: 'price',
            render: (price) => {
                return price > 0 ? `$${price.toFixed(2)}` : 'Free';
            }
        },
        {
            title: 'Duration',
            dataIndex: 'Duration',
            key: 'duration',
            render: (duration) => {
                return duration === 30 ? '30 days' :
                    duration === 60 ? '60 days' :
                        duration === 90 ? '90 days' : `${duration} days`;
            }
        },
        {
            title: 'Features',
            dataIndex: 'Features',
            key: 'features',
            render: (features) => {
                const featureList = formatFeatureList(features);
                return (
                    <List
                        dataSource={featureList}
                        renderItem={(feature) => (
                            <List.Item style={{ padding: '4px 0', border: 'none' }}>
                                <Text
                                    style={{
                                        whiteSpace: 'pre-wrap',
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                                        fontSize: '14px'
                                    }}
                                >
                                    {feature}
                                </Text>
                            </List.Item>
                        )}
                    />
                );
            }
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => {
                const isCurrent = currentMembership && currentMembership.PlanID === record.PlanID;
                const hasPendingPayment = currentMembership && currentMembership.Status === 'pending';
                const isPurchasable = user && (!currentMembership || currentMembership.PlanID !== record.PlanID) && !hasPendingPayment;
                const isGuestPlan = record.Price === 0;

                if (hasPendingPayment) {
                    return (
                        <Button disabled={true}>
                            Payment Pending
                        </Button>
                    );
                }

                return (
                    isPurchasable && !isGuestPlan ? (
                        <Button
                            type="primary"
                            onClick={() => handleSelectPlan(record)}
                        >
                            Subscribe Now
                        </Button>
                    ) : (
                        <Button disabled={true}>
                            {isCurrent ? 'Current Plan' : 'Not Available'}
                        </Button>
                    )
                );
            }
        }
    ];

    // Add a function to render payment status and instructions
    const renderPaymentStatus = (membership) => {
        if (!membership) return null;

        if (membership.Status === 'pending') {
            return (
                <Alert
                    message="Payment Pending Confirmation"
                    description={
                        <div>
                            <p>Your payment for the {membership.Name} plan is being processed.</p>
                            <p>For Bank Transfer: Please send the payment to our account and note your transaction ID.</p>
                            <p>For Cash: Please visit our branch with your membership ID.</p>
                            <p>Your account will be upgraded once payment is confirmed.</p>
                        </div>
                    }
                    type="warning"
                    showIcon
                    style={{ marginBottom: '20px' }}
                />
            );
        } else if (membership.Status === 'active') {
            const startDate = new Date(membership.StartDate).toLocaleDateString('en-US');
            const endDate = new Date(membership.EndDate).toLocaleDateString('en-US');

            return (
                <Alert
                    message="Current Membership"
                    description={
                        <div>
                            <p>You are currently using the {membership.Name} plan.</p>
                            <p><strong>Start Date:</strong> {startDate}</p>
                            <p><strong>End Date:</strong> {endDate}</p>
                            <p>After this date, your account will revert to Guest status.</p>
                            <Button
                                danger
                                style={{ marginTop: '10px' }}
                                onClick={() => setCancelModalVisible(true)}
                            >
                                Cancel Membership
                            </Button>
                        </div>
                    }
                    type="success"
                    showIcon
                    style={{ marginBottom: '20px' }}
                />
            );
        }

        return null;
    };

    if (loading && displayPlans.length === 0) {
        return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>;
    }

    // Debug logging
    console.log("Rendering MembershipPlans component with:", {
        plansCount: displayPlans.length,
        currentMembership,
        loading,
        error,
        success,
        message
    });

    return (
        <div className="membership-plans-container">
            {apiError && (
                <Alert
                    message="Demo Mode"
                    description="Displaying sample membership plans data."
                    type="info"
                    showIcon
                    style={{ marginBottom: 20 }}
                />
            )}

            {message && (
                <Alert
                    message="Database Status"
                    description={message}
                    type="success"
                    showIcon
                    style={{ marginBottom: 20 }}
                />
            )}

            {renderPaymentInfo()}

            {renderPaymentStatus(currentMembership)}

            <Table
                dataSource={displayPlans}
                columns={columns}
                rowKey="PlanID"
                pagination={false}
                bordered
                style={{ marginBottom: '30px' }}
            />

            <Modal
                title={
                    <div style={{ textAlign: 'center' }}>
                        <Steps current={currentStep} style={{ maxWidth: 500, margin: '0 auto 20px' }}>
                            <Step title="Select Plan" />
                            <Step title="Payment" />
                            <Step title="Confirmation" />
                        </Steps>
                        <Title level={4} style={{ margin: '20px 0 0' }}>
                            {currentStep === 0 ? 'Select Membership Plan' :
                                currentStep === 1 ? 'Payment' : 'Confirmation'}
                        </Title>
                    </div>
                }
                open={paymentModalVisible}
                onCancel={handleCancel}
                width={700}
                footer={[
                    <Button key="back" onClick={handleCancel}>
                        Cancel
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        loading={loading}
                        onClick={handlePayment}
                    >
                        {currentStep === 1 ? 'Pay Now' : 'Confirm'}
                    </Button>,
                ]}
            >
                {selectedPlan && (
                    <>
                        <div style={{ marginBottom: '20px' }}>
                            <Title level={4}>Order Information</Title>
                            <Paragraph>
                                <Text strong>Plan:</Text> {selectedPlan.Name}
                            </Paragraph>
                            <Paragraph>
                                <Text strong>Price:</Text> ${selectedPlan.Price.toFixed(2)}
                            </Paragraph>
                            <Paragraph>
                                <Text strong>Duration:</Text> {selectedPlan.Duration} days
                            </Paragraph>
                        </div>

                        <Divider />

                        <div>
                            <Title level={4}>Payment Method</Title>
                            <Radio.Group
                                options={PaymentMethodOptions}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                value={paymentMethod}
                            />
                        </div>

                        {/* Demo mode info message */}
                        <Alert
                            message="Payment Information"
                            description={
                                <div>
                                    <p>This is a demonstration mode. In a real system:</p>
                                    <ul>
                                        <li>Bank Transfer: You would receive bank details to transfer payment</li>
                                        <li>Cash at Branch: You would visit a physical location to pay</li>
                                        <li>After payment, an admin would confirm your payment</li>
                                        <li>Your account would be upgraded to member status</li>
                                    </ul>
                                </div>
                            }
                            type="info"
                            showIcon
                            style={{ marginTop: '20px' }}
                        />
                    </>
                )}
            </Modal>

            <Modal
                title="Cancel Membership"
                open={cancelModalVisible}
                onCancel={() => setCancelModalVisible(false)}
                footer={[
                    <Button key="back" onClick={() => setCancelModalVisible(false)}>
                        No, Keep Membership
                    </Button>,
                    <Button key="submit" type="primary" danger onClick={handleCancelMembership}>
                        Yes, Cancel and Get 50% Refund
                    </Button>,
                ]}
            >
                <Alert
                    message="Warning"
                    description={
                        <div>
                            <p>Are you sure you want to cancel your membership?</p>
                            <p><strong>Important:</strong> You will only receive a 50% refund of your payment amount.</p>
                            {currentMembership && (
                                <p>Refund amount: ${(currentMembership.Price * 0.5).toFixed(2)}</p>
                            )}
                            <p>Your account status will revert to Guest immediately.</p>
                        </div>
                    }
                    type="warning"
                    showIcon
                    style={{ marginBottom: '20px' }}
                />
            </Modal>
        </div>
    );
};

export default MembershipPlans; 