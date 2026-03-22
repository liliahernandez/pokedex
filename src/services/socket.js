import { io } from 'socket.io-client';

let socket;

export const initSocket = (token) => {
    if (socket) {
        socket.disconnect();
    }

    // Connect to the backend
    socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
        auth: {
            token: token
        }
    });

    socket.on('connect', () => {
        console.log('Connected to socket server');
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from socket server');
    });

    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
    });

    return socket;
};

export const getSocket = () => {
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
