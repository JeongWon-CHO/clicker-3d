import { useCallback, useEffect, useRef, useState } from "react";

export const STORAGE_KEY = "clicker:count:v1";

function readCount() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const value = raw === null ? 0 : Number(raw);
    return {
      count: Number.isSafeInteger(value) && value >= 0 ? value : 0,
      unavailable: false,
    };
  } catch {
    return { count: 0, unavailable: true };
  }
}

export function usePersistentCount() {
  const [initial] = useState(readCount);
  const [count, setCount] = useState(initial.count);
  const [unavailable, setUnavailable] = useState(initial.unavailable);
  const latest = useRef(initial.count);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    if (!dirty.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, String(latest.current));
      dirty.current = false;
      setUnavailable(false);
    } catch {
      setUnavailable(true);
    }
  }, []);

  const increment = useCallback(() => {
    latest.current = Math.min(Number.MAX_SAFE_INTEGER, latest.current + 1);
    setCount(latest.current);
    dirty.current = true;
    // Trailing throttle: sustained tapping is persisted at most four times a second.
    if (timer.current === null) timer.current = setTimeout(flush, 250);
  }, [flush]);

  const reset = useCallback(() => {
    latest.current = 0;
    setCount(0);
    dirty.current = true;
    // Cancel any pending click write and persist the explicit reset immediately.
    flush();
  }, [flush]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
      flush();
    };
  }, [flush]);

  return { count, increment, reset, unavailable };
}
