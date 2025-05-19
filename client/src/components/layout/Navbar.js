import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Layout, Menu, Button, Avatar, Dropdown, Space } from 'antd';
import {
    UserOutlined,
    LogoutOutlined,
    SettingOutlined,
    DashboardOutlined,
    HomeOutlined,
    BookOutlined,
    TeamOutlined,
    MenuOutlined
} from '@ant-design/icons';
import { logout } from '../../store/slices/authSlice';

const { Header } = Layout;

const Navbar = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useSelector(state => state.auth || {});
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            label: <Link to="/profile">Profile</Link>,
        },
        ...(user?.role === 'admin' ? [{
            key: 'admin',
            icon: <DashboardOutlined />,
            label: <Link to="/admin">Admin Dashboard</Link>,
        }] : []),
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: <span onClick={handleLogout}>Logout</span>,
        },
    ];

    const navItems = [
        {
            key: 'home',
            icon: <HomeOutlined />,
            label: <Link to="/">Home</Link>,
        },
        {
            key: 'blog',
            icon: <BookOutlined />,
            label: <Link to="/blog">Blog</Link>,
        },
        {
            key: 'community',
            icon: <TeamOutlined />,
            label: <Link to="/community">Community</Link>,
        },
    ];

    return (
        <Header className="navbar-header">
            {/* Logo */}
            <div className="navbar-logo">
                <Link to="/" className="navbar-brand">
                    SmokeKing
                </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="navbar-menu-desktop">
                <Menu
                    theme="dark"
                    mode="horizontal"
                    items={navItems}
                    className="navbar-menu"
                    selectedKeys={[]}
                />

                {isAuthenticated ? (
                    <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                        <div className="navbar-user">
                            <Space>
                                <span className="navbar-username">{getUserDisplayName()}</span>
                                <Avatar
                                    src={user?.avatar}
                                    icon={!user?.avatar && <UserOutlined />}
                                    alt={getUserDisplayName()}
                                />
                            </Space>
                        </div>
                    </Dropdown>
                ) : (
                    <div className="navbar-auth-buttons">
                        <Button type="text" className="navbar-login-btn">
                            <Link to="/login">Login</Link>
                        </Button>
                        <Button type="primary" className="navbar-register-btn">
                            <Link to="/register">Register</Link>
                        </Button>
                    </div>
                )}
            </div>

            {/* Mobile menu button */}
            <div className="navbar-mobile-toggle">
                <Button
                    type="text"
                    icon={<MenuOutlined />}
                    className="mobile-menu-btn"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                />

                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <div className="navbar-mobile-menu">
                        <Menu
                            theme="dark"
                            mode="vertical"
                            items={navItems}
                            className="mobile-nav-menu"
                        />

                        {isAuthenticated ? (
                            <Menu
                                theme="dark"
                                mode="vertical"
                                items={userMenuItems}
                                className="mobile-user-menu"
                            />
                        ) : (
                            <div className="mobile-auth-buttons">
                                <Button block type="text" className="mobile-login-btn">
                                    <Link to="/login">Login</Link>
                                </Button>
                                <Button block type="primary" className="mobile-register-btn">
                                    <Link to="/register">Register</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Header>
    );
};

export default Navbar; 