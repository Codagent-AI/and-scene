import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { DESIGN_W, DESIGN_H, EASE, LAYOUT_T, STAGE_LAYOUT } from "./constants";
import type { Mode, Step } from "./types";
import { useFitScale } from "./useFitScale";
export function groupStart<T>(steps: Step<T>[], index: number) {
  const step = steps[index];
  if (!step.groupKey) return index;
  while (
    index > 0 &&
    steps[index - 1].groupKey === step.groupKey &&
    steps[index - 1].Scene === step.Scene
  )
    index--;
  return index;
}
export function Stage<T>({
  steps,
  index,
  mode,
}: {
  steps: Step<T>[];
  index: number;
  mode: Mode;
}) {
  const scale = useFitScale(mode);
  const step = steps[index];
  const Scene = step.Scene;
  const layout = STAGE_LAYOUT[mode];
  return (
    <div
      data-presentation-stage=""
      style={{
        position: "absolute",
        top: layout.top,
        bottom: layout.bottom,
        left: layout.side,
        right: layout.side,
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
      }}
    >
      <div
        key={mode}
        style={{
          width: DESIGN_W * scale,
          height: DESIGN_H * scale,
          position: "relative",
        }}
      >
        <div
          data-presentation-canvas=""
          style={{
            position: "absolute",
            width: DESIGN_W,
            height: DESIGN_H,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <LayoutGroup>
            <AnimatePresence initial={false} mode="sync">
              <motion.div
                key={groupStart(steps, index)}
                data-presentation-scene=""
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: LAYOUT_T, ease: EASE }}
                style={{ position: "absolute", inset: 0 }}
              >
                <Scene payload={step.payload} />
              </motion.div>
            </AnimatePresence>
          </LayoutGroup>
        </div>
      </div>
    </div>
  );
}
