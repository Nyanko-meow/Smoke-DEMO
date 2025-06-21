import axios from 'axios';

// Create axios instance
const axiosInstance = axios.create({
    baseURL: 'http://localhost:4000/api',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        console.log('🔗 Axios Request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            fullURL: config.baseURL + config.url,
            hasToken: !!token,
            headers: config.headers
        });

        return config;
    },
    (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
    (response) => {
        console.log('✅ Axios Response:', {
            status: response.status,
            url: response.config.url,
            success: response.data?.success
        });
        return response;
    },
    (error) => {
        console.error('❌ Axios Response Error:', {
            status: error.response?.status,
            url: error.config?.url,
            message: error.response?.data?.message || error.message,
            data: error.response?.data
        });

        // Handle 401 unauthorized errors
        if (error.response?.status === 401) {
            console.log('🔒 Unauthorized - clearing local storage');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

export default axiosInstance; 