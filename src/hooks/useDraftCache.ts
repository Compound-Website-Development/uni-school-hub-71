import { useEffect, useRef, useState } from "react";

/** Saves in-progress input to this device so a dropped connection or reload never loses work. */
export function useDraftCache<T>(key: string | null, value: T, restore: (v: T) => void, delay = 600) {
  const [restored, setRestored] = useState(false);
  const restoredKey = useRef<string | null>(null);
  useEffect(() => {
    if (!key || restoredKey.current === key) return;
    restoredKey.current = key;
    try {
      const raw = localStorage.getItem("draft:" + key);
      if (raw) { restore(JSON.parse(raw)); setRestored(true); }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => {
    if (!key || restoredKey.current !== key) return;
    const t = setTimeout(() => {
      try { localStorage.setItem("draft:" + key, JSON.stringify(value)); } catch { /* storage full */ }
    }, delay);
    return () => clearTimeout(t);
  }, [key, value, delay]);
  const clear = () => { if (key) localStorage.removeItem("draft:" + key); setRestored(false); };
  return { restored, clear };
}
