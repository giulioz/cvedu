import { useState, useEffect, useRef, useCallback } from "react";

export function uuidv4() {
  return "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, function(c) {
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
  const [forceUpdate, set] = useState(0);
  useInterval(() => set(i => i + 1), timeout);
  return forceUpdate;
}

export function useThrottle(handlerFn: () => void, ms: number) {
  useEffect(() => {
    const timeout = setTimeout(handlerFn, ms);
    return () => clearTimeout(timeout);
  }, [handlerFn, ms]);
}

function removeBigData(obj: any) {
  const nObj = {};

  Object.keys(obj).forEach(uuid => {
    nObj[uuid] = { ...obj[uuid] };

    Object.keys(obj[uuid]).forEach(paramName => {
      if (
        nObj[uuid][paramName] instanceof ImageData ||
        nObj[uuid][paramName] instanceof HTMLImageElement
      ) {
        nObj[uuid][paramName] = null;
      }
    });
  });

  return nObj;
}

export function usePersistState<T>(
  value: T,
  setter: (value: T) => void,
  key: string,
  timeout = 1000
) {
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
  }, [key, setter]);

  const handler = useCallback(() => {
    try {
      const obj = value instanceof Array ? value : removeBigData(value);
      const persistedString = JSON.stringify(obj);
      window.localStorage.setItem(key, persistedString);
    } catch (e) {
      console.error("Error serializing", key, e);
    }
  }, [key, value]);

  useThrottle(handler, timeout);
}
