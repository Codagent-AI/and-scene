import { motion, type HTMLMotionProps } from 'motion/react'
import { ENTER_DELAY, ENTER_T } from '../constants.ts'

/**
 * Entrance wrapper for newcomers. It waits `ENTER_DELAY` so persisting entities
 * finish their layout move first; it fades out when its key leaves the scene.
 * It animates only on mount, so entities that persist are never re-faded.
 */
export function Appear({ delay = ENTER_DELAY, ...rest }: HTMLMotionProps<'div'> & { delay?: number }) {
  return (
    <motion.div
      data-presentation-appear=""
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: ENTER_T, delay } }}
      exit={{ opacity: 0, transition: { duration: ENTER_T } }}
      {...rest}
    />
  )
}
