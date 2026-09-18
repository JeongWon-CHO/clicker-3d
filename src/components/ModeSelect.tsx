import "./ModeSelect.css";
import { useEffect, useId, useRef, useState } from "react";
import {
  faceVariants,
  type FaceSelection,
  type FaceStatuses,
} from "../faceVariants";

const options: { value: FaceSelection; label: string }[] = [
  { value: "auto", label: "Auto" },
  ...faceVariants.map((face) => ({
    value: face.id,
    label: `직접 선택 - ${face.shortLabel}`,
  })),
];

export function ModeSelect({
  value,
  onChange,
  statuses,
}: {
  value: FaceSelection;
  onChange: (value: FaceSelection) => void;
  statuses: FaceStatuses;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  const selected = options.findIndex((option) => option.value === value);
  const available = (value: FaceSelection) =>
    value === "auto" || statuses[value] === "ready";
  const show = () => {
    setActive(selected);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  return (
    <div
      ref={root}
      className="mode-select"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        type="button"
        className="mode-trigger"
        role="combobox"
        aria-label="표정 모드"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? id : undefined}
        aria-activedescendant={open ? `${id}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            event.preventDefault();
          } else if (event.key === "Tab") setOpen(false);
          else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!open) show();
            else
              setActive(
                (index) =>
                  (index +
                    (event.key === "ArrowDown" ? 1 : options.length - 1)) %
                  options.length,
              );
          } else if (open && (event.key === "Home" || event.key === "End")) {
            event.preventDefault();
            setActive(event.key === "Home" ? 0 : options.length - 1);
          } else if (open && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            if (available(options[active].value)) {
              onChange(options[active].value);
              setOpen(false);
            }
          }
        }}
      >
        {options[selected].label}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m3 4.5 3 3 3-3"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div
          id={id}
          className="mode-menu"
          role="listbox"
          aria-label="표정 모드 선택"
        >
          {options.map((option, index) => (
            <div
              key={option.value}
              id={`${id}-${index}`}
              role="option"
              aria-selected={value === option.value}
              aria-disabled={!available(option.value)}
              className={`mode-option${active === index ? " is-active" : ""}`}
              onPointerMove={() => setActive(index)}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => {
                if (!available(option.value)) return;
                onChange(option.value);
                setOpen(false);
              }}
            >
              <span>
                <strong>{option.label}</strong>
              </span>
              {value === option.value && <span aria-hidden="true">✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
