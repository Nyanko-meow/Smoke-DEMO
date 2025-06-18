import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../../store/slices/authSlice';

const Login = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { loading, error } = useSelector((state) => state.auth);
    const [showPassword, setShowPassword] = useState(false);

    // Check for URL parameters
    const queryParams = new URLSearchParams(location.search);
    const sessionExpired = queryParams.get('session') === 'expired';
    const activationRequired = queryParams.get('activation') === 'required';

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    });

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({
            ...formData,
            [e.target.name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Submitting login form:', { ...formData, password: '***' });

        try {
            const resultAction = await dispatch(login(formData));
            console.log('Login result action:', resultAction);

            if (login.fulfilled.match(resultAction)) {
                // Login successful - navigate to requested page or home
                const { from } = location.state || { from: { pathname: '/' } };
                navigate(from.pathname);
            } else if (login.rejected.match(resultAction)) {
                // Login failed, error is already set in the redux state
                console.error('Login failed:', resultAction.payload);
            }
        } catch (err) {
            console.error('Login error:', err);
        }
    };

    // Clear URL parameters after component mounts
    useEffect(() => {
        if (sessionExpired || activationRequired) {
            window.history.replaceState({}, document.title, '/login');
        }
    }, [sessionExpired, activationRequired]);

    return (
        <div className="login-page-wrapper">
            <div className="login-card-wrapper">
                <div className="login-card">
                    {/* Header Section */}
                    <div className="login-header">
                        <div className="login-logo">
                            <span>🚭</span>
                        </div>
                        <h1 className="login-title">
                            SmokeKing
                        </h1>
                        <p className="login-subtitle">
                            Chào mừng trở lại! Đăng nhập để tiếp tục hành trình cai thuốc lá
                        </p>
                    </div>

                    {/* Alert Messages */}
                    {error && (
                        <div className="login-alert login-alert-error">
                            {error}
                        </div>
                    )}

                    {sessionExpired && (
                        <div className="login-alert login-alert-warning">
                            Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.
                        </div>
                    )}

                    {activationRequired && (
                        <div className="login-alert login-alert-info">
                            Tài khoản cần được kích hoạt. Vui lòng kiểm tra email để nhận hướng dẫn kích hoạt.
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="login-form-group">
                            <label className="login-form-label">
                                Email
                            </label>
                            <div className="login-input-wrapper">
                                <span className="login-input-icon">
                                    👤
                                </span>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="Nhập email của bạn"
                                    className="login-input"
                                />
                            </div>
                        </div>

                        <div className="login-form-group">
                            <label className="login-form-label">
                                Mật khẩu
                            </label>
                            <div className="login-input-wrapper">
                                <span className="login-input-icon">
                                    🔒
                                </span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="Nhập mật khẩu của bạn"
                                    className="login-input"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="login-password-toggle"
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        <div className="login-checkbox-wrapper">
                            <input
                                type="checkbox"
                                name="rememberMe"
                                checked={formData.rememberMe}
                                onChange={handleChange}
                                className="login-checkbox"
                            />
                            <label className="login-checkbox-label">
                                Ghi nhớ đăng nhập
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="login-submit-btn"
                        >
                            {loading ? '🔄 Đang đăng nhập...' : '🚀 Đăng nhập'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="login-divider">
                        <span>Hoặc đăng nhập với vai trò khác</span>
                    </div>

                    {/* Role-based Login Links */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                        <Link
                            to="/coach/login"
                            className="login-link"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '48px',
                                border: '2px solid #667eea',
                                borderRadius: '12px',
                                color: '#667eea',
                                textDecoration: 'none',
                                fontWeight: '500',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            👑 Coach
                        </Link>
                        <Link
                            to="/admin/login"
                            className="login-link"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '48px',
                                border: '2px solid #ff6b6b',
                                borderRadius: '12px',
                                color: '#ff6b6b',
                                textDecoration: 'none',
                                fontWeight: '500',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            🛡️ Admin
                        </Link>
                    </div>

                    {/* Footer Text */}
                    <div className="login-links">
                        <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                            Chưa có tài khoản?{' '}
                            <Link
                                to="/register"
                                className="login-link"
                            >
                                Đăng ký ngay
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login; 