import { useRef, useCallback } from "react";

export function useSwipe(callback) {
  const pointerStartX = useRef(null);

  const handlePointerDown = useCallback((e) => {
    pointerStartX.current = e.clientX;
  }, []);

  const handlePointerMove = useCallback(
    (e) => {
      if (pointerStartX.current === null) return;
      const currentX = e.clientX;
      const delta = currentX - pointerStartX.current; // Positive means dragging right
      pointerStartX.current = currentX;
      callback(delta);
    },
    [callback]
  );

  const handlePointerUpOrLeave = useCallback(() => {
    pointerStartX.current = null;
  }, []);

  return {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUpOrLeave,
    onPointerLeave: handlePointerUpOrLeave,
  };
}
