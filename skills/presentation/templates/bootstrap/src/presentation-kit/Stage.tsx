import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useId } from "react";
import type { Step, Mode } from "./types";
import { DESIGN_W, DESIGN_H, STAGE_LAYOUT } from "./constants";
import { useFitScale } from "./useFitScale";
import { stageKey } from "./stageKey";
export function Stage<T>({ step, mode }: { step: Step<T>; mode: Mode }) {
  const scale = useFitScale(mode);
  const id = useId();
  const Scene = step.Scene;
  return (
    <div
      data-presentation-stage=""
      style={{
        position: "absolute",
        inset: `${STAGE_LAYOUT[mode].top}px 0 ${STAGE_LAYOUT[mode].bottom}px`,
        display: "grid",
        placeItems: "center",
      }}
    >
      <div
        data-presentation-canvas=""
        style={{
          position: "relative",
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `scale(${scale})`,
          flexShrink: 0,
        }}
      >
        <LayoutGroup id={id}>
          <AnimatePresence mode="sync">
            <motion.div
              key={stageKey(step)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: "absolute", inset: 0 }}
            >
              <Scene payload={step.payload} />
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </div>
  );
}
