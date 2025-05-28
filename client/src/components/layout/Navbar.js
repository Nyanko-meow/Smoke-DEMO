import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Layout, Menu, Button, Avatar, Dropdown, Space, Drawer } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined, DashboardOutlined, HomeOutlined, BookOutlined, TeamOutlined, MenuOutlined, FormOutlined, BulbOutlined, TrophyOutlined, CommentOutlined, MessageOutlined, CalendarOutlined } from '@ant-design/icons';
import { logout } from '../../store/slices/authSlice';
import MemberChat from '../chat/MemberChat';

const { Header } = Layout;

const Navbar = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useSelector(state => state.auth || {});
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [chatDrawerOpen, setChatDrawerOpen] = useState(false);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/');
    };

    // Format user's full name
    const getUserDisplayName = () => {
        if (!user) return '';
        if (user.firstName && user.lastName) {
            return `${user.firstName} ${user.lastName}`;
        } else if (user.firstName) {
            return user.firstName;
        } else if (user.lastName) {
            return user.lastName;
        } else if (user.email) {
            // If no name is available, use email as fallback
            return user.email.split('@')[0];
        }
        return 'User';
    };

    const userMenuItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: <Link to="/profile">Hồ sơ</Link>,
        },
        {
            key: 'comments',
            icon: <CommentOutlined />,
            label: <Link to="/user/comments">Quản lý bình luận</Link>,
        },
        ...(user?.role === 'admin' ? [{
            key: 'admin',
            icon: <DashboardOutlined />,
            label: <Link to="/admin">Bảng điều khiển Admin</Link>,
        }] : []),
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: <span onClick={handleLogout}>Đăng xuất</span>,
        },
    ];

    // Define navigation items based on user role
    const getNavItems = () => {
        const baseItems = [
            {
                key: 'home',
                icon: <HomeOutlined />,
                label: <Link to="/">Trang chủ</Link>,
            },
            {
                key: 'blog',
                icon: <BookOutlined />,
                label: <Link to="/blog">Blog</Link>,
            },
            {
                key: 'community',
                icon: <TeamOutlined />,
                label: <Link to="/community">Cộng đồng</Link>,
            },
        ];

        // Add role-specific items
        if (isAuthenticated && user) {
            // Common authenticated user items
            const authenticatedItems = [
                ...baseItems,
                {
                    key: 'achievement',
                    icon: <TrophyOutlined />,
                    label: <Link to="/achievement">Thành tích</Link>,
                },
                {
                    key: 'quit-plan',
                    icon: <BulbOutlined />,
                    label: <Link to="/quit-plan">Kế hoạch cai thuốc</Link>,
                },
            ];

            if (user.role === 'guest') {
                // Guest users see basic features
                return [
                    ...authenticatedItems,
                    {
                        key: 'plans',
                        icon: <SettingOutlined />,
                        label: <Link to="/membership">Gói dịch vụ</Link>,
                    },
                ];
            } else if (user.role === 'member') {
                // Members see all features
                return [
                    ...authenticatedItems,
                    {
                        key: 'plans',
                        icon: <SettingOutlined />,
                        label: <Link to="/membership">Gói dịch vụ</Link>,
                    },
                    {
                        key: 'survey',
                        icon: <FormOutlined />,
                        label: <Link to="/smoking-survey">Khảo sát</Link>,
                    },
                ];
            } else if (user.role === 'coach') {
                // Coaches see coaching-related features
                return [
                    ...authenticatedItems,
                    {
                        key: 'dashboard',
                        icon: <DashboardOutlined />,
                        label: <Link to="/coach/dashboard">Bảng điều khiển Coach</Link>,
                    },
                ];
            } else if (user.role === 'admin') {
                // Admins see all features
                return [
                    ...authenticatedItems,
                    {
                        key: 'plans',
                        icon: <SettingOutlined />,
                        label: <Link to="/membership">Gói dịch vụ</Link>,
                    },
                    {
                        key: 'survey',
                        icon: <FormOutlined />,
                        label: <Link to="/smoking-survey">Khảo sát</Link>,
                    },
                ];
            }
        }

        // Default for non-authenticated users
        return [
            ...baseItems,
            {
                key: 'plans',
                icon: <SettingOutlined />,
                label: <Link to="/membership">Gói dịch vụ</Link>,
            },
        ];
    };

    const navItems = getNavItems();

    return (
        <Header className="navbar-header" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px'
        }}>
            {/* Logo */}
            <div className="navbar-logo">
                <Link to="/" className="navbar-brand" style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#fff',
                    textDecoration: 'none',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}>
                    SmokeKing
                </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="navbar-menu-desktop" style={{
                display: 'flex',
                alignItems: 'center',
                flex: 1,
                justifyContent: 'space-between',
                marginLeft: '40px'
            }}>
                <Menu
                    theme="dark"
                    mode="horizontal"
                    items={navItems}
                    className="navbar-menu"
                    selectedKeys={[]}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        flex: 1
                    }}
                />

                {isAuthenticated ? (
                    <Space>
                        {/* Appointment button for members */}
                        {user?.role === 'member' && (
                            <Button
                                type="text"
                                icon={<CalendarOutlined />}
                                onClick={() => navigate('/member/dashboard?tab=appointments')}
                                className="navbar-appointment-btn"
                                style={{ marginRight: '8px' }}
                            >
                                Lịch hẹn
                            </Button>
                        )}

                        {/* Chat button for members */}
                        {user?.role === 'member' && (
                            <Button
                                type="text"
                                icon={<MessageOutlined />}
                                onClick={() => setChatDrawerOpen(true)}
                                style={{
                                    color: '#fff',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    borderRadius: '6px',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                Chat với Coach
                            </Button>
                        )}

                        {/* Appointment button for coaches */}
                        {user?.role === 'coach' && (
                            <Button
                                type="text"
                                icon={<CalendarOutlined />}
                                onClick={() => navigate('/coach/dashboard?tab=appointments')}
                                className="navbar-appointment-btn"
                                style={{ marginRight: '8px' }}
                            >
                                Lịch hẹn
                            </Button>
                        )}

                        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                            <div className="navbar-user" style={{
                                cursor: 'pointer',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                background: 'rgba(255,255,255,0.1)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                transition: 'all 0.3s ease'
                            }}>
                                <Space>
                                    <span className="navbar-username" style={{
                                        color: '#fff',
                                        fontWeight: '500'
                                    }}>
                                        {getUserDisplayName()}
                                    </span>
                                    <Avatar
                                        src={user?.avatar}
                                        icon={!user?.avatar && <UserOutlined />}
                                        alt={getUserDisplayName()}
                                        style={{
                                            background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
                                            border: '2px solid rgba(255,255,255,0.3)'
                                        }}
                                    />
                                </Space>
                            </div>
                        </Dropdown>
                    </Space>
                ) : (
                    <div className="navbar-auth-buttons" style={{ display: 'flex', gap: '8px' }}>
                        <Button
                            type="text"
                            className="navbar-login-btn"
                            style={{
                                color: '#fff',
                                border: '1px solid rgba(255,255,255,0.3)',
                                borderRadius: '6px',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <Link to="/login" style={{ color: 'inherit' }}>Đăng nhập</Link>
                        </Button>
                        <Button
                            type="text"
                            className="navbar-coach-btn"
                            style={{
                                color: '#fff',
                                border: '1px solid rgba(255,255,255,0.3)',
                                borderRadius: '6px',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <Link to="/coach/login" style={{ color: 'inherit' }}>Đăng nhập Coach</Link>
                        </Button>
                        <Button
                            type="primary"
                            className="navbar-register-btn"
                            style={{
                                background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: '500',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <Link to="/register" style={{ color: '#fff' }}>Đăng ký</Link>
                        </Button>
                    </div>
                )}
            </div>

            {/* Mobile menu button */}
            <div className="navbar-mobile-toggle" style={{ display: 'none' }}>
                <Button
                    type="text"
                    icon={<MenuOutlined />}
                    className="mobile-menu-btn"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    style={{ color: '#fff' }}
                />

                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <div className="navbar-mobile-menu" style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'rgba(102, 126, 234, 0.95)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}>
                        <Menu
                            theme="dark"
                            mode="vertical"
                            items={navItems}
                            className="mobile-nav-menu"
                            style={{ background: 'transparent', border: 'none' }}
                        />

                        {isAuthenticated ? (
                            <Menu
                                theme="dark"
                                mode="vertical"
                                items={userMenuItems}
                                className="mobile-user-menu"
                                style={{ background: 'transparent', border: 'none' }}
                            />
                        ) : (
                            <div className="mobile-auth-buttons" style={{ padding: '16px' }}>
                                <Button block type="text" className="mobile-login-btn" style={{ marginBottom: '8px', color: '#fff' }}>
                                    <Link to="/login" style={{ color: 'inherit' }}>Đăng nhập</Link>
                                </Button>
                                <Button block type="text" className="mobile-coach-btn" style={{ marginBottom: '8px', color: '#fff' }}>
                                    <Link to="/coach/login" style={{ color: 'inherit' }}>Đăng nhập Coach</Link>
                                </Button>
                                <Button block type="primary" className="mobile-register-btn" style={{ background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)', border: 'none' }}>
                                    <Link to="/register" style={{ color: '#fff' }}>Đăng ký</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Chat Drawer for Members */}
            <Drawer
                title="Chat với Coach"
                placement="right"
                onClose={() => setChatDrawerOpen(false)}
                open={chatDrawerOpen}
                width={400}
                bodyStyle={{ padding: 0 }}
            >
                {user?.role === 'member' && (
                    <MemberChat height={600} />
                )}
            </Drawer>
        </Header>
    );
};

export default Navbar; 