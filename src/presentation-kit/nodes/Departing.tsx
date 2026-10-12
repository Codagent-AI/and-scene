import { AnimatePresence, motion } from "motion/react";
import type { HTMLMotionProps } from "motion/react";
import { ENTER_T } from "../constants";

/**
 * Wraps an entity that exists in one step but not the next. Render it with
 * `show` true while the entity is present and false once it should leave; the
 * entity stays mounted just long enough to animate out.
 *
 * `Departing` must itself stay mounted across the step change and be driven
 * only by `show` (a grouped scene keeps it mounted). If an ancestor unmounts,
 * the entity is removed without an exit animation.
 *
 * Class, style and data attributes are applied to the wrapper element so the
 * presentation can keep its own layout intact.
 */
export function Departing({
  children,
  show = true,
  ...props
}: HTMLMotionProps<"div"> & { show?: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="departing"
          data-presentation-departing
          exit={{ opacity: 0 }}
          transition={{ duration: ENTER_T }}
          {...props}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
