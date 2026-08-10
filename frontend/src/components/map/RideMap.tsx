'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';

// Custom SVG Location Pin for Live Driver Location
const createLocationPinIcon = () =>
  L.divIcon({
    className: 'custom-location-marker',
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
      ">
        <div style="
          position: absolute;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: rgba(59, 130, 246, 0.25);
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          position: relative;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background-color: #2563eb;
          border: 3px solid white;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

// Standard Pin Icons for Pickup and Dropoff
const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const dropoffIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Coordinates {
  lat: number;
  lng: number;
}

interface RideMapProps {
  pickup?: Coordinates | null;
  dropoff?: Coordinates | null;
  driverLocation?: Coordinates | null;
  showDriverMarker?: boolean;
}

// Auto-recenter map when live location changes
function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center[0] && center[1]) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
}

export default function RideMap({
  pickup,
  dropoff,
  driverLocation,
  showDriverMarker = true,
}: RideMapProps) {
  // Use actual driver location if available; otherwise fallback to pickup or default coordinates
  const activeCenter: [number, number] = driverLocation
    ? [driverLocation.lat, driverLocation.lng]
    : pickup
    ? [pickup.lat, pickup.lng]
    : [31.5204, 74.3587];

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={activeCenter}
        zoom={16}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Dynamic Center Controller */}
        <MapRecenter center={activeCenter} />

        {/* Live Location Marker (Blue Dot with Pulse Effect) */}
        {showDriverMarker && driverLocation && (
          <Marker
            position={[driverLocation.lat, driverLocation.lng]}
            icon={createLocationPinIcon()}
          >
            <Popup>Your Live Location</Popup>
          </Marker>
        )}

        {/* Pickup Pin */}
        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
            <Popup>Pickup Location</Popup>
          </Marker>
        )}

        {/* Dropoff Pin */}
        {dropoff && (
          <Marker position={[dropoff.lat, dropoff.lng]} icon={dropoffIcon}>
            <Popup>Drop-off Location</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}