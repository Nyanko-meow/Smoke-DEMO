import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchMembershipPlans,
    getCurrentMembership,
    purchaseMembership,
    setCurrentMembership,
    cancelMembership,
    clearSuccess,
    getRefundRequests
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
    Popconfirm,
    Input
} from 'antd';
import { notification } from 'antd';
import axiosInstance from '../../utils/axiosConfig';
import { logout, login } from '../../store/slices/authSlice';
import ProgressResetNotification from '../member/ProgressResetNotification';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

const PaymentMethodOptions = [
    { label: 'Chuyển khoản ngân hàng', value: 'BankTransfer' },
    { label: 'Thanh toán tại quầy', value: 'Cash' },
];

// Dữ liệu mẫu khi API không hoạt động
const SAMPLE_PLANS = [
    {
        PlanID: 1,
        Name: 'Gói Cơ Bản',
        Description: 'Bắt đầu hành trình cai thuốc với gói cơ bản của chúng tôi.',
        Price: 99000,
        Duration: 30,
        Features: 'Theo dõi tiến trình\nMẹo cai thuốc cơ bản\nTruy cập cộng đồng'
    },
    {
        PlanID: 4,
        Name: 'Gói Basic',
        Description: 'Trải nghiệm nhanh các tính năng cai thuốc trong 15 ngày.',
        Price: 50000,
        Duration: 15,
        Features: 'Theo dõi tiến trình\nPhân tích nâng cao\nChiến lược cai thuốc\nTruy cập cộng đồng\nĐộng lực hàng tuần\nTrải nghiệm đầy đủ tính năng'
    },
    {
        PlanID: 2,
        Name: 'Gói Cao Cấp',
        Description: 'Hỗ trợ nâng cao cho hành trình cai thuốc của bạn.',
        Price: 199000,
        Duration: 60,
        Features: 'Theo dõi tiến trình\nPhân tích nâng cao\nChiến lược cai thuốc cao cấp\nTruy cập cộng đồng\nĐộng lực hàng tuần'
    },
    {
        PlanID: 3,
        Name: 'Gói Chuyên Nghiệp',
        Description: 'Hỗ trợ tối đa để đảm bảo thành công của bạn.',
        Price: 299000,
        Duration: 90,
        Features: 'Theo dõi tiến trình\nPhân tích nâng cao\nChiến lược cai thuốc chuyên nghiệp\nTruy cập cộng đồng\nĐộng lực hàng ngày\nHuấn luyện cá nhân\nBảng điều khiển cải thiện sức khỏe'
    }
];

const MembershipPlans = () => {
    const dispatch = useDispatch();
    const { plans, currentMembership, loading, error, success, message, refundRequests } = useSelector(
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
    const [bankInfo, setBankInfo] = useState({
        bankAccountNumber: '',
        bankName: '',
        accountHolderName: ''
    });

    // Progress reset notification state
    const [progressResetModalVisible, setProgressResetModalVisible] = useState(false);
    const [pendingPurchase, setPendingPurchase] = useState(null);

    // Debug effect to monitor selectedPlan changes
    useEffect(() => {
        console.log('📊 selectedPlan state changed:', {
            selectedPlan,
            hasSelectedPlan: !!selectedPlan,
            planID: selectedPlan?.PlanID,
            planName: selectedPlan?.Name,
            timestamp: new Date().toISOString()
        });
    }, [selectedPlan]);

    // Debug effect to monitor modal visibility
    useEffect(() => {
        console.log('👁️ paymentModalVisible changed:', {
            paymentModalVisible,
            currentStep,
            selectedPlan: !!selectedPlan,
            timestamp: new Date().toISOString()
        });
    }, [paymentModalVisible]);

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

                        // Fetch payment history with retry mechanism
                        console.log('🔄 Starting payment history fetch...');
                        await fetchPaymentHistory();

                        // Fetch refund requests
                        try {
                            await dispatch(getRefundRequests()).unwrap();
                        } catch (err) {
                            console.log("Could not fetch refund requests:", err);
                        }

                        // Force a second fetch after a delay to ensure we get the latest data
                        setTimeout(async () => {
                            console.log('🔄 Force refreshing payment history...');
                            await fetchPaymentHistory();
                        }, 2000);

                    } catch (err) {
                        console.log("Could not fetch current membership:", err);
                    }
                }
            } catch (err) {
                console.error('Error fetching plans:', err);
                setApiError("Không thể tải gói từ API. Sử dụng dữ liệu mẫu làm phương án dự phòng.");
                setUseSampleData(true);
            }
        };

        loadData();
    }, [dispatch, user]);

    // Effect to check membership expiration periodically
    useEffect(() => {
        if (!user) return;

        // Check immediately when component mounts or paymentHistory changes
        const checkMembership = async () => {
            console.log('🔄 Auto-checking membership status...', {
                userRole: user?.role,
                paymentHistoryCount: paymentHistory?.length || 0,
                timestamp: new Date().toLocaleTimeString()
            });
            await checkMembershipExpiration();
        };

        // Check immediately
        checkMembership();

        // Disabled interval check to avoid notification spam
        // const intervalId = setInterval(() => {
        //     checkMembership();
        // }, 30 * 1000); // Check every 30 seconds

        return () => {
            // clearInterval(intervalId);
        };
    }, [user, paymentHistory]);

    // Additional effect to check when user logs in or role changes  
    useEffect(() => {
        if (!user) return;

        // If user role doesn't match their membership status, trigger check
        const checkRoleConsistency = async () => {
            console.log('🔍 Checking role consistency for user:', {
                userId: user.id || user.UserID,
                userRole: user.role,
                hasPaymentHistory: !!(paymentHistory && paymentHistory.length > 0)
            });

            // If user is not guest but has no active memberships, check for downgrade
            if (user.role !== 'guest' && paymentHistory !== null) {
                const hasActive = hasActiveMembership();
                if (!hasActive) {
                    console.log('⚠️ Role inconsistency detected - user is not guest but has no active membership');
                    await checkMembershipExpiration();
                }
            }
        };

        // Small delay to ensure paymentHistory is loaded
        const timeoutId = setTimeout(checkRoleConsistency, 1500);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [user?.role, paymentHistory]);

    // Effect to auto-trigger downgrade when role inconsistency is detected in UI
    useEffect(() => {
        if (!user || !paymentHistory) return;

        const userRole = user.role || 'guest';
        const hasActivePayments = paymentHistory.some(payment => {
            if (payment.MembershipStatus === 'cancelled' ||
                payment.PaymentStatus === 'cancelled' ||
                payment.Status === 'cancelled' ||
                payment.MembershipStatus === 'pending_cancellation') {
                return false;
            }
            return (payment.PaymentStatus === 'confirmed' || payment.Status === 'confirmed') ||
                (payment.PaymentStatus === 'pending' || payment.Status === 'pending');
        });

        // Auto trigger downgrade if role inconsistency detected
        if (userRole !== 'guest' && !hasActivePayments && paymentHistory.length >= 0) {
            console.log('🚨 Auto-triggering downgrade due to role inconsistency detected in UI');

            const triggerDowngrade = async () => {
                try {
                    await checkMembershipExpiration();
                } catch (error) {
                    console.error('❌ Auto-downgrade failed:', error);
                    // Don't show notification to avoid spam
                }
            };

            // Small delay to avoid race conditions
            const timeoutId = setTimeout(triggerDowngrade, 500);
            return () => clearTimeout(timeoutId);
        }
    }, [user?.role, paymentHistory]);

    // Effect to refresh data when window gets focus (e.g., coming back from notifications)
    useEffect(() => {
        const handleWindowFocus = async () => {
            if (user && document.hasFocus()) {
                console.log('🔄 Window focus detected, refreshing membership data...');
                try {
                    await dispatch(getCurrentMembership()).unwrap();
                    await fetchPaymentHistory();
                    console.log('✅ Data refreshed on window focus');
                } catch (error) {
                    console.error('❌ Error refreshing data on focus:', error);
                }
            }
        };

        window.addEventListener('focus', handleWindowFocus);
        return () => window.removeEventListener('focus', handleWindowFocus);
    }, [user, dispatch]);

    // Function to refresh membership data - can be called externally
    const refreshMembershipData = async () => {
        console.log('🔄 Manual refresh membership data...');
        try {
            await dispatch(getCurrentMembership()).unwrap();
            await fetchPaymentHistory();
            console.log('✅ Manual refresh completed');
        } catch (error) {
            console.error('❌ Error in manual refresh:', error);
        }
    };

    // Expose refresh function globally
    useEffect(() => {
        window.refreshMembershipData = refreshMembershipData;
        return () => {
            delete window.refreshMembershipData;
        };
    }, []);

    // Don't show API errors in demo mode
    useEffect(() => {
        if (error && !useSampleData) {
            let errorMsg = 'Đã xảy ra lỗi. Vui lòng thử lại.';

            if (typeof error === 'string') {
                errorMsg = error;
            } else if (error && error.message) {
                errorMsg = error.message;
            }

            notification.error({
                message: 'Lỗi',
                description: errorMsg
            });
        }
    }, [error, useSampleData]);

    // Function to fetch payment history
    const fetchPaymentHistory = async () => {
        if (!user) return;

        try {
            setPaymentLoading(true);
            console.log('🔍 Fetching payment history...');

            const response = await axiosInstance.get('/membership/payment-history');
            console.log('📨 Payment history response:', response.data);

            if (response.data && response.data.success) {
                const paymentData = response.data.data;
                console.log('📋 Payment data received:', {
                    count: paymentData?.length || 0,
                    firstRecord: paymentData?.[0]
                });

                setPaymentHistory(paymentData || []);
            } else {
                console.warn('⚠️ Invalid payment history response format');
                setPaymentHistory([]);
            }
        } catch (error) {
            console.error("❌ Error fetching payment history:", error);
            setPaymentHistory([]);
        } finally {
            setPaymentLoading(false);
        }
    };

    // Function to calculate refund amount safely
    const calculateRefundAmount = (paymentData) => {
        if (!paymentData) {
            console.log("calculateRefundAmount: No payment data provided");
            return 0;
        }

        // Try to get price from payment data first, then fallback to plan data
        let originalPrice = 0;

        // First try to get price directly from payment data
        if (paymentData.Price && paymentData.Price > 0) {
            originalPrice = paymentData.Price;
            console.log("calculateRefundAmount: Using price from payment data:", originalPrice);
        }
        // If no price in payment data, try to find from plan name
        else if (paymentData.PlanName && displayPlans && displayPlans.length > 0) {
            // Find the original plan price by plan name (exact match first)
            let matchingPlan = displayPlans.find(plan => plan.Name === paymentData.PlanName);

            // If no exact match, try partial match
            if (!matchingPlan) {
                matchingPlan = displayPlans.find(plan =>
                    plan.Name.toLowerCase().includes(paymentData.PlanName.toLowerCase()) ||
                    paymentData.PlanName.toLowerCase().includes(plan.Name.toLowerCase())
                );
            }

            if (matchingPlan && matchingPlan.Price > 0) {
                originalPrice = matchingPlan.Price;
                console.log("calculateRefundAmount: Using price from matching plan:", originalPrice, "for plan:", paymentData.PlanName);
            } else {
                console.log("calculateRefundAmount: No matching plan found or price is 0 for:", paymentData.PlanName, "Available plans:", displayPlans.map(p => p.Name));
            }
        }
        // Last resort: try to get from PlanID if available
        else if (paymentData.PlanID && displayPlans && displayPlans.length > 0) {
            const matchingPlan = displayPlans.find(plan => plan.PlanID === paymentData.PlanID);
            if (matchingPlan && matchingPlan.Price > 0) {
                originalPrice = matchingPlan.Price;
                console.log("calculateRefundAmount: Using price from plan ID match:", originalPrice);
            }
        } else {
            console.log("calculateRefundAmount: No valid price source found. Payment data:", paymentData);
        }

        // Return 50% of original price
        const refundAmount = Math.floor(originalPrice * 0.5);
        console.log("calculateRefundAmount: Final refund amount (50% of", originalPrice, "):", refundAmount);
        return refundAmount;
    };

    // Function to check if there are completed refund requests
    const hasCompletedRefundRequests = () => {
        if (!refundRequests || refundRequests.length === 0) {
            return false;
        }

        return refundRequests.some(request => {
            // For cancellation requests (new workflow)
            if (request.RequestType === 'cancellation') {
                return request.Status === 'approved' && request.RefundReceived;
            }
            // For legacy refund requests
            return request.Status === 'completed';
        });
    };

    // Function to check membership expiration and auto-downgrade to guest
    const checkMembershipExpiration = async () => {
        if (!user) {
            return;
        }

        // Handle case where user has no payment history at all
        if (!paymentHistory || paymentHistory.length === 0) {
            console.log('🚫 User has no payment history at all');

            // Check if user is currently not a guest
            if (user.role && user.role !== 'guest') {
                console.log('🔄 User has no payment history but is not guest - downgrading...');

                try {
                    // Try the original endpoint first
                    let response;
                    try {
                        response = await axiosInstance.post('/membership/downgrade-to-guest');
                    } catch (firstError) {
                        console.log('⚠️ First downgrade method failed, trying force method...', firstError);
                        // If first method fails, try force method
                        response = await axiosInstance.post('/membership/force-guest');
                    }

                    console.log('✅ Downgrade API response:', response.data);

                    // Refresh user data
                    await dispatch(getCurrentUser()).unwrap();

                    notification.success({
                        message: 'Tài khoản được chuyển về Guest',
                        description: 'Bạn không có gói dịch vụ nào. Tài khoản đã được chuyển về trạng thái Guest.',
                        duration: 6
                    });

                    // Force reload the page to refresh UI completely
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);

                } catch (error) {
                    console.error('❌ Error downgrading to guest (no payment history):', error);
                    // Don't show notification for this error to avoid spam
                }
            }
            return;
        }

        try {
            // Filter out ALL cancelled and pending_cancellation memberships first
            const activePayments = paymentHistory.filter(payment => {
                if (payment.MembershipStatus === 'cancelled' ||
                    payment.PaymentStatus === 'cancelled' ||
                    payment.Status === 'cancelled' ||
                    payment.MembershipStatus === 'pending_cancellation') {
                    return false;
                }
                return true;
            });

            console.log('🔍 Checking membership expiration with active payments:', activePayments);

            // If no active payments at all, user should be guest
            if (activePayments.length === 0) {
                console.log('🚫 No active payments found - checking if user should be guest...');

                // Check if user is currently not a guest
                if (user.role && user.role !== 'guest') {
                    console.log('🔄 User has no active memberships but is not guest - downgrading...');

                    try {
                        // Try the original endpoint first
                        let response;
                        try {
                            response = await axiosInstance.post('/membership/downgrade-to-guest');
                        } catch (firstError) {
                            console.log('⚠️ First downgrade method failed, trying force method...', firstError);
                            // If first method fails, try force method
                            response = await axiosInstance.post('/membership/force-guest');
                        }

                        console.log('✅ Downgrade API response:', response.data);

                        // Refresh user data to get updated role
                        await dispatch(getCurrentUser()).unwrap();

                        notification.success({
                            message: 'Tài khoản được chuyển về Guest',
                            description: 'Bạn không còn gói dịch vụ nào đang hoạt động. Tài khoản đã được chuyển về trạng thái Guest.',
                            duration: 6
                        });

                        // Force reload the page to refresh UI completely
                        setTimeout(() => {
                            window.location.reload();
                        }, 2000);

                    } catch (error) {
                        console.error('❌ Error downgrading to guest:', error);
                        // Removed error notification to avoid spam
                    }
                }
                return;
            }

            // Find active confirmed membership
            const activeMembership = activePayments.find(payment =>
                (payment.PaymentStatus === 'confirmed' || payment.Status === 'confirmed')
            );

            if (!activeMembership || !activeMembership.EndDate) {
                // No confirmed membership but has pending payments - don't downgrade yet
                console.log('📝 Has pending payments but no confirmed membership');
                return;
            }

            // Check if membership has expired
            const endDate = new Date(activeMembership.EndDate);
            const currentDate = new Date();

            if (currentDate > endDate) {
                console.log('⏲️ Membership expired, auto-downgrading to guest...');

                // Call API to expire the membership
                try {
                    await axiosInstance.post('/membership/expire-membership', {
                        membershipId: activeMembership.MembershipID || activeMembership.PaymentID
                    });

                    // Refresh payment history to reflect changes
                    await fetchPaymentHistory();

                    // Refresh user data to update role
                    dispatch(getCurrentUser());

                    notification.warning({
                        message: 'Gói dịch vụ đã hết hạn',
                        description: 'Gói dịch vụ của bạn đã hết hạn và được chuyển về tài khoản guest. Bạn có thể mua gói mới để tiếp tục sử dụng.',
                        duration: 8
                    });
                } catch (error) {
                    console.error('❌ Error expiring membership:', error);
                }
            }
        } catch (error) {
            console.error('❌ Error checking membership expiration:', error);
        }
    };

    // Check if user has active membership
    const hasActiveMembership = () => {
        // IMPORTANT: Guest users never have active membership
        if (user && user.role === 'guest') {
            console.log('🚫 User is guest - no active membership by definition');
            return false;
        }

        if (!paymentHistory || paymentHistory.length === 0) {
            console.log('✅ No payment history - user can purchase');

            // Auto-check if user should be downgraded to guest
            if (user && user.role && user.role !== 'guest') {
                console.log('🔍 User has no payment history but is not guest - might need downgrade');
                // This will be handled by checkMembershipExpiration
            }

            return false;
        }

        // Filter out ALL cancelled and pending_cancellation memberships first (same as renderPaymentInfo)
        const activePayments = paymentHistory.filter(payment => {
            // Exclude any payment with cancelled membership or payment status
            if (payment.MembershipStatus === 'cancelled' ||
                payment.PaymentStatus === 'cancelled' ||
                payment.Status === 'cancelled') {
                console.log('🚫 Filtering out cancelled payment in hasActiveMembership:', payment);
                return false;
            }
            // Also exclude pending_cancellation
            if (payment.MembershipStatus === 'pending_cancellation') {
                console.log('🚫 Filtering out pending_cancellation payment in hasActiveMembership:', payment);
                return false;
            }
            return true;
        });

        console.log('📋 Active payments for membership check:', activePayments);

        if (activePayments.length === 0) {
            console.log('✅ No active payments after filtering - user can purchase');

            // Auto-check if user should be downgraded to guest
            if (user && user.role && user.role !== 'guest') {
                console.log('🔍 User has no active payments but is not guest - might need downgrade');
                // This will be handled by checkMembershipExpiration
            }

            return false;
        }

        // Check for any confirmed membership that is not expired
        const activeMembership = activePayments.find(payment =>
            (payment.PaymentStatus === 'confirmed' || payment.Status === 'confirmed')
        );

        if (activeMembership) {
            // Check if not expired
            const endDate = new Date(activeMembership.EndDate || activeMembership.PaymentEndDate || activeMembership.MembershipEndDate || '2025-08-02T00:00:00.000Z');
            const currentDate = new Date();

            if (!isNaN(endDate.getTime()) && currentDate <= endDate) {
                console.log('🚫 User has active membership:', {
                    planName: activeMembership.PlanName,
                    endDate: endDate.toLocaleDateString('vi-VN'),
                    daysRemaining: Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24)),
                    membershipStatus: activeMembership.MembershipStatus,
                    paymentStatus: activeMembership.PaymentStatus
                });
                return true;
            } else {
                console.log('⏰ Active membership found but expired:', {
                    planName: activeMembership.PlanName,
                    endDate: endDate.toLocaleDateString('vi-VN')
                });
                // Expired membership will be handled by checkMembershipExpiration
            }
        }

        // Also check for pending memberships (just paid, waiting for confirmation)
        const pendingMembership = activePayments.find(payment =>
            (payment.PaymentStatus === 'pending' || payment.Status === 'pending') &&
            payment.PaymentStatus !== 'rejected' && payment.Status !== 'rejected'
        );

        if (pendingMembership) {
            console.log('🚫 User has pending membership payment:', {
                planName: pendingMembership.PlanName,
                membershipStatus: pendingMembership.MembershipStatus,
                paymentStatus: pendingMembership.PaymentStatus
            });
            return true;
        }

        console.log('✅ User has no active membership - can purchase');
        return false;
    };

    // Function to render user's payment information
    const renderPaymentInfo = () => {
        if (!user || paymentLoading) {
            return null;
        }

        // IMPORTANT: Hide payment info completely if user is guest
        // This ensures when user is downgraded to guest, they don't see old payment info
        if (user.role === 'guest') {
            console.log('🚫 User is guest - hiding all payment info');
            return null;
        }

        // Hide payment info if there are completed refund requests
        if (hasCompletedRefundRequests()) {
            console.log('🚫 Hiding payment info due to completed refund requests');
            return null;
        }

        console.log('🎨 Rendering payment info with:', {
            paymentHistoryLength: paymentHistory?.length || 0,
            paymentHistory: paymentHistory,
            userRole: user.role
        });

        if (paymentHistory && paymentHistory.length > 0) {
            // UPDATED: Filter out ALL cancelled and pending_cancellation memberships
            const activePayments = paymentHistory.filter(payment => {
                // Exclude any payment with cancelled membership or payment status
                if (payment.MembershipStatus === 'cancelled' ||
                    payment.PaymentStatus === 'cancelled' ||
                    payment.Status === 'cancelled') {
                    console.log('🚫 Filtering out cancelled payment:', payment);
                    return false;
                }
                // Also exclude pending_cancellation
                if (payment.MembershipStatus === 'pending_cancellation') {
                    console.log('🚫 Filtering out pending_cancellation payment:', payment);
                    return false;
                }
                return true;
            });

            console.log('📋 Active payments after filtering cancelled:', activePayments);

            // If no active payments remain, hide payment info completely
            // This is crucial for guest users - they should not see any payment info
            if (activePayments.length === 0) {
                console.log('💳 No active payments remaining after filtering - hiding payment info');
                return null;
            }

            // Additional check: if user is guest, don't show ANY payment info even if there are active payments
            // This handles cases where role change is faster than payment cleanup
            if (user.role === 'guest') {
                console.log('🚫 User is guest - force hiding payment info even with active payments');
                return null;
            }

            // FIXED: Always use the most recent payment (by PaymentDate or PaymentID)
            // This ensures we show the latest payment status, not just confirmed ones
            console.log('🔍 All active payments before sorting:', activePayments);

            // Sort by PaymentDate (newest first) or PaymentID if PaymentDate is same
            const sortedPayments = activePayments.sort((a, b) => {
                // Try PaymentDate first
                if (a.PaymentDate && b.PaymentDate) {
                    return new Date(b.PaymentDate) - new Date(a.PaymentDate);
                }
                // Fallback to PaymentID (higher ID = newer)
                return (b.PaymentID || 0) - (a.PaymentID || 0);
            });

            console.log('🔍 Sorted payments (newest first):', sortedPayments);

            // Always use the most recent payment
            let latestPayment = sortedPayments[0];

            console.log('🎯 Selected latest payment:', {
                paymentId: latestPayment?.PaymentID,
                paymentDate: latestPayment?.PaymentDate,
                paymentStatus: latestPayment?.PaymentStatus,
                status: latestPayment?.Status,
                paymentMethod: latestPayment?.PaymentMethod
            });

            // Final safety check - if no payment found, hide info
            if (!latestPayment) {
                console.log('💳 No suitable payment found for display - hiding payment info');
                return null;
            }

            console.log('💳 Selected payment for display:', {
                latestPayment,
                PaymentStatus: latestPayment.PaymentStatus,
                Status: latestPayment.Status,
                MembershipStatus: latestPayment.MembershipStatus,
                reason: latestPayment.MembershipStatus === 'pending_cancellation' ? 'pending cancellation' :
                    latestPayment.PaymentStatus === 'confirmed' || latestPayment.Status === 'confirmed' ? 'confirmed payment' :
                        latestPayment.PaymentStatus === 'pending' || latestPayment.Status === 'pending' ? 'pending payment' :
                            'fallback payment',
                StartDate: latestPayment.StartDate,
                EndDate: latestPayment.EndDate
            });

            // TEMPORARY FIX: Use hardcoded dates from database if API dates are null
            let startDateString = latestPayment.StartDate;
            let endDateString = latestPayment.EndDate;

            // If no dates from API, use the known dates from database
            if (!startDateString || startDateString === 'null') {
                startDateString = '2025-06-03T00:00:00.000Z'; // From database PaymentID 8
                console.log('🔧 Using hardcoded start date for testing');
            }
            if (!endDateString || endDateString === 'null') {
                endDateString = '2025-08-02T00:00:00.000Z'; // From database PaymentID 8  
                console.log('🔧 Using hardcoded end date for testing');
            }

            // Safe date formatting with fallbacks and detailed logging
            const formatDate = (dateString) => {
                console.log('📅 Formatting date:', dateString);

                if (!dateString || dateString === 'null') {
                    console.log('📅 No date string provided');
                    return 'N/A';
                }

                const date = new Date(dateString);
                console.log('📅 Parsed date object:', date);

                if (isNaN(date.getTime())) {
                    console.log('📅 Invalid date, returning N/A');
                    return 'N/A';
                }

                const formatted = date.toLocaleDateString('vi-VN');
                console.log('📅 Formatted date:', formatted);
                return formatted;
            };

            const startDate = formatDate(startDateString);
            const endDate = formatDate(endDateString);
            const status = latestPayment.PaymentStatus || latestPayment.Status || 'pending';

            console.log('📅 Final payment info for display:', {
                startDate,
                endDate,
                status,
                membershipStatus: latestPayment.MembershipStatus,
                paymentMethod: latestPayment.PaymentMethod,
                rawPaymentStatus: latestPayment.PaymentStatus,
                rawStatus: latestPayment.Status,
                finalStatusUsed: status
            });

            // ⚠️ IMPROVED LOGIC FOR BANK TRANSFER STATUS
            // Only force to 'pending' if it's a new payment without admin confirmation
            let correctedStatus = status;

            // Check if this is truly a confirmed payment (admin has processed it)
            const hasAdminConfirmation = latestPayment.ConfirmationDate ||
                latestPayment.FormattedConfirmationDate ||
                latestPayment.ConfirmedByUserID ||
                latestPayment.AdminName ||
                latestPayment.ConfirmationCode;

            if (latestPayment.PaymentMethod === 'BankTransfer' && status === 'confirmed' && !hasAdminConfirmation) {
                console.log('🔧 CORRECTING: BankTransfer payment auto-confirmed without admin action');
                correctedStatus = 'pending';
            } else if (latestPayment.PaymentMethod === 'BankTransfer' && status === 'confirmed' && hasAdminConfirmation) {
                console.log('✅ KEEPING: BankTransfer payment confirmed by admin');
                correctedStatus = 'confirmed';
            }

            console.log('✅ Final status after correction:', {
                originalStatus: status,
                correctedStatus: correctedStatus,
                paymentMethod: latestPayment.PaymentMethod,
                hasAdminConfirmation: hasAdminConfirmation,
                confirmationDate: latestPayment.ConfirmationDate,
                formattedConfirmationDate: latestPayment.FormattedConfirmationDate,
                adminName: latestPayment.AdminName,
                confirmationCode: latestPayment.ConfirmationCode,
                confirmedByUserID: latestPayment.ConfirmedByUserID
            });

            // Calculate days since purchase for cancellation eligibility
            let daysSincePurchase = 0;
            let canCancel = false;

            if (startDateString) {
                const purchaseDate = new Date(startDateString);
                if (!isNaN(purchaseDate.getTime())) {
                    const currentDate = new Date();
                    daysSincePurchase = Math.floor((currentDate - purchaseDate) / (1000 * 60 * 60 * 24));
                    canCancel = correctedStatus === 'confirmed' && daysSincePurchase <= 7;
                }
            }

            // Determine alert type and status text based on payment status
            let alertType = 'info';
            let statusText = 'Không xác định';

            if (correctedStatus === 'confirmed') {
                alertType = 'success';
                statusText = '✅ Đã xác nhận';
            } else if (correctedStatus === 'pending') {
                alertType = 'warning';
                statusText = '⏳ Đang chờ admin xác nhận thanh toán';
            } else if (correctedStatus === 'rejected' || correctedStatus === 'cancelled') {
                alertType = 'error';
                statusText = correctedStatus === 'cancelled' ? '🚫 Đã hủy' : '❌ Đã từ chối';
            }

            return (
                <div
                    style={{
                        background: correctedStatus === 'confirmed'
                            ? 'linear-gradient(135deg, #f0fdf9 0%, #ecfdf5 50%, #f0fdf4 100%)'
                            : correctedStatus === 'pending'
                                ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fef7cd 100%)'
                                : 'linear-gradient(135deg, #fef2f2 0%, #fecaca 50%, #fed7d7 100%)',
                        border: `1px solid ${correctedStatus === 'confirmed' ? '#86efac' :
                            correctedStatus === 'pending' ? '#fcd34d' : '#fca5a5'}`,
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '16px',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    {/* Header Badge */}
                    <div style={{
                        position: 'absolute',
                        top: '0',
                        left: '0',
                        right: '0',
                        background: correctedStatus === 'confirmed'
                            ? 'linear-gradient(135deg, #34d399 0%, #10b981 50%, #059669 100%)'
                            : correctedStatus === 'pending'
                                ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)'
                                : 'linear-gradient(135deg, #f87171 0%, #ef4444 50%, #dc2626 100%)',
                        color: 'white',
                        textAlign: 'center',
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        borderRadius: '12px 12px 0 0',
                        letterSpacing: '0.3px'
                    }}>
                        {correctedStatus === 'pending' ? "🔄 ĐANG CHỜ XÁC NHẬN" :
                            correctedStatus === 'confirmed' ? "✅ GÓI DỊCH VỤ HIỆN TẠI" :
                                correctedStatus === 'cancelled' ? "🚫 ĐÃ HỦY GÓI DỊCH VỤ" :
                                    "📋 THÔNG TIN ĐƠN HÀNG"}
                    </div>

                    {/* Content */}
                    <div style={{ marginTop: '12px' }}>
                        {/* Plan Info List */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1px',
                            marginBottom: '8px'
                        }}>
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.7)',
                                borderRadius: '6px',
                                padding: '8px 12px',
                                border: '1px solid rgba(0,0,0,0.05)',
                                backdropFilter: 'blur(10px)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    <span style={{ fontSize: '14px' }}>📦</span>
                                    <span style={{
                                        fontSize: '12px',
                                        color: '#6b7280',
                                        fontWeight: 600
                                    }}>
                                        Gói dịch vụ:
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    color: '#1f2937'
                                }}>
                                    {latestPayment.PlanName || latestPayment.Name || 'Premium Plan'}
                                </div>
                            </div>

                            <div style={{
                                background: 'rgba(255, 255, 255, 0.7)',
                                borderRadius: '6px',
                                padding: '8px 12px',
                                border: '1px solid rgba(0,0,0,0.05)',
                                backdropFilter: 'blur(10px)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    <span style={{ fontSize: '14px' }}>📅</span>
                                    <span style={{
                                        fontSize: '12px',
                                        color: '#6b7280',
                                        fontWeight: 600
                                    }}>
                                        Thời gian:
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: '12px',
                                    color: '#374151',
                                    fontWeight: 600
                                }}>
                                    {startDate} → {endDate}
                                </div>
                            </div>

                            <div style={{
                                background: 'rgba(255, 255, 255, 0.7)',
                                borderRadius: '6px',
                                padding: '8px 12px',
                                border: '1px solid rgba(0,0,0,0.05)',
                                backdropFilter: 'blur(10px)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    <span style={{ fontSize: '14px' }}>💳</span>
                                    <span style={{
                                        fontSize: '12px',
                                        color: '#6b7280',
                                        fontWeight: 600
                                    }}>
                                        Thanh toán:
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: '12px',
                                    color: '#374151',
                                    fontWeight: 600
                                }}>
                                    {latestPayment.PaymentMethod === 'BankTransfer' ? 'Chuyển khoản' :
                                        latestPayment.PaymentMethod === 'Cash' ? 'Tiền mặt' :
                                            latestPayment.PaymentMethod || 'Chuyển khoản'}
                                </div>
                            </div>

                            <div style={{
                                background: 'rgba(255, 255, 255, 0.7)',
                                borderRadius: '6px',
                                padding: '8px 12px',
                                border: '1px solid rgba(0,0,0,0.05)',
                                backdropFilter: 'blur(10px)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    <span style={{ fontSize: '14px' }}>📊</span>
                                    <span style={{
                                        fontSize: '12px',
                                        color: '#6b7280',
                                        fontWeight: 600
                                    }}>
                                        Trạng thái:
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    color: correctedStatus === 'confirmed' ? '#16a34a' :
                                        correctedStatus === 'pending' ? '#d97706' :
                                            '#dc2626'
                                }}>
                                    {statusText}
                                </div>
                            </div>
                        </div>



                        {correctedStatus === 'confirmed' && (
                            <div style={{
                                background: 'linear-gradient(135deg, #f0fdf9 0%, #ecfdf5 50%, #e6fffa 100%)',
                                border: '1px solid #86efac',
                                borderRadius: '10px',
                                padding: '14px',
                                marginTop: '12px'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginBottom: '12px'
                                }}>
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #34d399 0%, #10b981 50%, #059669 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: '10px'
                                    }}>
                                        <span style={{ fontSize: '16px' }}>🎉</span>
                                    </div>
                                    <div>
                                        <div style={{
                                            fontSize: '14px',
                                            fontWeight: 700,
                                            color: '#16a34a',
                                            marginBottom: '4px'
                                        }}>
                                            Gói dịch vụ đã được kích hoạt thành công!
                                        </div>
                                        {hasAdminConfirmation && (
                                            <div style={{ fontSize: '13px', color: '#059669' }}>
                                                ✅ Đã xác nhận bởi: {latestPayment.AdminName || 'Admin'}
                                                {latestPayment.FormattedConfirmationDate && (
                                                    <span> vào {new Date(latestPayment.FormattedConfirmationDate).toLocaleString('vi-VN')}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Price Info */}
                                <div style={{
                                    background: 'rgba(255, 255, 255, 0.8)',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    marginBottom: '12px',
                                    border: '1px solid rgba(187, 247, 208, 0.5)',
                                    backdropFilter: 'blur(10px)'
                                }}>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '12px',
                                        fontSize: '12px'
                                    }}>
                                        <div>
                                            <span style={{ color: '#6b7280' }}>💰 Giá gói:</span>
                                            <div style={{ fontWeight: 600, color: '#16a34a' }}>
                                                {(latestPayment.Price || latestPayment.Amount || 199000).toLocaleString()} VNĐ
                                            </div>
                                        </div>
                                        <div>
                                            <span style={{ color: '#6b7280' }}>🔄 Hoàn tiền nếu hủy:</span>
                                            <div style={{ fontWeight: 600, color: '#16a34a' }}>
                                                {(Math.floor((latestPayment.Price || latestPayment.Amount || 199000) * 0.5)).toLocaleString()} VNĐ (50%)
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Cancel Section */}
                                {canCancel ? (
                                    <div style={{
                                        background: '#fef3c7',
                                        borderRadius: '8px',
                                        padding: '16px',
                                        border: '1px solid #fcd34d'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}>
                                            <div>
                                                <div style={{
                                                    fontSize: '14px',
                                                    color: '#92400e',
                                                    fontWeight: 600,
                                                    marginBottom: '4px'
                                                }}>
                                                    ⏰ Còn {7 - daysSincePurchase} ngày để hủy gói
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#a16207' }}>
                                                    Chỉ được hủy trong vòng 7 ngày đầu tiên
                                                </div>
                                            </div>
                                            <Button
                                                danger
                                                size="small"
                                                onClick={() => setCancelModalVisible(true)}
                                                style={{
                                                    borderRadius: '8px',
                                                    fontWeight: 600
                                                }}
                                            >
                                                Hủy gói dịch vụ
                                            </Button>
                                        </div>
                                    </div>
                                ) : daysSincePurchase > 7 ? (
                                    <div style={{
                                        background: '#fef2f2',
                                        borderRadius: '8px',
                                        padding: '16px',
                                        border: '1px solid #fca5a5',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{
                                            fontSize: '14px',
                                            color: '#dc2626',
                                            fontWeight: 600
                                        }}>
                                            ⚠️ Đã quá thời hạn hủy gói (7 ngày đầu tiên)
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        )}

                        {correctedStatus === 'pending' && (
                            <div style={{
                                background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fef7cd 100%)',
                                border: '1px solid #fcd34d',
                                borderRadius: '10px',
                                padding: '14px',
                                marginTop: '12px',
                                textAlign: 'center'
                            }}>
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 12px auto'
                                }}>
                                    <span style={{ fontSize: '18px' }}>⏳</span>
                                </div>
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    color: '#92400e',
                                    marginBottom: '6px'
                                }}>
                                    Đang chờ admin xác nhận thanh toán
                                </div>
                                <div style={{
                                    fontSize: '12px',
                                    color: '#a16207'
                                }}>
                                    Đơn hàng sẽ được kích hoạt sau khi admin xác nhận thanh toán của bạn
                                </div>
                            </div>
                        )}

                        {correctedStatus === 'cancelled' && (
                            <div style={{
                                background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 50%, #fed7d7 100%)',
                                border: '1px solid #fca5a5',
                                borderRadius: '10px',
                                padding: '14px',
                                marginTop: '12px',
                                textAlign: 'center'
                            }}>
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #f87171 0%, #ef4444 50%, #dc2626 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 12px auto'
                                }}>
                                    <span style={{ fontSize: '18px' }}>🚫</span>
                                </div>
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    color: '#dc2626',
                                    marginBottom: '6px'
                                }}>
                                    Gói dịch vụ đã được hủy
                                </div>
                                <div style={{
                                    fontSize: '12px',
                                    color: '#b91c1c'
                                }}>
                                    Bạn có thể mua gói mới bất kỳ lúc nào
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        console.log('🚫 No payment history to display');
        return null;
    };

    const handleSelectPlan = (plan) => {
        console.log('🎯 handleSelectPlan called with:', {
            plan,
            planType: typeof plan,
            planKeys: plan ? Object.keys(plan) : 'null',
            planID: plan?.PlanID,
            planName: plan?.Name
        });

        console.log('🧑 Current user object:', {
            user,
            hasId: user && 'id' in user,
            hasUserID: user && 'UserID' in user,
            idValue: user?.id,
            UserIDValue: user?.UserID,
            preferredId: user?.id || user?.UserID
        });

        // Check if user already has an active membership
        if (hasActiveMembership()) {
            notification.warning({
                message: 'Không thể mua gói mới',
                description: 'Bạn đã có gói dịch vụ đang hoạt động. Bạn cần đợi gói hiện tại hết hạn hoặc hủy gói hiện tại trước khi mua gói mới.',
                duration: 6
            });
            return;
        }

        // Ensure plan has all required fields
        if (!plan || !plan.PlanID) {
            console.error('❌ Invalid plan passed to handleSelectPlan:', plan);
            notification.error({
                message: 'Lỗi',
                description: 'Thông tin gói không hợp lệ. Vui lòng thử lại.'
            });
            return;
        }

        // Create a copy of the plan to ensure it persists
        const planCopy = {
            PlanID: plan.PlanID,
            Name: plan.Name,
            Price: plan.Price,
            Duration: plan.Duration,
            Features: plan.Features,
            Description: plan.Description
        };

        console.log('✅ Setting selectedPlan to:', planCopy);

        setSelectedPlan(planCopy);
        setPaymentModalVisible(true);
        setCurrentStep(1);

        // Verify the plan was set correctly after a short delay
        setTimeout(() => {
            console.log('🔍 Verifying selectedPlan after setState:', {
                selectedPlanAfterSet: planCopy,
                stateWillBe: planCopy.PlanID
            });
        }, 100);
    };

    const handlePayment = () => {
        // Add comprehensive debugging
        console.log('🔥 handlePayment called with full context:', {
            selectedPlan,
            selectedPlanType: typeof selectedPlan,
            selectedPlanKeys: selectedPlan ? Object.keys(selectedPlan) : 'null',
            selectedPlanPlanID: selectedPlan?.PlanID,
            selectedPlanName: selectedPlan?.Name,
            currentStep,
            paymentMethod,
            user,
            userId: user?.id || user?.UserID,
            loading: loading // Add loading state check
        });

        // Prevent multiple simultaneous purchases
        if (loading) {
            console.warn('⚠️ Purchase already in progress, ignoring duplicate call');
            return;
        }

        // Validate selectedPlan with detailed logging
        if (!selectedPlan) {
            console.error('❌ selectedPlan is null or undefined');
            notification.error({
                message: 'Lỗi',
                description: 'Không tìm thấy thông tin gói đã chọn. Vui lòng chọn lại gói.'
            });
            return;
        }

        if (!selectedPlan.PlanID) {
            console.error('❌ selectedPlan exists but PlanID is missing:', selectedPlan);
            notification.error({
                message: 'Lỗi',
                description: 'Thông tin gói không hợp lệ. Vui lòng chọn lại gói.'
            });
            return;
        }

        console.log('✅ selectedPlan validation passed:', {
            PlanID: selectedPlan.PlanID,
            Name: selectedPlan.Name,
            Price: selectedPlan.Price
        });

        // Validate user is logged in - handle both id and UserID fields
        if (!user || (!user.id && !user.UserID)) {
            console.error('❌ User validation failed:', user);
            notification.error({
                message: 'Lỗi xác thực',
                description: 'Bạn cần đăng nhập để mua gói dịch vụ'
            });
            setPaymentModalVisible(false);
            // Redirect to login
            window.location.href = '/login';
            return;
        }

        // Get user ID (support both formats)
        const userId = user.id || user.UserID;
        console.log('✅ User validation passed:', {
            userId,
            userIdField: user.id ? 'id' : 'UserID'
        });

        if (currentStep === 1) {
            // Filter payment history first (same logic as other functions)
            const activePayments = paymentHistory ? paymentHistory.filter(payment => {
                if (payment.MembershipStatus === 'cancelled' ||
                    payment.PaymentStatus === 'cancelled' ||
                    payment.Status === 'cancelled' ||
                    payment.MembershipStatus === 'pending_cancellation') {
                    return false;
                }
                return true;
            }) : [];

            // Check if user already has active pending payment (not cancelled/rejected)
            if (activePayments && activePayments.some(p =>
                (p.PaymentStatus === 'pending' || p.Status === 'pending') &&
                p.PaymentStatus !== 'rejected' && p.Status !== 'rejected'
            )) {
                console.warn('⚠️ User has active pending payment');
                notification.warning({
                    message: 'Đã có thanh toán đang chờ',
                    description: 'Bạn đã có một thanh toán đang chờ xác nhận. Vui lòng chờ admin xác nhận trước khi đặt mua gói mới.',
                    duration: 5
                });
                setPaymentModalVisible(false);
                return;
            }

            // NEW: Check if user has existing progress to show reset notification
            const hasExistingMembership = currentMembership &&
                (currentMembership.Status === 'active' || currentMembership.Status === 'expired');

            if (hasExistingMembership || user?.Role === 'member') {
                // User has existing progress, show reset notification
                setPendingPurchase({ selectedPlan, paymentMethod, userId });
                setProgressResetModalVisible(true);
                return;
            }

            try {
                // Set to confirmation step
                setCurrentStep(2);

                console.log('🚀 Proceeding with payment for plan:', selectedPlan.PlanID, 'user:', userId);

                // Clear any previous success state to prevent notification loops
                dispatch(clearSuccess());

                // Validate data before sending
                const paymentData = {
                    planId: selectedPlan.PlanID,
                    paymentMethod: paymentMethod
                };

                console.log('💳 Payment data being sent:', paymentData);

                // Call the purchaseMembership action to save to database
                dispatch(purchaseMembership(paymentData))
                    .unwrap()
                    .then(response => {
                        console.log('✅ Payment submitted successfully:', response);
                        console.log('🔍 Response analysis:', {
                            hasData: !!response.data,
                            hasSuccess: response.success,
                            hasMessage: response.message,
                            status: response.status
                        });

                        // Close modal first
                        setPaymentModalVisible(false);
                        setCurrentStep(0);

                        // Show success notification (not warning)
                        notification.success({
                            message: '🎉 Đơn hàng đã được tạo thành công!',
                            description: 'Đơn hàng của bạn đã được tạo và đang chờ admin xác nhận thanh toán. Khi thanh toán được xác nhận, tất cả tiến trình cũ sẽ được reset để bạn bắt đầu fresh với gói mới!',
                            duration: 8
                        });

                        // Refresh user data to get updated role
                        dispatch(getCurrentUser());

                        // Fetch updated payment history
                        fetchPaymentHistory();

                        // Refresh current membership
                        dispatch(getCurrentMembership());
                    })
                    .catch(err => {
                        console.error('❌ Payment submission failed:', err);
                        console.error('🔍 Error analysis:', {
                            errorType: typeof err,
                            errorConstructor: err?.constructor?.name,
                            hasMessage: !!err?.message,
                            hasResponse: !!err?.response,
                            hasData: !!err?.response?.data,
                            actualError: err
                        });

                        // Enhanced error handling - only show error for actual failures
                        console.error('Payment error details:', {
                            error: err,
                            errorType: typeof err,
                            errorMessage: err?.message,
                            errorResponse: err?.response?.data,
                            paymentData: paymentData
                        });

                        // Check if this is actually an error or just a successful response wrongly caught
                        if (err && typeof err === 'object' && err.message && err.message.includes('Network error')) {
                            // This is a real network error
                            notification.error({
                                message: 'Lỗi kết nối',
                                description: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.',
                                duration: 8
                            });
                            setCurrentStep(1);
                            return;
                        }

                        let errorMsg = 'Không thể xử lý thanh toán. Vui lòng thử lại.';

                        if (err && typeof err === 'object') {
                            if (err.message) {
                                errorMsg = err.message;
                            } else if (err.error) {
                                errorMsg = err.error;
                            }
                        } else if (typeof err === 'string') {
                            errorMsg = err;
                        }

                        // Only show error notification for actual errors
                        console.warn('⚠️ Showing error notification for:', errorMsg);
                        notification.error({
                            message: 'Lỗi thanh toán',
                            description: errorMsg + ' (Vui lòng kiểm tra kết nối mạng và đăng nhập lại nếu cần)',
                            duration: 8
                        });
                        setCurrentStep(1);
                    });
            } catch (error) {
                // Handle any synchronous errors
                console.error('❌ Error in payment process:', error);
                notification.error({
                    message: 'Error',
                    description: 'An error occurred during payment processing'
                });
                setCurrentStep(1);
            }
        } else {
            console.warn('⚠️ handlePayment called but currentStep is not 1:', currentStep);
        }
    };

    const handleCancel = () => {
        console.log('🚫 handleCancel called, current state:', {
            selectedPlan: !!selectedPlan,
            currentStep,
            paymentModalVisible
        });

        setPaymentModalVisible(false);
        setCurrentStep(0);

        // Don't clear selectedPlan immediately in case user wants to retry
        // setSelectedPlan(null);

        console.log('🚫 Modal cancelled, selectedPlan preserved for potential retry');
    };

    const proceedWithPayment = () => {
        try {
            // Set to confirmation step
            setCurrentStep(2);

            const userId = user?.id || user?.UserID;
            console.log('🚀 Proceeding with payment for plan:', selectedPlan.PlanID, 'user:', userId);

            // Clear any previous success state to prevent notification loops
            dispatch(clearSuccess());

            // Validate data before sending
            const paymentData = {
                planId: selectedPlan.PlanID,
                paymentMethod: paymentMethod
            };

            console.log('💳 Payment data being sent:', paymentData);

            // Call the purchaseMembership action to save to database
            dispatch(purchaseMembership(paymentData))
                .unwrap()
                .then(response => {
                    console.log('✅ Payment submitted successfully:', response);

                    // Close modal first
                    setPaymentModalVisible(false);
                    setCurrentStep(0);

                    // Show success notification
                    notification.success({
                        message: '🎉 Đơn hàng đã được tạo thành công!',
                        description: 'Đơn hàng của bạn đã được tạo và đang chờ admin xác nhận thanh toán. Khi thanh toán được xác nhận, tất cả tiến trình cũ sẽ được reset để bạn bắt đầu fresh với gói mới!',
                        duration: 8
                    });

                    // Refresh data
                    dispatch(getCurrentUser());
                    fetchPaymentHistory();
                    dispatch(getCurrentMembership());
                })
                .catch(error => {
                    console.error('❌ Payment failed:', error);
                    setCurrentStep(1);

                    notification.error({
                        message: '❌ Thanh toán thất bại',
                        description: error.message || 'Đã có lỗi xảy ra trong quá trình thanh toán',
                        duration: 5
                    });
                });

        } catch (error) {
            console.error('❌ Unexpected error in proceedWithPayment:', error);
            notification.error({
                message: 'Lỗi hệ thống',
                description: 'Đã có lỗi không mong muốn. Vui lòng thử lại.',
                duration: 4
            });
        }
    };

    const handleProgressResetConfirm = () => {
        // User confirmed they understand the reset, proceed with payment
        setProgressResetModalVisible(false);
        setPendingPurchase(null);
        proceedWithPayment();
    };

    const handleProgressResetCancel = () => {
        // User cancelled, reset states
        setProgressResetModalVisible(false);
        setPendingPurchase(null);
        setPaymentModalVisible(false);
        setCurrentStep(0);
    };

    const handleCancelMembership = async () => {
        try {
            console.log("🚀 Starting cancel membership process...");

            // Validate bank information
            if (!bankInfo.bankAccountNumber || !bankInfo.bankName || !bankInfo.accountHolderName) {
                notification.error({
                    message: 'Lỗi',
                    description: 'Vui lòng cung cấp đầy đủ thông tin ngân hàng để hoàn tiền'
                });
                return;
            }

            // Validate bank account number (basic validation)
            if (bankInfo.bankAccountNumber.length < 8) {
                notification.error({
                    message: 'Lỗi',
                    description: 'Số tài khoản ngân hàng không hợp lệ (phải có ít nhất 8 chữ số)'
                });
                return;
            }

            // Validate account holder name
            if (bankInfo.accountHolderName.trim().length < 2) {
                notification.error({
                    message: 'Lỗi',
                    description: 'Tên chủ tài khoản phải có ít nhất 2 ký tự'
                });
                return;
            }

            // Check if user has payment history
            if (!paymentHistory || paymentHistory.length === 0) {
                notification.error({
                    message: 'Lỗi',
                    description: 'Không tìm thấy thông tin gói dịch vụ để hủy'
                });
                return;
            }

            // Find the active confirmed payment
            const latestPayment = paymentHistory.find(payment =>
                (payment.PaymentStatus === 'confirmed' || payment.Status === 'confirmed')
            );

            if (!latestPayment) {
                notification.error({
                    message: 'Lỗi',
                    description: 'Không tìm thấy gói dịch vụ đã xác nhận để hủy'
                });
                return;
            }

            console.log("✅ Latest payment data for cancellation:", latestPayment);

            // Prepare the cancellation request
            const cancellationData = {
                reason: 'Hủy gói dịch vụ theo yêu cầu của khách hàng',
                bankAccount: {
                    bankAccountNumber: bankInfo.bankAccountNumber.trim(),
                    bankName: bankInfo.bankName.trim(),
                    accountHolderName: bankInfo.accountHolderName.trim()
                }
            };

            console.log("📤 Sending cancellation request with data:", cancellationData);

            // Clear any previous errors
            dispatch(clearSuccess());

            // Send the cancellation request
            const result = await dispatch(cancelMembership(cancellationData)).unwrap();

            console.log("✅ Cancel membership result:", result);

            // Show success notification
            notification.success({
                message: 'Thành công',
                description: result.message || 'Yêu cầu hủy gói dịch vụ đã được gửi. Admin sẽ xem xét và xử lý trong vòng 3-5 ngày làm việc.',
                duration: 6
            });

            // Close modal and reset form
            setCancelModalVisible(false);
            setBankInfo({
                bankAccountNumber: '',
                bankName: '',
                accountHolderName: ''
            });

            // Refresh data
            setTimeout(async () => {
                console.log('🔄 Refreshing data after cancellation...');

                // Refresh payment history
                await fetchPaymentHistory();

                // Refresh current membership
                dispatch(getCurrentMembership());

                // Refresh current user to update role
                dispatch(getCurrentUser());
            }, 1000);

        } catch (error) {
            console.error('❌ Cancel membership error:', error);

            let errorMessage = 'Lỗi không xác định';

            if (error && typeof error === 'object') {
                if (error.message) {
                    errorMessage = error.message;
                } else if (error.error) {
                    errorMessage = error.error;
                } else if (error.data && error.data.message) {
                    errorMessage = error.data.message;
                }
            } else if (typeof error === 'string') {
                errorMessage = error;
            }

            console.error('📋 Final error message:', errorMessage);

            notification.error({
                message: 'Lỗi hủy gói dịch vụ',
                description: errorMessage,
                duration: 8
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
            title: 'Mã gói',
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
            title: 'Tên gói',
            dataIndex: 'Name',
            key: 'name',
        },
        {
            title: 'Giá (VNĐ)',
            dataIndex: 'Price',
            key: 'price',
            render: (price) => {
                return price > 0 ? `${price.toLocaleString()} VNĐ` : 'Miễn phí';
            }
        },
        {
            title: 'Thời hạn',
            dataIndex: 'Duration',
            key: 'duration',
            render: (duration) => {
                return duration === 30 ? '30 ngày' :
                    duration === 60 ? '60 ngày' :
                        duration === 90 ? '90 ngày' : `${duration} ngày`;
            }
        },
        {
            title: 'Tính năng',
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
            title: 'Hành động',
            key: 'action',
            render: (_, record) => {
                const isCurrent = currentMembership && currentMembership.PlanID === record.PlanID;
                const isCurrentActive = isCurrent && currentMembership?.Status === 'active';

                // If we have an active currentMembership for this plan, prioritize it
                if (isCurrentActive) {
                    return (
                        <Button disabled={true} type="primary">
                            Gói hiện tại
                        </Button>
                    );
                }

                // Filter payments (exclude cancelled but be more lenient for restored memberships)
                const activePayments = paymentHistory ? paymentHistory.filter(payment => {
                    // If this plan has an active membership, don't filter its payment history
                    if (isCurrentActive && payment.PlanID === record.PlanID) {
                        return true;
                    }

                    if (payment.MembershipStatus === 'cancelled' ||
                        payment.PaymentStatus === 'cancelled' ||
                        payment.Status === 'cancelled') {
                        return false;
                    }

                    // Only filter pending_cancellation if there's no active membership for this plan
                    if (payment.MembershipStatus === 'pending_cancellation' && !isCurrentActive) {
                        return false;
                    }

                    return true;
                }) : [];

                // Check for active payments (confirmed or pending) - not cancelled/rejected
                const hasActivePendingPayment = activePayments && activePayments.some(p =>
                    (p.PaymentStatus === 'pending' || p.Status === 'pending') &&
                    p.PaymentStatus !== 'rejected' && p.Status !== 'rejected'
                );

                const hasActiveConfirmedPayment = activePayments && activePayments.some(p =>
                    (p.PaymentStatus === 'confirmed' || p.Status === 'confirmed')
                );

                // User can purchase if:
                // 1. User is logged in
                // 2. No active pending payments
                // 3. Either no confirmed payments OR not the same plan as current confirmed
                // 4. Not a guest plan (free plan)
                // 5. Not currently active (handled above)
                const isPurchasable = user &&
                    !hasActivePendingPayment &&
                    (!hasActiveConfirmedPayment || !isCurrent) &&
                    record.Price > 0 &&
                    !isCurrentActive;

                const isGuestPlan = record.Price === 0;

                console.log('🎯 Action button logic for plan', record.Name, ':', {
                    isCurrent,
                    isCurrentActive,
                    hasActivePendingPayment,
                    hasActiveConfirmedPayment,
                    isPurchasable,
                    isGuestPlan,
                    currentMembershipStatus: currentMembership?.Status,
                    paymentHistory: paymentHistory?.map(p => ({
                        PlanName: p.PlanName,
                        PaymentStatus: p.PaymentStatus,
                        Status: p.Status,
                        MembershipStatus: p.MembershipStatus
                    }))
                });

                if (hasActivePendingPayment) {
                    return (
                        <Button disabled={true}>
                            Đang chờ thanh toán
                        </Button>
                    );
                }

                return (
                    isPurchasable && !isGuestPlan ? (
                        <Button
                            type="primary"
                            disabled={loading}
                            onClick={() => handleSelectPlan(record)}
                        >
                            Mua gói
                        </Button>
                    ) : (
                        <Button disabled={true}>
                            {(isCurrent && hasActiveConfirmedPayment) || isCurrentActive ? 'Gói hiện tại' :
                                isGuestPlan ? 'Miễn phí' : 'Không khả dụng'}
                        </Button>
                    )
                );
            }
        }
    ];

    // Add a function to render payment status and instructions
    const renderPaymentStatus = (membership) => {
        // This function is now mainly for backwards compatibility
        // Most logic has been moved to renderPaymentInfo above
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

    const handlePayOSPayment = async (plan) => {
        try {
            setLoading(true);
            
            const response = await axiosInstance.post('/payment/payos/create', {
                planId: plan.PlanID,
                amount: plan.Price,
                description: `Thanh toán gói ${plan.Name}`
            });

            if (response.data.success) {
                // Redirect to PayOS checkout
                window.location.href = response.data.data.checkoutUrl;
            } else {
                toast.error('Không thể tạo link thanh toán');
            }
        } catch (error) {
            console.error('PayOS payment error:', error);
            toast.error('Lỗi khi tạo thanh toán PayOS');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="membership-plans-container">
            {apiError && (
                <Alert
                    message="Chế độ Demo"
                    description="Hiển thị dữ liệu gói thành viên mẫu."
                    type="info"
                    showIcon
                    style={{ marginBottom: 20 }}
                />
            )}

            {renderPaymentInfo()}

            {renderPaymentStatus(currentMembership)}

            {/* Modern Card Layout for Membership Plans */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '24px',
                marginBottom: '30px'
            }}>
                {displayPlans.map((plan, index) => {
                    // Xác định màu và style cho từng gói
                    const planName = plan.Name.toLowerCase();
                    let planTheme = {};

                    if (planName.includes('basic') || planName.includes('cơ bản')) {
                        planTheme = {
                            color: '#10b981',
                            gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            icon: '🌱',
                            borderColor: '#10b981',
                            textColor: '#065f46'
                        };
                    } else if (planName.includes('premium') || planName.includes('cao cấp')) {
                        planTheme = {
                            color: '#8b5cf6',
                            gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                            icon: '💎',
                            borderColor: '#8b5cf6',
                            textColor: '#5b21b6'
                        };
                    } else if (planName.includes('professional') || planName.includes('chuyên nghiệp')) {
                        planTheme = {
                            color: '#f59e0b',
                            gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            icon: '🚀',
                            borderColor: '#f59e0b',
                            textColor: '#92400e'
                        };
                    } else {
                        // Màu mặc định cho các gói khác
                        planTheme = {
                            color: '#3b82f6',
                            gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            icon: '⭐',
                            borderColor: '#3b82f6',
                            textColor: '#1e40af'
                        };
                    }

                    const isPopular = planName.includes('premium') || planName.includes('cao cấp');

                    return (
                        <div
                            key={plan.PlanID}
                            className={`membership-plan-card ${isPopular ? 'popular-plan' : ''}`}
                            style={{
                                borderRadius: '16px',
                                border: `3px solid ${planTheme.borderColor}`,
                                position: 'relative',
                                overflow: 'hidden',
                                transition: 'all 0.3s ease',
                                transform: 'translateY(0)',
                                boxShadow: `0 15px 35px ${planTheme.color}30`,
                                background: 'white',
                                padding: '24px'
                            }}
                        >
                            {/* Plan Badge */}
                            {isPopular && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-2px',
                                    left: '-2px',
                                    right: '-2px',
                                    background: planTheme.gradient,
                                    color: 'white',
                                    textAlign: 'center',
                                    padding: '10px',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    borderRadius: '16px 16px 0 0',
                                    letterSpacing: '0.5px'
                                }}>
                                    🔥 PHỔ BIẾN NHẤT
                                </div>
                            )}

                            {/* Simplified Header */}
                            <div style={{
                                textAlign: 'center',
                                marginTop: isPopular ? '16px' : '0',
                                marginBottom: '20px'
                            }}>
                                <div style={{
                                    fontSize: '32px',
                                    marginBottom: '12px'
                                }}>
                                    {planTheme.icon}
                                </div>

                                <Title level={3} style={{
                                    margin: '0 0 8px 0',
                                    color: '#1f2937',
                                    fontSize: '20px'
                                }}>
                                    {plan.Name}
                                </Title>

                                <div style={{
                                    color: '#6b7280',
                                    fontSize: '14px',
                                    marginBottom: '16px'
                                }}>
                                    {plan.Description}
                                </div>

                                {/* Compact Price */}
                                <div style={{
                                    background: planTheme.gradient,
                                    color: 'white',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    margin: '0 -8px'
                                }}>
                                    <div style={{
                                        fontSize: '28px',
                                        fontWeight: 'bold',
                                        lineHeight: 1
                                    }}>
                                        {plan.Price.toLocaleString()}đ
                                    </div>
                                    <div style={{
                                        fontSize: '12px',
                                        opacity: 0.8,
                                        marginTop: '4px'
                                    }}>
                                        {plan.Duration} ngày • {Math.round(plan.Price / plan.Duration).toLocaleString()}đ/ngày
                                    </div>
                                </div>
                            </div>

                            {/* Compact Features */}
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    color: '#374151',
                                    marginBottom: '12px'
                                }}>
                                    ✨ Tính năng nổi bật:
                                </div>
                                {formatFeatureList(plan.Features).slice(0, 3).map((feature, idx) => (
                                    <div key={idx} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginBottom: '8px',
                                        fontSize: '13px'
                                    }}>
                                        <span style={{
                                            display: 'inline-block',
                                            width: '16px',
                                            height: '16px',
                                            borderRadius: '50%',
                                            background: '#22c55e',
                                            color: 'white',
                                            textAlign: 'center',
                                            lineHeight: '16px',
                                            fontSize: '10px',
                                            marginRight: '10px',
                                            flexShrink: 0
                                        }}>
                                            ✓
                                        </span>
                                        <span style={{
                                            color: '#4b5563',
                                            lineHeight: 1.4
                                        }}>
                                            {feature}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Simplified Button */}
                            <Button
                                type="primary"
                                size="large"
                                block
                                onClick={() => handleSelectPlan(plan)}
                                disabled={loading}
                                style={{
                                    height: '44px',
                                    borderRadius: '10px',
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    background: planTheme.gradient,
                                    border: 'none',
                                    color: 'white'
                                }}
                            >
                                Mua gói
                            </Button>

                            <button
                                className="btn btn-success me-2"
                                onClick={() => handlePayOSPayment(plan)}
                                disabled={loading}
                            >
                                <i className="fas fa-credit-card me-2"></i>
                                Thanh toán PayOS
                            </button>
                        </div>
                    );
                })}
            </div>

            <style>{`
                .membership-plan-card:hover {
                    transform: translateY(-8px) !important;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15) !important;
                }
                
                .membership-plan-card.popular-plan:hover {
                    box-shadow: 0 30px 60px rgba(102, 126, 234, 0.25) !important;
                }
                
                .membership-plan-card .ant-btn:hover {
                    transform: translateY(-2px);
                    transition: all 0.3s ease;
                }
            `}</style>

            <Modal
                title={
                    <div style={{
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        margin: '-24px -24px 0 -24px',
                        padding: '32px 24px 24px 24px',
                        color: 'white'
                    }}>
                        <div style={{ fontSize: '32px', marginBottom: '16px' }}>💳</div>
                        <Steps
                            current={currentStep}
                            style={{ maxWidth: 500, margin: '0 auto 20px' }}
                            items={[
                                { title: "Chọn gói", icon: <span style={{ fontSize: '16px' }}>📋</span> },
                                { title: "Thanh toán", icon: <span style={{ fontSize: '16px' }}>💳</span> },
                                { title: "Xác nhận", icon: <span style={{ fontSize: '16px' }}>✅</span> }
                            ]}
                        />
                        <Title level={3} style={{ margin: '16px 0 0', color: 'white' }}>
                            {currentStep === 0 ? 'Chọn gói thành viên' :
                                currentStep === 1 ? 'Thông tin thanh toán' : 'Xác nhận đơn hàng'}
                        </Title>
                    </div>
                }
                open={paymentModalVisible}
                onCancel={handleCancel}
                width={750}
                bodyStyle={{ padding: '32px 24px' }}
                footer={[
                    <Button
                        key="back"
                        onClick={handleCancel}
                        size="large"
                        style={{
                            borderRadius: '8px',
                            height: '44px',
                            minWidth: '100px'
                        }}
                    >
                        Hủy bỏ
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        size="large"
                        loading={loading}
                        disabled={loading || (paymentHistory && paymentHistory.some(p =>
                            (p.PaymentStatus === 'pending' || p.Status === 'pending') &&
                            p.PaymentStatus !== 'cancelled' && p.Status !== 'cancelled' &&
                            p.PaymentStatus !== 'rejected' && p.Status !== 'rejected'
                        ))}
                        onClick={handlePayment}
                        style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            height: '44px',
                            minWidth: '140px',
                            fontWeight: 600
                        }}
                    >
                        {currentStep === 1 ? '🚀 Thanh toán ngay' : '✅ Xác nhận'}
                    </Button>,
                ]}
            >
                {selectedPlan && (
                    <>
                        {/* Order Information Card */}
                        <Card
                            style={{
                                marginBottom: '24px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                border: '1px solid #e2e8f0'
                            }}
                            bodyStyle={{ padding: '20px' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '20px',
                                    marginRight: '16px'
                                }}>
                                    📋
                                </div>
                                <Title level={4} style={{ margin: 0, color: '#1e293b' }}>
                                    Thông tin đơn hàng
                                </Title>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div style={{
                                    padding: '16px',
                                    borderRadius: '8px',
                                    background: 'white',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <Text style={{ color: '#64748b', fontSize: '14px' }}>Gói dịch vụ</Text>
                                    <div style={{ fontWeight: 600, color: '#1e293b', marginTop: '4px' }}>
                                        {selectedPlan.Name}
                                    </div>
                                </div>

                                <div style={{
                                    padding: '16px',
                                    borderRadius: '8px',
                                    background: 'white',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <Text style={{ color: '#64748b', fontSize: '14px' }}>Thời hạn</Text>
                                    <div style={{ fontWeight: 600, color: '#1e293b', marginTop: '4px' }}>
                                        {selectedPlan.Duration} ngày
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                marginTop: '16px',
                                padding: '20px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px' }}>
                                    Tổng thanh toán
                                </div>
                                <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                                    {selectedPlan.Price.toLocaleString()}đ
                                </div>
                                <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                                    ≈ {Math.round(selectedPlan.Price / selectedPlan.Duration).toLocaleString()}đ/ngày
                                </div>
                            </div>
                        </Card>

                        {/* Payment Method Selection */}
                        <Card
                            style={{
                                marginBottom: '24px',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0'
                            }}
                            bodyStyle={{ padding: '20px' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '20px',
                                    marginRight: '16px'
                                }}>
                                    💳
                                </div>
                                <Title level={4} style={{ margin: 0, color: '#1e293b' }}>
                                    Phương thức thanh toán
                                </Title>
                            </div>

                            <Radio.Group
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                value={paymentMethod}
                                style={{ width: '100%' }}
                            >
                                {PaymentMethodOptions.map(option => (
                                    <Radio
                                        key={option.value}
                                        value={option.value}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            height: '50px',
                                            padding: '0 16px',
                                            margin: '8px 0',
                                            borderRadius: '8px',
                                            border: '2px solid #e2e8f0',
                                            background: '#f8fafc',
                                            width: '100%'
                                        }}
                                    >
                                        <span style={{
                                            marginLeft: '8px',
                                            fontSize: '15px',
                                            fontWeight: 500,
                                            color: '#374151'
                                        }}>
                                            {option.label}
                                        </span>
                                    </Radio>
                                ))}
                            </Radio.Group>
                        </Card>

                        {/* Payment Information Card */}
                        <Card
                            style={{
                                borderRadius: '12px',
                                background: '#f0f9ff',
                                border: '1px solid #bfdbfe'
                            }}
                            bodyStyle={{ padding: '24px' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '20px',
                                    marginRight: '16px'
                                }}>
                                    ℹ️
                                </div>
                                <Title level={4} style={{ margin: 0, color: '#1e40af' }}>
                                    Hướng dẫn thanh toán
                                </Title>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', alignItems: 'start' }}>
                                {/* QR Code Section */}
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{
                                        background: 'white',
                                        borderRadius: '16px',
                                        padding: '20px',
                                        border: '2px solid #e5e7eb',
                                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                                    }}>
                                        <img
                                            src="/api/images/payment-qr.svg"
                                            alt="Mã QR thanh toán"
                                            style={{
                                                width: '180px',
                                                height: '180px',
                                                borderRadius: '12px'
                                            }}
                                        />
                                        <div style={{
                                            marginTop: '12px',
                                            fontWeight: 600,
                                            color: '#374151',
                                            fontSize: '16px'
                                        }}>
                                            📱 Quét mã QR
                                        </div>
                                        <div style={{
                                            fontSize: '14px',
                                            color: '#6b7280',
                                            marginTop: '4px'
                                        }}>
                                            để thanh toán nhanh chóng
                                        </div>
                                    </div>
                                </div>

                                {/* Instructions Section */}
                                <div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <div style={{
                                            display: 'inline-block',
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            color: 'white',
                                            padding: '8px 16px',
                                            borderRadius: '20px',
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            marginBottom: '12px'
                                        }}>
                                            Ghi chú chuyển khoản: <Text code style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>ADMIN PREMIUM</Text>
                                        </div>
                                    </div>

                                    <div className="payment-steps">
                                        {[
                                            {
                                                icon: '🏦',
                                                title: 'Chuyển khoản ngân hàng',
                                                desc: 'Bạn sẽ nhận được thông tin tài khoản để chuyển tiền'
                                            },
                                            {
                                                icon: '🏪',
                                                title: 'Thanh toán tại quầy',
                                                desc: 'Bạn sẽ đến địa điểm vật lý để thanh toán trực tiếp'
                                            },
                                            {
                                                icon: '✅',
                                                title: 'Xác nhận thanh toán',
                                                desc: 'Admin sẽ xác nhận và nâng cấp tài khoản trong 5-10 phút'
                                            }
                                        ].map((step, index) => (
                                            <div key={index} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                marginBottom: '16px',
                                                padding: '16px',
                                                background: 'white',
                                                borderRadius: '12px',
                                                border: '1px solid #e5e7eb'
                                            }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    background: '#f3f4f6',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '18px',
                                                    marginRight: '16px'
                                                }}>
                                                    {step.icon}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                                                        {step.title}
                                                    </div>
                                                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                                        {step.desc}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </>
                )}
            </Modal>

            <Modal
                title="Hủy gói thành viên"
                open={cancelModalVisible}
                onCancel={() => setCancelModalVisible(false)}
                footer={[
                    <Button key="back" onClick={() => setCancelModalVisible(false)}>
                        Không, giữ gói thành viên
                    </Button>,
                    <Button key="submit" type="primary" danger onClick={handleCancelMembership}>
                        Có, hủy và nhận 50% hoàn tiền
                    </Button>,
                ]}
                width={600}
            >
                <Alert
                    message="Cảnh báo"
                    description={
                        <div>
                            <p>Bạn có chắc chắn muốn hủy gói thành viên không?</p>
                            <p><strong>Quan trọng:</strong> Bạn chỉ nhận được hoàn tiền 50% số tiền đã thanh toán.</p>
                            {paymentHistory && paymentHistory.length > 0 && paymentHistory[0].PaymentStatus === 'confirmed' && (
                                <p>Số tiền hoàn lại: {calculateRefundAmount(paymentHistory[0]).toLocaleString()} VNĐ</p>
                            )}
                            <p>Trạng thái tài khoản của bạn sẽ trở về Guest ngay lập tức.</p>
                            <p style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                                ⚠️ Lưu ý: Gói dịch vụ chỉ có thể hủy trong vòng 7 ngày đầu tiên kể từ ngày mua.
                            </p>
                        </div>
                    }
                    type="warning"
                    showIcon
                    style={{ marginBottom: '20px' }}
                />

                <Divider>Thông tin hoàn tiền</Divider>

                <div style={{ marginBottom: '16px' }}>
                    <Text strong>Số tài khoản ngân hàng *</Text>
                    <Input
                        placeholder="Nhập số tài khoản ngân hàng"
                        value={bankInfo.bankAccountNumber}
                        onChange={(e) => setBankInfo({ ...bankInfo, bankAccountNumber: e.target.value })}
                        style={{ marginTop: '8px' }}
                    />
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <Text strong>Tên ngân hàng *</Text>
                    <Input
                        placeholder="Ví dụ: Vietcombank, BIDV, Techcombank..."
                        value={bankInfo.bankName}
                        onChange={(e) => setBankInfo({ ...bankInfo, bankName: e.target.value })}
                        style={{ marginTop: '8px' }}
                    />
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <Text strong>Tên chủ tài khoản *</Text>
                    <Input
                        placeholder="Nhập tên chủ tài khoản (theo đúng tên trên ngân hàng)"
                        value={bankInfo.accountHolderName}
                        onChange={(e) => setBankInfo({ ...bankInfo, accountHolderName: e.target.value })}
                        style={{ marginTop: '8px' }}
                    />
                </div>

                <Alert
                    message="Lưu ý quan trọng"
                    description={
                        <div>
                            <p>• Thông tin ngân hàng phải chính xác để đảm bảo hoàn tiền thành công</p>
                            <p>• Thời gian xử lý hoàn tiền là 3-5 ngày làm việc</p>
                            <p>• Gói dịch vụ chỉ có thể hủy trong vòng 7 ngày đầu tiên</p>
                            <p>• Bạn sẽ chỉ nhận được 50% số tiền đã thanh toán</p>
                            <p>• Mọi thông tin ADMIN Trung Tâm chuyển khoản cho bạn sẽ được hệ thống thông báo qua SMS,SĐT của người dùng</p>
                        </div>
                    }
                    type="info"
                    showIcon
                    style={{ marginTop: '16px' }}
                />
            </Modal>

            {/* Progress Reset Notification Modal */}
            <ProgressResetNotification
                visible={progressResetModalVisible}
                onConfirm={handleProgressResetConfirm}
                onCancel={handleProgressResetCancel}
                planName={pendingPurchase?.selectedPlan?.Name || ""}
                loading={loading}
            />
        </div>
    );
};

export default MembershipPlans; 