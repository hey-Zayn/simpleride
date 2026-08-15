import { create } from 'zustand';
import Cookies from 'js-cookie';
import api from '@/lib/axios';
import {
    DriverProfile,
    DriverStatus,
    LoginPayload,
    RegisterPayload,
    User,
} from '@/types/auth';

interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

interface AuthSession {
    user: User;
    tokens: AuthTokens;
}

interface ApiResponse<T> {
    data: T;
}

interface TokenResponse {
    tokens: AuthTokens;
}

interface DriverStatusResponse {
    data: DriverProfile;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    registerUser: (payload: RegisterPayload) => Promise<User>;
    loginUser: (payload: LoginPayload) => Promise<User>;
    fetchMe: () => Promise<User | null>;
    refreshToken: () => Promise<boolean>;
    updateDriverStatus: (status: DriverStatus) => Promise<void>;
    logoutUser: () => Promise<void>;
}

const getInitialToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return Cookies.get('token') ?? null;
};

const clearSession = (): void => {
    Cookies.remove('token', { path: '/' });
    if (typeof window !== 'undefined') localStorage.removeItem('refreshToken');
};

const persistSession = (tokens: AuthTokens): void => {
    Cookies.set('token', tokens.accessToken, { expires: 1, path: '/', sameSite: 'lax' });
    if (typeof window !== 'undefined') localStorage.setItem('refreshToken', tokens.refreshToken);
};

const getDriverStatus = (profile: DriverProfile | null | undefined): DriverStatus | undefined => {
    if (!profile) return undefined;
    if (profile.isBusy) return 'BUSY';
    return profile.isOnline ? 'ONLINE' : 'OFFLINE';
};

const normalizeUser = (user: User): User => ({
    ...user,
    driverStatus: getDriverStatus(user.driverProfile),
    vehicleType: user.driverProfile?.vehicleType ?? user.vehicleType,
    vehicleNumber: user.driverProfile?.vehicleNumber ?? user.vehicleNumber,
    licenseNumber: user.driverProfile?.licenseNumber ?? user.licenseNumber,
});

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: getInitialToken(),
    isAuthenticated: Boolean(getInitialToken()),
    isLoading: false,

    registerUser: async (payload) => {
        set({ isLoading: true });
        try {
            const response = await api.post<ApiResponse<AuthSession>>('/auth/api/auth/register', payload);
            const user = normalizeUser(response.data.data.user);
            persistSession(response.data.data.tokens);
            set({ user, token: response.data.data.tokens.accessToken, isAuthenticated: true });
            return user;
        } finally {
            set({ isLoading: false });
        }
    },

    loginUser: async (payload) => {
        set({ isLoading: true });
        try {
            const response = await api.post<ApiResponse<AuthSession>>('/auth/api/auth/login', payload);
            const user = normalizeUser(response.data.data.user);
            persistSession(response.data.data.tokens);
            set({ user, token: response.data.data.tokens.accessToken, isAuthenticated: true });
            return user;
        } finally {
            set({ isLoading: false });
        }
    },

    fetchMe: async () => {
        const token = getInitialToken();
        if (!token) {
            clearSession();
            set({ user: null, token: null, isAuthenticated: false });
            return null;
        }

        set({ isLoading: true });
        try {
            const response = await api.get<ApiResponse<User>>('/auth/api/auth/me');
            const user = normalizeUser(response.data.data);
            set({ user, token, isAuthenticated: true });
            return user;
        } catch {
            clearSession();
            set({ user: null, token: null, isAuthenticated: false });
            return null;
        } finally {
            set({ isLoading: false });
        }
    },

    refreshToken: async () => {
        const storedRefreshToken = typeof window === 'undefined' ? null : localStorage.getItem('refreshToken');
        if (!storedRefreshToken) {
            clearSession();
            set({ user: null, token: null, isAuthenticated: false });
            return false;
        }

        try {
            const response = await api.post<TokenResponse>('/auth/api/auth/refresh', { refreshToken: storedRefreshToken });
            persistSession(response.data.tokens);
            set({ token: response.data.tokens.accessToken, isAuthenticated: true });
            return true;
        } catch {
            clearSession();
            set({ user: null, token: null, isAuthenticated: false });
            return false;
        }
    },

    updateDriverStatus: async (status) => {
        set({ isLoading: true });
        try {
            const response = await api.patch<DriverStatusResponse>('/auth/api/auth/driver/status', {
                isOnline: status === 'ONLINE',
                isBusy: status === 'BUSY',
            });
            const driverProfile = response.data.data;
            set((state) => ({
                user: state.user
                    ? normalizeUser({ ...state.user, driverProfile })
                    : state.user,
            }));
        } finally {
            set({ isLoading: false });
        }
    },

    logoutUser: async () => {
        set({ isLoading: true });
        try {
            await api.post('/auth/api/auth/logout');
        } catch {
            // Local cleanup still protects the client after a network failure.
        } finally {
            clearSession();
            set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
    },
}));