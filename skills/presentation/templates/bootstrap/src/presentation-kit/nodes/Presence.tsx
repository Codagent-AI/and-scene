import type { ComponentPropsWithoutRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { EXIT_T } from '../constants'

export interface PresenceProps extends ComponentPropsWithoutRef<typeof motion.div> {
  present: boolean
}

// Exit counterpart to `Appear`.
//
// Steps that share a `groupKey` keep one scene instance mounted across the
// transition, so `Stage`'s own `AnimatePresence` only ever sees the scene host —
// never an entity removed *inside* a scene that persists. An entity rendered
// behind a plain condition is therefore unmounted synchronously and its `exit`
// transition never runs. Wrapping it here gives it its own presence boundary, so
// it stays mounted for the length of that transition and animates out.
//
// Like every other primitive this supplies motion behavior only: `exit` and
// `transition` are overridable, and no palette, spacing, or border is imposed.
export function Presence({
  present,
  children,
  exit = { opacity: 0 },
  transition = { duration: EXIT_T },
  ...rest
}: PresenceProps) {
  return (
    <AnimatePresence>
      {present ? (
        <motion.div
          data-presentation-node="presence"
          exit={exit}
          transition={transition}
          {...rest}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
