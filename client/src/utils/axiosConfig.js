import axios from 'axios';

// Define API URL for export
export const API_URL = 'http://localhost:4000/api';

// Create axios instance
const axiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add token
axiosInstance.interceptors.request.use(
    (config) => {
        // Check for coach token first, then member token
        const coachToken = localStorage.getItem('coachToken');
        const memberToken = localStorage.getItem('token');
        const token = coachToken || memberToken;
        
        const coachUser = localStorage.getItem('coachUser');
        const memberUser = localStorage.getItem('user');
        const user = coachUser || memberUser;
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // EXTENSIVE LOGGING for debugging
        console.group('🔗 AXIOS REQUEST');
        console.log('📍 URL:', config.baseURL + config.url);
        console.log('🔧 Method:', config.method?.toUpperCase());
        console.log('🔑 Token Status:', {
            hasCoachToken: !!coachToken,
            hasMemberToken: !!memberToken,
            usingToken: coachToken ? 'coach' : (memberToken ? 'member' : 'none'),
            tokenLength: token?.length,
            tokenPreview: token ? token.substring(0, 30) + '...' : 'NO TOKEN',
            expires: token ? (() => {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    return new Date(payload.exp * 1000).toLocaleString();
                } catch { return 'Invalid token format'; }
            })() : 'N/A'
        });
        console.log('👤 User:', user ? JSON.parse(user) : 'NO USER');
        console.log('📋 Headers:', config.headers);
        console.log('📦 Params:', config.params);
        console.log('📄 Data:', config.data);
        console.groupEnd();

        return config;
    },
    (error) => {
        console.group('❌ REQUEST INTERCEPTOR ERROR');
        console.error('Error:', error);
        console.groupEnd();
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
    (response) => {
        // EXTENSIVE LOGGING for debugging
        console.group('📤 AXIOS RESPONSE');
        console.log('📍 URL:', response.config.url);
        console.log('📊 Status:', response.status);
        console.log('⏱️ Duration:', Date.now() - response.config.metadata?.startTime, 'ms');
        console.log('📄 Response Data:', response.data);
        console.groupEnd();
        
        return response;
    },
    (error) => {
        console.group('❌ AXIOS RESPONSE ERROR');
        console.error('📍 URL:', error.config?.url);
        console.error('📊 Status:', error.response?.status);
        console.error('📄 Error Data:', error.response?.data);
        console.error('🔍 Full Error:', error);
        console.groupEnd();
        
        // Handle authentication errors
        if (error.response?.status === 401) {
            // Check if coach or member and redirect accordingly
            const coachToken = localStorage.getItem('coachToken');
            const memberToken = localStorage.getItem('token');
            
            if (coachToken) {
                localStorage.removeItem('coachToken');
                localStorage.removeItem('coachUser');
                window.location.href = '/coach/login';
            } else if (memberToken) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        
        return Promise.reject(error);
    }
);

// Add timestamp to request config
axiosInstance.interceptors.request.use((config) => {
    config.metadata = { startTime: Date.now() };
    return config;
});

export default axiosInstance; 