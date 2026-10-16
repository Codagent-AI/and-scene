import { motion } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'
import { EASE, ENTER_DELAY, ENTER_T } from '../constants'

/**
 * Wraps an entity that is new in this step: it fades in only after persisting
 * entities have finished their layout morph, and fades out when it departs.
 * `delay` (s) overrides the default wait. Do not wrap entities that continue across steps.
 */
export function Appear({ delay = ENTER_DELAY, ...props }: HTMLMotionProps<'div'> & { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: ENTER_T, delay, ease: EASE } }}
      exit={{ opacity: 0, transition: { duration: ENTER_T / 2 } }}
      {...props}
    />
  )
}
