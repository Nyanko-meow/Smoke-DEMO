import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    // Set a reasonable timeout
    timeout: 15000,
    // Only use withCredentials if needed for cross-domain cookies
    withCredentials: false
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);

        // Don't add Authorization header for login/register requests
        const isAuthEndpoint =
            config.url.includes('/auth/login') ||
            config.url.includes('/auth/register');

        if (!isAuthEndpoint) {
            // Get the token from localStorage
            const token = localStorage.getItem('token');

            // Check if token exists and attach it to the Authorization header
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }

        return config;
    },
    (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        console.log(`API Response: ${response.status} for ${response.config.url}`);
        return response;
    },
    async (error) => {
        console.error('API Response Error:', error.response?.status || error.message, 'for URL:', error.config?.url);

        const originalRequest = error.config;
        if (!originalRequest) {
            return Promise.reject(error);
        }

        // Skip auth handling for login/register requests
        const isAuthEndpoint =
            originalRequest.url.includes('/auth/login') ||
            originalRequest.url.includes('/auth/register') ||
            originalRequest.url.includes('/auth/refresh-token');

        if (isAuthEndpoint) {
            return Promise.reject(error);
        }

        // Handle 403 forbidden specifically for unactivated accounts
        if (error.response && error.response.status === 403) {
            console.log('403 Forbidden response:', error.response.data);

            // Check if this is an account activation issue
            if (error.response.data &&
                (error.response.data.requireActivation ||
                    (error.response.data.message && error.response.data.message.includes('kích hoạt')))) {

                console.log('User account not activated, redirecting to login');

                // Clear auth data
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                localStorage.removeItem('tokenExpiration');

                // Redirect to login with activation required parameter
                if (typeof window !== 'undefined') {
                    window.location.href = '/login?activation=required';
                    return Promise.reject({
                        ...error,
                        handled: true // Mark as handled to prevent further processing
                    });
                }
            }
        }

        // Handle token expiration (401 Unauthorized)
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Try to refresh the token
                const refreshToken = localStorage.getItem('refreshToken');

                if (refreshToken) {
                    try {
                        console.log('Attempting to refresh token');
                        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
                            refreshToken
                        }, {
                            // Don't include Authorization header for refresh requests
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });

                        if (response.data && response.data.token) {
                            console.log('Token refreshed successfully');
                            // Update stored tokens
                            localStorage.setItem('token', response.data.token);

                            if (response.data.refreshToken) {
                                localStorage.setItem('refreshToken', response.data.refreshToken);
                            }

                            // Update token expiration
                            const expirationTime = new Date().getTime() + 30 * 60 * 1000; // 30 minutes
                            localStorage.setItem('tokenExpiration', expirationTime.toString());

                            // Update Authorization header and retry original request
                            api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
                            originalRequest.headers['Authorization'] = `Bearer ${response.data.token}`;

                            // Retry the original request
                            return axios(originalRequest);
                        } else {
                            throw new Error('Failed to refresh token');
                        }
                    } catch (refreshError) {
                        console.error('Token refresh failed:', refreshError);
                        throw refreshError;
                    }
                } else {
                    console.log('No refresh token available');
                    throw new Error('No refresh token available');
                }
            } catch (refreshError) {
                // If refresh token fails, clear auth data and redirect to login
                console.error('Authentication failed, logging out', refreshError);
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                localStorage.removeItem('tokenExpiration');

                // Only redirect if we're in the browser environment and not in a test
                if (typeof window !== 'undefined') {
                    window.location.href = '/login?session=expired';
                }
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);

export default api; 