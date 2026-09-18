import "./InteractionGuide.css";
export function InteractionGuide() {
  return (
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
  );
}
