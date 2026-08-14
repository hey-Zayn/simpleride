'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Plus, Minus, Compass } from 'lucide-react';
import { type Driver } from '@/store/useRideStore';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface MapViewProps {
  pickup: Coordinates | null;
  dropoff: Coordinates | null;
  selectingMode?: 'pickup' | 'dropoff' | null;
  onSelectLocation?: (coords: Coordinates) => void;
  nearbyDrivers?: Driver[];
  driverCoords?: Coordinates | null;
  rideStatus?: string;
}

export default function MapView({
  pickup,
  dropoff,
  selectingMode,
  onSelectLocation,
  nearbyDrivers = [],
  driverCoords,
  rideStatus = 'SEARCHING',
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const dropoffMarkerRef = useRef<L.Marker | null>(null);
  const primaryRouteLayerRef = useRef<L.Polyline | null>(null);
  const primaryRouteOutlineRef = useRef<L.Polyline | null>(null);
  const secondaryRouteLayerRef = useRef<L.Polyline | null>(null);
  const lastFetchedRouteKeyRef = useRef<string>('');
  const driverMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const activeDriverMarkerRef = useRef<L.Marker | null>(null);

  const pickupLat = pickup?.lat;
  const pickupLng = pickup?.lng;
  const dropoffLat = dropoff?.lat;
  const dropoffLng = dropoff?.lng;
  const driverLat = driverCoords?.lat;
  const driverLng = driverCoords?.lng;

  // Initialize Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = pickupLat || driverLat || dropoffLat || 31.5204;
    const initialLng = pickupLng || driverLng || dropoffLng || 74.3587;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
    }).setView([initialLat, initialLng], 13);

    // Tile Layer with neutral background
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
      className: 'map-tile',
    }).addTo(map);

    // Zoom control at bottom right - minimal design
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    // Trigger map resize check
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Invalidate size when container resizes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map) {
      map.invalidateSize();
    }
  }, []);

  // Handle map click selection when selectingMode is active
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (selectingMode && onSelectLocation) {
        onSelectLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [selectingMode, onSelectLocation]);

  // Update Pickup Marker efficiently (Rider Location Icon)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (pickupLat !== undefined && pickupLng !== undefined) {
      const greenIcon = L.divIcon({
        className: 'custom-pickup-icon',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: rgba(31, 157, 85, 0.25); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="
              background: #141414;
              border: 3px solid #1F9D55;
              width: 36px;
              height: 36px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 6px 16px rgba(0,0,0,0.4);
              z-index: 2;
            ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1F9D55" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
          </div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      if (pickupMarkerRef.current) {
        pickupMarkerRef.current.setLatLng([pickupLat, pickupLng]);
      } else {
        pickupMarkerRef.current = L.marker([pickupLat, pickupLng], { icon: greenIcon })
          .addTo(map)
          .bindPopup('<b style="font-family: system-ui;">Rider Pickup Location</b>');
      }
    } else if (pickupMarkerRef.current) {
      map.removeLayer(pickupMarkerRef.current);
      pickupMarkerRef.current = null;
    }
  }, [pickupLat, pickupLng]);

  // Update Dropoff Marker efficiently (Destination Icon)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (dropoffLat !== undefined && dropoffLng !== undefined) {
      const redIcon = L.divIcon({
        className: 'custom-dropoff-icon',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="
              background: #141414;
              border: 3px solid #E3413F;
              width: 36px;
              height: 36px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 6px 16px rgba(0,0,0,0.4);
            ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E3413F" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                <line x1="4" y1="22" x2="4" y2="15"/>
              </svg>
            </div>
          </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      if (dropoffMarkerRef.current) {
        dropoffMarkerRef.current.setLatLng([dropoffLat, dropoffLng]);
      } else {
        dropoffMarkerRef.current = L.marker([dropoffLat, dropoffLng], { icon: redIcon })
          .addTo(map)
          .bindPopup('<b style="font-family: system-ui;">Destination Drop-off Location</b>');
      }
    } else if (dropoffMarkerRef.current) {
      map.removeLayer(dropoffMarkerRef.current);
      dropoffMarkerRef.current = null;
    }
  }, [dropoffLat, dropoffLng]);

  // Fetch and draw Dynamic Status-Based Routes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const clearRoutes = () => {
      if (primaryRouteOutlineRef.current) {
        map.removeLayer(primaryRouteOutlineRef.current);
        primaryRouteOutlineRef.current = null;
      }
      if (primaryRouteLayerRef.current) {
        map.removeLayer(primaryRouteLayerRef.current);
        primaryRouteLayerRef.current = null;
      }
      if (secondaryRouteLayerRef.current) {
        map.removeLayer(secondaryRouteLayerRef.current);
        secondaryRouteLayerRef.current = null;
      }
    };

    // Determine start and end coordinates based on status
    let origin: Coordinates | null = null;
    let destination: Coordinates | null = null;
    let secondaryDestination: Coordinates | null = null;

    const normalizedStatus = (rideStatus || '').toUpperCase();

    // Effective driver coordinates fallback when trip is active but socket GPS is initializing
    const effectiveDriverLat = driverLat ?? (['ACCEPTED', 'ARRIVED', 'IN_PROGRESS'].includes(normalizedStatus) && pickupLat ? pickupLat - 0.006 : undefined);
    const effectiveDriverLng = driverLng ?? (['ACCEPTED', 'ARRIVED', 'IN_PROGRESS'].includes(normalizedStatus) && pickupLng ? pickupLng - 0.006 : undefined);

    if (['ACCEPTED', 'ARRIVED'].includes(normalizedStatus) && effectiveDriverLat && effectiveDriverLng && pickupLat && pickupLng) {
      // Driver to Pickup Route
      origin = { lat: effectiveDriverLat, lng: effectiveDriverLng };
      destination = { lat: pickupLat, lng: pickupLng };
      if (dropoffLat && dropoffLng) {
        secondaryDestination = { lat: dropoffLat, lng: dropoffLng };
      }
    } else if (normalizedStatus === 'IN_PROGRESS' && dropoffLat && dropoffLng) {
      // Driver / Pickup to Destination Route
      origin = effectiveDriverLat && effectiveDriverLng ? { lat: effectiveDriverLat, lng: effectiveDriverLng } : (pickupLat && pickupLng ? { lat: pickupLat, lng: pickupLng } : null);
      destination = { lat: dropoffLat, lng: dropoffLng };
    } else if (pickupLat && pickupLng && dropoffLat && dropoffLng) {
      // Standard Pickup to Destination Route
      origin = { lat: pickupLat, lng: pickupLng };
      destination = { lat: dropoffLat, lng: dropoffLng };
    }

    if (origin && destination) {
      const routeKey = `${normalizedStatus}:${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}->${destination.lat.toFixed(4)},${destination.lng.toFixed(4)}`;
      if (lastFetchedRouteKeyRef.current === routeKey) {
        return;
      }
      lastFetchedRouteKeyRef.current = routeKey;

      const drawRoutes = async () => {
        try {
          // Primary Route
          const res = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${origin!.lng},${origin!.lat};${destination!.lng},${destination!.lat}?overview=full&geometries=geojson`
          );
          const data = await res.json();

          clearRoutes();

          if (data.routes && data.routes.length > 0) {
            const coordinates: [number, number][] = data.routes[0].geometry.coordinates;
            const routeLatLngs = coordinates.map((c) => [c[1], c[0]] as [number, number]);

            primaryRouteOutlineRef.current = L.polyline(routeLatLngs, {
              color: '#0A0A0A',
              weight: 9,
              opacity: 0.8,
              lineCap: 'round',
              lineJoin: 'round',
            }).addTo(map);

            const primaryColor = ['ACCEPTED', 'ARRIVED'].includes(normalizedStatus)
              ? '#2F6FED'
              : '#F47920';

            primaryRouteLayerRef.current = L.polyline(routeLatLngs, {
              color: primaryColor,
              weight: 6,
              opacity: 1.0,
              lineCap: 'round',
              lineJoin: 'round',
            }).addTo(map);

            // Bounds setup
            const allPoints: [number, number][] = [...routeLatLngs];
            if (secondaryDestination) {
              allPoints.push([secondaryDestination.lat, secondaryDestination.lng]);
            }
            map.fitBounds(L.latLngBounds(allPoints), { padding: [60, 60] });
          }

          // Secondary solid route (Pickup -> Dropoff when Driver is coming to pickup)
          if (secondaryDestination && destination) {
            try {
              const secRes = await fetch(
                `https://router.project-osrm.org/route/v1/driving/${destination.lng},${destination.lat};${secondaryDestination.lng},${secondaryDestination.lat}?overview=full&geometries=geojson`
              );
              const secData = await secRes.json();
              if (secData.routes && secData.routes.length > 0) {
                const secCoords: [number, number][] = secData.routes[0].geometry.coordinates;
                const secLatLngs = secCoords.map((c) => [c[1], c[0]] as [number, number]);

                secondaryRouteLayerRef.current = L.polyline(secLatLngs, {
                  color: '#F47920',
                  weight: 5,
                  opacity: 0.85,
                  lineCap: 'round',
                  lineJoin: 'round',
                }).addTo(map);
              }
            } catch {
              // Ignore secondary route failure gracefully
            }
          }
        } catch (err) {
          console.error('Routing error:', err);
          clearRoutes();
          const fallbackLatLngs: [number, number][] = [
            [origin!.lat, origin!.lng],
            [destination!.lat, destination!.lng],
          ];

          primaryRouteLayerRef.current = L.polyline(fallbackLatLngs, {
            color: '#F47920',
            weight: 6,
            opacity: 1.0,
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(map);

          map.fitBounds(L.latLngBounds(fallbackLatLngs), { padding: [60, 60] });
        }
      };

      drawRoutes();
    } else {
      lastFetchedRouteKeyRef.current = '';
      clearRoutes();
      if (driverLat && driverLng) {
        map.setView([driverLat, driverLng], 14);
      } else if (pickupLat !== undefined && pickupLng !== undefined) {
        map.setView([pickupLat, pickupLng], 14);
      }
    }
  }, [pickupLat, pickupLng, dropoffLat, dropoffLng, driverLat, driverLng, rideStatus]);

  // Synchronize Live Driver Radar Markers (Nearby drivers)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const currentDriverIds = new Set(nearbyDrivers.map((d) => d.id));

    // Remove markers for drivers no longer in radar
    driverMarkersRef.current.forEach((marker, id) => {
      if (!currentDriverIds.has(id)) {
        map.removeLayer(marker);
        driverMarkersRef.current.delete(id);
      }
    });

    // Render or smooth update active driver locations
    nearbyDrivers.forEach((driver) => {
      const svgIcon =
        driver.vehicleType === 'bike'
          ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F47920" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6h2l1.5 7h-4.5"/><path d="M12 17.5V14l-3-3 4-3 2 3"/></svg>`
          : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F47920" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H7c-.7 0-1.3.3-1.8.7C4.3 8.6 3 10 3 10s-2.7.6-4.5 1.1C.7 11.3 0 12.1 0 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`;

      const driverIcon = L.divIcon({
        className: 'driver-radar-marker',
        html: `
          <div style="
            background: #141414;
            border: 2px solid #F47920;
            width: 30px;
            height: 30px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.4);
            transform: rotate(${driver.bearing || 0}deg);
            transition: transform 0.3s ease;
          ">${svgIcon}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      if (driverMarkersRef.current.has(driver.id)) {
        const existingMarker = driverMarkersRef.current.get(driver.id)!;
        existingMarker.setLatLng([driver.lat, driver.lng]);
        existingMarker.setIcon(driverIcon);
      } else {
        const newMarker = L.marker([driver.lat, driver.lng], { icon: driverIcon }).addTo(map);
        driverMarkersRef.current.set(driver.id, newMarker);
      }
    });
  }, [nearbyDrivers]);

  // Synchronize Active Assigned Driver Live GPS Marker (Assigned Driver Icon)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const normalizedStatus = (rideStatus || '').toUpperCase();
    const targetLat = driverCoords?.lat ?? (['ACCEPTED', 'ARRIVED', 'IN_PROGRESS'].includes(normalizedStatus) && pickupLat ? pickupLat - 0.006 : undefined);
    const targetLng = driverCoords?.lng ?? (['ACCEPTED', 'ARRIVED', 'IN_PROGRESS'].includes(normalizedStatus) && pickupLng ? pickupLng - 0.006 : undefined);

    if (targetLat !== undefined && targetLng !== undefined) {
      const activeDriverIcon = L.divIcon({
        className: 'active-driver-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 50px; height: 50px; border-radius: 50%; background: rgba(244, 121, 32, 0.25); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="
              background: #141414;
              border: 3px solid #F47920;
              width: 40px;
              height: 40px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 6px 18px rgba(0,0,0,0.4);
              z-index: 2;
            ">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F47920" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H7c-.7 0-1.3.3-1.8.7C4.3 8.6 3 10 3 10s-2.7.6-4.5 1.1C.7 11.3 0 12.1 0 13v3c0 .6.4 1 1 1h2"/>
                <circle cx="7" cy="17" r="2"/>
                <path d="M9 17h6"/>
                <circle cx="17" cy="17" r="2"/>
              </svg>
            </div>
          </div>`,
        iconSize: [50, 50],
        iconAnchor: [25, 25],
      });

      if (activeDriverMarkerRef.current) {
        activeDriverMarkerRef.current.setLatLng([targetLat, targetLng]);
      } else {
        activeDriverMarkerRef.current = L.marker([targetLat, targetLng], { icon: activeDriverIcon })
          .addTo(map)
          .bindPopup('<b style="font-family: system-ui;">Assigned Driver (Live GPS Location)</b>');
      }
    } else if (activeDriverMarkerRef.current) {
      map.removeLayer(activeDriverMarkerRef.current);
      activeDriverMarkerRef.current = null;
    }
  }, [driverCoords, rideStatus, pickupLat, pickupLng]);

  return (
    <div className="relative w-full h-full min-h-[480px] overflow-hidden">
      {selectingMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-[var(--brand-primary)] border-2 border-[var(--ink)] px-4 py-2 rounded-full shadow-sm font-display text-xs font-bold text-[var(--ink)] animate-bounce">
          📍 Click anywhere on the map to set {selectingMode} location
        </div>
      )}

      <div ref={mapContainerRef} className="w-full h-full min-h-[480px]" />
    </div>
  );
}