import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export function useWebSocket() {
  const [connected, setConnected] = useState(false);
  const [stockUpdates, setStockUpdates] = useState([]);
  const [orderUpdates, setOrderUpdates] = useState([]);
  const [procurementEvents, setProcurementEvents] = useState([]);
  const clientRef = useRef(null);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 3000,
      onConnect: () => {
        setConnected(true);
        client.subscribe('/topic/stock', msg => {
          const data = JSON.parse(msg.body);
          setStockUpdates(prev => [data, ...prev.slice(0, 19)]);
        });
        client.subscribe('/topic/orders', msg => {
          const data = JSON.parse(msg.body);
          setOrderUpdates(prev => [data, ...prev.slice(0, 19)]);
        });
        client.subscribe('/topic/procurement', msg => {
          const data = JSON.parse(msg.body);
          setProcurementEvents(prev => [data, ...prev.slice(0, 9)]);
        });
      },
      onDisconnect: () => setConnected(false),
    });
    client.activate();
    clientRef.current = client;
    return () => client.deactivate();
  }, []);

  return { connected, stockUpdates, orderUpdates, procurementEvents };
}
