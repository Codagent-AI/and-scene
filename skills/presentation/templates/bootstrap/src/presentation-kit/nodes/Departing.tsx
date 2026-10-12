import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { ENTER_T } from "../constants";

/**
 * Wraps an entity that exists in one step but not the next. Render it with
 * `show` true while the entity is present and false once it should leave; the
 * entity stays mounted just long enough to animate out.
 */
export function Departing({
  children,
  show = true,
}: {
  children: ReactNode;
  show?: boolean;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="departing"
          data-presentation-departing
          exit={{ opacity: 0 }}
          transition={{ duration: ENTER_T }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
