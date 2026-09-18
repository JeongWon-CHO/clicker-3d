import "./ExpressionControls.css";
import { ModeSelect } from "./ModeSelect";
import type { FaceSelection, FaceStatuses, FaceVariant } from "../faceVariants";

type Props = {
  selection: FaceSelection;
  faceVariant: FaceVariant;
  statuses: FaceStatuses;
  onSelectionChange: (selection: FaceSelection) => void;
};

export function ExpressionControls({
  selection,
  faceVariant,
  statuses,
  onSelectionChange,
}: Props) {
  return (
    <section
      className="expression-controls"
      aria-label="표정 설정"
      data-face={faceVariant}
    >
      <div className="mode-summary">
        <span className="mode-label">표정</span>
        <ModeSelect
          value={selection}
          statuses={statuses}
          onChange={onSelectionChange}
        />
      </div>
    </section>
  );
}
