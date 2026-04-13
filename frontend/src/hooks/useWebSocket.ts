import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const useWebSocket = (onMessage: (data: any) => void) => {
    const { user, token } = useAuth();
    const socketRef = useRef<WebSocket | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!token || !user) return;

        const tenantId = user.tenant_id;
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//localhost:8000/api/v1/ws/dispatch/${tenantId}?token=${token}`;

        const connect = () => {
            console.log('Connecting to WebSocket...', wsUrl);
            const socket = new WebSocket(wsUrl);

            socket.onopen = () => {
                console.log('WebSocket Connected');
                setConnected(true);
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    onMessage(data);
                } catch (e) {
                    console.error('Failed to parse WS message', e);
                }
            };

            socket.onclose = () => {
                console.log('WebSocket Disconnected. Reconnecting in 3s...');
                setConnected(false);
                setTimeout(connect, 3000);
            };

            socket.onerror = (error) => {
                console.error('WebSocket Error', error);
            };

            socketRef.current = socket;
        };

        connect();

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, [token, user]);

    return { connected };
};
