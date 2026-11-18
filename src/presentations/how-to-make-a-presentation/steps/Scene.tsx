import { AnimatePresence, motion } from "motion/react";
import type { SceneProps } from "../../../presentation-kit/types";
import {
  entityMotion,
  newcomerMotion,
} from "../../../presentation-kit/constants";
import { visibleEntities } from "../entities";
export function Scene({ payload: beat }: SceneProps<number>) {
  return (
    <div data-presentation-layer="" style={{ position: "absolute", inset: 0 }}>
      <AnimatePresence>
        {visibleEntities(beat).map((e) => (
          <motion.div
            key={e.id}
            {...entityMotion}
            initial={newcomerMotion.initial}
            animate={newcomerMotion.animate}
            transition={{
              ...entityMotion.transition,
              opacity: newcomerMotion.transition,
            }}
            layoutId={`how-to:${e.id}`}
            data-presentation-entity={`how-to:${e.id}`}
            className={`entity entity-${e.id} ${e.id === "card2" && beat >= 8 ? "edited" : ""}`}
            style={{
              position: "absolute",
              left: e.x,
              top: e.y,
              width: e.w,
              height: e.h,
            }}
          >
            {e.id === "conversation" ? <svg className="conversation-arrows" aria-label="two-way conversation" viewBox="0 0 495 45" data-presentation-connection-from="how-to:you" data-presentation-connection-to="how-to:skill"><line x1="0" y1="22.5" x2="495" y2="22.5" stroke="currentColor" strokeWidth="1.5"/><path d="M8 14.5 L0 22.5 L8 30.5 M487 14.5 L495 22.5 L487 30.5" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg> : <strong data-presentation-reveal-label={e.id === "reveal" ? "" : undefined}>{e.label}</strong>}
            {e.id === "modify" && <svg aria-label="modify arc to edited card" viewBox="0 0 430 95" style={{position:'absolute',inset:0,width:'100%',height:'100%',overflow:'visible'}}><path d="M390 0 C390 65 20 0 20 85 M14 77 L20 85 L26 77" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4"/></svg>}
            {e.detail && <span>{e.detail}</span>}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
