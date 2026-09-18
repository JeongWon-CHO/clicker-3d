import "./ClickCounter.css";
import { useEffect, useRef } from "react";

export function ClickCounter({
  count,
  onReset,
}: {
  count: number;
  onReset: () => void;
}) {
  const output = useRef<HTMLOutputElement>(null);
  const previous = useRef(count);

  useEffect(() => {
    const increased = count > previous.current;
    previous.current = count;
    if (!increased || matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    output.current?.getAnimations().forEach((animation) => animation.cancel());
    output.current?.animate(
      [{ transform: "scale(1.055)" }, { transform: "scale(1)" }],
      { duration: 180, easing: "ease-out" },
    );
  }, [count]);

  return (
    <section className="count-panel" aria-label="누적 클릭 수">
      <span className="count-label">TOTAL CLICKS</span>
      <output ref={output} data-testid="count">
        {count.toLocaleString("en-US")}
      </output>
      <button
        className="text-action reset-count"
        type="button"
        onClick={onReset}
      >
        클릭 수 초기화
      </button>
    </section>
  );
}
