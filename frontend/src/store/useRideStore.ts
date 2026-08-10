import { create } from 'zustand';
import api from '@/lib/axios';
import { toast } from 'sonner';

// --- TYPINGS ---

export type RideStatus =
    | 'REQUESTED'
    | 'ACCEPTED'
    | 'ARRIVED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED';

export type VehicleCategory = 'BIKE' | 'MINI' | 'COMFORT';

export interface LocationPoint {
    lat: number;
    lng: number;
    address: string;
}

export interface Coordinates {
    lat: number;
    lng: number;
}

export interface Driver {
    id: string;
    lat: number;
    lng: number;
    vehicleType: Lowercase<VehicleCategory>;
    bearing: number;
}

export interface VehicleOption {
    type: VehicleCategory | string;
    fare: number;
    estimatedMins: number;
    minBid?: number;
    maxBid?: number;
}

export interface RideEstimateRequest {
    pickup: {
        lat: number;
        lng: number;
    };
    dropoff: {
        lat: number;
        lng: number;
    };
}

export interface RideEstimateResponse {
    fare?: number;
    estimatedFare?: number;
    distanceKm: number;
    durationMins: number;
    vehicleOptions?: VehicleOption[];
    estimates?: VehicleOption[];
}

export interface CreateRidePayload {
    pickupLat: number;
    pickupLng: number;
    pickupAddress: string;
    dropoffLat: number;
    dropoffLng: number;
    dropoffAddress: string;
    vehicleType: VehicleCategory;
    offeredFare: number;
    distanceKm: number;
    durationMins: number;
}

export interface Ride {
    id: string;
    riderId: string;
    driverId: string | null;
    driver?: {
        name?: string;
        avatar?: string;
        vehicleModel?: string;
        plateNumber?: string;
        rating?: number;
    };
    pickupLat: number;
    pickupLng: number;
    pickupAddress: string;
    dropoffLat: number;
    dropoffLng: number;
    dropoffAddress: string;
    vehicleType: VehicleCategory;
    status: RideStatus;
    fare: number;
    offeredFare: number;
    distanceKm: number;
    durationMins: number;
    otp: string | null;
    createdAt: string;
    updatedAt: string;
}

interface RideState {
    // Booking Local State
    pickup: Coordinates | null;
    dropoff: Coordinates | null;
    pickupAddress: string;
    dropoffAddress: string;
    distanceKm: number;
    durationMins: number;
    selectedVehicle: VehicleCategory;
    baseCalculatedFare: number;
    offeredFare: number;
    nearbyDrivers: Driver[];

    // Express API Active State
    currentRide: Ride | null;
    estimate: RideEstimateResponse | null;
    backendEstimates: Record<string, number>;
    rideHistory: Ride[];
    isLoading: boolean;
    error: string | null;

    // Local Actions
    setPickup: (coords: Coordinates | null, address: string) => void;
    setDropoff: (coords: Coordinates | null, address: string) => void;
    setSelectedVehicle: (vehicleCategory: VehicleCategory) => void;
    setOfferedFare: (fare: number) => void;
    updateNearbyDrivers: (drivers: Driver[]) => void;
    resetBookingState: () => void;

    // Express API Actions
    getEstimate: (payload: RideEstimateRequest) => Promise<RideEstimateResponse>;
    requestRide: (payload: CreateRidePayload) => Promise<Ride>;
    fetchActiveRide: (rideId: string) => Promise<Ride>;
    fetchRideHistory: () => Promise<void>;
    acceptRideBid: (rideId: string) => Promise<Ride>;
    submitDriverCounterBid: (rideId: string, counterFare: number) => Promise<any>;
    acceptCounterBid: (rideId: string, bidId: string) => Promise<Ride>;
    updateRideStatus: (rideId: string, status: RideStatus) => Promise<Ride>;
}

// --- ZUSTAND STORE ---

export const useRideStore = create<RideState>((set, get) => ({
    // Local Booking Defaults
    pickup: null,
    dropoff: null,
    pickupAddress: '',
    dropoffAddress: '',
    distanceKm: 0,
    durationMins: 0,
    selectedVehicle: 'BIKE',
    baseCalculatedFare: 0,
    offeredFare: 0,
    nearbyDrivers: [],

    // API Defaults
    currentRide: null,
    estimate: null,
    backendEstimates: {},
    rideHistory: [],
    isLoading: false,
    error: null,

    // Local Actions
    setPickup: (coords, address) => set({ pickup: coords, pickupAddress: address }),
    setDropoff: (coords, address) => set({ dropoff: coords, dropoffAddress: address }),

    setSelectedVehicle: (vehicleCategory) => {
        const { backendEstimates } = get();
        const fare = backendEstimates[vehicleCategory] || get().baseCalculatedFare;
        set({
            selectedVehicle: vehicleCategory,
            baseCalculatedFare: fare,
            offeredFare: fare,
        });
    },

    setOfferedFare: (fare) => set({ offeredFare: fare }),
    updateNearbyDrivers: (drivers) => set({ nearbyDrivers: drivers }),

    resetBookingState: () => {
        set({
            pickup: null,
            dropoff: null,
            pickupAddress: '',
            dropoffAddress: '',
            distanceKm: 0,
            durationMins: 0,
            offeredFare: 0,
            baseCalculatedFare: 0,
            currentRide: null,
            estimate: null,
            backendEstimates: {},
            error: null,
        });
    },

    // 1. POST /ride/api/rides/estimate
    getEstimate: async (payload) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/ride/api/rides/estimate', payload);
            const data = response.data.data; // Postman shows payload is wrapped in "data"

            const distanceKm = Number((data.distanceKm || 0).toFixed(1));
            const durationMins = Math.ceil(data.durationMins || 0);

            // Extract the estimates map directly from response: { BIKE: 300, MINI: 600, COMFORT: 930 }
            const backendEstimates: Record<string, number> = {};
            if (data.estimates) {
                Object.entries(data.estimates).forEach(([typeKey, fareValue]) => {
                    backendEstimates[typeKey.toUpperCase()] = Number(fareValue);
                });
            }

            const currentVehicle = get().selectedVehicle || 'BIKE';
            const initialFare = backendEstimates[currentVehicle] || 0;

            set({
                estimate: data,
                distanceKm,
                durationMins,
                backendEstimates,
                baseCalculatedFare: initialFare,
                offeredFare: initialFare,
            });

            toast.success('Route estimated successfully!');
            return data;
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to estimate fare.';
            set({ error: msg });
            toast.error(msg);
            throw err;
        } finally {
            set({ isLoading: false });
        }
    },

    // 2. POST /ride/api/rides/request
    requestRide: async (payload) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/ride/api/rides/request', payload);
            const ride: Ride = response.data.data || response.data.ride || response.data;

            set({ currentRide: ride, estimate: null });
            toast.success('Ride requested! Searching for nearby drivers...');
            return ride;
        } catch (err: any) {
            const backendError =
                err.response?.data?.errors ||
                err.response?.data?.message ||
                'Failed to request ride.';

            const formattedError = Array.isArray(backendError)
                ? backendError.map((e) => e.message || e).join(', ')
                : backendError;

            console.error('Backend Request Ride Validation Failure:', backendError);

            set({ error: formattedError });
            toast.error(formattedError);
            throw err;
        } finally {
            set({ isLoading: false });
        }
    },

    // 3. GET /ride/api/rides/history/me
    fetchRideHistory: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get('/ride/api/rides/history/me');
            const history = response.data.data || response.data.rides || response.data;
            set({ rideHistory: history });
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to fetch ride history';
            set({ error: msg });
            toast.error(msg);
        } finally {
            set({ isLoading: false });
        }
    },

    // 4. GET /ride/api/rides/:id
    fetchActiveRide: async (rideId: string) => {
        try {
            const response = await api.get(`/ride/api/rides/${rideId}`);
            const ride: Ride = response.data.data || response.data.ride || response.data;
            set({ currentRide: ride });
            return ride;
        } catch (err: any) {
            console.error('Error fetching ride status:', err);
            throw err;
        }
    },

    // 5. PATCH /ride/api/rides/:id/accept
    acceptRideBid: async (rideId: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.patch(`/ride/api/rides/${rideId}/accept`);
            const ride: Ride = response.data.data || response.data;
            set({ currentRide: ride });
            toast.success('Ride offer accepted!');
            return ride;
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to accept bid.';
            set({ error: msg });
            toast.error(msg);
            throw err;
        } finally {
            set({ isLoading: false });
        }
    },

    // 6. POST /ride/api/rides/:id/counter
    submitDriverCounterBid: async (rideId: string, counterFare: number) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post(`/ride/api/rides/${rideId}/counter`, { counterFare });
            toast.success(`Counter offer of PKR ${counterFare} sent!`);
            return response.data.data || response.data;
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to submit counter offer.';
            set({ error: msg });
            toast.error(msg);
            throw err;
        } finally {
            set({ isLoading: false });
        }
    },

    // 7. PATCH /ride/api/rides/:id/counter/:bidId/accept
    acceptCounterBid: async (rideId: string, bidId: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.patch(`/ride/api/rides/${rideId}/counter/${bidId}/accept`);
            const ride: Ride = response.data.data || response.data;
            set({ currentRide: ride });
            toast.success('Counter offer accepted!');
            return ride;
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to accept counter offer.';
            set({ error: msg });
            toast.error(msg);
            throw err;
        } finally {
            set({ isLoading: false });
        }
    },

    // 8. PATCH /ride/api/rides/:id/status
    updateRideStatus: async (rideId: string, status: RideStatus) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.patch(`/ride/api/rides/${rideId}/status`, { status });
            const ride: Ride = response.data.data || response.data;
            set({ currentRide: ride });
            toast.success(`Ride status updated to ${status.replace('_', ' ')}`);
            return ride;
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to update ride status.';
            set({ error: msg });
            toast.error(msg);
            throw err;
        } finally {
            set({ isLoading: false });
        }
    },
}));