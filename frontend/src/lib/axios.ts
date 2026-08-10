import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Needed if refreshToken is set in HTTP-only cookies by backend
});

// Attach Access Token to outgoing requests
api.interceptors.request.use((config) => {
    const token = Cookies.get('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Refresh Token interceptor on 401 response
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const isAuthRoute =
            originalRequest?.url?.includes('/auth/api/auth/login') ||
            originalRequest?.url?.includes('/auth/api/auth/register') ||
            originalRequest?.url?.includes('/auth/api/auth/refresh');

        if (
            (error.response?.status === 401 || error.response?.status === 403) &&
            !originalRequest._retry &&
            !isAuthRoute
        ) {
            originalRequest._retry = true;
            try {
                const storedRefreshToken = localStorage.getItem('refreshToken');
                if (!storedRefreshToken) {
                    throw new Error('No refresh token available');
                }
                const res = await axios.post(
                    `${process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8000'}/auth/api/auth/refresh`,
                    { refreshToken: storedRefreshToken },
                    { withCredentials: true }
                );

                const accessToken = res.data.tokens?.accessToken || res.data.accessToken;
                if (accessToken) {
                    Cookies.set('token', accessToken, { expires: 7, path: '/', sameSite: 'lax' });
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return api(originalRequest);
                }
            } catch (refreshErr) {
                // Clear tokens if refresh fails
                Cookies.remove('token', { path: '/' });
                localStorage.removeItem('refreshToken');
                if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshErr);
            }
        }
        return Promise.reject(error);
    }
);

export default api;