import type { Step, PresentationOptions } from "./types";
import { usePresentationNav } from "./usePresentationNav";
import { Stage } from "./Stage";
import { Header } from "./chrome/Header";
import { Footer } from "./chrome/Footer";
import { Toc } from "./chrome/Toc";
export function Presentation<T>({
  steps,
  title,
  initialMode = "browse",
  brand,
  attribution,
}: PresentationOptions & { steps: Step<T>[] }) {
  const nav = usePresentationNav(steps.length, initialMode);
  if (!steps.length) return <p role="alert">No presentation steps.</p>;
  return (
    <main
      data-presentation-root=""
      data-presentation-mode={nav.mode}
      data-step-count={steps.length}
      data-step-index={nav.index}
      onTouchStart={nav.onTouchStart}
      onTouchEnd={nav.onTouchEnd}
      style={{
        position: "relative",
        width: "100%",
        height: "100dvh",
        overflow: "hidden",
      }}
    >
      <Header
        title={nav.mode === "browse" ? steps[nav.index].title : title}
        brand={brand}
      />
      <button
        data-presentation-mode-toggle=""
        onClick={nav.toggle}
        aria-label={`Switch to ${nav.mode === "browse" ? "present" : "browse"} mode`}
        style={{ position: "absolute", top: 0, right: 0 }}
      >
        {nav.mode === "browse" ? "Present" : "Browse"}
      </button>
      {nav.mode === "browse" && (
        <Toc steps={steps} index={nav.index} go={nav.go} />
      )}
      <Stage steps={steps} index={nav.index} mode={nav.mode} />
      <Footer
        steps={steps}
        index={nav.index}
        mode={nav.mode}
        go={nav.go}
        prev={nav.prev}
        next={nav.next}
      />
      <div
        data-presentation-attribution-slot=""
        style={{ position: "absolute", bottom: 8, right: 12 }}
      >
        {attribution === undefined ? (
          <a
            data-presentation-attribution=""
            href="https://github.com/Codagent-AI/and-scene"
          >
            made by and-scene
          </a>
        ) : (
          attribution
        )}
      </div>
    </main>
  );
}
