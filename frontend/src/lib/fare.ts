export interface VehicleOption {
    id: 'bike' | 'mini' | 'comfort';
    name: string;
    icon: string;
    capacity: string;
    disabled?: boolean;
    baseFare: number;
    ratePerKm: number;
    ratePerMin: number;
    etaMins: number;
}

export const VEHICLE_TYPES: VehicleOption[] = [
    {
        id: 'bike',
        name: 'Bike',
        icon: '🏍️',
        capacity: '1 Seat',
        disabled: false,
        baseFare: 50,
        ratePerKm: 20,
        ratePerMin: 2,
        etaMins: 3,
    },
    {
        id: 'mini',
        name: 'Mini',
        icon: '🚗',
        capacity: '3 Seats',
        disabled: false,
        baseFare: 120,
        ratePerKm: 45,
        ratePerMin: 4,
        etaMins: 5,
    },
    {
        id: 'comfort',
        name: 'Comfort',
        icon: '🚘',
        capacity: '4 Seats',
        disabled: false,
        baseFare: 180,
        ratePerKm: 65,
        ratePerMin: 5,
        etaMins: 7,
    },
];

export function calculateFare(
    vehicle: VehicleOption,
    distanceKm: number,
    durationMins: number
): number {
    if (!distanceKm || !durationMins) return vehicle.baseFare;

    const fare =
        vehicle.baseFare +
        distanceKm * vehicle.ratePerKm +
        durationMins * vehicle.ratePerMin;

    return Math.round(fare);
}