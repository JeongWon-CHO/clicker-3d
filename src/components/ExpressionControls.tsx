import "./ExpressionControls.css";
import { ModeSelect } from "./ModeSelect";
import {
  faceVariants,
  type FaceMode,
  type FaceStatuses,
  type FaceVariant,
} from "../faceVariants";

type Props = {
  mode: FaceMode;
  faceVariant: FaceVariant;
  statuses: FaceStatuses;
  onModeChange: (mode: FaceMode) => void;
  onFaceChange: (face: FaceVariant) => void;
};

export function ExpressionControls({
  mode,
  faceVariant,
  statuses,
  onModeChange,
  onFaceChange,
}: Props) {
  return (
    <section
      className="expression-controls"
      aria-label="표정 설정"
      data-face={faceVariant}
    >
      <div className="mode-summary">
        <span className="mode-label">표정</span>
        <ModeSelect value={mode} onChange={onModeChange} />
      </div>
      {mode === "manual" && (
        <div
          className="face-variants face-options"
          role="group"
          aria-label="얼굴 표정"
        >
          {faceVariants.map((variant) => {
            const status = statuses[variant.id];
            const title =
              status === "unavailable"
                ? "이미지 준비 중"
                : status === "error"
                  ? "이미지를 불러오지 못했어요"
                  : undefined;
            const suffix =
              status === "loading"
                ? " · 로딩 중"
                : status === "unavailable"
                  ? " · 준비 중"
                  : status === "error"
                    ? " · 로딩 실패"
                    : "";
            return (
              <button
                key={variant.id}
                aria-label={variant.label}
                type="button"
                aria-pressed={faceVariant === variant.id}
                disabled={status !== "ready"}
                title={title}
                onClick={() => onFaceChange(variant.id)}
              >
                {variant.shortLabel}
                {suffix}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
