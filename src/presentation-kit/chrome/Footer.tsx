import type { StepMeta, Mode } from "../types";
export function Footer({
  steps,
  index,
  mode,
  go,
}: {
  steps: readonly StepMeta[];
  index: number;
  mode: Mode;
  go: (i: number) => void;
}) {
  return (
    <footer data-presentation-footer="">
      {mode === "present" ? (
        <h1 data-presentation-title="">{steps[index].title}</h1>
      ) : (
        <>
          <p data-presentation-caption="">{steps[index].caption}</p>
          <nav aria-label="Steps" data-presentation-navigation="">
            <button
              aria-label="Previous step"
              disabled={index === 0}
              onClick={() => go(index - 1)}
            >
              ←
            </button>
            <div data-presentation-progress="">
              {steps.map((s, i) => (
                <button
                  key={s.id}
                  aria-label={`Step ${i + 1}: ${s.title}`}
                  aria-current={i === index ? "step" : undefined}
                  data-presentation-active={i === index}
                  onClick={() => go(i)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              aria-label="Next step"
              disabled={index === steps.length - 1}
              onClick={() => go(index + 1)}
            >
              →
            </button>
          </nav>
        </>
      )}
    </footer>
  );
}
