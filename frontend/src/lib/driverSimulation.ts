import { Driver } from '@/store/useRideStore';

export function generateNearbyDrivers(
    centerLat: number,
    centerLng: number,
    count = 5
): Driver[] {
    const vehicleTypes: Array<'bike' | 'mini' | 'comfort'> = ['bike', 'mini', 'comfort'];

    return Array.from({ length: count }, (_, idx) => {
        // Generate small offsets (~0.5 - 1.5 km radius)
        const latOffset = (Math.random() - 0.5) * 0.02;
        const lngOffset = (Math.random() - 0.5) * 0.02;

        return {
            id: `driver-${idx + 1}`,
            lat: centerLat + latOffset,
            lng: centerLng + lngOffset,
            vehicleType: vehicleTypes[idx % vehicleTypes.length],
            bearing: Math.floor(Math.random() * 360),
        };
    });
}

export function animateDriverPositions(drivers: Driver[]): Driver[] {
    return drivers.map((driver) => {
        // Slight random drift simulating real-time driving
        const deltaLat = (Math.random() - 0.5) * 0.0004;
        const deltaLng = (Math.random() - 0.5) * 0.0004;

        return {
            ...driver,
            lat: driver.lat + deltaLat,
            lng: driver.lng + deltaLng,
            bearing: (driver.bearing + Math.floor(Math.random() * 20 - 10)) % 360,
        };
    });
}