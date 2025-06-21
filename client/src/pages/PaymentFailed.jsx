import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, Button, Result } from 'antd';
import { CloseCircleOutlined, HomeOutlined, ReloadOutlined } from '@ant-design/icons';

const PaymentFailed = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [orderCode, setOrderCode] = useState(null);

    useEffect(() => {
        const code = searchParams.get('orderCode');
        setOrderCode(code);
        console.log('❌ Payment failed for orderCode:', code);
    }, [searchParams]);

    const handleGoHome = () => {
        navigate('/');
    };

    const handleRetryPayment = () => {
        navigate('/membership');
    };

    const handleContactSupport = () => {
        // You can customize this to your support system
        window.open('mailto:support@yourapp.com?subject=Payment Failed&body=Order Code: ' + orderCode);
    };

    return (
        <div style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #fc466b 0%, #3f5efb 100%)',
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
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    margin: '-24px -24px 24px -24px',
                    padding: '40px 24px',
                    color: 'white'
                }}>
                    <CloseCircleOutlined style={{ 
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
                        ❌ Thanh toán thất bại
                    </h1>
                    <p style={{ 
                        color: 'rgba(255,255,255,0.9)', 
                        margin: '8px 0 0 0',
                        fontSize: '16px'
                    }}>
                        Giao dịch PayOS không thành công
                    </p>
                </div>

                {/* Error Info */}
                <div style={{ marginBottom: '32px' }}>
                    {orderCode && (
                        <div style={{ 
                            background: '#fef2f2',
                            borderRadius: '12px',
                            padding: '20px',
                            marginBottom: '20px',
                            border: '1px solid #fca5a5'
                        }}>
                            <h3 style={{ margin: '0 0 12px 0', color: '#dc2626' }}>
                                📋 Thông tin giao dịch
                            </h3>
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span style={{ color: '#6b7280' }}>Mã đơn hàng:</span>
                                <span style={{ 
                                    fontWeight: 600, 
                                    color: '#dc2626',
                                    fontFamily: 'monospace' 
                                }}>
                                    {orderCode}
                                </span>
                            </div>
                        </div>
                    )}

                    <div style={{ 
                        background: '#fffbeb',
                        borderRadius: '12px',
                        padding: '20px',
                        border: '1px solid #fbbf24'
                    }}>
                        <h4 style={{ margin: '0 0 12px 0', color: '#d97706' }}>
                            💡 Có thể xảy ra các trường hợp sau:
                        </h4>
                        <ul style={{ 
                            margin: 0, 
                            color: '#a16207', 
                            fontSize: '14px', 
                            lineHeight: 1.6,
                            textAlign: 'left',
                            paddingLeft: '20px'
                        }}>
                            <li>Hủy giao dịch trong quá trình thanh toán</li>
                            <li>Hết thời gian thanh toán (session timeout)</li>
                            <li>Số dư tài khoản không đủ</li>
                            <li>Lỗi kết nối mạng trong quá trình thanh toán</li>
                            <li>Thông tin thẻ không chính xác</li>
                        </ul>
                    </div>
                </div>

                {/* Action Buttons */}
                <div style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                    marginBottom: '20px'
                }}>
                    <Button 
                        type="primary" 
                        size="large"
                        onClick={handleRetryPayment}
                        icon={<ReloadOutlined />}
                        style={{
                            borderRadius: '10px',
                            height: '48px',
                            minWidth: '140px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            border: 'none',
                            fontWeight: 600
                        }}
                    >
                        Thử lại
                    </Button>
                    <Button 
                        size="large"
                        onClick={handleGoHome}
                        icon={<HomeOutlined />}
                        style={{
                            borderRadius: '10px',
                            height: '48px',
                            minWidth: '140px',
                            fontWeight: 600
                        }}
                    >
                        Về trang chủ
                    </Button>
                </div>

                {/* Support Section */}
                <div style={{ 
                    background: '#f8fafc',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid #e2e8f0'
                }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#374151', fontSize: '14px' }}>
                        🆘 Cần hỗ trợ?
                    </h4>
                    <p style={{ 
                        margin: '0 0 12px 0', 
                        color: '#6b7280', 
                        fontSize: '13px',
                        lineHeight: 1.5
                    }}>
                        Nếu bạn gặp khó khăn trong quá trình thanh toán, hãy liên hệ với đội ngũ hỗ trợ của chúng tôi.
                    </p>
                    <Button 
                        size="small"
                        onClick={handleContactSupport}
                        style={{
                            borderRadius: '6px',
                            fontSize: '12px'
                        }}
                    >
                        📧 Liên hệ hỗ trợ
                    </Button>
                </div>

                {/* Auto redirect notice */}
                <div style={{ 
                    marginTop: '20px', 
                    fontSize: '12px', 
                    color: '#6b7280' 
                }}>
                    Trang sẽ tự động chuyển về trang chủ sau 15 giây...
                </div>
            </Card>
        </div>
    );
};

// Auto redirect after 15 seconds
setTimeout(() => {
    if (window.location.pathname === '/payment/failed') {
        window.location.href = '/';
    }
}, 15000);

export default PaymentFailed; 