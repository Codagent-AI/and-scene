import { useViewport } from "../useViewport";
import type { StepMeta } from "../types";
export function Toc({
  steps,
  index,
  go,
}: {
  steps: StepMeta[];
  index: number;
  go: (n: number) => void;
}) {
  const { w } = useViewport();
  if (w <= 760) return null;
  const eras = steps.flatMap((s, i) =>
    i === 0 || s.era !== steps[i - 1].era ? [{ era: s.era, index: i }] : [],
  );
  return (
    <nav data-presentation-toc="" aria-label="Sections">
      {eras.map((era, i) => {
        const active =
          index >= era.index && index < (eras[i + 1]?.index ?? steps.length);
        return (
          <button
            key={era.index}
            data-presentation-active={active}
            aria-current={active ? "step" : undefined}
            onClick={() => go(era.index)}
          >
            {era.era}
          </button>
        );
      })}
    </nav>
  );
}
