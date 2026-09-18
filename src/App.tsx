import "./App.css";
import { useCallback, useState } from "react";
import { SiteHeader } from "./components/SiteHeader";
import { Intro } from "./components/Intro";
import { KeycapStage } from "./components/KeycapStage";
import { ExpressionControls } from "./components/ExpressionControls";
import { ClickCounter } from "./components/ClickCounter";
import { InteractionGuide } from "./components/InteractionGuide";
import { ClickFeedback } from "./components/ClickFeedback";
import { usePersistentCount } from "./hooks/usePersistentCount";
import { useKeyClickSound } from "./hooks/useKeyClickSound";
import { useClickFeedback } from "./hooks/useClickFeedback";
import {
  getAutoFace,
  initialFaceStatuses,
  type FaceMode,
  type FaceVariant,
} from "./faceVariants";

export default function App() {
  const { count, increment, reset } = usePersistentCount();
  const playClickSound = useKeyClickSound();
  const { items, show, remove, clear } = useClickFeedback();
  const [mode, setMode] = useState<FaceMode>("auto");
  const [manualFace, setManualFace] = useState<FaceVariant>("default");
  const [faceStatuses, setFaceStatuses] = useState(initialFaceStatuses);
  const faceVariant = mode === "auto" ? getAutoFace(count) : manualFace;

  const onClick = useCallback(
    (x: number, y: number) => {
      increment();
      playClickSound();
      show(x, y);
    },
    [increment, playClickSound, show],
  );

  const onReset = useCallback(() => {
    reset();
    clear();
  }, [reset, clear]);

  return (
    <main className="app" onDragStart={(event) => event.preventDefault()}>
      <SiteHeader />
      <Intro />
      <KeycapStage
        faceVariant={faceVariant}
        onFaceStatus={setFaceStatuses}
        onClick={onClick}
      />
      <ExpressionControls
        mode={mode}
        faceVariant={faceVariant}
        statuses={faceStatuses}
        onModeChange={setMode}
        onFaceChange={setManualFace}
      />
      <ClickCounter count={count} onReset={onReset} />
      <InteractionGuide />
      <ClickFeedback items={items} onDone={remove} />
    </main>
  );
}
