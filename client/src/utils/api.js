import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Get the token from localStorage (which should be the most up-to-date)
        const token = localStorage.getItem('token');

        // Check if token exists and attach it to the Authorization header
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Check if the error is due to an expired token (401 Unauthorized)
        if (error.response && error.response.status === 401) {
            // Instead of dispatching directly, clear the token from localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('tokenExpiration');

            // Force refresh to update auth state
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

export default api; 