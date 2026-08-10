'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { notificationSocket, locationSocket } from '@/lib/sockets';

interface SocketContextType {
  notificationSocket: typeof notificationSocket;
  locationSocket: typeof locationSocket;
}

const SocketContext = createContext<SocketContextType>({
  notificationSocket,
  locationSocket,
});

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    // Clean up connections on app unmount
    return () => {
      if (notificationSocket.connected) notificationSocket.disconnect();
      if (locationSocket.connected) locationSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ notificationSocket, locationSocket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSockets = () => useContext(SocketContext);