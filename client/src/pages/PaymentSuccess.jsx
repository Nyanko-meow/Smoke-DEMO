import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Card, Button, Spin, Result } from 'antd';
import { CheckCircleOutlined, HomeOutlined } from '@ant-design/icons';
import { getCurrentUser } from '../store/slices/authSlice';
import { getCurrentMembership } from '../store/slices/membershipSlice';
import axiosInstance from '../utils/axiosConfig';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(true);
    const [paymentInfo, setPaymentInfo] = useState(null);
    const [error, setError] = useState(null);

    const orderCode = searchParams.get('orderCode');

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                console.log('🔍 Verifying PayOS payment success for orderCode:', orderCode);
                
                if (!orderCode) {
                    setError('Không tìm thấy mã đơn hàng');
                    setLoading(false);
                    return;
                }

                // Check payment status via our API
                const response = await axiosInstance.get(`/payment/payos/status/${orderCode}`);
                
                if (response.data.success) {
                    setPaymentInfo(response.data.data);
                    console.log('✅ Payment verified successfully:', response.data.data);
                    
                    // Refresh user data to get updated role and membership
                    await dispatch(getCurrentUser()).unwrap();
                    await dispatch(getCurrentMembership()).unwrap();
                    
                    // Refresh membership data globally if function exists
                    if (window.refreshMembershipData) {
                        setTimeout(() => {
                            window.refreshMembershipData();
                        }, 2000);
                    }
                    
                } else {
                    setError('Không thể xác minh thanh toán');
                }
            } catch (error) {
                console.error('❌ Error verifying payment:', error);
                setError('Lỗi khi xác minh thanh toán: ' + (error.message || 'Unknown error'));
            } finally {
                setLoading(false);
            }
        };

        verifyPayment();
    }, [orderCode, dispatch]);

    const handleGoHome = () => {
        navigate('/');
    };

    const handleGoToMembership = () => {
        navigate('/membership');
    };

    if (loading) {
        return (
            <div style={{ 
                minHeight: '100vh', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
                <Card style={{ 
                    maxWidth: 500, 
                    textAlign: 'center',
                    borderRadius: '16px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                }}>
                    <Spin size="large" />
                    <div style={{ marginTop: '20px', fontSize: '16px' }}>
                        Đang xác minh thanh toán PayOS...
                    </div>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ 
                minHeight: '100vh', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #fc466b 0%, #3f5efb 100%)'
            }}>
                <Card style={{ 
                    maxWidth: 500, 
                    textAlign: 'center',
                    borderRadius: '16px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                }}>
                    <Result
                        status="error"
                        title="Lỗi xác minh thanh toán"
                        subTitle={error}
                        extra={[
                            <Button type="primary" onClick={handleGoHome} key="home">
                                Về trang chủ
                            </Button>,
                            <Button onClick={handleGoToMembership} key="membership">
                                Kiểm tra gói dịch vụ
                            </Button>
                        ]}
                    />
                </Card>
            </div>
        );
    }

    return (
        <div style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            padding: '20px'
        }}>
            <Card style={{ 
                maxWidth: 600, 
                textAlign: 'center',
                borderRadius: '20px',
                boxShadow: '0 30px 60px rgba(0,0,0,0.15)',
                border: 'none',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    margin: '-24px -24px 24px -24px',
                    padding: '40px 24px',
                    color: 'white'
                }}>
                    <CheckCircleOutlined style={{ 
                        fontSize: '64px', 
                        marginBottom: '16px',
                        display: 'block'
                    }} />
                    <h1 style={{ 
                        color: 'white', 
                        margin: 0, 
                        fontSize: '28px',
                        fontWeight: 700 
                    }}>
                        🎉 Thanh toán thành công!
                    </h1>
                    <p style={{ 
                        color: 'rgba(255,255,255,0.9)', 
                        margin: '8px 0 0 0',
                        fontSize: '16px'
                    }}>
                        Gói dịch vụ đã được kích hoạt tự động
                    </p>
                </div>

                {/* Payment Info */}
                {paymentInfo && (
                    <div style={{ marginBottom: '32px', textAlign: 'left' }}>
                        <div style={{ 
                            background: '#f8fafc',
                            borderRadius: '12px',
                            padding: '20px',
                            marginBottom: '20px'
                        }}>
                            <h3 style={{ margin: '0 0 16px 0', color: '#1f2937' }}>
                                📋 Thông tin thanh toán
                            </h3>
                            <div style={{ display: 'grid', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#6b7280' }}>Mã đơn hàng:</span>
                                    <span style={{ fontWeight: 600, color: '#1f2937' }}>{orderCode}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#6b7280' }}>Số tiền:</span>
                                    <span style={{ fontWeight: 600, color: '#10b981' }}>
                                        {paymentInfo.amount?.toLocaleString()} VNĐ
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#6b7280' }}>Trạng thái:</span>
                                    <span style={{ 
                                        fontWeight: 600, 
                                        color: '#10b981',
                                        background: '#dcfce7',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        fontSize: '12px'
                                    }}>
                                        ✅ Đã thanh toán
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#6b7280' }}>Phương thức:</span>
                                    <span style={{ fontWeight: 600, color: '#1f2937' }}>PayOS</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ 
                            background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                            borderRadius: '12px',
                            padding: '20px',
                            border: '1px solid #86efac'
                        }}>
                            <h4 style={{ margin: '0 0 12px 0', color: '#065f46' }}>
                                🚀 Gói dịch vụ đã sẵn sàng!
                            </h4>
                            <p style={{ margin: 0, color: '#047857', fontSize: '14px', lineHeight: 1.6 }}>
                                Gói dịch vụ của bạn đã được kích hoạt tự động. Bạn có thể bắt đầu sử dụng 
                                tất cả tính năng premium ngay bây giờ!
                            </p>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                }}>
                    <Button 
                        type="primary" 
                        size="large"
                        onClick={handleGoHome}
                        icon={<HomeOutlined />}
                        style={{
                            borderRadius: '10px',
                            height: '48px',
                            minWidth: '140px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                            fontWeight: 600
                        }}
                    >
                        Về trang chủ
                    </Button>
                    <Button 
                        size="large"
                        onClick={handleGoToMembership}
                        style={{
                            borderRadius: '10px',
                            height: '48px',
                            minWidth: '140px',
                            fontWeight: 600
                        }}
                    >
                        Xem gói dịch vụ
                    </Button>
                </div>

                {/* Auto redirect notice */}
                <div style={{ 
                    marginTop: '24px', 
                    fontSize: '12px', 
                    color: '#6b7280' 
                }}>
                    Trang sẽ tự động chuyển về trang chủ sau 10 giây...
                </div>
            </Card>
        </div>
    );
};

// Auto redirect after 10 seconds
setTimeout(() => {
    if (window.location.pathname === '/payment/success') {
        window.location.href = '/';
    }
}, 10000);

export default PaymentSuccess; 