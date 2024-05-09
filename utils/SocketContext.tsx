/* eslint-disable */

import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { SOCKET_URI, API_KEY } from "@env"
import io, { Socket } from 'socket.io-client';


interface SocketContextType {
    socket: Socket | null;
}

interface ParentComponentProps {
    children?: ReactNode; // Specify ReactNode as the type of children
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const useSocket = (): SocketContextType => useContext(SocketContext);

const SocketProvider: React.FC<ParentComponentProps>  = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  const url: string = SOCKET_URI;

  useEffect(() => {
    const newSocket = io(url, {
      query: {
        apiKey: API_KEY
      }
    });

    setSocket(newSocket);

    
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{socket}}>
      {children}
    </SocketContext.Provider>
  );
};

export { SocketContext, SocketProvider };
