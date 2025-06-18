import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const [paymentInfo, setPaymentInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const orderCode = searchParams.get('orderCode');

    useEffect(() => {
        if (orderCode) {
            fetchPaymentInfo();
        }
    }, [orderCode]);

    const fetchPaymentInfo = async () => {
        try {
            const response = await axiosInstance.get(`/payment/payos/status/${orderCode}`);
            if (response.data.success) {
                setPaymentInfo(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching payment info:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container text-center mt-5">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card">
                        <div className="card-body text-center">
                            <div className="text-success mb-4">
                                <i className="fas fa-check-circle fa-5x"></i>
                            </div>
                            <h2 className="text-success">Thanh toán thành công!</h2>
                            <p className="text-muted">
                                Cảm ơn bạn đã thanh toán. Đơn hàng của bạn đã được xử lý thành công.
                            </p>
                            
                            {paymentInfo && (
                                <div className="mt-4">
                                    <h5>Thông tin thanh toán:</h5>
                                    <div className="text-start">
                                        <p><strong>Mã đơn hàng:</strong> {paymentInfo.orderCode}</p>
                                        <p><strong>Số tiền:</strong> {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(paymentInfo.amount)}</p>
                                        <p><strong>Trạng thái:</strong> <span className="badge bg-success">{paymentInfo.status}</span></p>
                                    </div>
                                </div>
                            )}
                            
                            <div className="mt-4">
                                <Link to="/membership" className="btn btn-primary me-3">
                                    Quay lại Membership
                                </Link>
                                <Link to="/" className="btn btn-outline-secondary">
                                    Về trang chủ
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccess; 