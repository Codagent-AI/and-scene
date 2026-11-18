import type { ReactNode } from "react";
import type { Step, Mode } from "./types";
import { Stage } from "./Stage";
import { Header } from "./chrome/Header";
import { Footer } from "./chrome/Footer";
import { Toc } from "./chrome/Toc";
import { usePresentationNav } from "./usePresentationNav";
export function Presentation<T>({
  steps,
  title,
  initialMode = "browse",
  brand,
}: {
  steps: readonly Step<T>[];
  title: string;
  initialMode?: Mode;
  brand?: ReactNode;
}) {
  const nav = usePresentationNav(steps.length, initialMode);
  if (!steps.length) throw new Error("Presentation requires at least one step");
  return (
    <main
      aria-label={title}
      data-presentation-root=""
      data-presentation-mode={nav.mode}
      data-step-count={steps.length}
      data-step-index={nav.index}
      style={{
        position: "relative",
        width: "100%",
        height: "100dvh",
        overflow: "hidden",
      }}
      onTouchStart={nav.onTouchStart}
      onTouchEnd={nav.onTouchEnd}
    >
      <Header
        step={steps[nav.index]}
        index={nav.index}
        mode={nav.mode}
        brand={brand}
        toggle={nav.toggle}
      />
      <Stage step={steps[nav.index]} mode={nav.mode} />
      {nav.mode === "browse" && (
        <Toc steps={steps} index={nav.index} go={nav.go} />
      )}
      <Footer steps={steps} index={nav.index} mode={nav.mode} go={nav.go} />
      <a
        data-presentation-attribution=""
        href="https://github.com/Codagent-AI/and-scene"
        style={{ position: "absolute", bottom: 12, right: 16 }}
      >
        made by and-scene
      </a>
    </main>
  );
}
