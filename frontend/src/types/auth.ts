export type UserRole = 'RIDER' | 'DRIVER';
export type DriverStatus = 'ONLINE' | 'OFFLINE' | 'BUSY';
export type VehicleType = 'BIKE' | 'MINI' | 'COMFORT';

export interface User {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role: UserRole;
    driverStatus?: DriverStatus;
    vehicleType?: VehicleType;
    vehicleNumber?: string;
    licenseNumber?: string;
}

export interface RegisterPayload {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    role: UserRole;
    vehicleType?: VehicleType;
    vehicleNumber?: string;
    licenseNumber?: string;
}

export interface LoginPayload {
    email: string;
    password: string;
}