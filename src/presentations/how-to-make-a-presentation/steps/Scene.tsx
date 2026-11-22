import { AnimatePresence, motion } from "motion/react";
import type { SceneProps } from "../../../presentation-kit/types";
import { entityMotion, newcomerMotion } from "../../../presentation-kit/constants";
import { visibleEntities } from "../entities";
import { DIAGRAM_TEXT_PX } from "../readability";

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
            transition={{ ...entityMotion.transition, opacity: newcomerMotion.transition }}
            layoutId={`how-to:${e.id}`}
            data-presentation-entity={`how-to:${e.id}`}
            className={`entity entity-${e.id} ${e.id === "card3" && beat >= 8 ? "edited" : ""}`}
            style={{ position: "absolute", left: e.x, top: e.y, width: e.w, height: e.h }}
          >
            {e.id === "conversation" && (
              <svg className="conversation-arrows" aria-label="two-way conversation" viewBox="0 0 560 45" data-presentation-connection-from="how-to:you" data-presentation-connection-to="how-to:skill">
                <line x1="0" y1="22.5" x2="560" y2="22.5" stroke="currentColor" strokeWidth="3" />
                <path d="M12 10.5 L0 22.5 L12 34.5 M548 10.5 L560 22.5 L548 34.5" stroke="currentColor" strokeWidth="3" fill="none" />
              </svg>
            )}
            {(e.id === "link1" || e.id === "link2") && (
              <svg className="morph-link" aria-label="morph: shared entity changes between cards" viewBox="0 0 40 130">
                <rect x="10" y="15" width="20" height="20" rx="3" fill="none" stroke="currentColor" strokeWidth="3" />
                <path d="M4 65 H36 M28 57 L36 65 L28 73" fill="none" stroke="currentColor" strokeWidth="3" />
                <rect x="4" y="94" width="32" height="20" rx="3" fill="none" stroke="currentColor" strokeWidth="3" />
              </svg>
            )}
            {e.label && (
              <div className={e.id === "verify" ? "verification-title" : "entity-title"}>
                <strong data-presentation-diagram-text="" data-presentation-reveal-label={e.id === "reveal" ? "" : undefined} style={{ fontSize: DIAGRAM_TEXT_PX }}>{e.label}</strong>
                {e.id === "verify" && <svg aria-label="verification passed" viewBox="0 0 24 24"><path d="M4 12 L10 18 L21 5" fill="none" stroke="currentColor" strokeWidth="3" /></svg>}
              </div>
            )}
            {e.id === "modify" && (
              <svg aria-label="modify arc to edited card" viewBox="0 0 260 50" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
                <path d="M235 0 C235 40 0 0 0 50 M-8 42 L0 50 L8 42" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="6 6" />
              </svg>
            )}
            {e.detail && <div className="entity-parts">{e.detail.split(' · ').map(part => <span key={part} data-presentation-diagram-text="" style={{ fontSize: DIAGRAM_TEXT_PX }}>{part}</span>)}</div>}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
