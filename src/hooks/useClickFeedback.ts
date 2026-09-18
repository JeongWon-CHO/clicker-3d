import { useCallback, useRef, useState } from "react";
import type { Feedback } from "../components/ClickFeedback";

export function useClickFeedback() {
  const [items, setItems] = useState<Feedback[]>([]);
  const sequence = useRef(0);
  const show = useCallback((x: number, y: number) => {
    const id = ++sequence.current;
    setItems((previous) => [...previous.slice(-11), { id, x, y }]);
  }, []);
  const remove = useCallback((id: number) => {
    setItems((previous) => previous.filter((item) => item.id !== id));
  }, []);
  const clear = useCallback(() => setItems([]), []);
  return { items, show, remove, clear };
}
