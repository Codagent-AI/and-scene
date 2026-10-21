import { motion, type HTMLMotionProps } from 'motion/react'
import { ENTER_DELAY, ENTER_T } from '../constants.ts'

type AppearProps = Omit<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'exit'> & {
  /** Seconds to wait; defaults to the full layout morph duration. */
  delay?: number
}

/**
 * Enters newcomers after persisting entities have finished moving. Wrap only
 * entities that are new in a step; continuing entities stay outside it.
 * Place inside an AnimatePresence to also animate departures. A wrapper cannot be
 * added to or removed from an entity that stays mounted without remounting it, so
 * when newcomer status varies per step, spread `appearMotion(isNewcomer)` onto the
 * entity instead.
 */
export function Appear({ delay = ENTER_DELAY, style, ...rest }: AppearProps) {
  return (
    <motion.div
      data-presentation-appear=""
      {...rest}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { ...ENTER_T, delay } }}
      exit={{ opacity: 0, transition: ENTER_T }}
      style={{ ...style, position: 'absolute', inset: 0, pointerEvents: 'none' }}
    />
  )
}
