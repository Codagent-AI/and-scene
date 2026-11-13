import type { Mode, StepMeta } from "../types";
export function Footer({
  steps,
  index,
  mode,
  go,
  next,
  prev,
}: {
  steps: StepMeta[];
  index: number;
  mode: Mode;
  go: (n: number) => void;
  next: () => void;
  prev: () => void;
}) {
  const step = steps[index];
  return (
    <footer
      data-presentation-footer=""
      style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}
    >
      <div data-presentation-marker="">
        {String(index + 1).padStart(2, "0")} /{" "}
        {String(steps.length).padStart(2, "0")} · {step.era}
      </div>
      {mode === "present" ? (
        <h1 data-presentation-present-title="">{step.title}</h1>
      ) : (
        <>
          <p data-presentation-caption="">{step.caption}</p>
          <nav data-presentation-controls="" aria-label="Steps">
            <button
              onClick={prev}
              disabled={index === 0}
              aria-label="Previous step"
            >
              ←
            </button>
            <div data-presentation-progress="">
              {steps.map((s, i) => (
                <button
                  key={s.id}
                  data-presentation-progress-entry=""
                  data-presentation-active={i === index ? "true" : "false"}
                  aria-current={i === index ? "step" : undefined}
                  aria-label={`Step ${i + 1}: ${s.title}`}
                  onClick={() => go(i)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={next}
              disabled={index === steps.length - 1}
              aria-label="Next step"
            >
              →
            </button>
          </nav>
        </>
      )}
    </footer>
  );
}
