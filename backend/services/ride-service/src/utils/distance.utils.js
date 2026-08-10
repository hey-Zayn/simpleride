/**
 * Haversine formula distance calculation in kilometers.
 */
export const calculateDistanceInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
};

/**
 * Rates in PKR for vehicle options.
 */
export const PKR_PRICING_CONFIG = {
    BIKE: { baseFare: 70, ratePerKm: 25, ratePerMin: 3, minFare: 100 },
    MINI: { baseFare: 150, ratePerKm: 50, ratePerMin: 5, minFare: 200 },
    COMFORT: { baseFare: 250, ratePerKm: 75, ratePerMin: 8, minFare: 350 },
};

/**
 * Calculates system estimation for a specific vehicle type.
 */
export const calculatePkrFare = (vehicleType, distanceKm, durationMins) => {
    const config = PKR_PRICING_CONFIG[vehicleType] || PKR_PRICING_CONFIG.BIKE;
    const rawFare = config.baseFare + (distanceKm * config.ratePerKm) + (durationMins * config.ratePerMin);
    const roundedFare = Math.max(rawFare, config.minFare);

    // Round to nearest 10 PKR for easier cash handling
    return Math.round(roundedFare / 10) * 10;
};

/**
 * Enforces InDrive-style rider bidding constraints (-5% min, +15% max).
 */
export const validateRiderBid = (calculatedFarePkr, proposedBidPkr) => {
    const minBid = Math.floor((calculatedFarePkr * 0.95) / 10) * 10;
    const maxBid = Math.ceil((calculatedFarePkr * 1.15) / 10) * 10;

    const isValid = proposedBidPkr >= minBid && proposedBidPkr <= maxBid;
    return { isValid, minBid, maxBid, calculatedFarePkr };
};