import axios, { type InternalAxiosRequestConfig, type AxiosError, type AxiosResponse } from 'axios';

// ============================================================================
// AXIOS INSTANCE CONFIGURATION
// ============================================================================

/**
 * Configured Axios instance for communicating with the Spring Boot backend.
 * The base URL is set to the local development server.
 */
const api = axios.create({
    baseURL: 'http://localhost:8080/api',
});

// ============================================================================
// INTERCEPTORS
// ============================================================================

/**
 * Request Interceptor:
 * Automatically retrieves the JWT token from localStorage and attaches it
 * to the 'Authorization' header of every outgoing request, provided the token exists.
 */
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

/**
 * Response Interceptor:
 * Passes through successful responses but intercepts errors globally.
 * Specifically targets 401 (Unauthorized) and 403 (Forbidden) status codes
 * to handle expired sessions or invalid credentials by purging local storage
 * and forcefully redirecting the user to the login screen.
 */
api.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            console.warn('Session expired or access denied. Purging auth data and redirecting.');

            // Clear authentication artifacts
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');

            // Redirect to login page if the user is not already on an authentication route
            const currentPath = window.location.pathname;
            if (currentPath !== '/login' && currentPath !== '/register') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;