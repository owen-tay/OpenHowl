// File: app/hooks/useLongPress.jsx
import { useCallback, useRef } from "react";

export function useLongPress(callback, ms = 500) { 
    const timerRef = useRef(null);
  
    const start = useCallback(
      (event) => {
        timerRef.current = setTimeout(() => {
          callback(event);
        }, ms);
      },
      [callback, ms]
    );
  
    const clear = useCallback(() => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    }, []);
  
    return {
      onMouseDown: start,
      onTouchStart: start,
      onMouseUp: clear,
      onMouseLeave: clear,
      onTouchEnd: clear,
    };
  }
  