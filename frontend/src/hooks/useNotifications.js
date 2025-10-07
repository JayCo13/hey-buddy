import { useEffect, useRef, useState } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001/api/v1';

export function useNotifications() {
  const [lastEvent, setLastEvent] = useState(null);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    const userId = localStorage.getItem('user_id') || 'default_user';
    const url = new URL(`${API_BASE_URL}/notifications/stream`);
    if (userId) url.searchParams.append('user_id', userId);

    const es = new EventSource(url.toString());
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnected(true);
    };

    es.onerror = () => {
      setConnected(false);
      // Browsers auto-reconnect; no manual retry needed
    };

    es.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        setLastEvent(data);
      } catch (e) {
        // ignore parse errors
      }
    };

    return () => {
      es.close();
      setConnected(false);
    };
  }, []);

  return { lastEvent, connected };
}


