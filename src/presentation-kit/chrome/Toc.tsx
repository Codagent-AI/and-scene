import { useViewport } from "../useFitScale";
import type { StepMeta } from "../types";
function eraEntries(steps: readonly StepMeta[]) {
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
  steps: readonly StepMeta[];
  index: number;
  go: (i: number) => void;
}) {
  const { width } = useViewport();
  if (width <= 900) return null;
  return (
    <nav data-presentation-toc="" aria-label="Sections">
      {eraEntries(steps).map((e) => (
        <button
          key={e.era}
          data-presentation-active={steps[index].era === e.era}
          aria-current={steps[index].era === e.era ? "step" : undefined}
          onClick={() => go(e.index)}
        >
          {e.era}
        </button>
      ))}
    </nav>
  );
}
