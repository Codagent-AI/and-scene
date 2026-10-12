import type { Step } from "../types";
export function Toc<T>({
  steps,
  index,
  onJump,
}: {
  steps: readonly Step<T>[];
  index: number;
  onJump: (i: number) => void;
}) {
  const eras = [...new Set(steps.map((s) => s.era))];
  return (
    <nav
      data-presentation-toc
      aria-label="Table of contents"
      style={{ position: "absolute", left: 0, top: 80 }}
    >
      {eras.map((era) => {
        const first = steps.findIndex((s) => s.era === era);
        const active = steps[index]?.era === era;
        return (
          <button
            key={era}
            onClick={() => onJump(first)}
            aria-current={active ? "true" : undefined}
            data-active={active ? "true" : "false"}
            data-presentation-toc-entry
          >
            {era}
          </button>
        );
      })}
    </nav>
  );
}
