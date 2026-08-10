import { create } from 'zustand';
import Cookies from 'js-cookie';
import api from '@/lib/axios';
import {
    User,
    DriverStatus,
    RegisterPayload,
    LoginPayload,
} from '@/types/auth';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // Actions
    registerUser: (payload: RegisterPayload) => Promise<User>;
    loginUser: (payload: LoginPayload) => Promise<User>;
    fetchMe: () => Promise<User | null>;
    refreshToken: () => Promise<void>;
    updateDriverStatus: (status: DriverStatus) => Promise<void>;
    logoutUser: () => Promise<void>;
}

const getInitialToken = () => {
    if (typeof window === 'undefined') return null;
    return Cookies.get('token') || null;
};

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: getInitialToken(),
    isAuthenticated: !!getInitialToken(),
    isLoading: false,

    // 1. POST http://localhost:8000/auth/api/auth/register
    registerUser: async (payload) => {
        set({ isLoading: true });
        try {
            const response = await api.post('/auth/api/auth/register', payload);
            const { user, tokens } = response.data.data;
            const { accessToken, refreshToken } = tokens;

            Cookies.set('token', accessToken, { expires: 7, path: '/', sameSite: 'lax' });
            if (refreshToken) localStorage.setItem('refreshToken', refreshToken);

            set({ user, token: accessToken, isAuthenticated: true });
            return user;
        } finally {
            set({ isLoading: false });
        }
    },

    // 2. POST http://localhost:8000/auth/api/auth/login
    loginUser: async (payload) => {
        set({ isLoading: true });
        try {
            const response = await api.post('/auth/api/auth/login', payload);
            const { user, tokens } = response.data.data;
            const { accessToken, refreshToken } = tokens;

            Cookies.set('token', accessToken, { expires: 7, path: '/', sameSite: 'lax' });
            if (refreshToken) localStorage.setItem('refreshToken', refreshToken);

            set({ user, token: accessToken, isAuthenticated: true });
            return user;
        } finally {
            set({ isLoading: false });
        }
    },

    // 3. GET http://localhost:8000/auth/api/auth/me
    fetchMe: async () => {
        const token = Cookies.get('token');
        if (!token || token === 'undefined') {
            Cookies.remove('token', { path: '/' });
            set({ user: null, token: null, isAuthenticated: false });
            return null;
        }

        set({ isLoading: true });
        try {
            const response = await api.get('/auth/api/auth/me');
            const user = response.data.data || response.data.user || response.data;
            // console.log(user);
            set({ user, isAuthenticated: true });
            return user;
        } catch (error) {
            set({ user: null, token: null, isAuthenticated: false });
            Cookies.remove('token', { path: '/' });
            localStorage.removeItem('refreshToken');
            return null;
        } finally {
            set({ isLoading: false });
        }
    },

    // 4. POST http://localhost:8000/auth/api/auth/refresh
    refreshToken: async () => {
        const storedRefreshToken = localStorage.getItem('refreshToken');
        const response = await api.post('/auth/api/auth/refresh', { refreshToken: storedRefreshToken });
        const accessToken = response.data.tokens?.accessToken || response.data.accessToken;

        if (accessToken) {
            Cookies.set('token', accessToken, { expires: 7, path: '/', sameSite: 'lax' });
            set({ token: accessToken, isAuthenticated: true });
        }
    },

    // 5. PATCH http://localhost:8000/auth/api/auth/driver/status
    updateDriverStatus: async (status: DriverStatus) => {
        set({ isLoading: true });
        try {
            await api.patch('/auth/api/auth/driver/status', { status });
            set((state) => ({
                user: state.user ? { ...state.user, driverStatus: status } : null,
            }));
        } finally {
            set({ isLoading: false });
        }
    },

    // 6. POST http://localhost:8000/auth/api/auth/logout
    logoutUser: async () => {
        set({ isLoading: true });
        try {
            await api.post('/auth/api/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            Cookies.remove('token', { path: '/' });
            localStorage.removeItem('refreshToken');
            set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
    },
}));