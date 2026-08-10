'use client';

import { useState, useEffect, useRef } from 'react';

export interface LocationCoords {
    lat: number;
    lng: number;
    heading?: number | null;
    speed?: number | null;
}

export function useDriverLocation(isOnline: boolean) {
    const [location, setLocation] = useState<LocationCoords | null>(null);
    const [error, setError] = useState<string | null>(null);
    const watchIdRef = useRef<number | null>(null);

    useEffect(() => {
        if (!isOnline) {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
            return;
        }

        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser.');
            return;
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude, heading, speed } = pos.coords;
                const newCoords: LocationCoords = {
                    lat: latitude,
                    lng: longitude,
                    heading,
                    speed,
                };
                setLocation(newCoords);

                // TODO: Socket/API ping to backend
                // sendLocationToBackend(newCoords);
            },
            (err) => setError(err.message),
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 2000,
            }
        );

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, [isOnline]);

    return { location, error };
}