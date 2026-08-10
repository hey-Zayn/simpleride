import { io, Socket } from 'socket.io-client';

// Gateway URL for notification socket (API Gateway running on port 8000)
const GATEWAY_URL = (process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8000').replace(/\/$/, '');

// Location service has its own Socket.IO server on a separate port
const LOCATION_URL = (process.env.NEXT_PUBLIC_LOCATION_SOCKET_URL || 'http://localhost:3002').replace(/\/$/, '');

// ─────────────────────────────────────────────────────────────────────────────
// 1. Notification Socket
//    Connects through API Gateway → notification-service
//    IMPORTANT: Use the DEFAULT Socket.IO path (/socket.io). Do NOT override
//    the path — a custom path causes the WS handshake to fail and floods the
//    console with infinite reconnect attempts.
// ─────────────────────────────────────────────────────────────────────────────
export const notificationSocket: Socket = io(GATEWAY_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'], // websocket first, fallback to polling
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Location Socket
//    Connects directly to location-service (separate Socket.IO server, port 3002)
//    Requires JWT auth token passed via socket.auth before connecting.
// ─────────────────────────────────────────────────────────────────────────────
export const locationSocket: Socket = io(LOCATION_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
});

/**
 * Attach JWT token to the location socket and connect.
 * Call this when an active ride begins (driver streaming / rider tracking).
 */
export const connectLocationSocket = (token: string) => {
  locationSocket.auth = { token };
  if (!locationSocket.connected) {
    locationSocket.connect();
  }
};

/**
 * Disconnect all sockets cleanly. Call on logout or app unmount.
 */
export const disconnectAllSockets = () => {
  if (notificationSocket.connected) notificationSocket.disconnect();
  if (locationSocket.connected) locationSocket.disconnect();
};
