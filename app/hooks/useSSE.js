// hooks/useSSE.js
import { useState, useEffect } from "react";

export default function useSSE(url) {
  const [eventData, setEventData] = useState(null);

  useEffect(() => {
    console.log("Connecting to SSE URL:", url);
    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      console.log("SSE connection opened.");
    };

    eventSource.onmessage = (e) => {
      console.log("Received SSE message:", e.data);
      try {
        const parsedData = JSON.parse(e.data);
        setEventData(parsedData);
      } catch (err) {
        console.error("Error parsing SSE data:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE connection error:", err);
      eventSource.close();
    };

    return () => {
      console.log("Closing SSE connection.");
      eventSource.close();
    };
  }, [url]);

  return eventData;
}
