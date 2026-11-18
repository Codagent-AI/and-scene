import type { ReactNode } from "react";
import type { StepMeta, Mode } from "../types";
export function Header({
  step,
  index,
  mode,
  brand,
  toggle,
}: {
  step: StepMeta;
  index: number;
  mode: Mode;
  brand?: ReactNode;
  toggle: () => void;
}) {
  return (
    <header data-presentation-header="">
      <div>{brand}</div>
      <span data-presentation-marker="">
        {String(index + 1).padStart(2, "0")} / {step.era}
      </span>
      {mode === "browse" && <h1 data-presentation-title="">{step.title}</h1>}
      <button data-presentation-mode-toggle="" onClick={toggle}>
        {" "}
        {mode === "browse" ? "Present" : "Browse"} <kbd>P</kbd>
      </button>
    </header>
  );
}
