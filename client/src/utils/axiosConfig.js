import axios from 'axios';

// Set a fixed API URL to ensure correct port
const API_URL = 'http://localhost:4000/api';

// Create an axios instance
const axiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    withCredentials: false, // Changed to false to avoid CORS issues
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Request interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        // Add authorization header if token exists
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle network errors
        if (error.message === 'Network Error' || !error.response) {
            console.error('Network error or server not responding');
            // You can dispatch an action here or show a notification
        }

        // Handle different status codes
        if (error.response) {
            const { status } = error.response;

            if (status === 401) {
                // Handle unauthorized
                console.error('Unauthorized access');
                // localStorage.removeItem('token');
                // window.location.href = '/login';
            }

            if (status === 404) {
                console.error('Resource not found');
            }

            if (status >= 500) {
                console.error('Server error');
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
export { API_URL }; 