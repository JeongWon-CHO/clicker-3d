export type Feedback = { id: number; x: number; y: number };

export function ClickFeedback({
  items,
  onDone,
}: {
  items: Feedback[];
  onDone: (id: number) => void;
}) {
  return (
    <div className="feedback-layer" aria-hidden="true">
      {items.map((item) => (
        <span
          key={item.id}
          className="click-feedback"
          style={{ left: item.x, top: item.y }}
          onAnimationEnd={() => onDone(item.id)}
        >
          +1
        </span>
      ))}
    </div>
  );
}
