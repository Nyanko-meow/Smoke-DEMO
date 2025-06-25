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
import { getCurrentUser, updateUserRole } from '../../store/slices/authSlice';
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
import { notification, Select } from 'antd';
import { toast } from 'react-toastify';
import axiosInstance from '../../utils/axiosConfig';
import { usePayOS } from '@payos/payos-checkout';
import { logout, login } from '../../store/slices/authSlice';
import ProgressResetNotification from '../member/ProgressResetNotification';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

const PaymentMethodOptions = [
    { label: 'PayOS - Thanh toán online', value: 'PayOS' },
];

// Dữ liệu mẫu khi API không hoạt động
const SAMPLE_PLANS = [
    {
        PlanID: 1,
        Name: 'Basic Plan',
        Description: 'Gói cơ bản để bắt đầu hành trình cai thuốc của bạn.',
        Price: 99000,
        Duration: 15,
        Features: 'Theo dõi tiến trình\nPhân tích nâng cao\nChiến lược bỏ thuốc cao cấp\nTruy cập cộng đồng\nĐộng lực hàng tuần\nĐược coach tư vấn qua chat và có thể đặt lịch'
    },
    {
        PlanID: 2,
        Name: 'Premium Plan',
        Description: 'Hỗ trợ nâng cao cho hành trình cai thuốc của bạn.',
        Price: 199000,
        Duration: 60,
        Features: 'Theo dõi tiến trình chi tiết\nPhân tích và báo cáo chuyên sâu\nKế hoạch cai thuốc cá nhân hóa\nTư vấn 1-1 với chuyên gia\nHỗ trợ 24/7 qua chat và hotline\nVideo hướng dẫn độc quyền\nCộng đồng VIP và mentor\nNhắc nhở thông minh theo thói quen\nPhân tích tâm lý và cảm xúc\nChương trình thưởng đặc biệt\nBáo cáo tiến độ hàng tuần\nTruy cập không giới hạn tất cả tính năng'
    }
];

// Add bank options at the top of the component
const VIETNAM_BANKS = [
    {
        name: 'Vietcombank',
        fullName: 'Ngân hàng TMCP Ngoại thương Việt Nam',
        icon: '🏦',
        color: '#007bff'
    },
    {
        name: 'BIDV',
        fullName: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam',
        icon: '🏛️',
        color: '#28a745'
    },
    {
        name: 'Vietinbank',
        fullName: 'Ngân hàng TMCP Công thương Việt Nam',
        icon: '🏢',
        color: '#dc3545'
    },
    {
        name: 'Agribank',
        fullName: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam',
        icon: '🌾',
        color: '#ffc107'
    },
    {
        name: 'Techcombank',
        fullName: 'Ngân hàng TMCP Kỹ thương Việt Nam',
        icon: '💎',
        color: '#6f42c1'
    },
    {
        name: 'MBBank',
        fullName: 'Ngân hàng TMCP Quân đội',
        icon: '⭐',
        color: '#fd7e14'
    },
    {
        name: 'VPBank',
        fullName: 'Ngân hàng TMCP Việt Nam Thịnh vượng',
        icon: '🚀',
        color: '#20c997'
    },
    {
        name: 'ACB',
        fullName: 'Ngân hàng TMCP Á Châu',
        icon: '🔥',
        color: '#e83e8c'
    },
    {
        name: 'SHB',
        fullName: 'Ngân hàng TMCP Sài Gòn - Hà Nội',
        icon: '🏙️',
        color: '#17a2b8'
    },
    {
        name: 'TPBank',
        fullName: 'Ngân hàng TMCP Tiên Phong',
        icon: '🎯',
        color: '#6c757d'
    }
];

const MembershipPlans = () => {
    const dispatch = useDispatch();
    const { plans, currentMembership, loading, error, success, message, refundRequests } = useSelector(
        (state) => state.membership
    );
    const { user } = useSelector((state) => state.auth);

    const [selectedPlan, setSelectedPlan] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('PayOS');
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
    const [cancellationReason, setCancellationReason] = useState('');

    // Progress reset notification state
    const [progressResetModalVisible, setProgressResetModalVisible] = useState(false);
    const [pendingPurchase, setPendingPurchase] = useState(null);

    const [payosLoading, setPayosLoading] = useState(false);

    const [payOSConfig, setPayOSConfig] = useState({
        RETURN_URL: window.location.href,
        ELEMENT_ID: 'payos-embedded',
        CHECKOUT_URL: null,
        embedded: true,
        onSuccess: async (event) => {
            console.log('🎉 PayOS payment successful:', event);
            setPaymentModalVisible(false);
            const request = await axiosInstance.get('/payments/payos/status/' + event.orderCode);
            
            // ✅ CẬP NHẬT: Refresh cả user data và membership data
            await dispatch(getCurrentUser()).unwrap(); // Thêm dòng này
            await refreshMembershipData();
            
            notification.success({
                message: 'Thanh toán thành công!',
                description: 'Gói thành viên của bạn đã được kích hoạt.',
            });
        },
        onExit: (event) => {
            console.log('🏃‍♂️ PayOS checkout exited:', event);
            setPaymentModalVisible(false);
        },
        onError: (error) => {
            console.error('❌ PayOS error:', error);
            notification.error({
                message: 'Lỗi Thanh Toán',
                description: 'Đã có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.',
            });
        }
    });

    const { open, exit } = usePayOS(payOSConfig);

    useEffect(() => {
        if (payOSConfig.CHECKOUT_URL) {
            open();
        }
    }, [payOSConfig.CHECKOUT_URL]);

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
            // ✅ CẬP NHẬT: Thêm getCurrentUser
            await dispatch(getCurrentUser()).unwrap();
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

    // Function to generate QR code image from PayOS data string
    const generateQRCodeImage = async (qrData) => {
        try {
            console.log('🔄 Generating QR code image from data:', qrData);
            
            // Generate QR code as data URL
            const qrCodeDataURL = await QRCode.toDataURL(qrData, {
                width: 200,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            
            console.log('✅ QR code image generated successfully');
            return qrCodeDataURL;
        } catch (error) {
            console.error('❌ Error generating QR code:', error);
            return null;
        }
    };

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
        if (!user || !paymentHistory) return;

        const activePayments = paymentHistory.filter(payment => {
            // Only check confirmed payments
            if (payment.PaymentStatus !== 'confirmed' && payment.Status !== 'confirmed') {
                return false;
            }
            // Skip cancelled memberships
            if (payment.MembershipStatus === 'cancelled' || 
                payment.PaymentStatus === 'cancelled' || 
                payment.Status === 'cancelled') {
                return false;
            }
            return true;
        });

        if (activePayments.length === 0) return;

        // Get the latest payment
        const latestPayment = activePayments.sort((a, b) => {
            if (a.PaymentDate && b.PaymentDate) {
                return new Date(b.PaymentDate) - new Date(a.PaymentDate);
            }
            return (b.PaymentID || 0) - (a.PaymentID || 0);
        })[0];

        if (!latestPayment || !latestPayment.EndDate) return;

        const endDate = new Date(latestPayment.EndDate);
        const currentDate = new Date();

        console.log('🕒 Checking membership expiration:', {
            endDate: endDate.toISOString(),
            currentDate: currentDate.toISOString(),
            isExpired: currentDate > endDate,
            userRole: user.role,
            membershipStatus: latestPayment.MembershipStatus
        });

        if (currentDate > endDate && user.role !== 'guest') {
            console.log('⚠️ Membership expired, downgrading to guest...');
            
            try {
                // Call API to downgrade user to guest
                const response = await axiosInstance.post('/auth/downgrade-to-guest', {
                    userId: user.id,
                    reason: 'membership_expired'
                });

                if (response.data.success) {
                    console.log('✅ Successfully downgraded to guest');
                    
                    // Update user role in Redux store
                    dispatch(updateUserRole('guest'));
                    
                    // Show notification
                    notification.warning({
                        message: 'Gói thành viên đã hết hạn',
                        description: 'Tài khoản của bạn đã được chuyển về gói miễn phí. Vui lòng gia hạn để tiếp tục sử dụng các tính năng cao cấp.',
                        duration: 10
                    });
                    
                    // Refresh data
                    await loadData();
                } else {
                    console.error('❌ Failed to downgrade to guest:', response.data.message);
                }
            } catch (error) {
                console.error('❌ Error downgrading to guest:', error);
            }
        }
    };

    // Function to check if user has active membership
    const hasActiveMembership = () => {
        if (!paymentHistory || paymentHistory.length === 0) {
            console.log('🔍 hasActiveMembership: No payment history');
            return false;
        }

        const activePayments = paymentHistory.filter(payment => {
            const isConfirmed = payment.PaymentStatus === 'confirmed' || payment.Status === 'confirmed';
            const isNotCancelled = payment.PaymentStatus !== 'cancelled' && 
                                  payment.Status !== 'cancelled' && 
                                  payment.MembershipStatus !== 'cancelled';
            
            console.log('🔍 Checking payment:', {
                paymentId: payment.PaymentID,
                isConfirmed,
                isNotCancelled,
                paymentStatus: payment.PaymentStatus,
                status: payment.Status,
                membershipStatus: payment.MembershipStatus
            });
            
            return isConfirmed && isNotCancelled;
        });

        const hasActive = activePayments.length > 0;
        console.log('🔍 hasActiveMembership result:', {
            hasActive,
            activePaymentsCount: activePayments.length,
            totalPayments: paymentHistory.length
        });

        return hasActive;
    };

    // Check if user has active membership to disable purchase buttons
    const hasActiveMembershipForPurchase = () => {
        if (!paymentHistory || paymentHistory.length === 0) {
            console.log('🔍 No payment history for purchase check');
            return false;
        }

        // Check for any active payments (confirmed and not cancelled)
        const activePayments = paymentHistory.filter(payment => {
            const isActiveStatus = (payment.PaymentStatus === 'confirmed' || payment.Status === 'confirmed') ||
                                  (payment.PaymentStatus === 'pending' || payment.Status === 'pending');
            
            const isNotCancelled = payment.PaymentStatus !== 'cancelled' && 
                                  payment.Status !== 'cancelled' && 
                                  payment.PaymentStatus !== 'rejected' && 
                                  payment.Status !== 'rejected' &&
                                  payment.MembershipStatus !== 'cancelled' &&
                                  payment.MembershipStatus !== 'pending_cancellation';
            
            return isActiveStatus && isNotCancelled;
        });

        const hasActivePending = activePayments.some(p => 
            (p.PaymentStatus === 'pending' || p.Status === 'pending') &&
            p.PaymentStatus !== 'rejected' && p.Status !== 'rejected'
        );

        if (hasActivePending) {
            console.log('🚫 User has pending membership payment:', {
                planName: activePayments.find(p => p.PaymentStatus === 'pending' || p.Status === 'pending')?.PlanName,
                membershipStatus: activePayments.find(p => p.PaymentStatus === 'pending' || p.Status === 'pending')?.MembershipStatus,
                paymentStatus: activePayments.find(p => p.PaymentStatus === 'pending' || p.Status === 'pending')?.PaymentStatus
            });
            return true;
        }

        const hasActiveConfirmed = activePayments.some(p => 
            (p.PaymentStatus === 'confirmed' || p.Status === 'confirmed')
        );

        if (hasActiveConfirmed) {
            console.log('🚫 User has confirmed membership payment');
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

        // ✅ THAY ĐỔI: Chỉ ẩn nếu user là guest VÀ KHÔNG có payment history
        if (user.role === 'guest' && (!paymentHistory || paymentHistory.length === 0)) {
            console.log('🚫 User is guest with no payment history - hiding payment info');
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
                    console.log('🚫 Filtering out cancelled payment in hasActiveMembership:', payment);
                    return false;
                }
                // Keep pending_cancellation
                if (payment.MembershipStatus === 'pending_cancellation') {
                    console.log('⏳ Keeping pending_cancellation payment for display:', payment);
                    return true;
                }
                return true;
            });

            console.log('📋 Active payments after filtering cancelled:', activePayments);

            // If no active payments remain, hide payment info completely
            if (activePayments.length === 0) {
                console.log('💳 No active payments remaining after filtering - hiding payment info');
                return null;
            }

            // ✅ XÓA LOGIC NÀY - không còn ẩn thông tin thanh toán khi user role = guest
            // if (user.role === 'guest') {
            //     console.log('🚫 User is guest - force hiding payment info even with active payments');
            //     return null;
            // }

            // ✅ THÊM LOG để debug
            console.log('✅ SHOWING payment info for user:', {
                userRole: user.role,
                activePaymentsCount: activePayments.length,
                paymentHistoryCount: paymentHistory.length
            });

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

            // Determine alert type and status text based on payment status and method
            let alertType = 'info';
            let statusText = 'Không xác định';

            // Check membership status first for cancellation
            if (latestPayment.MembershipStatus === 'pending_cancellation') {
                alertType = 'warning';
                statusText = '🕒 Đang chờ hủy gói - Yêu cầu hủy đã được gửi';
            } else if (correctedStatus === 'confirmed') {
                alertType = 'success';
                if (latestPayment.PaymentMethod === 'PayOS') {
                    statusText = '🎉 Đã kích hoạt tự động qua PayOS';
                } else {
                    statusText = '✅ Đã xác nhận';
                }
            } else if (correctedStatus === 'pending') {
                alertType = 'success';
                statusText = '⚡ Đang xử lý thanh toán PayOS...';
            } else if (correctedStatus === 'rejected' || correctedStatus === 'cancelled') {
                alertType = 'error';
                statusText = correctedStatus === 'cancelled' ? '🚫 Đã hủy' : '❌ Đã từ chối';
            }

            return (
                <div
                    style={{
                        background: latestPayment.MembershipStatus === 'pending_cancellation'
                            ? 'linear-gradient(135deg, #fef3c7 0%, #fbbf24 25%, #f59e0b 75%, #d97706 100%)'
                            : correctedStatus === 'confirmed'
                                ? 'linear-gradient(135deg, #f0fdf9 0%, #ecfdf5 50%, #f0fdf4 100%)'
                                : correctedStatus === 'pending'
                                    ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fef7cd 100%)'
                                    : 'linear-gradient(135deg, #fef2f2 0%, #fecaca 50%, #fed7d7 100%)',
                        border: `1px solid ${latestPayment.MembershipStatus === 'pending_cancellation' ? '#f59e0b' :
                            correctedStatus === 'confirmed' ? '#86efac' :
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
                        background: latestPayment.MembershipStatus === 'pending_cancellation'
                            ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)'
                            : correctedStatus === 'confirmed'
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
                        {latestPayment.MembershipStatus === 'pending_cancellation' ? 
                            "🕒 ĐANG CHỜ HỦY GÓI" :
                            correctedStatus === 'pending' ? 
                                "⚡ ĐANG XỬ LÝ PAYOS" :
                                correctedStatus === 'confirmed' ? 
                                    (latestPayment.PaymentMethod === 'PayOS' ? "🎉 KÍCH HOẠT TỰ ĐỘNG" : "✅ GÓI DỊCH VỤ HIỆN TẠI") :
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
                            marginBottom: '12px'
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
                                        fontSize: '13px',
                                        color: '#6b7280',
                                        fontWeight: 600,
                                        fontFamily: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif'
                                    }}>
                                        Gói dịch vụ:
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    color: '#1f2937',
                                    fontFamily: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif'
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
                                        fontSize: '13px',
                                        color: '#6b7280',
                                        fontWeight: 600,
                                        fontFamily: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif'
                                    }}>
                                        Thời gian:
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: '13px',
                                    color: '#374151',
                                    fontWeight: 600,
                                    fontFamily: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif'
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
                                        fontSize: '13px',
                                        color: '#6b7280',
                                        fontWeight: 600,
                                        fontFamily: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif'
                                    }}>
                                        Thanh toán:
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: '13px',
                                    color: '#374151',
                                    fontWeight: 600,
                                    fontFamily: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif'
                                }}>
                                    {latestPayment.PaymentMethod === 'BankTransfer' ? 'Chuyển khoản' :
                                        latestPayment.PaymentMethod === 'Cash' ? 'Tiền mặt' :
                                            latestPayment.PaymentMethod === 'PayOS' ? 'PayOS - Thanh toán online' :
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
                                        fontSize: '13px',
                                        color: '#6b7280',
                                        fontWeight: 600,
                                        fontFamily: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif'
                                    }}>
                                        Trạng thái:
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    color: correctedStatus === 'confirmed' ? '#16a34a' :
                                        correctedStatus === 'pending' ? '#d97706' :
                                            '#dc2626',
                                    fontFamily: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif'
                                }}>
                                    {statusText}
                                </div>
                            </div>
                        </div>

                        {/* Tính năng nổi bật section - ALWAYS show for active membership */}
                        <div className="membership-features-section membership-info-card" style={{
                            background: 'rgba(255, 255, 255, 0.95)',
                            borderRadius: '12px',
                            padding: '20px',
                            border: '1px solid rgba(22, 163, 74, 0.2)',
                            backdropFilter: 'blur(20px)',
                            marginBottom: '16px',
                            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
                        }}>
                            <div style={{
                                fontSize: '16px',
                                fontWeight: 700,
                                color: '#16a34a',
                                marginBottom: '16px',
                                fontFamily: 'inherit',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <span style={{ 
                                    fontSize: '18px', 
                                    fontFamily: 'inherit',
                                    display: 'inline-block',
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    background: '#16a34a',
                                    color: 'white',
                                    textAlign: 'center',
                                    lineHeight: '24px'
                                }}>✨</span>
                                <span style={{ fontFamily: 'inherit' }}>Tính năng nổi bật</span>
                            </div>
                            {(() => {
                                // Find the current plan's features
                                const currentPlan = displayPlans.find(plan => 
                                    plan.Name === (latestPayment.PlanName || latestPayment.Name)
                                );
                                const features = currentPlan ? 
                                    formatFeatureList(currentPlan.Features) : 
                                    [
                                        'Theo dõi tiến trình cai thuốc chi tiết',
                                        'Phân tích nâng cao và báo cáo', 
                                        'Chiến lược bỏ thuốc cao cấp',
                                        'Truy cập cộng đồng và chia sẻ',
                                        'Động lực hàng tuần từ coach',
                                        'Được coach tư vấn qua chat và đặt lịch hẹn'
                                    ];
                                
                                return features.slice(0, 4).map((feature, idx) => (
                                    <div key={idx} className="membership-feature-item" style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginBottom: '10px',
                                        fontSize: '14px',
                                        fontFamily: 'inherit',
                                        padding: '6px 0'
                                    }}>
                                        <span style={{
                                            display: 'inline-block',
                                            width: '18px',
                                            height: '18px',
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                            color: 'white',
                                            textAlign: 'center',
                                            lineHeight: '18px',
                                            fontSize: '11px',
                                            marginRight: '12px',
                                            flexShrink: 0,
                                            fontFamily: 'inherit',
                                            fontWeight: 'bold',
                                            boxShadow: '0 2px 6px rgba(34, 197, 94, 0.25)'
                                        }}>
                                            ✓
                                        </span>
                                        <span style={{
                                            color: '#374151',
                                            lineHeight: 1.6,
                                            fontFamily: 'inherit',
                                            fontWeight: 500
                                        }}>
                                            {feature}
                                        </span>
                                    </div>
                                ));
                            })()}
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

    // Enhanced PayOS payment handling
    const handlePayOSPayment = async (plan) => {
        try {
            console.log('💳 Starting PayOS payment for plan:', plan);
            setPayosLoading(true);
            
            const response = await axiosInstance.post('/payments/payos/create', {
                planId: plan.PlanID,
                amount: plan.Price,
                description: `Thanh toán gói ${plan.Name}`
            });

            if (response.data.success) {
                console.log('✅ PayOS payment created successfully:', response.data.data);
                
                // Store payment data for QR display
                setPayosPaymentData(response.data.data.paymentLink);
                
                // Show success message
                notification.success({
                    message: '🎉 Tạo thanh toán PayOS thành công!',
                    description: 'Hãy quét mã QR để thanh toán hoặc nhấn nút "Thanh toán PayOS" để chuyển đến trang thanh toán.',
                    duration: 5
                });

                // Auto redirect to PayOS after 3 seconds (optional)
                setTimeout(() => {
                    if (response.data.data.checkoutUrl) {
                        window.open(response.data.data.checkoutUrl, '_blank');
                    }
                }, 3000);
                
            } else {
                throw new Error(response.data.message || 'Không thể tạo thanh toán PayOS');
            }
        } catch (error) {
            console.error('❌ PayOS payment error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Lỗi không xác định';
            notification.error({
                message: '❌ Lỗi thanh toán PayOS',
                description: errorMessage,
                duration: 5
            });
        } finally {
            setPayosLoading(false);
        }
    };

    // Enhanced PayOS payment processing in modal
    const processPayOSPayment = async () => {
        if (!selectedPlan) {
            notification.error({
                message: 'Lỗi',
                description: 'Vui lòng chọn gói dịch vụ'
            });
            return;
        }

        try {
            setPayosLoading(true);
            console.log('🚀 Processing PayOS payment for plan:', selectedPlan);

            const response = await axiosInstance.post('/payments/payos/create', {
                planId: selectedPlan.PlanID,
                amount: selectedPlan.Price,
                description: `Thanh toán gói ${selectedPlan.Name}`
            });

            if (response.data.success) {
                console.log('✅ PayOS payment link created:', response.data.data);
                
                // Store the complete payment data
                setPayosPaymentData(response.data.data.paymentLink);
                
                // Show success notification
                notification.success({
                    message: '🎉 PayOS Payment Created!',
                    description: 'Quét mã QR bên dưới hoặc nhấn nút để chuyển đến trang thanh toán PayOS',
                    duration: 6
                });

                // Force re-render to show QR code
                setCurrentStep(2); 
                
            } else {
                throw new Error(response.data.message || 'Failed to create PayOS payment');
            }
        } catch (error) {
            console.error('❌ PayOS payment processing error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
            notification.error({
                message: '❌ PayOS Payment Failed',
                description: errorMessage,
                duration: 5
            });
        } finally {
            setPayosLoading(false);
        }
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
            // Handle PayOS payment method
            if (paymentMethod === 'PayOS') {
                console.log('💳 PayOS payment method selected - processing...');
                processPayOSPayment();
                return;
            }

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
                notification.info({
                    message: 'Đang xử lý thanh toán',
                    description: 'Bạn đã có một thanh toán đang được xử lý. Vui lòng chờ trong giây lát.',
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

    const proceedWithPayment = async () => {
        try {
            // Set to confirmation step
            setCurrentStep(2);

            const userId = user?.id || user?.UserID;
            console.log('🚀 Proceeding with payment for plan:', selectedPlan.PlanID, 'user:', userId);

            // Clear any previous success state to prevent notification loops
            dispatch(clearSuccess());

            // Check if PayOS payment method is selected
            if (paymentMethod === 'PayOS') {
                try {
                    console.log('💳 Creating PayOS payment...');
                    const response = await axiosInstance.post('/payments/payos/create', {
                        planId: selectedPlan.PlanID,
                        amount: selectedPlan.Price,
                        description: `Thanh toán gói ${selectedPlan.Name}`
                    });

                    if (response.data.success) {
                        // Close modal and redirect to PayOS checkout
                        setPaymentModalVisible(false);
                        setCurrentStep(0);
                        
                        toast.success('Đang chuyển hướng đến trang thanh toán PayOS...');
                        
                        // Redirect to PayOS checkout
                        window.location.href = response.data.data.checkoutUrl;
                        return;
                    } else {
                        throw new Error('Không thể tạo link thanh toán PayOS');
                    }
                } catch (error) {
                    console.error('❌ PayOS payment error:', error);
                    setCurrentStep(1);
                    
                    notification.error({
                        message: '❌ Lỗi thanh toán PayOS',
                        description: error.message || 'Không thể tạo thanh toán PayOS. Vui lòng thử lại.',
                        duration: 5
                    });
                    return;
                }
            }

            // For other payment methods (BankTransfer, Cash)
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
                    const notificationMessage = paymentMethod === 'PayOS' ? 
                        'Đơn hàng PayOS đã được tạo và sẽ được kích hoạt tự động khi thanh toán thành công!' :
                        'Đơn hàng của bạn đã được tạo và đang chờ admin xác nhận thanh toán. Khi thanh toán được xác nhận, tất cả tiến trình cũ sẽ được reset để bạn bắt đầu fresh với gói mới!';
                    
                    notification.success({
                        message: '🎉 Đơn hàng đã được tạo thành công!',
                        description: notificationMessage,
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

            // Validate cancellation reason
            if (!cancellationReason.trim()) {
                notification.error({
                    message: 'Lỗi',
                    description: 'Vui lòng nhập lí do hủy gói dịch vụ'
                });
                return;
            }

            if (cancellationReason.trim().length < 10) {
                notification.error({
                    message: 'Lỗi',
                    description: 'Lí do hủy gói phải có ít nhất 10 ký tự'
                });
                return;
            }

            // Validate bank information
            if (!bankInfo.accountHolderName.trim()) {
                notification.error({
                    message: 'Lỗi',
                    description: 'Vui lòng nhập tên chủ tài khoản'
                });
                return;
            }

            if (!bankInfo.bankAccountNumber.trim()) {
                notification.error({
                    message: 'Lỗi',
                    description: 'Vui lòng nhập số tài khoản ngân hàng'
                });
                return;
            }

            if (bankInfo.bankAccountNumber.trim().length < 8) {
                notification.error({
                    message: 'Lỗi',
                    description: 'Số tài khoản ngân hàng phải có ít nhất 8 chữ số'
                });
                return;
            }

            if (!bankInfo.bankName.trim()) {
                notification.error({
                    message: 'Lỗi',
                    description: 'Vui lòng chọn ngân hàng'
                });
                return;
            }

            // Prepare the cancellation request with bank info
            const cancellationData = {
                reason: cancellationReason.trim(),
                accountHolderName: bankInfo.accountHolderName.trim(),
                bankAccountNumber: bankInfo.bankAccountNumber.trim(),
                bankName: bankInfo.bankName.trim()
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
                description: result.message || 'Yêu cầu hủy gói dịch vụ đã được gửi. Admin sẽ xem xét và xử lý.',
                duration: 6
            });

            // Close modal and reset form
            setCancelModalVisible(false);
            setCancellationReason('');
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

    // Khi chọn phương thức thanh toán PayOS
    useEffect(() => {
        // Create the payment link for the embedded form when modal is open and plan is selected
        if (selectedPlan && paymentModalVisible) {
            console.log('🔄 Creating PayOS payment link for embedded form...');
            setPayosLoading(true);
            exit(); // Close any existing instance

            axiosInstance.post('/payments/payos/create', {
                planId: selectedPlan.PlanID,
                amount: selectedPlan.Price,
                description: `Thanh toán gói ${selectedPlan.Name}`
            })
            .then(res => {
                if (res.data.success && res.data.data.checkoutUrl) {
                    console.log('✅ PayOS payment link created:', res.data.data.checkoutUrl);
                    setPayOSConfig(prevConfig => ({
                        ...prevConfig,
                        CHECKOUT_URL: res.data.data.checkoutUrl
                    }));
                } else {
                    console.error('❌ PayOS payment creation failed:', res.data.message);
                    notification.error({
                        message: 'Lỗi PayOS',
                        description: res.data.message || 'Không thể tạo thanh toán PayOS'
                    });
                }
            })
            .catch(error => {
                console.error('❌ PayOS payment creation error:', error);
                notification.error({
                    message: 'Lỗi PayOS',
                    description: error.response?.data?.message || 'Không thể kết nối PayOS'
                });
            })
            .finally(() => {
                setPayosLoading(false);
            });
        } else {
            // If modal is closed, clean up
            exit();
            setPayOSConfig(prev => ({ ...prev, CHECKOUT_URL: null }));
        }
    }, [selectedPlan, paymentModalVisible]);

    // Don't show API errors in demo mode
    useEffect(() => {
        const originalError = console.error;
        console.error = (...args) => {
            if (!useSampleData) {
                originalError(...args);
            }
        };
        return () => {
            console.error = originalError;
        };
    }, [useSampleData]);

    // Effect to inject CSS for PayOS QR styling
    useEffect(() => {
        // Inject CSS to remove padding and make QR code fill container
        const style = document.createElement('style');
        style.textContent = `
            #payos-embedded iframe {
                border: none !important;
                padding: 0 !important;
                margin: 0 !important;
                width: 100% !important;
                height: 100% !important;
            }
            
            /* Remove default PayOS padding */
            #payos-embedded .payos-checkout-container {
                padding: 0 !important;
                margin: 0 !important;
            }
            
            /* Make QR code fill container */
            #payos-embedded .qr-container,
            #payos-embedded .qr-code-wrapper,
            #payos-embedded .qr-code {
                width: 100% !important;
                height: 100% !important;
                padding: 0 !important;
                margin: 0 !important;
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
            }
            
            #payos-embedded img[alt*="QR"],
            #payos-embedded canvas {
                max-width: 100% !important;
                max-height: 100% !important;
                width: auto !important;
                height: auto !important;
                object-fit: contain !important;
            }
        `;
        document.head.appendChild(style);
        
        return () => {
            document.head.removeChild(style);
        };
    }, []);

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

                            {/* Conditional Button with Same Logic as Table */}
                            {(() => {
                                // Apply same logic as table for determining button state
                                const isCurrent = currentMembership && 
                                    (currentMembership.PlanName === plan.Name || 
                                     currentMembership.PlanID === plan.PlanID);
                                
                                const isCurrentActive = currentMembership && 
                                    currentMembership.Status === 'active' && 
                                    isCurrent;

                                // Check for active payments for this plan
                                const activePayments = paymentHistory ? paymentHistory.filter(p => {
                                    const planMatches = p.PlanName === plan.Name || 
                                                       p.PlanID === plan.PlanID ||
                                                       (p.PlanName && plan.Name && 
                                                        p.PlanName.toLowerCase().includes(plan.Name.toLowerCase()));
                                    
                                    const isActivePayment = (p.PaymentStatus === 'pending' || p.Status === 'pending' ||
                                                           p.PaymentStatus === 'confirmed' || p.Status === 'confirmed') &&
                                                          p.PaymentStatus !== 'cancelled' && p.Status !== 'cancelled' &&
                                                          p.PaymentStatus !== 'rejected' && p.Status !== 'rejected';
                                    
                                    return planMatches && isActivePayment;
                                }) : [];

                                const hasActivePendingPayment = activePayments && activePayments.some(p =>
                                    (p.PaymentStatus === 'pending' || p.Status === 'pending') &&
                                    p.PaymentStatus !== 'rejected' && p.Status !== 'rejected'
                                );

                                const hasActiveConfirmedPayment = activePayments && activePayments.some(p =>
                                    (p.PaymentStatus === 'confirmed' || p.Status === 'confirmed')
                                );

                                // Check if user has ANY active membership (not just for this plan)
                                const hasAnyActiveMembership = paymentHistory && paymentHistory.some(p => 
                                    (p.PaymentStatus === 'confirmed' || p.Status === 'confirmed') &&
                                    p.PaymentStatus !== 'cancelled' && p.Status !== 'cancelled' &&
                                    p.PaymentStatus !== 'rejected' && p.Status !== 'rejected' &&
                                    p.MembershipStatus !== 'cancelled' && p.MembershipStatus !== 'pending_cancellation'
                                );

                                const isPurchasable = user &&
                                    !hasActivePendingPayment &&
                                    !hasAnyActiveMembership &&  // Don't allow purchasing if user has ANY active membership
                                    plan.Price > 0 &&
                                    !isCurrentActive;

                                const isGuestPlan = plan.Price === 0;

                                if (hasActivePendingPayment) {
                                    return (
                                        <Button
                                            type="primary"
                                            size="large"
                                            block
                                            disabled={true}
                                            style={{
                                                height: '44px',
                                                borderRadius: '10px',
                                                fontWeight: 600,
                                                fontSize: '14px',
                                                background: '#d1d5db',
                                                border: 'none',
                                                color: 'white'
                                            }}
                                        >
                                            Đang chờ thanh toán
                                        </Button>
                                    );
                                }

                                if (isPurchasable && !isGuestPlan) {
                                    return (
                                        <>
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
                                                    color: 'white',
                                                    marginBottom: '8px'
                                                }}
                                            >
                                                Mua gói
                                            </Button>
                                            
                                            <Button
                                                type="default"
                                                size="large"
                                                block
                                                onClick={() => handlePayOSPayment(plan)}
                                                disabled={loading}
                                                style={{
                                                    height: '40px',
                                                    borderRadius: '8px',
                                                    fontWeight: 500,
                                                    fontSize: '13px',
                                                    border: '1px solid #22c55e',
                                                    color: '#22c55e'
                                                }}
                                            >
                                                <i className="fas fa-credit-card me-2"></i>
                                                Thanh toán PayOS
                                            </Button>
                                        </>
                                    );
                                } else {
                                    return (
                                        <Button
                                            type="primary"
                                            size="large"
                                            block
                                            disabled={true}
                                            style={{
                                                height: '44px',
                                                borderRadius: '10px',
                                                fontWeight: 600,
                                                fontSize: '14px',
                                                background: '#d1d5db',
                                                border: 'none',
                                                color: 'white'
                                            }}
                                        >
                                            {(isCurrent && hasActiveConfirmedPayment) || isCurrentActive ? 'Gói hiện tại' :
                                                isGuestPlan ? 'Miễn phí' : 'Không khả dụng'}
                                        </Button>
                                    );
                                }
                            })()}
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

                        {/* PayOS Payment Method - Only Option */}
                        <Card
                            style={{
                                marginBottom: '24px',
                                borderRadius: '12px',
                                border: '2px solid #10b981',
                                background: 'linear-gradient(135deg, #f0fdf9 0%, #ecfdf5 100%)'
                            }}
                            bodyStyle={{ padding: '20px' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
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
                                    ⚡
                                </div>
                                <div>
                                    <Title level={4} style={{ margin: 0, color: '#065f46' }}>
                                        PayOS - Thanh toán online
                                    </Title>
                                    <div style={{ color: '#047857', fontSize: '14px', marginTop: '4px' }}>
                                        Phương thức thanh toán duy nhất - An toàn & Nhanh chóng
                                    </div>
                                </div>
                                <div style={{
                                    marginLeft: 'auto',
                                    background: '#10b981',
                                    color: 'white',
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: 600
                                }}>
                                    ✓ ĐƯỢC CHỌN
                                </div>
                            </div>
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

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'start' }}>
                                {/* Payment form container */}
                                <div style={{ textAlign: 'center', width: '100%' }}>
                                    <div style={{ 
                                        width: '100%',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        backgroundColor: '#ffffff',
                                        position: 'relative'
                                    }}>
                                        {payosLoading && (
                                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                                                <Spin size="large" />
                                                <p style={{ marginTop: '20px' }}>Đang chuẩn bị thanh toán...</p>
                                            </div>
                                        )}
                                        <div 
                                            id="payos-embedded" 
                                            style={{ 
                                                height: '400px', 
                                                display: payosLoading ? 'none' : 'block',
                                                width: '100%',
                                                border: 'none',
                                                padding: '0',
                                                margin: '0',
                                                overflow: 'hidden'
                                            }}
                                        ></div>
                                        <style dangerouslySetInnerHTML={{
                                            __html: `
                                                #payos-embedded iframe {
                                                    border: none !important;
                                                    padding: 0 !important;
                                                    margin: 0 !important;
                                                    width: 100% !important;
                                                    height: 100% !important;
                                                }
                                                
                                                #payos-embedded .payos-checkout-container {
                                                    padding: 0 !important;
                                                    margin: 0 !important;
                                                }
                                                
                                                #payos-embedded .qr-container,
                                                #payos-embedded .qr-code-wrapper,
                                                #payos-embedded .qr-code {
                                                    width: 100% !important;
                                                    height: 100% !important;
                                                    padding: 0 !important;
                                                    margin: 0 !important;
                                                    display: flex !important;
                                                    justify-content: center !important;
                                                    align-items: center !important;
                                                }
                                                
                                                #payos-embedded img[alt*="QR"],
                                                #payos-embedded canvas {
                                                    max-width: calc(100% - 20px) !important;
                                                    max-height: calc(100% - 20px) !important;
                                                    width: auto !important;
                                                    height: auto !important;
                                                    object-fit: contain !important;
                                                }
                                            `
                                        }} />
                                    </div>
                                </div>

                                {/* Instructions Section */}
                                <div>
                                    <div style={{ 
                                        background: 'linear-gradient(135deg, #f0fdf9 0%, #ecfdf5 100%)',
                                        borderRadius: '12px',
                                        padding: '24px',
                                        border: '1px solid #10b981'
                                    }}>
                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            marginBottom: '20px'
                                        }}>
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
                                                ⚡
                                            </div>
                                            <div>
                                                <div style={{
                                                    fontSize: '18px',
                                                    fontWeight: 700,
                                                    color: '#065f46',
                                                    marginBottom: '4px'
                                                }}>
                                                    PayOS - Thanh toán tức thì
                                                </div>
                                                <div style={{ fontSize: '14px', color: '#047857' }}>
                                                    Kích hoạt tự động sau khi thanh toán thành công
                                                </div>
                                            </div>
                                        </div>

                                        <div className="payos-steps">
                                            {[
                                                {
                                                    icon: '📱',
                                                    title: 'Quét mã QR hoặc nhấn nút PayOS',
                                                    desc: 'Sử dụng app ngân hàng để quét mã QR hoặc nhấn nút "Thanh toán PayOS"'
                                                },
                                                {
                                                    icon: '💳',
                                                    title: 'Thanh toán trực tuyến',
                                                    desc: 'Thực hiện thanh toán an toàn qua PayOS gateway'
                                                },
                                                {
                                                    icon: '🎉',
                                                    title: 'Kích hoạt tức thì',
                                                    desc: 'Gói dịch vụ được kích hoạt ngay lập tức, không cần chờ admin'
                                                }
                                            ].map((step, index) => (
                                                <div key={index} style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    marginBottom: '16px',
                                                    padding: '16px',
                                                    background: 'rgba(255, 255, 255, 0.7)',
                                                    borderRadius: '12px',
                                                    border: '1px solid rgba(16, 185, 129, 0.2)'
                                                }}>
                                                    <div style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '50%',
                                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '18px',
                                                        marginRight: '16px',
                                                        color: 'white'
                                                    }}>
                                                        {step.icon}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: '#065f46', marginBottom: '4px' }}>
                                                            {step.title}
                                                        </div>
                                                        <div style={{ fontSize: '14px', color: '#047857' }}>
                                                            {step.desc}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div style={{
                                            background: 'rgba(16, 185, 129, 0.1)',
                                            borderRadius: '8px',
                                            padding: '16px',
                                            marginTop: '16px',
                                            border: '1px solid rgba(16, 185, 129, 0.3)'
                                        }}>
                                            <div style={{ 
                                                fontSize: '14px', 
                                                color: '#065f46', 
                                                fontWeight: 600,
                                                textAlign: 'center'
                                            }}>
                                                ✨ Ưu điểm PayOS: Thanh toán nhanh • Kích hoạt tức thì • An toàn bảo mật
                                            </div>
                                        </div>
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
                onCancel={() => {
                    setCancelModalVisible(false);
                    setCancellationReason('');
                    setBankInfo({
                        bankAccountNumber: '',
                        bankName: '',
                        accountHolderName: ''
                    });
                }}
                footer={[
                    <Button key="back" onClick={() => {
                        setCancelModalVisible(false);
                        setCancellationReason('');
                        setBankInfo({
                            bankAccountNumber: '',
                            bankName: '',
                            accountHolderName: ''
                        });
                    }}>
                        Không, giữ gói thành viên
                    </Button>,
                    <Button key="submit" type="primary" danger onClick={handleCancelMembership}>
                        Có, gửi yêu cầu hủy gói
                    </Button>,
                ]}
                width={600}
            >
                <Alert
                    message="Cảnh báo"
                    description={
                        <div>
                            <p>Bạn có chắc chắn muốn gửi yêu cầu hủy gói thành viên không?</p>
                            <p><strong>Quan trọng:</strong> Yêu cầu sẽ được gửi đến admin để xem xét.</p>
                            <p>Admin sẽ xác nhận hủy gói và bạn có thể đặt mua gói dịch vụ mới sau đó.</p>
                            <p style={{ color: '#1890ff', fontWeight: 'bold' }}>
                                ℹ️ Lưu ý: Vui lòng nhập lí do chi tiết để admin hiểu rõ tình况 của bạn.
                            </p>
                        </div>
                    }
                    type="info"
                    showIcon
                    style={{ marginBottom: '20px' }}
                />

                <Divider>Thông tin hoàn tiền</Divider>

                <div style={{ marginBottom: '16px' }}>
                    <Text strong>Tên chủ tài khoản *</Text>
                    <Input
                        placeholder="Nhập tên chủ tài khoản (theo đúng tên trên ngân hàng)"
                        value={bankInfo.accountHolderName}
                        onChange={(e) => setBankInfo({ ...bankInfo, accountHolderName: e.target.value })}
                        style={{ marginTop: '8px' }}
                    />
                </div>

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
                    <Text strong>Ngân hàng *</Text>
                    <Select
                        placeholder="Chọn ngân hàng"
                        value={bankInfo.bankName}
                        onChange={(value) => setBankInfo({ ...bankInfo, bankName: value })}
                        style={{ width: '100%', marginTop: '8px' }}
                        showSearch
                        filterOption={(input, option) =>
                            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                        }
                    >
                        {VIETNAM_BANKS.map((bank) => (
                            <Select.Option key={bank.name} value={bank.name}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '16px' }}>{bank.icon}</span>
                                    <span>{bank.name}</span>
                                    <span style={{ color: '#666', fontSize: '12px' }}>
                                        - {bank.fullName}
                                    </span>
                                </div>
                            </Select.Option>
                        ))}
                    </Select>
                </div>

                <Divider>Lí do hủy gói dịch vụ</Divider>

                <div style={{ marginBottom: '16px' }}>
                    <Text strong>Lí do muốn hủy gói dịch vụ *</Text>
                    <Input.TextArea
                        placeholder="Vui lòng cho biết lí do bạn muốn hủy gói dịch vụ (ít nhất 10 ký tự)..."
                        value={cancellationReason}
                        onChange={(e) => setCancellationReason(e.target.value)}
                        rows={3}
                        maxLength={500}
                        showCount
                        style={{ marginTop: '8px' }}
                    />
                </div>

                <Alert
                    message="Thông tin quan trọng"
                    description={
                        <div>
                            <p>• Yêu cầu hủy gói sẽ được gửi đến admin để xem xét</p>
                            <p>• Admin sẽ liên hệ với bạn để xác nhận và xử lý</p>
                            <p>• Sau khi admin xác nhận, bạn có thể đặt mua gói dịch vụ mới</p>
                            <p>• Vui lòng cung cấp lí do chi tiết để admin hiểu rõ tình huống</p>
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