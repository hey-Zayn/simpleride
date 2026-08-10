export type RideStatus =
    | 'REQUESTED'
    | 'ACCEPTED'
    | 'ARRIVED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED';

export interface LocationPoint {
    lat: number;
    lng: number;
    address: string;
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
    fare: number;
    distanceKm: number;
    durationMins: number;
    vehicleOptions?: {
        type: 'BIKE' | 'CAR';
        fare: number;
        estimatedMins: number;
    }[];
}

export interface CreateRidePayload {
    pickupLat: number;
    pickupLng: number;
    pickupAddress: string;
    dropoffLat: number;
    dropoffLng: number;
    dropoffAddress: string;
}

export interface Ride {
    id: string;
    riderId: string;
    driverId: string | null;
    pickupLat: number;
    pickupLng: number;
    pickupAddress: string;
    dropoffLat: number;
    dropoffLng: number;
    dropoffAddress: string;
    status: RideStatus;
    fare: number;
    distanceKm: number;
    durationMins: number;
    otp: string | null;
    createdAt: string;
    updatedAt: string;
}