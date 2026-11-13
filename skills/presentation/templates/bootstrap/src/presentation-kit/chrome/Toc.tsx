import "../layout.css";
import type { StepMeta } from "../types";
export function eras(steps: StepMeta[]) {
  return steps.flatMap((s, i) =>
    steps.findIndex((t) => t.era === s.era) === i
      ? [{ era: s.era, index: i }]
      : [],
  );
}
export function Toc({
  steps,
  index,
  go,
}: {
  steps: StepMeta[];
  index: number;
  go: (n: number) => void;
}) {
  return (
    <nav data-presentation-toc="" aria-label="Sections">
      {eras(steps).map((e) => (
        <button
          key={e.era}
          data-presentation-toc-entry=""
          data-presentation-active={
            steps[index].era === e.era ? "true" : "false"
          }
          aria-current={steps[index].era === e.era ? "step" : undefined}
          onClick={() => go(e.index)}
        >
          {e.era}
        </button>
      ))}
    </nav>
  );
}
