import type { PresentationMode } from "../types";
export function Footer({
  mode,
  caption,
  index,
  count,
  onJump,
  onPrev,
  onNext,
}: {
  mode: PresentationMode;
  caption: string;
  index: number;
  count: number;
  onJump: (i: number) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <footer
      data-presentation-footer
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        minHeight: mode === "browse" ? 132 : 72,
      }}
    >
      {mode === "browse" && (
        <>
          <div data-presentation-caption>{caption}</div>
          <nav aria-label="Presentation navigation">
            {Array.from({ length: count }, (_, i) => (
              <button
                key={i}
                aria-label={`Step ${i + 1}`}
                aria-current={i === index ? "step" : undefined}
                data-active={i === index ? "true" : "false"}
                data-presentation-progress
                onClick={() => onJump(i)}
              >
                {i + 1}
              </button>
            ))}
            <button onClick={onPrev} aria-label="Previous step">
              Previous
            </button>
            <button onClick={onNext} aria-label="Next step">
              Next
            </button>
          </nav>
        </>
      )}
    </footer>
  );
}
