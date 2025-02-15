import { useState, useEffect } from "react";

export function useSentValue(value, delay = 1000) {
  const [sentValue, setSentValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSentValue(value);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return sentValue;
}
