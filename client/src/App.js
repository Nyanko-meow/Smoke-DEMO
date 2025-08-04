import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Layout, ConfigProvider } from 'antd';
import { useDispatch } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/layout/Navbar';
import Home from './components/Home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import CoachLogin from './components/auth/CoachLogin';
import AdminLogin from './components/auth/AdminLogin';
import UserProfile from './components/user/UserProfile';
import UserCommentHistory from './components/user/UserCommentHistory';
import BlogPage from './pages/BlogPage';
import CommunityList from './components/community/CommunityList';
import CommunityDetail from './components/community/CommunityDetail';
import CommunityPost from './components/community/CommunityPost';
import PrivateRoute from './components/routing/PrivateRoute';
import RoleBasedRoute from './components/routing/RoleBasedRoute';
import MembershipPage from './pages/MembershipPage';
import RefundRequestsPage from './pages/RefundRequestsPage';
import SmokingSurveyPage from './pages/SmokingSurveyPage';
import SurveyResultsPage from './pages/SurveyResultsPage';
import SmokingAddictionSurveyPage from './pages/SmokingAddictionSurveyPage';
import SmokingAddictionResultsPage from './pages/SmokingAddictionResultsPage';
import EnhancedProgressPage from './pages/EnhancedProgressPage';
import QuitPlanPage from './pages/QuitPlanPage';
import TemplateDetailPage from './pages/TemplateDetailPage';
import QuitPlanFormPage from './pages/QuitPlanFormPage';
import CoachDashboard from './pages/CoachDashboard';
import MemberDashboard from './pages/MemberDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AchievementPage from './pages/AchievementPage';
import TestPage from './pages/TestPage';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailed from './pages/PaymentFailed';
import { checkSessionExpiration, refreshSession } from './store/slices/authSlice';
import viVN from 'antd/locale/vi_VN';
import 'moment/locale/vi';

// Import global error suppression for ResizeObserver errors
import './utils/errorSuppression';

const { Content } = Layout;

function App() {
    const dispatch = useDispatch();
    const location = useLocation();

    // Check if current route should show navbar
    const shouldShowNavbar = () => {
        // Hide navbar for admin and coach dashboards to prevent conflicts
        const hideNavbarRoutes = [
            '/admin/dashboard',
            '/admin/users',
            '/admin/settings',
            '/admin/reports',
            '/coach/dashboard' // Add coach dashboard to hide navbar
        ];

        // Show navbar on login pages
        const showNavbarRoutes = ['/admin/login', '/coach/login'];

        if (showNavbarRoutes.includes(location.pathname)) {
            return true; // Show navbar on login pages
        }

        // Check if current path starts with any route that should hide navbar
        return !hideNavbarRoutes.some(route => location.pathname.startsWith(route));
    };

    // Check session on component mount
    useEffect(() => {
        // Check session immediately on mount
        dispatch(checkSessionExpiration());

        // Set up interval to check and refresh session - but not too frequently
        const sessionInterval = setInterval(() => {
            dispatch(checkSessionExpiration());
            // Refresh session to extend token validity if user is active
            dispatch(refreshSession());
        }, 60000); // Check every minute - increased to reduce server load

        // User activity tracking with debounce to avoid too many dispatches
        let activityTimeout;
        const handleUserActivity = () => {
            clearTimeout(activityTimeout);
            activityTimeout = setTimeout(() => {
                dispatch(refreshSession());
            }, 3000); // Debounce for 3 seconds to reduce API calls
        };

        // Add event listeners for user activity - fewer listeners
        window.addEventListener('click', handleUserActivity);
        // No need for every possible event - just key movements and clicks
        window.addEventListener('keydown', handleUserActivity);
        // Don't track scroll or mousemove - they're too frequent

        // Cleanup interval and event listeners on unmount
        return () => {
            clearInterval(sessionInterval);
            clearTimeout(activityTimeout);
            window.removeEventListener('click', handleUserActivity);
            window.removeEventListener('keydown', handleUserActivity);
        };
    }, [dispatch]);

    return (
        <ConfigProvider 
            locale={viVN}
            theme={{
                token: {
                    fontFamily: "'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Arial Unicode MS', 'Noto Sans', sans-serif"
                }
            }}
        >
            <Layout className="app-layout min-h-screen">
                {shouldShowNavbar() && <Navbar />}
                <Content className="app-content flex-grow">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/coach/login" element={<CoachLogin />} />
                        <Route path="/coach/dashboard" element={<CoachDashboard />} />
                        <Route path="/admin/login" element={<AdminLogin />} />
                        <Route path="/admin/dashboard" element={<AdminDashboard />} />
                        <Route
                            path="/member/dashboard"
                            element={
                                <PrivateRoute>
                                    <RoleBasedRoute allowedRoles={['member', 'guest']}>
                                        <MemberDashboard />
                                    </RoleBasedRoute>
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/profile"
                            element={
                                <PrivateRoute>
                                    <UserProfile />
                                </PrivateRoute>
                            }
                        />

                        <Route path="/blog/*" element={<BlogPage />} />
                        <Route path="/community" element={<CommunityList />} />
                        <Route path="/community/:postId" element={<CommunityDetail />} />
                        <Route
                            path="/community/new"
                            element={
                                <PrivateRoute>
                                    <CommunityPost />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/membership"
                            element={
                                <PrivateRoute>
                                    <RoleBasedRoute allowedRoles={['member', 'guest']}>
                                        <MembershipPage />
                                    </RoleBasedRoute>
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/refund-requests"
                            element={
                                <PrivateRoute>
                                    <RoleBasedRoute allowedRoles={['member', 'guest']}>
                                        <RefundRequestsPage />
                                    </RoleBasedRoute>
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/smoking-survey"
                            element={
                                <PrivateRoute>
                                    <RoleBasedRoute allowedRoles={['member', 'guest']}>
                                        <SmokingSurveyPage />
                                    </RoleBasedRoute>
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/smoking-survey/results"
                            element={
                                <PrivateRoute>
                                    <RoleBasedRoute allowedRoles={['member', 'guest']}>
                                        <SurveyResultsPage />
                                    </RoleBasedRoute>
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/member/smoking-survey"
                            element={
                                <PrivateRoute>
                                    <RoleBasedRoute allowedRoles={['member', 'guest']}>
                                        <SmokingAddictionSurveyPage />
                                    </RoleBasedRoute>
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/member/smoking-results"
                            element={
                                <PrivateRoute>
                                    <RoleBasedRoute allowedRoles={['member', 'guest']}>
                                        <SmokingAddictionResultsPage />
                                    </RoleBasedRoute>
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/member/enhanced-progress"
                            element={
                                <PrivateRoute>
                                    <RoleBasedRoute allowedRoles={['member', 'guest']}>
                                        <EnhancedProgressPage />
                                    </RoleBasedRoute>
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/quit-plan"
                            element={
                                <PrivateRoute>
                                    <RoleBasedRoute allowedRoles={['member', 'guest']}>
                                        <QuitPlanPage />
                                    </RoleBasedRoute>
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/quit-plan/template/:templateId"
                            element={
                                <PrivateRoute>
                                    <RoleBasedRoute allowedRoles={['member', 'guest']}>
                                        <TemplateDetailPage />
                                    </RoleBasedRoute>
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/quit-plan/form"
                            element={
                                <PrivateRoute>
                                    <RoleBasedRoute allowedRoles={['member', 'guest']}>
                                        <QuitPlanFormPage />
                                    </RoleBasedRoute>
                                </PrivateRoute>
                            }
                        />

                        <Route
                            path="/achievement"
                            element={
                                <PrivateRoute>
                                    <RoleBasedRoute allowedRoles={['member', 'guest']}>
                                        <AchievementPage />
                                    </RoleBasedRoute>
                                </PrivateRoute>
                            }
                        />
                        <Route path="/test" element={<TestPage />} />
                        <Route path="/payment/success" element={<PaymentSuccess />} />
                        <Route path="/payment/failed" element={<PaymentFailed />} />
                        
                        {/* Additional PayOS callback routes */}
                        <Route path="/payment/cancelled" element={<PaymentFailed />} />
                        <Route path="/payment/error" element={<PaymentFailed />} />
                        
                        {/* PayOS direct callback routes for better handling */}
                        <Route path="/payos/success" element={<PaymentSuccess />} />
                        <Route path="/payos/failed" element={<PaymentFailed />} />
                        <Route path="/payos/cancelled" element={<PaymentFailed />} />
                    </Routes>
                </Content>
                <ToastContainer
                    position="top-right"
                    autoClose={5000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="colored"
                />
            </Layout>
        </ConfigProvider>
    );
}

export default App; 