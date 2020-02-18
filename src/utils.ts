import { useState, useEffect, useRef } from "react";

export function uuidv4() {
  return "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function useInterval(callback: () => void, delay: number) {
  const savedCallback = useRef<() => void>();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

export function usePeriodicRerender(timeout: number) {
  const forceUpdate = useState(0)[1];
  useInterval(() => forceUpdate(i => i + 1), timeout);
}

export function usePersistState<T>(value: T, setter: (value: T) => void, key: string) {
  useEffect(() => {
    const persistedString = window.localStorage.getItem(key);
    if (persistedString) {
      try {
        const persistedJSON = JSON.parse(persistedString);
        setter(persistedJSON);
      } catch (e) {
        console.error("Error deserializing", key, e);
      }
    }
  }, [])

  useEffect(() => {
    try {
      const persistedString = JSON.stringify(value);
      window.localStorage.setItem(key, persistedString)
    } catch (e) {
      console.error("Error serializing", key, e);
    }
  }, [value])
}
