import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axiosInstance from '../utils/axiosConfig';

export const useMembershipAccess = () => {
    const [hasAccess, setHasAccess] = useState(false);
    const [loading, setLoading] = useState(true);
    const [membershipStatus, setMembershipStatus] = useState(null);
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        const checkAccess = async () => {
            try {
                setLoading(true);

                // If not logged in, no access
                if (!user) {
                    setHasAccess(false);
                    setMembershipStatus('not_logged_in');
                    setLoading(false);
                    return;
                }

                // Admin and coach should NOT have access to member features
                // They should use their own dashboards
                if (user.role === 'admin' || user.role === 'coach') {
                    setHasAccess(false);
                    setMembershipStatus('wrong_user_type');
                    setLoading(false);
                    return;
                }

                // For regular users, check payment history
                try {
                    const response = await axiosInstance.get('/membership/payment-history');

                    if (response.data && response.data.success) {
                        const paymentHistory = response.data.data || [];

                        // Filter out cancelled and pending_cancellation payments
                        const activePayments = paymentHistory.filter(payment => {
                            if (payment.MembershipStatus === 'cancelled' ||
                                payment.PaymentStatus === 'cancelled' ||
                                payment.Status === 'cancelled' ||
                                payment.MembershipStatus === 'pending_cancellation') {
                                return false;
                            }
                            return true;
                        });

                        // Check if user has any confirmed active membership
                        const hasActiveMembership = activePayments.some(payment => {
                            const isConfirmed = payment.PaymentStatus === 'confirmed' || payment.Status === 'confirmed';

                            if (isConfirmed) {
                                // Check if not expired
                                const endDate = new Date(payment.EndDate);
                                const currentDate = new Date();
                                const isNotExpired = !isNaN(endDate.getTime()) && currentDate <= endDate;

                                console.log('🔍 AccessGuard: Checking confirmed payment:', {
                                    paymentId: payment.PaymentID,
                                    paymentStatus: payment.PaymentStatus,
                                    status: payment.Status,
                                    endDate: payment.EndDate,
                                    isNotExpired,
                                    daysRemaining: isNotExpired ? Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24)) : 0
                                });

                                return isNotExpired;
                            }
                            return false;
                        });

                        // Check for pending payments
                        const pendingPayments = activePayments.filter(payment =>
                            (payment.PaymentStatus === 'pending' || payment.Status === 'pending') &&
                            payment.PaymentStatus !== 'rejected' && payment.Status !== 'rejected'
                        );

                        console.log('🔍 AccessGuard: Payment analysis:', {
                            userRole: user.role,
                            totalPayments: paymentHistory.length,
                            activePayments: activePayments.length,
                            hasActiveMembership,
                            pendingPayments: pendingPayments.length,
                            allPayments: activePayments.map(p => ({
                                id: p.PaymentID,
                                status: p.PaymentStatus || p.Status,
                                membershipStatus: p.MembershipStatus,
                                endDate: p.EndDate
                            }))
                        });

                        if (hasActiveMembership) {
                            console.log('✅ AccessGuard: GRANTING ACCESS - User has confirmed active membership');
                            setHasAccess(true);
                            setMembershipStatus('active_member');
                        } else if (pendingPayments.length > 0) {
                            console.log('⏳ AccessGuard: DENYING ACCESS - User has pending payments waiting for confirmation');
                            setHasAccess(false);
                            setMembershipStatus('pending_payment');
                        } else {
                            console.log('❌ AccessGuard: DENYING ACCESS - User has no active membership');
                            setHasAccess(false);
                            setMembershipStatus('no_active_membership');
                        }
                    } else {
                        setHasAccess(false);
                        setMembershipStatus('no_payment_history');
                    }
                } catch (error) {
                    console.error('Error checking membership access:', error);
                    setHasAccess(false);
                    setMembershipStatus('error_checking');
                }

            } finally {
                setLoading(false);
            }
        };

        checkAccess();
    }, [user]);

    return {
        hasAccess,
        loading,
        membershipStatus,
        user
    };
};

export default useMembershipAccess; 