'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Driver } from '@/store/useRideStore';

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
}

export default function MapView({
  pickup,
  dropoff,
  selectingMode,
  onSelectLocation,
  nearbyDrivers = [],
  driverCoords,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const dropoffMarkerRef = useRef<L.Marker | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const routeOutlineRef = useRef<L.Polyline | null>(null);
  const lastFetchedRouteKeyRef = useRef<string>('');
  const driverMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const activeDriverMarkerRef = useRef<L.Marker | null>(null);

  const pickupLat = pickup?.lat;
  const pickupLng = pickup?.lng;
  const dropoffLat = dropoff?.lat;
  const dropoffLng = dropoff?.lng;

  // Initialize Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = pickupLat || dropoffLat || 24.8607;
    const initialLng = pickupLng || dropoffLng || 67.0011;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
    }).setView([initialLat, initialLng], 13);

    // Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(map);

    // Zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    // Trigger map resize check to prevent lag/black canvas
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

  // Update Pickup Marker efficiently
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (pickupLat !== undefined && pickupLng !== undefined) {
      const greenIcon = L.divIcon({
        className: 'custom-pickup-icon',
        html: `
          <div style="
            background: #141414; 
            border: 3px solid #C1F11D; 
            width: 32px; 
            height: 32px; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: #C1F11D; 
            font-weight: bold; 
            font-size: 13px; 
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            font-family: sans-serif;
          ">A</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      if (pickupMarkerRef.current) {
        pickupMarkerRef.current.setLatLng([pickupLat, pickupLng]);
      } else {
        pickupMarkerRef.current = L.marker([pickupLat, pickupLng], { icon: greenIcon })
          .addTo(map)
          .bindPopup('<b>Pickup Location</b>');
      }
    } else if (pickupMarkerRef.current) {
      map.removeLayer(pickupMarkerRef.current);
      pickupMarkerRef.current = null;
    }
  }, [pickupLat, pickupLng]);

  // Update Dropoff Marker efficiently
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (dropoffLat !== undefined && dropoffLng !== undefined) {
      const redIcon = L.divIcon({
        className: 'custom-dropoff-icon',
        html: `
          <div style="
            background: #141414; 
            border: 3px solid #EF4444; 
            width: 32px; 
            height: 32px; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: #EF4444; 
            font-weight: bold; 
            font-size: 13px; 
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            font-family: sans-serif;
          ">B</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      if (dropoffMarkerRef.current) {
        dropoffMarkerRef.current.setLatLng([dropoffLat, dropoffLng]);
      } else {
        dropoffMarkerRef.current = L.marker([dropoffLat, dropoffLng], { icon: redIcon })
          .addTo(map)
          .bindPopup('<b>Drop-off Location</b>');
      }
    } else if (dropoffMarkerRef.current) {
      map.removeLayer(dropoffMarkerRef.current);
      dropoffMarkerRef.current = null;
    }
  }, [dropoffLat, dropoffLng]);

  // Fetch and draw Route Polyline from OSRM without unnecessary re-fetching
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const clearRoute = () => {
      if (routeOutlineRef.current) {
        map.removeLayer(routeOutlineRef.current);
        routeOutlineRef.current = null;
      }
      if (routeLayerRef.current) {
        map.removeLayer(routeLayerRef.current);
        routeLayerRef.current = null;
      }
    };

    if (
      pickupLat !== undefined &&
      pickupLng !== undefined &&
      dropoffLat !== undefined &&
      dropoffLng !== undefined
    ) {
      const routeKey = `${pickupLat},${pickupLng}->${dropoffLat},${dropoffLng}`;
      if (lastFetchedRouteKeyRef.current === routeKey) {
        return; // Don't refetch same route
      }
      lastFetchedRouteKeyRef.current = routeKey;

      const fetchRoute = async () => {
        try {
          const res = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${pickupLng},${pickupLat};${dropoffLng},${dropoffLat}?overview=full&geometries=geojson`
          );
          const data = await res.json();

          if (data.routes && data.routes.length > 0) {
            const coordinates: [number, number][] = data.routes[0].geometry.coordinates;
            const routeLatLngs = coordinates.map((c) => [c[1], c[0]] as [number, number]);

            clearRoute();

            routeOutlineRef.current = L.polyline(routeLatLngs, {
              color: '#141414',
              weight: 8,
              opacity: 0.8,
              lineCap: 'round',
              lineJoin: 'round',
            }).addTo(map);

            routeLayerRef.current = L.polyline(routeLatLngs, {
              color: '#C1F11D',
              weight: 5,
              opacity: 1,
              lineCap: 'round',
              lineJoin: 'round',
            }).addTo(map);

            const bounds = routeLayerRef.current.getBounds();
            map.fitBounds(bounds, { padding: [60, 60] });
          }
        } catch (err) {
          console.error('Routing error:', err);
          clearRoute();
          const fallbackLatLngs: [number, number][] = [
            [pickupLat, pickupLng],
            [dropoffLat, dropoffLng],
          ];

          routeOutlineRef.current = L.polyline(fallbackLatLngs, {
            color: '#141414',
            weight: 8,
            opacity: 0.8,
          }).addTo(map);

          routeLayerRef.current = L.polyline(fallbackLatLngs, {
            color: '#C1F11D',
            weight: 5,
            dashArray: '8, 8',
          }).addTo(map);

          map.fitBounds(L.latLngBounds(fallbackLatLngs), { padding: [60, 60] });
        }
      };

      fetchRoute();
    } else {
      lastFetchedRouteKeyRef.current = '';
      clearRoute();
      if (pickupLat !== undefined && pickupLng !== undefined) {
        map.setView([pickupLat, pickupLng], 14);
      } else if (dropoffLat !== undefined && dropoffLng !== undefined) {
        map.setView([dropoffLat, dropoffLng], 14);
      }
    }
  }, [pickupLat, pickupLng, dropoffLat, dropoffLng]);

  // Synchronize Live Driver Radar Markers
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
      const iconEmoji =
        driver.vehicleType === 'bike'
          ? '🏍️'
          : driver.vehicleType === 'mini'
          ? '🚗'
          : '🚘';

      const driverIcon = L.divIcon({
        className: 'driver-radar-marker',
        html: `
          <div style="
            background: #141414;
            border: 2px solid #C1F11D;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            transform: rotate(${driver.bearing}deg);
            transition: transform 0.3s ease;
          ">${iconEmoji}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
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

  // Synchronize Active Assigned Driver Live GPS Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (driverCoords?.lat && driverCoords?.lng) {
      const activeDriverIcon = L.divIcon({
        className: 'active-driver-marker',
        html: `
          <div style="
            background: #141414;
            border: 3px solid #C1F11D;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
          ">🚗</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      if (activeDriverMarkerRef.current) {
        activeDriverMarkerRef.current.setLatLng([driverCoords.lat, driverCoords.lng]);
      } else {
        activeDriverMarkerRef.current = L.marker([driverCoords.lat, driverCoords.lng], { icon: activeDriverIcon })
          .addTo(map)
          .bindPopup('<b>Assigned Driver (Live GPS)</b>');
      }
    } else if (activeDriverMarkerRef.current) {
      map.removeLayer(activeDriverMarkerRef.current);
      activeDriverMarkerRef.current = null;
    }
  }, [driverCoords]);

  return (
    <div className="relative w-full h-full min-h-[480px] overflow-hidden shadow-[4px_4px_0px_0px_#141414]">
      {selectingMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-[#C1F11D] border-2 border-[#141414] px-4 py-2 rounded-full shadow-md font-display text-xs font-bold text-[#141414] animate-bounce">
          📍 Click anywhere on the map to set {selectingMode} location
        </div>
      )}

      <div ref={mapContainerRef} className="w-full h-full min-h-[480px]" />
    </div>
  );
}