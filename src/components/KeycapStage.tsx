import "./KeycapStage.css";
import { useCallback, useState } from "react";
import { KeycapScene } from "./KeycapScene";
import type { FaceStatuses, FaceVariant } from "../faceVariants";

type Props = {
  faceVariant: FaceVariant;
  onFaceStatus: (status: FaceStatuses) => void;
  onClick: (x: number, y: number) => void;
};

export function KeycapStage(props: Props) {
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  return (
    <>
      <section
        className="stage"
        aria-label="박종근을 누른다면?"
        data-ready={ready}
      >
        <div className="stage-halo" />
        <div className="stage-shadow" />
        <KeycapScene {...props} onReady={onReady} />
        {!ready && (
          <div className="loading">
            키캡을 꺼내는 중<span>…</span>
          </div>
        )}
      </section>
      <div className="object-label">
        <span /> KEYCAP | Park Jongkeun
      </div>
    </>
  );
}
