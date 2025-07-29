import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Layout,
  Menu,
  Button,
  Avatar,
  Dropdown,
  Space,
  Drawer,
  Modal,
  message,
  Badge,
  List,
} from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  DashboardOutlined,
  HomeOutlined,
  BookOutlined,
  TeamOutlined,
  MenuOutlined,
  FormOutlined,
  BulbOutlined,
  TrophyOutlined,
  CommentOutlined,
  MessageOutlined,
  CalendarOutlined,
  FileTextOutlined,
  CreditCardOutlined,
  BellOutlined,
} from "@ant-design/icons";
import { logout } from "../../store/slices/authSlice";
import MemberChat from "../chat/MemberChat";
import "./Navbar.css"; // Import file CSS

const { Header } = Layout;

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, token } = useSelector(
    (state) => state.auth || {}
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  // notification drawer & counts
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  // ✅ Function to get current active menu key based on pathname
  const getCurrentMenuKey = () => {
    const pathname = location.pathname;
    if (pathname === "/" || pathname === "/home") return "home";
    if (pathname.startsWith("/blog")) return "blog";
    if (pathname.startsWith("/community")) return "community";
    if (pathname.startsWith("/achievement")) return "achievement";
    if (pathname.startsWith("/quit-plan")) return "quit-plan";
    if (pathname.startsWith("/membership")) return "plans";
    if (pathname.startsWith("/smoking-survey")) return "survey";
    if (pathname.startsWith("/coach/dashboard")) return "dashboard";
    if (pathname.startsWith("/admin")) return "admin";
    return "";
  };

  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      // safe to show a notification
      new Notification("Hello!");
    } else if (Notification.permission === "default") {
      // ask the user
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification("Thanks for enabling notifications!");
        }
      });
    } else {
      // permission === 'denied'
      // fallback: show an in-app banner, badge, or drawer instead
      console.warn("Notifications are blocked—showing in-app alerts.");
    }
  }

  // Định nghĩa hàm fetchNotifications ở trên, trong component:
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data);
        setUnreadCount(json.data.filter((n) => !n.IsRead).length);
      }
    } catch (err) {
      console.error("Fetch notifications failed:", err);
    }
  };

  const handleLogout = () => {
    Modal.confirm({
      title: "🚪 Xác nhận đăng xuất",
      content: (
        <div style={{ padding: "12px 0" }}>
          <p style={{ marginBottom: "8px", fontSize: "16px" }}>
            Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?
          </p>
          <p
            style={{
              color: "#666",
              fontSize: "14px",
              marginBottom: "0",
              background: "#f6f8fa",
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #e1e4e8",
            }}
          >
            💡 Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng các tính năng.
          </p>
        </div>
      ),
      icon: <LogoutOutlined style={{ color: "#ff6b6b" }} />,
      okText: "Đăng xuất",
      cancelText: "Hủy",
      okType: "danger",
      okButtonProps: {
        style: {
          background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)",
          border: "none",
          borderRadius: "6px",
          fontWeight: "600",
        },
        icon: <LogoutOutlined />,
      },
      cancelButtonProps: {
        style: {
          borderRadius: "6px",
          fontWeight: "500",
        },
      },
      width: 460,
      centered: true,
      onOk: () => {
        dispatch(logout());
        message.success({
          content: "🎉 Đăng xuất thành công! Hẹn gặp lại.",
          duration: 3,
          style: {
            marginTop: "20vh",
          },
        });
        navigate("/");
      },
      onCancel: () => {
        message.info("Đã hủy đăng xuất");
      },
    });
  };

  // Format user's full name
  const getUserDisplayName = () => {
    if (!user) return "";
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user.firstName) {
      return user.firstName;
    } else if (user.lastName) {
      return user.lastName;
    } else if (user.email) {
      // If no name is available, use email as fallback
      return user.email.split("@")[0];
    }
    return "User";
  };

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: <Link to="/profile">Hồ sơ</Link>,
    },
    ...(user?.role === "member"
      ? [
          {
            key: "refund",
            icon: <CreditCardOutlined />,
            label: <Link to="/refund-requests">Yêu cầu hoàn tiền</Link>,
          },
        ]
      : []),
    ...(user?.role === "admin"
      ? [
          {
            key: "admin",
            icon: <DashboardOutlined />,
            label: <Link to="/admin">Bảng điều khiển Admin</Link>,
          },
        ]
      : []),
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: <span onClick={handleLogout}>Đăng xuất</span>,
    },
  ];

  // Define navigation items based on user role
  const getNavItems = () => {
    const baseItems = [
      {
        key: "home",
        icon: <HomeOutlined />,
        label: <Link to="/">Trang chủ</Link>,
      },
      {
        key: "blog",
        icon: <BookOutlined />,
        label: <Link to="/blog">Blog</Link>,
      },
      {
        key: "community",
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
          key: "achievement",
          icon: <TrophyOutlined />,
          label: <Link to="/achievement">Thành tích</Link>,
        },
        {
          key: "quit-plan",
          icon: <BulbOutlined />,
          label: <Link to="/quit-plan">Kế hoạch cai thuốc</Link>,
        },
      ];

      if (user.role === "guest") {
        // Guest users see basic features
        return [
          ...authenticatedItems,
          {
            key: "plans",
            icon: <SettingOutlined />,
            label: <Link to="/membership">Gói dịch vụ</Link>,
          },
        ];
      } else if (user.role === "member") {
        // Members see all features
        return [
          ...authenticatedItems,
          {
            key: "plans",
            icon: <SettingOutlined />,
            label: <Link to="/membership">Gói dịch vụ</Link>,
          },
          {
            key: "survey",
            icon: <FormOutlined />,
            label: <Link to="/smoking-survey">Khảo sát</Link>,
          },
        ];
      } else if (user.role === "coach") {
        // Coaches see coaching-related features
        return [
          ...authenticatedItems,
          {
            key: "dashboard",
            icon: <DashboardOutlined />,
            label: <Link to="/coach/dashboard">Bảng điều khiển Coach</Link>,
          },
        ];
      } else if (user.role === "admin") {
        // Admins see all features
        return [
          ...authenticatedItems,
          {
            key: "plans",
            icon: <SettingOutlined />,
            label: <Link to="/membership">Gói dịch vụ</Link>,
          },
          {
            key: "survey",
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
        key: "plans",
        icon: <SettingOutlined />,
        label: <Link to="/membership">Gói dịch vụ</Link>,
      },
    ];
  };

  const navItems = getNavItems();

  return (
    <>
      
      <Header
        className="navbar-header"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Logo */}
        <div className="navbar-logo">
          <Link
            to="/"
            className="navbar-brand"
            style={{
              fontSize: "26px",
              fontWeight: "700",
              color: "#fff",
              textDecoration: "none",
              textShadow: "0 2px 4px rgba(0,0,0,0.3)",
              background: "linear-gradient(45deg, #4ecdc4, #44a08d)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
            }}
          >
            🚭 SmokeKing
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div
          className="navbar-menu-desktop"
          style={{
            display: "flex",
            alignItems: "center",
            flex: 1,
            justifyContent: "space-between",
            marginLeft: "40px",
          }}
        >
          <Menu
            theme="dark"
            mode="horizontal"
            items={navItems}
            className="navbar-menu"
            selectedKeys={[getCurrentMenuKey()]} // ✅ Set active menu item
            style={{
              background: "transparent",
              border: "none",
              flex: 1,
              fontSize: "15px",
              fontWeight: "500",
            }}
          />

          {isAuthenticated ? (
            <Space size="middle">
              {/* Appointment button for members */}
              {user?.role === "member" && (
                <Button
                  type="text"
                  icon={<CalendarOutlined />}
                  onClick={() => navigate("/member/dashboard?tab=appointments")}
                  className="navbar-appointment-btn"
                >
                  Lịch hẹn
                </Button>
              )}

              {/* ✅ Enhanced notification bell */}
              <Badge 
                count={unreadCount} 
                offset={[-2, 4]} 
                size="small"
                className="notification-badge"
              >
                <div
                  style={{
                    cursor: "pointer",
                    padding: "10px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.1)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onClick={() => setNotifDrawerOpen(true)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.25)";
                    e.currentTarget.style.transform = "scale(1.1)";
                    e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <BellOutlined
                    style={{
                      fontSize: "18px",
                      color: "#fff",
                      filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                    }}
                  />
                </div>
              </Badge>

              {/* Chat button for members */}
              {user?.role === "member" && (
                <Button
                  type="text"
                  icon={<MessageOutlined />}
                  onClick={() => setChatDrawerOpen(true)}
                  style={{
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.3)",
                    borderRadius: "8px",
                    transition: "all 0.3s ease",
                    background: "rgba(255,255,255,0.1)",
                    fontWeight: "500",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "rgba(255,255,255,0.2)";
                    e.target.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "rgba(255,255,255,0.1)";
                    e.target.style.transform = "translateY(0)";
                  }}
                >
                  Chat với Coach
                </Button>
              )}

              {/* Appointment button for coaches */}
              {user?.role === "coach" && (
                <Button
                  type="text"
                  icon={<CalendarOutlined />}
                  onClick={() => navigate("/coach/dashboard?tab=appointments")}
                  className="navbar-appointment-btn"
                >
                  Lịch hẹn
                </Button>
              )}

              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <div
                  className="navbar-user"
                  style={{
                    cursor: "pointer",
                    padding: "8px 16px",
                    borderRadius: "12px",
                    background: "rgba(255,255,255,0.1)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  <Space>
                    <span
                      className="navbar-username"
                      style={{
                        color: "#fff",
                        fontWeight: "600",
                        textShadow: "0 1px 2px rgba(0,0,0,0.1)",
                      }}
                    >
                      {getUserDisplayName()}
                    </span>
                    <Avatar
                      src={user?.avatar}
                      icon={!user?.avatar && <UserOutlined />}
                      alt={getUserDisplayName()}
                      style={{
                        background: "linear-gradient(45deg, #ff6b6b, #4ecdc4)",
                        border: "2px solid rgba(255,255,255,0.4)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      }}
                    />
                  </Space>
                </div>
              </Dropdown>
            </Space>
          ) : (
            <div
              className="navbar-auth-buttons"
              style={{ display: "flex", gap: "12px" }}
            >
              <Button
                type="text"
                className="navbar-login-btn"
                style={{
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: "8px",
                  transition: "all 0.3s ease",
                  fontWeight: "500",
                  background: "rgba(255,255,255,0.1)",
                }}
              >
                <Link to="/login" style={{ color: "inherit" }}>
                  Đăng nhập
                </Link>
              </Button>
              <Button
                type="text"
                className="navbar-coach-btn"
                style={{
                  color: "#fff",
                  border: "1px solid #4ecdc4",
                  borderRadius: "8px",
                  background: "linear-gradient(45deg, rgba(78, 205, 196, 0.15), rgba(78, 205, 196, 0.25))",
                  transition: "all 0.3s ease",
                  fontWeight: "500",
                  backdropFilter: "blur(10px)",
                }}
              >
                <Link to="/coach/login" style={{ color: "inherit" }}>
                  Đăng nhập Coach
                </Link>
              </Button>
              <Button
                type="text"
                className="navbar-admin-btn"
                style={{
                  color: "#fff",
                  border: "1px solid #ff6b6b",
                  borderRadius: "8px",
                  background: "linear-gradient(45deg, rgba(255, 107, 107, 0.15), rgba(255, 107, 107, 0.25))",
                  transition: "all 0.3s ease",
                  fontWeight: "500",
                  backdropFilter: "blur(10px)",
                }}
              >
                <Link to="/admin/login" style={{ color: "inherit" }}>
                  Đăng nhập Admin
                </Link>
              </Button>
              <Button
                type="primary"
                className="navbar-register-btn"
                style={{
                  background: "linear-gradient(45deg, #ff6b6b, #4ecdc4)",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  transition: "all 0.3s ease",
                  boxShadow: "0 2px 8px rgba(255, 107, 107, 0.3)",
                }}
              >
                <Link to="/register" style={{ color: "#fff" }}>
                  Đăng ký
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="navbar-mobile-toggle" style={{ display: "none" }}>
          <Button
            type="text"
            icon={<MenuOutlined />}
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ 
              color: "#fff",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "6px",
            }}
          />

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div
              className="navbar-mobile-menu"
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                background: "rgba(102, 126, 234, 0.96)",
                backdropFilter: "blur(15px)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
                borderTop: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <Menu
                theme="dark"
                mode="vertical"
                items={navItems}
                className="mobile-nav-menu"
                selectedKeys={[getCurrentMenuKey()]} // ✅ Active menu for mobile too
                style={{ background: "transparent", border: "none" }}
              />

              {isAuthenticated ? (
                <Menu
                  theme="dark"
                  mode="vertical"
                  items={userMenuItems}
                  className="mobile-user-menu"
                  style={{ background: "transparent", border: "none" }}
                />
              ) : (
                <div className="mobile-auth-buttons" style={{ padding: "16px" }}>
                  <Button
                    block
                    type="text"
                    className="mobile-login-btn"
                    style={{ marginBottom: "8px", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}
                  >
                    <Link to="/login" style={{ color: "inherit" }}>
                      Đăng nhập
                    </Link>
                  </Button>
                  <Button
                    block
                    type="text"
                    className="mobile-coach-btn"
                    style={{ marginBottom: "8px", color: "#fff", border: "1px solid #4ecdc4" }}
                  >
                    <Link to="/coach/login" style={{ color: "inherit" }}>
                      Đăng nhập Coach
                    </Link>
                  </Button>
                  <Button
                    block
                    type="text"
                    className="mobile-admin-btn"
                    style={{ marginBottom: "8px", color: "#fff", border: "1px solid #ff6b6b" }}
                  >
                    <Link to="/admin/login" style={{ color: "inherit" }}>
                      Đăng nhập Admin
                    </Link>
                  </Button>
                  <Button
                    block
                    type="primary"
                    className="mobile-register-btn"
                    style={{
                      background: "linear-gradient(45deg, #ff6b6b, #4ecdc4)",
                      border: "none",
                    }}
                  >
                    <Link to="/register" style={{ color: "#fff" }}>
                      Đăng ký
                    </Link>
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
          {user?.role === "member" && <MemberChat height={600} />}
        </Drawer>

        {/* Notifications Drawer */}
        <Drawer
          title={
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <BellOutlined style={{ color: "#1890ff" }} />
              <span>Thông báo</span>
              {unreadCount > 0 && (
                <Badge count={unreadCount} style={{ marginLeft: "auto" }} />
              )}
            </div>
          }
          placement="right"
          onClose={() => setNotifDrawerOpen(false)}
          open={notifDrawerOpen}
          width={380}
          extra={
            unreadCount > 0 && (
              <Button
                type="link"
                size="small"
                onClick={async () => {
                  try {
                    await fetch("/api/notifications/read-all", {
                      method: "PUT",
                      credentials: "include",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                    });
                    setNotifications((prev) =>
                      prev.map((n) => ({ ...n, IsRead: true }))
                    );
                    setUnreadCount(0);
                    message.success("Đã đánh dấu tất cả là đã đọc");
                  } catch (error) {
                    message.error("Lỗi khi đánh dấu đã đọc");
                  }
                }}
              >
                Đánh dấu tất cả đã đọc
              </Button>
            )
          }
        >
          {notifications.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#999" }}>
              <BellOutlined style={{ fontSize: "48px", marginBottom: "16px" }} />
              <p>Chưa có thông báo nào</p>
            </div>
          ) : (
            <List
              itemLayout="horizontal"
              dataSource={notifications}
              renderItem={(item) => (
                <List.Item
                  style={{
                    background: item.IsRead ? "#fff" : "#e6f7ff",
                    cursor: "pointer",
                    borderRadius: "8px",
                    margin: "8px 0",
                    padding: "12px",
                    border: item.IsRead ? "1px solid #f0f0f0" : "1px solid #1890ff",
                    transition: "all 0.3s ease",
                  }}
                  onClick={async () => {
                    if (!item.IsRead) {
                      try {
                        // 1) Đánh dấu đã đọc
                        await fetch(`/api/notifications/${item.NotificationID}/read`, {
                          method: "PUT",
                          credentials: "include",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                        });
                        // ✅ Sửa cập nhật state
                        setNotifications((prev) =>
                          prev.map((n) =>
                            n.NotificationID === item.NotificationID
                              ? { ...n, IsRead: true }
                              : n
                          )
                        );
                        setUnreadCount((c) => Math.max(0, c - 1));
                      } catch (error) {
                        console.error("Error marking as read:", error);
                      }
                    }

                    // 2) Đóng Drawer
                    setNotifDrawerOpen(false);

                    // 3) Điều hướng nếu cần
                    if (item.AppointmentID) {
                      navigate("/member/dashboard?tab=appointments");
                    }
                  }}
                >
                  <List.Item.Meta
                    avatar={
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: item.IsRead ? "#d9d9d9" : "#1890ff",
                        }}
                      />
                    }
                    title={
                      <div style={{ fontWeight: item.IsRead ? "normal" : "600" }}>
                        {item.Title}
                      </div>
                    }
                    description={
                      <div>
                        <p style={{ margin: "4px 0", color: "#666" }}>
                          {item.Message}
                        </p>
                        <small style={{ color: "#999" }}>
                          {new Date(item.CreatedAt).toLocaleString("vi-VN")}
                        </small>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Drawer>
      </Header>
    </>
  );
};

export default Navbar;
