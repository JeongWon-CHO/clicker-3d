import { useCallback, useRef, useState } from "react";
import { KeycapScene } from "./components/KeycapScene";
import { ClickFeedback, type Feedback } from "./components/ClickFeedback";
import { usePersistentCount } from "./hooks/usePersistentCount";
import {
  faceVariants,
  initialFaceStatuses,
  type FaceVariant,
} from "./faceVariants";

export default function App() {
  const { count, increment, unavailable } = usePersistentCount();
  const [ready, setReady] = useState(false);
  const [faceVariant, setFaceVariant] = useState<FaceVariant>("default");
  const [faceStatuses, setFaceStatuses] = useState(initialFaceStatuses);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const sequence = useRef(0);
  const counter = useRef<HTMLOutputElement>(null);
  const onReady = useCallback(() => setReady(true), []);
  const onClick = useCallback(
    (x: number, y: number) => {
      increment();
      const id = ++sequence.current;
      setFeedback((items) => [...items.slice(-11), { id, x, y }]);
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
        counter.current
          ?.getAnimations()
          .forEach((animation) => animation.cancel());
        counter.current?.animate(
          [{ transform: "scale(1.055)" }, { transform: "scale(1)" }],
          { duration: 180, easing: "ease-out" },
        );
      }
    },
    [increment],
  );
  const onDone = useCallback(
    (id: number) =>
      setFeedback((items) => items.filter((item) => item.id !== id)),
    [],
  );

  return (
    <main className="app" onDragStart={(event) => event.preventDefault()}>
      <header className="header">
        <a className="wordmark" href="./" aria-label="Clicker 홈">
          <span className="brand-icon" />
          clicker<span className="brand-dot">.</span>
        </a>
      </header>
      <section className="intro">
        <h1>미쳐라</h1>
        <p>단 한 번도 열정이 식지 않은 것처럼...</p>
      </section>
      <section
        className="stage"
        aria-label="박종근을 누른다면?"
        data-ready={ready}
      >
        <div className="stage-halo" />
        <div className="stage-shadow" />
        <KeycapScene
          onClick={onClick}
          onReady={onReady}
          faceVariant={faceVariant}
          onFaceStatus={setFaceStatuses}
        />
        {!ready && (
          <div className="loading">
            키캡을 꺼내는 중<span>…</span>
          </div>
        )}
      </section>
      <div className="object-label">
        <span /> KEYCAP | Park Jongkeun
      </div>
      <div className="face-variants" role="group" aria-label="얼굴 표정">
        {faceVariants.map((variant) => (
          <button
            key={variant.id}
            type="button"
            aria-pressed={faceVariant === variant.id}
            disabled={faceStatuses[variant.id] !== "ready"}
            title={
              faceStatuses[variant.id] === "unavailable"
                ? "이미지 준비 중"
                : faceStatuses[variant.id] === "error"
                  ? "이미지를 불러오지 못했어요"
                  : undefined
            }
            onClick={() => setFaceVariant(variant.id)}
          >
            {variant.label}
            {faceStatuses[variant.id] === "loading"
              ? " · 로딩 중"
              : faceStatuses[variant.id] === "unavailable"
                ? " · 준비 중"
                : faceStatuses[variant.id] === "error"
                  ? " · 로딩 실패"
                  : ""}
          </button>
        ))}
      </div>
      <section className="count-panel" aria-label="누적 클릭 수">
        <span className="count-label">TOTAL CLICKS</span>
        <output ref={counter} data-testid="count">
          {count.toLocaleString("en-US")}
        </output>
      </section>
      <footer>
        <div className="gesture-hints">
          <span>
            <i className="tap-icon" />
            클릭해서 누르기
          </span>
          <span className="hint-divider" />
          <span>
            <i className="rotate-icon">↔</i>드래그해서 돌리기
          </span>
        </div>
      </footer>
      <ClickFeedback items={feedback} onDone={onDone} />
    </main>
  );
}
